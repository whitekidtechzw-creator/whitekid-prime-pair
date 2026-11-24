'use strict';
/*
 * Whitekid Prime — music engine for .play / .song / .ytmp3 / .yta and .video / .ytmp4
 *   1. search YouTube first (yt-search), so we always know the title, length and thumbnail
 *   2. try the download APIs in parallel batches, validate what comes back (real audio, not an HTML error page)
 *   3. fall back to the local engine (yt-dlp / ytdl-core)
 *   4. send it in the format it really is (mp3 / m4a / ogg), as a document if it is too big or can't be played
 */
const { WM, config } = require('./config');
const { axios, yts } = require('./deps');
const { audioCandidates, formatAudio, isValidBuffer, localYtAudio, localYtVideo, ytDownloadMp4 } = require('./services');
const { card, bold } = require('./ui');

const YT_ID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/i;
const MAX_AUDIO = 16 * 1024 * 1024;

const clean = s => String(s || '').replace(/[^\w\s.\-()\[\]&']/g, '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'audio';

function sniffAudio(buf) {
    if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
    const h = buf.subarray(0, 12), str = (a, b) => h.toString('latin1', a, b);
    if (str(0, 3) === 'ID3' || (h[0] === 0xFF && (h[1] & 0xE0) === 0xE0)) return { kind: 'mp3', mime: 'audio/mpeg', ext: 'mp3' };
    if (str(4, 8) === 'ftyp') return { kind: 'm4a', mime: 'audio/mp4', ext: 'm4a' };
    if (str(0, 4) === 'OggS') return { kind: 'ogg', mime: 'audio/ogg; codecs=opus', ext: 'ogg' };
    if (str(0, 4) === 'RIFF' && str(8, 12) === 'WAVE') return { kind: 'wav', mime: 'audio/wav', ext: 'wav' };
    if (h[0] === 0x1A && h[1] === 0x45 && h[2] === 0xDF && h[3] === 0xA3) return { kind: 'webm', mime: 'audio/webm', ext: 'webm' };
    return null; // HTML / JSON error pages end up here
}

const views = n => { const v = Number(n); return Number.isFinite(v) && v > 0 ? v.toLocaleString('en-US') : 'N/A'; };

async function findTrack(q) {
    const m = String(q).match(YT_ID);
    try {
        if (m) {
            const v = await yts({ videoId: m[1] });
            if (v && v.title) return { url: `https://www.youtube.com/watch?v=${m[1]}`, title: v.title, duration: v.timestamp || 'N/A', views: v.views, author: v.author && v.author.name, thumb: v.thumbnail || v.image };
            return { url: `https://www.youtube.com/watch?v=${m[1]}`, title: 'YouTube audio', duration: 'N/A', thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` };
        }
        const r = await yts(String(q));
        const v = r && r.videos && r.videos.find(x => x.seconds === undefined || x.seconds <= 3 * 3600);
        if (v) return { url: v.url, title: v.title, duration: v.timestamp || 'N/A', views: v.views, author: v.author && v.author.name, thumb: v.thumbnail || v.image };
    } catch (e) { console.error('[MUSIC search]', e.message); }
    return null;
}

async function fetchAudio(url) {
    const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000, maxContentLength: 80 * 1024 * 1024, headers: { 'user-agent': 'Mozilla/5.0' } });
    return Buffer.from(data);
}

async function getAudioBuffer(track) {
    const tried = [];
    // 1. the search-by-name API (kept from the old engine)
    try {
        const { data } = await axios.get(`${config.DAVID_API}/play?query=${encodeURIComponent(track.title)}&apikey=`, { timeout: 25000 });
        const u = data && data.result && data.result.download_url;
        if (u) { const b = await fetchAudio(u); if (isValidBuffer(b) && sniffAudio(b)) return b; tried.push('david: not audio'); }
    } catch (e) { tried.push('david: ' + e.message); }
    // 2. the audio APIs, in parallel batches
    for (const u of await audioCandidates(track.url)) {
        try { const b = await fetchAudio(u); if (isValidBuffer(b) && sniffAudio(b)) return b; tried.push('api: not audio'); }
        catch (e) { tried.push('api: ' + e.message); }
    }
    // 3. local engine
    const local = await localYtAudio(track.url);
    if (isValidBuffer(local)) return local;
    console.error('[MUSIC] all sources failed →', tried.join(' | '));
    return null;
}

async function playAudio({ socket, from, msg, fakeCard, q, reply, react, replyImg, prefix }) {
    if (!q) return reply(`🎵 Play\n\nUsage: ${prefix}play <song name or YouTube link>\nExample: ${prefix}play faded alan walker`);
    await react('🎧');
    const track = await findTrack(q);
    if (!track) { await react('⚠️'); return reply(`⚠️ No results\n\nI couldn't find "${q}". Try the artist name too, e.g. ${prefix}play faded alan walker`); }

    const info = card('Now playing', [
        ['🎵 Title', track.title.slice(0, 80)], ['🎤 Channel', track.author || 'N/A'], ['⏱️ Length', track.duration],
        ['👁️ Views', views(track.views)], ['⬇️ Status', 'fetching audio…']
    ], `🔗 ${track.url}`);
    try { if (track.thumb) await replyImg(track.thumb, info, [], true); else await socket.sendMessage(from, { text: info }, { quoted: fakeCard }); }
    catch { /* the card is a bonus, keep going */ }

    try {
        await socket.sendPresenceUpdate('recording', from).catch(() => {});
        let buf = await getAudioBuffer(track);
        if (!buf) throw new Error('every download source failed');
        let kind = sniffAudio(buf);
        if (!kind || kind.kind === 'webm' || kind.kind === 'wav') { const conv = await formatAudio(buf); const k2 = sniffAudio(conv); if (k2 && k2.kind === 'mp3') { buf = conv; kind = k2; } }
        if (!kind) throw new Error('downloaded file is not audio');
        const fileName = `${clean(track.title)}.${kind.ext}`;
        const playable = ['mp3', 'm4a', 'ogg'].includes(kind.kind) && buf.length <= MAX_AUDIO;
        if (playable) {
            await socket.sendMessage(from, {
                audio: buf, mimetype: kind.kind === 'ogg' ? 'audio/ogg; codecs=opus' : kind.mime, fileName,
                contextInfo: { externalAdReply: { title: track.title.slice(0, 60), body: 'Whitekid Prime • ' + track.duration, thumbnailUrl: track.thumb, sourceUrl: track.url, mediaType: 1, renderLargerThumbnail: false } }
            }, { quoted: msg });
        } else {
            await socket.sendMessage(from, { document: buf, mimetype: kind.mime, fileName, caption: `🎵 ${track.title}\n(sent as a file)${WM}` }, { quoted: msg });
        }
        await react('✅');
    } catch (e) {
        console.error('[PLAY ERROR]', e.message);
        await react('⚠️');
        await reply(`⚠️ Play failed\n\nI found "${track.title.slice(0, 60)}" but couldn't download it right now (${e.message}).\nTry again in a minute, or send the link: ${prefix}play ${track.url}`);
    }
}

async function playVideo({ socket, from, fakeCard, q, reply, react, prefix }) {
    if (!q) return reply(`🎬 Video\n\nUsage: ${prefix}video <song/video name or YouTube link>`);
    await react('🎬');
    const track = await findTrack(q);
    if (!track) { await react('⚠️'); return reply('⚠️ No results\n\nNo video found for that search.'); }
    await reply(`🎬 Downloading\n${track.title.slice(0, 70)}\n⏱️ ${track.duration}\n⏳ Please wait…`);
    try {
        const dl = await ytDownloadMp4(track.url);
        const cap = `🎬 ${bold(track.title.slice(0, 80))}\n⏱️ ${track.duration}${WM}`;
        if (dl) await socket.sendMessage(from, { video: { url: dl }, mimetype: 'video/mp4', caption: cap }, { quoted: fakeCard });
        else {
            const local = await localYtVideo(track.url);
            if (!isValidBuffer(local)) throw new Error('all video sources failed');
            await socket.sendMessage(from, { video: local, mimetype: 'video/mp4', caption: cap }, { quoted: fakeCard });
        }
        await react('✅');
    } catch (e) { await react('⚠️'); await reply(`⚠️ Video failed\n\n${e.message}. Try again in a minute.`); }
}

module.exports = { findTrack, playAudio, playVideo, sniffAudio };
