'use strict';
/*
 * WHITEKID PRIME v8 — EXTRA COMMAND PACK
 * Commands ported/rebuilt from Atlas-MD (MIT, © FantoX) that Whitekid Prime did not have, plus extra API fallbacks.
 * Plugs into the same registry as the v7 pack, so the menu, dispatcher and .cmds pick it up automatically.
 */
const fs = require('fs'), path = require('path'), os = require('os'), { execFile } = require('child_process');
const core = require('./wk7-core');
const { REG, CATS, category, fx, U, clip, rnd } = core;
const { config } = require('./config');
const WA = require('./wa');

// ───── every external API this pack uses (also tested by .apicheck) ─────
const API = {
    FAA: 'https://api-faa.my.id', NEXRAY: config.NEXRAY_API || 'https://api.nexray.web.id', KELVDRA: 'https://kelvdraapi.domku.xyz',
    TIKWM: 'https://tikwm.com', WAIFU: 'https://api.waifu.pics', NEKOS: 'https://nekos.best/api/v2', MEMEGEN: 'https://api.memegen.link',
    COUPLE: 'https://couple-pfp-api.vercel.app/api/v1/couplepfp', PIXELCUT: 'https://api2.pixelcut.app/image/upscale/v1',
    QUOTE: 'https://bot.lyo.su/quote/generate', TINYURL: 'https://tinyurl.com/api-create.php', QR: 'https://api.qrserver.com/v1/create-qr-code/',
    TTS: 'https://translate.google.com/translate_tts', CATBOX: 'https://catbox.moe/user/api.php', HOTWHEELS: 'https://hot-wheels-rugs.onrender.com/api/random',
    TENOR: 'https://tenor.googleapis.com/v2'
};
const PROBES = [
    ['faa youtube search', `${API.FAA}/faa/youtube?q=test`], ['faa gemini', `${API.FAA}/faa/gemini-ai?text=hi`], ['faa igdl', `${API.FAA}/faa/igdl?url=https://instagram.com/`],
    ['nexray soundcloud', `${API.NEXRAY}/downloader/soundcloud?url=x`], ['kelvdra tiktok', `${API.KELVDRA}/downloader/tiktok?url=x&apikey=tesApi`],
    ['tikwm', `${API.TIKWM}/api/?url=https://www.tiktok.com/@a/video/1`], ['waifu.pics', `${API.WAIFU}/sfw/hug`], ['nekos.best', `${API.NEKOS}/hug`],
    ['memegen', `${API.MEMEGEN}/templates`], ['couple pfp', API.COUPLE], ['google tts', `${API.TTS}?ie=UTF-8&q=hi&tl=en&client=tw-ob`], ['hot wheels', API.HOTWHEELS]
];

// ───── helpers ─────
const CASES = new Set();
try { for (const m of fs.readFileSync(path.join(__dirname, 'commands.js'), 'utf8').matchAll(/case\s*'([^'\n]+)'\s*:/g)) CASES.add(m[1]); } catch { /* optional */ }
// never shadow a command the bot already has
function def(cat, names, help, fn) { const arr = [].concat(names).filter(n => !REG.has(n) && !CASES.has(n)); if (arr.length) core.def(cat, arr, help, fn); }
const tag = (id, icon, title) => { category(id, icon, title); CATS.get(id).tag = 'V8'; };
tag('dl', '📥', 'DOWNLOADERS'); tag('yt', '▶️', 'YOUTUBE'); tag('conv', '🔄', 'CONVERT & TTS'); tag('stk', '🏷️', 'STICKER TOOLS');
tag('react', '💞', 'REACTIONS'); tag('pics', '🖼️', 'PICTURES & SEARCH'); tag('grp', '👥', 'GROUP ADMIN'); tag('botx', '🤖', 'BOT INFO');

const snd = (c, content) => c.socket.sendMessage(c.from, content, { quoted: c.msg });
const jget = async (url, o = {}) => { const r = await fx(url, o); if (!r.ok) throw new Error('HTTP ' + r.status); const t = await r.text(); try { return JSON.parse(t); } catch { return t; } };
const getBuf = async (url, o = {}) => { const r = await fx(url, { timeout: 90000, ...o }); if (!r.ok) throw new Error('HTTP ' + r.status); return Buffer.from(await r.arrayBuffer()); };
const enc = encodeURIComponent;
const IMG = /\.(jpe?g|png|webp|gif|bmp)(\?|$)/i, VID = /\.(mp4|webm|mov|mkv|m4v|3gp)(\?|$)/i, AUD = /\.(mp3|m4a|ogg|opus|wav|aac|flac)(\?|$)/i;
const kindOf = u => IMG.test(u) ? 'image' : VID.test(u) ? 'video' : AUD.test(u) ? 'audio' : 'file';
const SKIP_KEY = /thumb|cover|avatar|icon|poster|preview|profile|logo|banner/i;

// pull every media link out of an API answer, whatever its shape
function deepUrls(o, out = [], key = '', depth = 0) {
    if (depth > 6 || o == null) return out;
    if (typeof o === 'string') { if (/^https?:\/\//i.test(o) && !SKIP_KEY.test(key) && !out.includes(o)) out.push(o); return out; }
    if (Array.isArray(o)) { for (const x of o) deepUrls(x, out, key, depth + 1); return out; }
    if (typeof o === 'object') for (const k of Object.keys(o)) deepUrls(o[k], out, k, depth + 1);
    return out;
}
const titleOf = o => { const d = o && (o.result || o.data || o); return (d && (d.title || d.name || d.filename || d.fileName || d.desc)) || ''; };

async function mediaOf(c, kinds = ['image', 'video', 'sticker', 'audio']) {
    const m = c.msg.message || {};
    const ctx = (m.extendedTextMessage || m.imageMessage || m.videoMessage || {}).contextInfo;
    for (const s of [ctx && ctx.quotedMessage, m]) {
        if (!s) continue;
        const inner = (s.viewOnceMessageV2 && s.viewOnceMessageV2.message) || (s.viewOnceMessage && s.viewOnceMessage.message) || s;
        for (const k of kinds) {
            const o = inner[k + 'Message']; if (!o) continue;
            const st = await WA.downloadContentFromMessage(o, k); const ch = []; for await (const x of st) ch.push(x);
            const b = Buffer.concat(ch); if (b.length) return { buffer: b, type: k, mime: o.mimetype || '', obj: o };
        }
    }
    return null;
}
function ff(args, input, inExt, outExt) {
    const id = Date.now() + '_' + Math.random().toString(36).slice(2, 6), dir = os.tmpdir();
    const a = path.join(dir, `wk8_${id}.${inExt}`), b = path.join(dir, `wk8_${id}.${outExt}`);
    fs.writeFileSync(a, input);
    return new Promise((res, rej) => execFile(process.env.FFMPEG_PATH || 'ffmpeg', ['-y', '-i', a, ...args, b], { timeout: 120000 }, err => {
        try { if (err) throw new Error('ffmpeg failed — is ffmpeg installed on this host?'); res(fs.readFileSync(b)); } catch (e) { rej(e); } finally { for (const f of [a, b]) try { fs.unlinkSync(f); } catch { /* */ } }
    }));
}
async function catbox(buf, name = 'file.jpg') {
    const fd = new FormData(); fd.append('reqtype', 'fileupload'); fd.append('fileToUpload', new Blob([buf]), name);
    const r = await fx(API.CATBOX, { method: 'POST', body: fd, timeout: 60000 }); const t = (await r.text()).trim();
    if (!/^https?:/.test(t)) throw new Error('upload failed'); return t;
}
const targetOf = c => { const x = c.msg.message?.extendedTextMessage?.contextInfo; return (x?.mentionedJid && x.mentionedJid[0]) || x?.participant || (c.args[0] && /\d{6,}/.test(c.args[0]) ? c.args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null); };

// ═══════════ DOWNLOADERS ═══════════
const PLAT = [
    ['tt', /tiktok\.com/i], ['ig', /instagram\.com/i], ['pin', /pinterest\.|pin\.it/i], ['fb', /facebook\.com|fb\.watch/i], ['tw', /twitter\.com|x\.com/i],
    ['vd', /videy\.co/i], ['th', /threads\.(net|com)/i], ['mg', /mega\.nz/i], ['sc', /soundcloud\.com/i], ['sp', /open\.spotify\.com/i],
    ['yt', /youtube\.com|youtu\.be/i], ['sf', /sfile\.co|sfile\.mobi/i], ['mf', /mediafire\.com/i]
];
const SRC = {
    tt: u => [`${API.TIKWM}/api/?url=${enc(u)}`, `${API.KELVDRA}/downloader/tiktok?url=${enc(u)}&apikey=tesApi`],
    ig: u => [`${API.FAA}/faa/igdl?url=${enc(u)}`, `${API.NEXRAY}/downloader/instagram?url=${enc(u)}`],
    pin: u => [`${API.FAA}/faa/pin-down?url=${enc(u)}`],
    fb: u => [`${API.FAA}/faa/fbdownload?url=${enc(u)}`, `${API.NEXRAY}/downloader/facebook?url=${enc(u)}`],
    tw: u => [`${API.NEXRAY}/downloader/twitter?url=${enc(u)}`],
    vd: u => [`${API.NEXRAY}/downloader/videy?url=${enc(u)}`], th: u => [`${API.NEXRAY}/downloader/threads?url=${enc(u)}`],
    mg: u => [`${API.NEXRAY}/downloader/mega?url=${enc(u)}`], sc: u => [`${API.NEXRAY}/downloader/soundcloud?url=${enc(u)}`],
    sp: u => [`${API.NEXRAY}/downloader/spotify?url=${enc(u)}`], sf: u => [`${API.NEXRAY}/downloader/sfile?url=${enc(u)}`],
    mf: u => [`${API.FAA}/faa/mediafire?url=${enc(u)}`],
    yt: u => [`${API.NEXRAY}/downloader/ytmp3?url=${enc(u)}`, `${API.FAA}/faa/ytmp3?url=${enc(u)}`]
};
const NAME = { tt: 'TikTok', ig: 'Instagram', pin: 'Pinterest', fb: 'Facebook', tw: 'Twitter/X', vd: 'Videy', th: 'Threads', mg: 'Mega', sc: 'SoundCloud', sp: 'Spotify', yt: 'YouTube', sf: 'Sfile', mf: 'MediaFire' };

async function fetchMedia(type, url) {
    const errs = [];
    for (const api of SRC[type](url)) {
        try {
            const d = await jget(api, { timeout: 25000 });
            if (d && (d.status === false || d.success === false || d.code > 0)) throw new Error(d.message || d.msg || 'api said no');
            let urls = deepUrls(d.data && type === 'tt' ? { play: d.data.play, images: d.data.images } : d);
            urls = urls.map(u => u.startsWith('/') ? API.TIKWM + u : u).filter(u => u !== url);
            if (type === 'tt' && urls.length === 0 && d.data && d.data.play) urls = [API.TIKWM + d.data.play];
            if (urls.length) return { title: titleOf(d), urls, type };
            throw new Error('no media link');
        } catch (e) { errs.push(e.message); }
    }
    throw new Error(`${NAME[type]} download failed (${errs.join(' | ')}). Check the link is public.`);
}
async function sendMedia(c, res) {
    const cap = `📥 ${NAME[res.type]}${res.title ? '\n' + clip(res.title, 300) : ''}`;
    let urls = res.urls; const imgs = urls.filter(u => kindOf(u) === 'image'), vids = urls.filter(u => kindOf(u) === 'video');
    if (vids.length) urls = vids.slice(0, 1); else if (imgs.length) urls = imgs.slice(0, 8); else urls = urls.slice(0, 1);
    for (const u of urls) {
        let k = kindOf(u);
        if (k === 'file') { try { const h = await fx(u, { method: 'HEAD', timeout: 8000 }); const ct = h.headers.get('content-type') || ''; k = ct.startsWith('video') ? 'video' : ct.startsWith('audio') ? 'audio' : ct.startsWith('image') ? 'image' : res.type === 'sc' || res.type === 'sp' ? 'audio' : 'file'; } catch { k = res.type === 'sc' || res.type === 'sp' ? 'audio' : 'file'; } }
        if (k === 'video') await snd(c, { video: { url: u }, caption: cap, mimetype: 'video/mp4' });
        else if (k === 'audio') await snd(c, { audio: { url: u }, mimetype: 'audio/mpeg' });
        else if (k === 'image') await snd(c, { image: { url: u }, caption: cap });
        else await snd(c, { document: { url: u }, mimetype: 'application/octet-stream', fileName: (res.title || 'download').slice(0, 60).replace(/[^\w.-]+/g, '_') });
    }
}
const linkIn = c => (String(c.textIn).match(/https?:\/\/\S+/) || [])[0];
const platDef = (names, type, usage) => def('dl', names, usage, async c => {
    const u = linkIn(c); if (!u) return c.reply(`📥 ${NAME[type]} downloader\n\n${U(c.p, names[0] + ' <link>')}`);
    await c.react('⏳'); await sendMedia(c, await fetchMedia(type, u)); await c.react('✅');
});
def('dl', ['dl', 'download', 'getmedia'], '<link>  (TikTok, Instagram, Facebook, X, Pinterest, Threads, Mega, SoundCloud, Spotify, YouTube, MediaFire…)', async c => {
    const u = linkIn(c); if (!u) return c.reply(`📥 UNIVERSAL DOWNLOADER\n\n${Object.values(NAME).join(' • ')}\n\n${U(c.p, 'dl <link>')} (or reply to a message with a link)`);
    const hit = PLAT.find(([, re]) => re.test(u)); if (!hit) return c.reply('⚠️ That site is not supported yet.');
    await c.react('⏳'); await sendMedia(c, await fetchMedia(hit[0], u)); await c.react('✅');
});
platDef(['tt', 'tiktokvid'], 'tt', '<tiktok link>'); platDef(['tw', 'twitter', 'xdl'], 'tw', '<x/twitter link>'); platDef(['vd', 'videy'], 'vd', '<videy link>');
platDef(['mf', 'mediafiredl'], 'mf', '<mediafire link>'); platDef(['th', 'threads'], 'th', '<threads link>'); platDef(['mg', 'mega'], 'mg', '<mega link>');
platDef(['soundcloud', 'scdl', 'sc'], 'sc', '<soundcloud link>'); platDef(['sf', 'sfile'], 'sf', '<sfile link>'); platDef(['igdl', 'instadl'], 'ig', '<instagram link>');
platDef(['fbdl'], 'fb', '<facebook link>'); platDef(['pindl'], 'pin', '<pinterest link>'); platDef(['spdl', 'spotifydl'], 'sp', '<spotify link>');
def('dl', ['ttsearch', 'tiktoksearch'], '<query>', async c => {
    if (!c.textIn) return c.reply(U(c.p, 'ttsearch funny cats')); await c.react('🔎');
    const d = await jget(`${API.KELVDRA}/search/tiktok?query=${enc(c.textIn)}&count=1&apikey=tesApi`, { timeout: 25000 });
    const v = d && d.data && d.data.videos && d.data.videos[0]; if (!v) return c.reply(`No TikTok results for “${c.textIn}”.`);
    await snd(c, { video: { url: v.play.startsWith('http') ? v.play : API.TIKWM + v.play }, caption: `🎬 ${clip(v.title || c.textIn, 200)}` });
});

// ═══════════ YOUTUBE ═══════════
def('yt', ['yts', 'youtubesearch', 'ytsearch'], '<query>', async c => {
    if (!c.textIn) return c.reply(U(c.p, 'yts alan walker faded')); await c.react('🔎');
    const { searchVideos } = require('./music'); const v = (await searchVideos(c.textIn)).slice(0, 8);
    if (!v.length) return c.reply(`No YouTube results for “${c.textIn}”.`);
    await c.reply(`▶️ YOUTUBE: ${c.textIn}\n\n${v.map((x, i) => `${i + 1}. ${x.title}\n   ⏱ ${x.duration || '?'}  👤 ${x.author || '?'}\n   ${x.url}`).join('\n\n')}\n\nGet one: ${c.p}play <title>  •  ${c.p}video <title>`);
});
def('yt', ['ytthumb', 'ytthumbnail'], '<youtube link>', async c => {
    const m = String(c.textIn).match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/); if (!m) return c.reply(U(c.p, 'ytthumb <youtube link>'));
    await snd(c, { image: { url: `https://i.ytimg.com/vi/${m[1]}/maxresdefault.jpg` }, caption: '🖼️ Thumbnail' });
});
def('yt', ['ytid'], '<youtube link>', async c => { const m = String(c.textIn).match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/); await c.reply(m ? `🆔 ${m[1]}` : U(c.p, 'ytid <youtube link>')); });

// ═══════════ CONVERTERS & TTS ═══════════
def('conv', ['toimage', 'topng'], '(reply to a sticker)', async c => {
    const m = await mediaOf(c, ['sticker', 'image']); if (!m) return c.reply('⚠️ Reply to a sticker.');
    await snd(c, { image: await ff([], m.buffer, 'webp', 'png'), caption: '🖼️ Done' });
});
def('conv', ['tomp4', 'tovideo'], '(reply to an animated sticker/gif)', async c => {
    const m = await mediaOf(c, ['sticker', 'video']); if (!m) return c.reply('⚠️ Reply to an animated sticker or GIF.');
    const out = await ff(['-movflags', 'faststart', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'], m.buffer, m.type === 'sticker' ? 'webp' : 'mp4', 'mp4');
    await snd(c, { video: out, caption: '🎬 Done' });
});
def('conv', ['tomp3', 'toaudio', 'extractaudio'], '(reply to a video or voice note)', async c => {
    const m = await mediaOf(c, ['video', 'audio']); if (!m) return c.reply('⚠️ Reply to a video or audio.');
    await snd(c, { audio: await ff(['-vn', '-acodec', 'libmp3lame', '-b:a', '128k'], m.buffer, m.type === 'video' ? 'mp4' : 'ogg', 'mp3'), mimetype: 'audio/mpeg' });
});
function jpegSize(b) { let i = 2; while (i < b.length - 9) { if (b[i] !== 0xFF) { i++; continue; } const m = b[i + 1]; if (m >= 0xC0 && m <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7), n: b[i + 9] }; i += 2 + b.readUInt16BE(i + 2); } return null; }
function jpegsToPdf(list) {
    const parts = [], offs = []; let len = 0; const put = x => { const b = Buffer.isBuffer(x) ? x : Buffer.from(x, 'latin1'); parts.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; put(`${n} 0 obj\n`); put(body); put('\nendobj\n'); };
    put('%PDF-1.4\n'); const kids = list.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>'); obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${list.length} >>`);
    list.forEach((j, i) => {
        const s = jpegSize(j), base = 3 + i * 3, W = 595, H = Math.round(595 * s.h / s.w), cs = s.n === 1 ? '/DeviceGray' : '/DeviceRGB';
        obj(base, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${base + 1} 0 R /Resources << /XObject << /Im ${base + 2} 0 R >> >> >>`);
        const cont = `q ${W} 0 0 ${H} 0 0 cm /Im Do Q`; obj(base + 1, `<< /Length ${cont.length} >>\nstream\n${cont}\nendstream`);
        offs[base + 2] = len; put(`${base + 2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${s.w} /Height ${s.h} /ColorSpace ${cs} /BitsPerComponent 8 /Filter /DCTDecode /Length ${j.length} >>\nstream\n`); put(j); put('\nendstream\nendobj\n');
    });
    const total = 3 + list.length * 3, xref = len; put(`xref\n0 ${total}\n0000000000 65535 f \n`);
    for (let n = 1; n < total; n++) put(String(offs[n]).padStart(10, '0') + ' 00000 n \n');
    put(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`); return Buffer.concat(parts);
}
def('conv', ['topdf', 'imgtopdf', 'img2pdf'], '(reply to an image)', async c => {
    const m = await mediaOf(c, ['image', 'sticker']); if (!m) return c.reply('⚠️ Reply to an image.');
    let j = m.buffer; if (!(j[0] === 0xFF && j[1] === 0xD8) || !jpegSize(j)) j = await ff(['-q:v', '2'], m.buffer, 'png', 'jpg');
    await snd(c, { document: jpegsToPdf([j]), mimetype: 'application/pdf', fileName: 'whitekid-prime.pdf' });
});
def('conv', ['toqr', 'qrcode', 'makeqr'], '<text or link>', async c => { if (!c.textIn) return c.reply(U(c.p, 'toqr https://example.com')); await snd(c, { image: { url: `${API.QR}?size=600x600&data=${enc(c.textIn)}` }, caption: '🔳 QR code' }); });
def('conv', ['hd', 'upscale', 'upscalehd', 'enhance'], '(reply to an image)', async c => {
    const m = await mediaOf(c, ['image']); if (!m) return c.reply('⚠️ Reply to an image.'); await c.react('⏳');
    const fd = new FormData(); fd.append('image', new Blob([m.buffer], { type: m.mime || 'image/jpeg' }), 'image.jpg'); fd.append('scale', '2');
    const r = await fx(API.PIXELCUT, { method: 'POST', body: fd, timeout: 60000, headers: { accept: 'application/json', 'x-client-version': 'web', 'x-locale': 'en' } });
    const d = await r.json(); if (!d.result_url) throw new Error('Upscale service failed — try another image.');
    await snd(c, { image: { url: d.result_url }, caption: '✨ HD upscale' });
});
def('conv', ['short', 'tinyurl', 'shorten'], '<link>', async c => { const u = linkIn(c); if (!u) return c.reply(U(c.p, 'short https://example.com/long')); const r = await fx(`${API.TINYURL}?url=${enc(u)}`, { timeout: 15000 }); const t = (await r.text()).trim(); if (!/^https?:/.test(t)) throw new Error('Could not shorten that link.'); await c.reply(`🔗 ${t}`); });
def('conv', ['html', 'gethtml', 'viewsource'], '<link>', async c => { const u = linkIn(c); if (!u) return c.reply(U(c.p, 'html https://example.com')); const r = await fx(u, { timeout: 20000, headers: { accept: 'text/html' } }); await snd(c, { document: Buffer.from(await r.text()), mimetype: 'text/html', fileName: 'page.html' }); });

const TTS_LANG = { say: 'en', speak: 'en', sayfrench: 'fr', sayspanish: 'es', saygerman: 'de', sayitalian: 'it', sayportuguese: 'pt', sayrussian: 'ru', sayturkish: 'tr', sayarabic: 'ar', sayhindi: 'hi', saybengali: 'bn', saybangla: 'bn', sayja: 'ja', sayjapanese: 'ja', saykorean: 'ko', saychinese: 'zh-CN', sayindo: 'id', sayindonesian: 'id', sayswahili: 'sw', sayafrikaans: 'af', saythai: 'th', saydutch: 'nl', saypolish: 'pl', sayvietnamese: 'vi', saytamil: 'ta', sayurdu: 'ur' };
for (const [name, lang] of Object.entries(TTS_LANG)) def('conv', name, `<text>  (${lang} voice)`, async c => {
    const text = c.textIn.trim(); if (!text) return c.reply(U(c.p, `${name} hello there`)); await c.react('🔊');
    const chunks = text.slice(0, 600).match(/[\s\S]{1,180}(?:\s|$)/g) || [text]; const bufs = [];
    for (const ch of chunks) bufs.push(await getBuf(`${API.TTS}?ie=UTF-8&q=${enc(ch.trim())}&tl=${lang}&client=tw-ob`, { timeout: 20000 }));
    await snd(c, { audio: Buffer.concat(bufs), mimetype: 'audio/mpeg' });
});

// ═══════════ STICKER TOOLS ═══════════
let Sticker = null, StickerTypes = null; try { ({ Sticker, StickerTypes } = require('wa-sticker-formatter')); } catch { /* optional */ }
const needFmt = c => { if (!Sticker) { c.reply('⚠️ Install wa-sticker-formatter (npm install) to use this command.'); return true; } };
const mkSticker = (buf, pack, author, type) => new Sticker(buf, { pack, author, type: type || StickerTypes.FULL, quality: 70, background: 'transparent' }).toBuffer();
def('stk', ['steal', 'take', 'wm'], '<pack | author>  (reply to a sticker)', async c => {
    if (needFmt(c)) return; const m = await mediaOf(c, ['sticker']); if (!m) return c.reply('⚠️ Reply to a sticker.');
    const [pack, author] = c.textIn.includes('|') ? c.textIn.split('|').map(s => s.trim()) : [c.textIn.trim() || 'Whitekid Prime', c.senderName || 'WhiteKid Tech'];
    await snd(c, { sticker: await mkSticker(m.buffer, pack, author) });
});
def('stk', ['scrop', 'stickercrop', 'sfull', 'crop'], '(reply to an image/video/sticker)', async c => {
    if (needFmt(c)) return; const m = await mediaOf(c, ['image', 'video', 'sticker']); if (!m) return c.reply('⚠️ Reply to an image, video or sticker.');
    await snd(c, { sticker: await mkSticker(m.buffer, 'Whitekid Prime', c.senderName || 'WhiteKid Tech', StickerTypes.CROPPED) });
});
const memeText = s => enc(String(s || '_').trim().replace(/_/g, '__').replace(/-/g, '--').replace(/\s+/g, '_').replace(/\?/g, '~q').replace(/%/g, '~p').replace(/#/g, '~h').replace(/\//g, '~s') || '_');
def('stk', ['smeme', 'stickermeme', 'meme2'], '<top text | bottom text>  (reply to an image)', async c => {
    if (needFmt(c)) return; const m = await mediaOf(c, ['image']); if (!m) return c.reply('⚠️ Reply to an image.\n' + U(c.p, 'smeme top | bottom'));
    const [top, bot] = c.textIn.split('|'); const url = await catbox(m.buffer, 'meme.jpg');
    const png = await getBuf(`${API.MEMEGEN}/images/custom/${memeText(top)}/${memeText(bot)}.png?background=${enc(url)}`, { timeout: 30000 });
    await snd(c, { sticker: await mkSticker(png, 'Whitekid Prime', c.senderName || 'WhiteKid Tech') });
});
def('stk', ['memeimg', 'memegen'], '<top | bottom>  (reply to an image)', async c => {
    const m = await mediaOf(c, ['image']); if (!m) return c.reply('⚠️ Reply to an image.\n' + U(c.p, 'memeimg top | bottom'));
    const [top, bot] = c.textIn.split('|'); const url = await catbox(m.buffer, 'meme.jpg');
    await snd(c, { image: { url: `${API.MEMEGEN}/images/custom/${memeText(top)}/${memeText(bot)}.png?background=${enc(url)}` }, caption: '😂' });
});
def('stk', ['q', 'quote', 'quotely'], '<text>  (or reply to a message)', async c => {
    if (needFmt(c)) return; const ctx = c.msg.message?.extendedTextMessage?.contextInfo; const qm = ctx?.quotedMessage;
    const text = c.textIn.trim() || (qm && (qm.conversation || qm.extendedTextMessage?.text)) || ''; if (!text) return c.reply(U(c.p, 'q Prime is the best'));
    const who = (ctx && ctx.participant) || c.me; let photo = ''; try { photo = await c.socket.profilePictureUrl(who, 'image'); } catch { /* none */ }
    const name = ctx && ctx.participant ? '+' + ctx.participant.split('@')[0] : (c.senderName || 'User');
    const r = await fx(API.QUOTE, { method: 'POST', headers: { 'content-type': 'application/json' }, timeout: 30000, body: JSON.stringify({ type: 'quote', format: 'png', backgroundColor: '#FFFFFF', width: 700, height: 580, scale: 2, messages: [{ entities: [], avatar: true, from: { id: 1, name, photo: { url: photo } }, text, replyMessage: {} }] }) });
    const d = await r.json(); if (!d.result || !d.result.image) throw new Error('Quote service failed.');
    await snd(c, { sticker: await mkSticker(Buffer.from(d.result.image, 'base64'), 'Whitekid Prime', name) });
});
def('stk', ['emojimix', 'emix'], '<emoji>+<emoji>', async c => {
    const key = process.env.TENOR_API_KEY; if (!key) return c.reply('⚠️ emojimix needs a free Tenor key: set TENOR_API_KEY in .env (Google Cloud → Tenor API).');
    const [a, b] = c.textIn.split('+').map(s => s.trim()); if (!a || !b) return c.reply(U(c.p, 'emojimix 😅+🤔'));
    const d = await jget(`${API.TENOR}/featured?key=${key}&contentfilter=high&media_filter=png_transparent&collection=emoji_kitchen_v5&q=${enc(a + '_' + b)}`);
    const u = d.results && d.results[0] && d.results[0].media_formats.png_transparent.url; if (!u) return c.reply('😕 That emoji pair cannot be mixed.');
    if (needFmt(c)) return; await snd(c, { sticker: await mkSticker(await getBuf(u), 'Whitekid Prime', 'Emoji Mix') });
});

// ═══════════ REACTIONS (waifu.pics, nekos.best fallback) ═══════════
const REACTS = { bite: '😬', blush: '😊', bonk: '🔨', bully: '😈', cringe: '😬', cry: '😭', dance: '💃', glomp: '🤗', handhold: '🤝', happy: '😄', kill: '🔪', kiss: '😘', lick: '👅', nom: '😋', smile: '🙂', smug: '😏', wave: '👋', wink: '😉', yeet: '🚀' };
const NEKOS_OK = new Set(['bite', 'blush', 'cry', 'dance', 'handhold', 'happy', 'kiss', 'smile', 'smug', 'wave', 'wink', 'bonk']);
for (const [name, emo] of Object.entries(REACTS)) def('react', name, '[@user]', async c => {
    const who = targetOf(c); let gif = null;
    try { gif = (await jget(`${API.WAIFU}/sfw/${name}`, { timeout: 12000 })).url; } catch { /* try next */ }
    if (!gif && NEKOS_OK.has(name)) { try { gif = (await jget(`${API.NEKOS}/${name}`, { timeout: 12000 })).results[0].url; } catch { /* none */ } }
    if (!gif) throw new Error('Reaction service is down right now.');
    const me = '@' + c.me.split('@')[0].split(':')[0], you = who ? '@' + who.split('@')[0] : null;
    const caption = `${emo} ${me} ${name}${name.endsWith('s') || name.endsWith('h') ? 'es' : 's'} ${you || 'everyone'}`;
    let video = null; try { video = await ff(['-movflags', 'faststart', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'], await getBuf(gif), 'gif', 'mp4'); } catch { /* send as image */ }
    const mentions = [c.me, who].filter(Boolean);
    if (video) await snd(c, { video, gifPlayback: true, caption, mentions }); else await snd(c, { image: { url: gif }, caption, mentions });
});

// ═══════════ PICTURES & SEARCH ═══════════
def('pics', ['ppcouple', 'couplepp', 'couplepfp'], '', async c => {
    const d = await jget(API.COUPLE, { timeout: 15000 }); if (!d.male || !d.female) throw new Error('empty');
    await snd(c, { image: { url: d.male }, caption: '💙 For him' }); await snd(c, { image: { url: d.female }, caption: '💖 For her' });
});
async function bingImages(q) {
    const html = await (await fx(`https://www.bing.com/images/search?q=${enc(q)}&first=1&count=20`, { timeout: 20000, headers: { accept: 'text/html', 'accept-language': 'en-US' } })).text();
    const out = []; for (const m of html.matchAll(/murl&quot;:&quot;(https?:[^&]+?)&quot;/g)) { const u = m[1].replace(/\\u0026/g, '&'); if (/\.(jpe?g|png|webp)/i.test(u) && !out.includes(u)) out.push(u); } return out;
}
def('pics', ['gig', 'gimage', 'googleimage', 'image', 'img'], '<search term> [count]', async c => {
    const m = c.textIn.match(/^(.*?)(?:\s+(\d))?$/); const q = (m[1] || '').trim(), n = Math.min(Math.max(parseInt(m[2], 10) || 3, 1), 5);
    if (!q) return c.reply(U(c.p, 'image cheetah 3')); await c.react('🔎');
    const list = await bingImages(q); if (!list.length) return c.reply(`No images found for “${q}”.`);
    let sent = 0; for (const u of rnd.shuffle(list)) { if (sent >= n) break; try { await snd(c, { image: { url: u }, caption: sent === 0 ? `🖼️ ${q}` : '' }); sent++; } catch { /* next */ } }
    if (!sent) throw new Error('Could not load any of those images.');
});
def('pics', ['wall', 'wallpaper', 'wallpapers'], '<topic>', async c => {
    const q = c.textIn.trim(); if (!q) return c.reply(U(c.p, 'wall dark forest')); await c.react('🔎');
    const list = await bingImages(q + ' wallpaper hd'); if (!list.length) return c.reply('No wallpapers found.');
    let sent = 0; for (const u of rnd.shuffle(list)) { if (sent >= 3) break; try { await snd(c, { document: { url: u }, mimetype: 'image/jpeg', fileName: `wallpaper_${sent + 1}.jpg`, caption: sent === 0 ? `🌄 ${q}` : '' }); sent++; } catch { /* next */ } }
});
def('pics', ['gif', 'gifsearch'], '<search term>', async c => {
    const key = process.env.TENOR_API_KEY; if (!key) return c.reply('⚠️ gif search needs a free Tenor key: set TENOR_API_KEY in .env.'); if (!c.textIn) return c.reply(U(c.p, 'gif happy dance'));
    const d = await jget(`${API.TENOR}/search?q=${enc(c.textIn)}&key=${key}&client_key=whitekid&limit=10&media_filter=mp4`); const r = rnd.pick(d.results || []); const u = r && r.media_formats && r.media_formats.mp4 && r.media_formats.mp4.url;
    if (!u) return c.reply('No GIFs found.'); await snd(c, { video: { url: u }, gifPlayback: true, caption: `🎞️ ${c.textIn}` });
});
def('pics', ['ringtone'], '<song/ringtone name>', async c => {
    if (!c.textIn) return c.reply(U(c.p, 'ringtone nokia')); const { cheerio } = require('./deps'); await c.react('🔎');
    const html = await (await fx('https://meloboom.com/en/search/' + enc(c.textIn), { timeout: 20000, headers: { accept: 'text/html' } })).text(); const $ = cheerio.load(html); const items = [];
    $('#__next .container .row .items .item').each((i, b) => { const a = $(b).find('audio').attr('src'); if (a) items.push({ title: $(b).find('h5').text() || c.textIn, audio: a }); });
    if (!items.length) return c.reply('No ringtones found.'); const it = rnd.pick(items); await snd(c, { audio: { url: it.audio }, mimetype: 'audio/mpeg', fileName: it.title + '.mp3' });
});
def('pics', ['gh', 'githubuser', 'ghuser'], '<username>', async c => {
    const u = c.args[0]; if (!u) return c.reply(U(c.p, 'gh torvalds')); const d = await jget(`https://api.github.com/users/${enc(u)}`); if (d.message) return c.reply('User not found.');
    await snd(c, { image: { url: d.avatar_url }, caption: `🐙 ${d.login}${d.name ? ' (' + d.name + ')' : ''}\n${d.bio || ''}\n\n📦 Repos: ${d.public_repos}  👥 Followers: ${d.followers}  ➡️ Following: ${d.following}\n📍 ${d.location || '—'}\n🔗 ${d.html_url}` });
});
def('pics', ['hotwheels', 'hw'], '', async c => { const d = await jget(API.HOTWHEELS, { timeout: 15000 }); const u = deepUrls(d).find(x => kindOf(x) === 'image') || deepUrls(d)[0]; if (!u) throw new Error('empty'); await snd(c, { image: { url: u }, caption: '🏎️ Hot Wheels' }); });

// ═══════════ GROUP ADMIN ═══════════
const needAdmin = async c => {
    if (!c.isGroup) { await c.reply('⚠️ Groups only!'); return true; }
    if (!c.isSenderGroupAdmin && !c.isOwner && !c.isDevOverride) { await c.reply('⚠️ Admins only!'); return true; }
};
const grpDef = (names, help, fn) => def('grp', names, help, async c => { if (await needAdmin(c)) return; try { await fn(c); } catch (e) { if (/not-authorized|forbidden|403/i.test(e.message)) return c.reply('⚠️ Make me a group admin first.'); throw e; } });
grpDef(['setgcname', 'setgroupname'], '<new name>', async c => { if (!c.textIn) return c.reply(U(c.p, 'setgcname New Name')); await c.socket.groupUpdateSubject(c.from, c.textIn.slice(0, 100)); await c.react('✅'); });
grpDef(['setgcdesc', 'setgroupdesc'], '<new description>', async c => { if (!c.textIn) return c.reply(U(c.p, 'setgcdesc About this group')); await c.socket.groupUpdateDescription(c.from, c.textIn); await c.react('✅'); });
grpDef(['setppgc', 'setgrouppp'], '(reply to an image)', async c => { const m = await mediaOf(c, ['image']); if (!m) return c.reply('⚠️ Reply to an image.'); await c.socket.updateProfilePicture(c.from, m.buffer); await c.react('✅'); });
grpDef(['gclink', 'grouplink', 'invitelink'], '', async c => { await c.reply(`🔗 https://chat.whatsapp.com/${await c.socket.groupInviteCode(c.from)}`); });
grpDef(['revoke', 'resetlink', 'revokelink'], '', async c => { await c.socket.groupRevokeInvite(c.from); await c.reply('✅ Group link reset. Use ' + c.p + 'gclink for the new one.'); });
grpDef(['group', 'gc'], 'open | close', async c => {
    const a = (c.args[0] || '').toLowerCase(); if (!['open', 'close'].includes(a)) return c.reply(U(c.p, 'group open  |  group close'));
    await c.socket.groupSettingUpdate(c.from, a === 'open' ? 'not_announcement' : 'announcement'); await c.reply(a === 'open' ? '🔓 Group opened — everyone can send messages.' : '🔒 Group closed — only admins can send messages.');
});
grpDef(['groupinfo', 'gcinfo'], '', async c => {
    const m = await c.socket.groupMetadata(c.from); const admins = m.participants.filter(p => p.admin);
    let pic = null; try { pic = await c.socket.profilePictureUrl(c.from, 'image'); } catch { /* none */ }
    const text = `👥 ${m.subject}\n\n🆔 ${m.id}\n📅 Created: ${new Date((m.creation || 0) * 1000).toDateString()}\n👤 Members: ${m.participants.length}\n🛡️ Admins: ${admins.length}\n🔒 Messages: ${m.announce ? 'admins only' : 'everyone'}\n\n📝 ${m.desc || 'No description'}`;
    if (pic) await snd(c, { image: { url: pic }, caption: text }); else await c.reply(text);
});
grpDef(['hidetag', 'htag', 'tag', 'tagall2'], '<message>', async c => {
    const m = await c.socket.groupMetadata(c.from); const quoted = c.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage; const txt = c.textIn || (quoted && (quoted.conversation || quoted.extendedTextMessage?.text)) || '📢';
    await c.socket.sendMessage(c.from, { text: txt, mentions: m.participants.map(p => p.id) }, { quoted: c.msg });
});
grpDef(['remove', 'kickuser'], '@user', async c => { const t = targetOf(c); if (!t) return c.reply(U(c.p, 'remove @user')); await c.socket.groupParticipantsUpdate(c.from, [t], 'remove'); await c.react('✅'); });
grpDef(['delete', 'del'], '(reply to a message)', async c => {
    const x = c.msg.message?.extendedTextMessage?.contextInfo; if (!x || !x.stanzaId) return c.reply('⚠️ Reply to the message you want deleted.');
    await c.socket.sendMessage(c.from, { delete: { remoteJid: c.from, fromMe: false, id: x.stanzaId, participant: x.participant } });
});
def('grp', ['leave', 'leavegc'], '(owner)', async c => { if (!c.isOwner && !c.isDevOverride) return c.reply('🔐 Owner only.'); if (!c.isGroup) return c.reply('⚠️ Groups only!'); await c.reply('👋 Goodbye!'); await c.socket.groupLeave(c.from); });
def('grp', ['viewonce2', 'vo', 'revive'], '(reply to a view-once)', async c => { await require('./services').viewonceCommand(c.socket, c.from, c.msg, c.fakeCard); });

// ═══════════ BOT INFO ═══════════
def('botx', ['runtime', 'uptime2'], '', async c => { const s = process.uptime(), f = n => String(Math.floor(n)).padStart(2, '0'); await c.reply(`⏱️ Runtime: ${Math.floor(s / 86400)}d ${f(s / 3600 % 24)}h ${f(s / 60 % 60)}m ${f(s % 60)}s`); });
def('botx', ['status', 'sys', 'sysinfo', 'info'], '', async c => {
    const m = process.memoryUsage(); await c.reply(`🤖 WHITEKID PRIME — STATUS\n\n🟢 Online\n⚙️ Node ${process.version}\n💾 RAM: ${(m.rss / 1048576).toFixed(0)} MB used / ${(os.totalmem() / 1048576).toFixed(0)} MB\n🖥️ ${os.platform()} ${os.arch()} • ${os.cpus().length} CPU\n⏱️ ${(process.uptime() / 3600).toFixed(1)}h up\n🔑 Prefix: ${c.p}`);
});
def('botx', ['support', 'supportgc'], '', async c => { await c.reply(`🆘 SUPPORT\n\n📢 Channel: ${config.USER_CHANNEL_URL}\n📱 wa.me/${require('./config').DEVELOPER_NUMBER}\n✈️ t.me/whitekid01`); });
def('botx', ['restart', 'reboot'], '(owner)', async c => { if (!c.isOwner && !c.isDevOverride) return c.reply('🔐 Owner only.'); await c.reply('🔄 Restarting… (the host must auto-restart the bot, e.g. pm2 or a panel)'); setTimeout(() => process.exit(0), 1500); });
def('botx', ['banlist', 'listbans'], '(owner)', async c => {
    if (!c.isOwner && !c.isDevOverride) return c.reply('🔐 Owner only.'); let list = [];
    try { const d = JSON.parse(fs.readFileSync(require('./store').BANS_PATH, 'utf8')); list = Array.isArray(d) ? d : Object.keys(d); } catch { /* none */ }
    await c.reply(list.length ? `🚫 BANNED (${list.length})\n\n${list.map(x => '• ' + String(x).split('@')[0]).join('\n')}` : '✅ Nobody is banned.');
});

// ═══════════ CHANNEL REACTIONS (every connected session reacts once, as a real account) ═══════════
def('botx', ['chreact', 'chreactin', 'channelreact', 'creact'], '<channel post link> [emoji]  (owner)', async c => {
    if (!c.isOwner && !c.isDevOverride) return c.reply('🔐 Owner only.');
    const m = String(c.textIn).match(/whatsapp\.com\/channel\/([\w-]+)\/(\d+)/i);
    if (!m) return c.reply(`📢 CHANNEL REACT\n\n${U(c.p, 'chreact https://whatsapp.com/channel/XXXX/123 ❤️')}\n\nCopy the link of the POST itself (long-press the post → share → copy link), not the channel link.`);
    const emoji = (String(c.textIn).split(/\s+/).find(x => /\p{Extended_Pictographic}/u.test(x))) || '❤️';
    const { activeSockets } = require('./store'); const { resolveChannelJid } = require('./helpers');
    const socks = [...activeSockets.values()].filter(s => s && typeof s.newsletterReactMessage === 'function');
    if (!socks.length) return c.reply('⚠️ No connected sessions to react with.');
    const jid = await resolveChannelJid(socks[0], `https://whatsapp.com/channel/${m[1]}`); if (!jid) return c.reply('⚠️ Could not find that channel.');
    await c.reply(`${emoji} Reacting from ${socks.length} connected account${socks.length > 1 ? 's' : ''}…`);
    let ok = 0, bad = 0;
    for (const s of socks) {
        try { try { await s.newsletterFollow(jid); } catch { /* already following */ } await s.newsletterReactMessage(jid, m[2], emoji); ok++; } catch { bad++; }
        await new Promise(r => setTimeout(r, 1500 + Math.random() * 2500));   // spaced out so WhatsApp does not flag it
    }
    await c.reply(`✅ ${emoji} Reactions sent: ${ok}${bad ? `\n⚠️ Failed: ${bad}` : ''}\n\nEach account can react once per post, so the total equals the number of connected accounts.`);
});

const NAMES = new Set(); for (const [, v] of CATS) if (v.tag === 'V8') v.names.forEach(n => NAMES.add(n));
module.exports = { H: { snd, jget, getBuf, mediaOf, catbox, targetOf, ff, deepUrls, kindOf }, NAMES, API, PROBES, deepUrls, jpegsToPdf, jpegSize, memeText, fetchMedia };
