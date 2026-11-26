'use strict';
/*
 * WHITEKID PRIME v9 — KNIGHTBOT PACK
 * Commands and APIs ported/rebuilt from Knightbot-MD (ISC licence) that Whitekid Prime did not have.
 * Registers into the same registry as the v7/v8 packs, so the menu and dispatcher pick it up automatically.
 */
const core = require('./wk7-core');
const { REG, CATS, category, fx, U, clip } = core;
const { config } = require('./config');
const { H } = require('./wk8');
const { snd, jget, getBuf, mediaOf, catbox, targetOf, ff, deepUrls, kindOf } = H;
const fs = require('fs'), path = require('path');
const enc = encodeURIComponent;

const SRA = 'https://api.some-random-api.com', SHIZO = 'https://shizoapi.onrender.com/api', PIES = 'https://api.shizo.top/pies', SIPUTZX = 'https://api.siputzx.my.id/api';
const PRINCE = config.PRINCE_API || 'https://api.princetechn.com/api', OKATSU = 'https://okatsu-rolezapiiz.vercel.app';
const DEFAULT_AVATAR = 'https://i.imgur.com/2wzGhpF.png';
const PROBES = [
    ['knight api', `https://knightbotapi.stream/api/download/ytaudio?apikey=${process.env.KNIGHT_API_KEY || 'knight'}&format=128kbps&url=https://youtu.be/dQw4w9WgXcQ`],
    ['hector yt', 'https://yt-dl.officialhectormanuel.workers.dev/?url=https://youtu.be/dQw4w9WgXcQ'], ['yupra ytmp3', `https://api.yupra.my.id/api/downloader/ytmp3?url=${enc('https://youtu.be/dQw4w9WgXcQ')}`],
    ['izumi youtube', `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${enc('https://youtu.be/dQw4w9WgXcQ')}&format=mp3`], ['keith dlmp3', `https://apis-keith.vercel.app/download/dlmp3?url=${enc('https://youtu.be/dQw4w9WgXcQ')}`],
    ['some-random-api animu', `${SRA}/animu/wink`], ['shizo pies', `${PIES}/japan?apikey=shizo`], ['shizo texts', `${SHIZO}/texts/flirt?apikey=shizo`], ['siputzx ssweb', `${SIPUTZX}/tools/ssweb?url=https://example.com&theme=light&device=desktop`]
];

const CASES = new Set();
try { for (const m of fs.readFileSync(path.join(__dirname, 'commands.js'), 'utf8').matchAll(/case\s*'([^'\n]+)'\s*:/g)) CASES.add(m[1]); } catch { /* optional */ }
function def(cat, names, help, fn) { const arr = [].concat(names).filter(n => !REG.has(n) && !CASES.has(n)); if (arr.length) core.def(cat, arr, help, fn); }
const tag = (id, icon, title) => { category(id, icon, title); CATS.get(id).tag = 'V9'; };
tag('fx', '🎭', 'IMAGE EFFECTS'); tag('txt', '✨', 'TEXT LOGOS'); tag('anim', '🎌', 'ANIME & PIES'); tag('kfun', '😂', 'FUN TEXTS'); tag('ktool', '🛠️', 'KNIGHT TOOLS');

// ───── avatar: replied/own image → upload; else the target's profile picture ─────
async function avatarUrl(c) {
    const m = await mediaOf(c, ['image', 'sticker']).catch(() => null);
    if (m) { try { return await catbox(m.buffer, 'a.jpg'); } catch { /* fall through */ } }
    const who = targetOf(c) || c.nowsender;
    try { return await c.socket.profilePictureUrl(who, 'image'); } catch { return DEFAULT_AVATAR; }
}
const canvas = async (kind, name, params) => getBuf(`${SRA}/canvas/${kind}/${name}?${new URLSearchParams(params)}`, { timeout: 45000 });

// ═══════════ IMAGE EFFECTS (some-random-api canvas) ═══════════
const AV_MISC = { heart: 'heart', horny: 'horny', circle: 'circle', lgbt: 'lgbt', lied: 'lied', lolice: 'lolice', simp: 'simpcard', simpcard: 'simpcard', tonikawa: 'tonikawa' };
for (const [name, ep] of Object.entries(AV_MISC)) def('fx', name, '[@user | reply to image]', async c => { await c.react('🎨'); await snd(c, { image: await canvas('misc', ep, { avatar: await avatarUrl(c) }) }); });
for (const name of ['comrade', 'gay', 'glass', 'jail', 'passed', 'triggered']) def('fx', name, '[@user | reply to image]', async c => { await c.react('🎨'); await snd(c, { image: await canvas('overlay', name, { avatar: await avatarUrl(c) }) }); });
def('fx', ['itssostupid', 'its-so-stupid', 'stupid'], '[text]  (@user or reply to image)', async c => { await snd(c, { image: await canvas('misc', 'its-so-stupid', { avatar: await avatarUrl(c), dog: c.textIn.replace(/@\d+/g, '').trim() || 'im+stupid' }) }); });
for (const ep of ['oogway', 'oogway2']) def('fx', ep, '<quote>', async c => { if (!c.textIn) return c.reply(U(c.p, ep + ' Be water my friend')); await snd(c, { image: await canvas('misc', ep, { quote: c.textIn, avatar: await avatarUrl(c) }) }); });
def('fx', ['tweet', 'faketweet'], '<comment>', async c => {
    if (!c.textIn) return c.reply(U(c.p, 'tweet Whitekid Prime is the best')); const n = c.senderName || 'User';
    await snd(c, { image: await canvas('misc', 'tweet', { displayname: n, username: n.replace(/\W+/g, '').toLowerCase() || 'user', comment: c.textIn, avatar: await avatarUrl(c), theme: 'dark' }) });
});
def('fx', ['ytcomment', 'youtubecomment'], '<comment>', async c => { if (!c.textIn) return c.reply(U(c.p, 'ytcomment nice video')); await snd(c, { image: await canvas('misc', 'youtube-comment', { username: c.senderName || 'User', comment: c.textIn, avatar: await avatarUrl(c) }) }); });
def('fx', ['blur', 'imgblur'], '(reply to an image)', async c => { const m = await mediaOf(c, ['image']); if (!m) return c.reply('⚠️ Reply to an image.'); await snd(c, { image: await ff(['-vf', 'boxblur=12:6'], m.buffer, 'jpg', 'jpg'), caption: '🌫️ Blurred' }); });

// ═══════════ TEXT LOGOS (ephoto360 through mumaker) ═══════════
const E = 'https://en.ephoto360.com/';
const LOGOS = {
    metallic: 'impressive-decorative-3d-metal-text-effect-798.html', ice: 'ice-text-effect-online-101.html', snow: 'create-a-snow-3d-text-effect-free-online-621.html', impressive: 'create-3d-colorful-paint-text-effect-online-801.html',
    matrix: 'matrix-text-effect-154.html', light: 'light-text-effect-futuristic-technology-style-648.html', neon: 'create-colorful-neon-light-text-effects-online-797.html', devil: 'neon-devil-wings-text-effect-online-683.html',
    purple: 'purple-text-effect-online-100.html', thunder: 'thunder-text-effect-online-97.html', leaves: 'green-brush-text-effect-typography-maker-online-153.html', '1917': '1917-style-text-effect-523.html',
    arena: 'create-cover-arena-of-valor-by-mastering-360.html', hacker: 'create-anonymous-hacker-avatars-cyan-neon-677.html', sand: 'write-names-and-messages-on-the-sand-online-582.html', blackpink: 'create-a-blackpink-style-logo-with-members-signatures-810.html',
    glitch: 'create-digital-glitch-text-effects-online-767.html', fire: 'flame-lettering-effect-372.html'
};
let mumaker = null; try { mumaker = require('mumaker'); } catch { /* optional dependency */ }
for (const [name, page] of Object.entries(LOGOS)) def('txt', 'logo' + name === 'logo1917' ? [name] : [name, 'logo' + name], '<text>', async c => {
    if (!c.textIn) return c.reply(U(c.p, `${name} Whitekid`)); if (!mumaker) return c.reply('⚠️ Run `npm install` to enable text logos (needs the mumaker package).');
    await c.react('🎨'); const r = await mumaker.ephoto(E + page, c.textIn.slice(0, 40)); if (!r || !r.image) throw new Error('Logo service is busy — try again in a minute.');
    await snd(c, { image: { url: r.image }, caption: `✨ ${name.toUpperCase()}` });
});

// ═══════════ ANIME & PIES ═══════════
const COUNTRIES = ['china', 'india', 'indonesia', 'japan', 'korea', 'malaysia', 'thailand', 'vietnam'];
def('anim', ['pies'], '<country>', async c => { const k = c.args[0] && c.args[0].toLowerCase(); if (!COUNTRIES.includes(k)) return c.reply(`🥧 PIES\n\n${U(c.p, 'pies japan')}\n\nCountries: ${COUNTRIES.join(', ')}`); await snd(c, { image: await getBuf(`${PIES}/${k}?apikey=shizo`, { timeout: 30000 }), caption: `🥧 ${k}` }); });
for (const k of COUNTRIES) def('anim', k, '', async c => { await snd(c, { image: await getBuf(`${PIES}/${k}?apikey=shizo`, { timeout: 30000 }), caption: `🥧 ${k}` }); });
def('anim', ['facepalm', 'face-palm'], '', async c => { const d = await jget(`${SRA}/animu/face-palm`, { timeout: 20000 }); const u = d.link || deepUrls(d)[0]; if (!u) throw new Error('empty'); const g = await getBuf(u).catch(() => null); let v = null; if (g) try { v = await ff(['-movflags', 'faststart', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'], g, 'gif', 'mp4'); } catch { /* image fallback */ } if (v) await snd(c, { video: v, gifPlayback: true, caption: '🤦' }); else await snd(c, { image: { url: u }, caption: '🤦' }); });
def('anim', ['animu', 'animeaction'], 'wink | pat | hug | face-palm', async c => {
    const t = (c.args[0] || '').toLowerCase(); if (!['wink', 'pat', 'hug', 'face-palm'].includes(t)) return c.reply(`🎌 ${U(c.p, 'animu wink')}\nTypes: wink, pat, hug, face-palm`);
    const d = await jget(`${SRA}/animu/${t}`, { timeout: 20000 }); await snd(c, { image: { url: d.link }, caption: `🎌 ${t}` });
});
def('anim', ['animuquote', 'animequote'], '', async c => { const d = await jget(`${SRA}/animu/quote`, { timeout: 20000 }); await c.reply(`🎌 “${d.sentence}”\n\n— ${d.character} (${d.anime})`); });

// ═══════════ FUN TEXTS ═══════════
const shizoText = (names, ep, icon) => def('kfun', names, '', async c => { const d = await jget(`${SHIZO}/texts/${ep}?apikey=shizo`, { timeout: 20000 }); const t = d && (d.result || d.text || d.message); if (!t) throw new Error('empty'); await c.reply(`${icon} ${t}`); });
shizoText(['flirt', 'pickup'], 'flirt', '😘'); shizoText(['shayari', 'shayri'], 'shayari', '🌹'); shizoText(['goodnight', 'gn', 'lovenight'], 'lovenight', '🌙');
def('kfun', ['roseday', 'rose'], '', async c => { const d = await jget(`${PRINCE}/fun/roseday?apikey=${config.PRINCE_KEY || 'prince'}`, { timeout: 20000 }); const t = d && (d.result || d.message); if (!t) throw new Error('empty'); await c.reply(`🌹 ${typeof t === 'string' ? t : JSON.stringify(t)}`); });
def('kfun', ['gpt', 'gpt3'], '<question>', async c => {
    if (!c.textIn) return c.reply(U(c.p, 'gpt explain gravity')); await c.react('🤖');
    const r = await require('./ai').ask(c.textIn, { cmd: 'chatgpt' }); if (!r) throw new Error('No AI service answered — try again.'); await c.reply(r.text);
});

// ═══════════ TOOLS ═══════════
def('ktool', ['ss', 'ssweb', 'screenshot'], '<link>', async c => {
    const u = (c.textIn.match(/https?:\/\/\S+/) || [])[0]; if (!u) return c.reply(U(c.p, 'ss https://google.com')); await c.react('📸');
    await snd(c, { image: await getBuf(`${SIPUTZX}/tools/ssweb?url=${enc(u)}&theme=light&device=desktop`, { timeout: 45000 }), caption: `📸 ${clip(u, 100)}` });
});
def('ktool', ['removebg', 'nobg', 'rmbg'], '(reply to an image)', async c => {
    const m = await mediaOf(c, ['image']); if (!m) return c.reply('⚠️ Reply to an image.'); await c.react('✂️');
    const b = await getBuf(`${SIPUTZX}/iloveimg/removebg?image=${enc(await catbox(m.buffer, 'x.jpg'))}`, { timeout: 60000 });
    if (b.length < 1000) throw new Error('Background remover failed — try another image.'); await snd(c, { image: b, caption: '✨ Background removed' });
});
def('ktool', ['remini', 'enhance2'], '(reply to an image)', async c => {
    const m = await mediaOf(c, ['image']); if (!m) return c.reply('⚠️ Reply to an image.'); await c.react('✨');
    const d = await jget(`${PRINCE}/tools/remini?apikey=${config.PRINCE_KEY || 'prince'}&url=${enc(await catbox(m.buffer, 'x.jpg'))}`, { timeout: 60000 });
    const u = deepUrls(d).find(x => kindOf(x) === 'image') || deepUrls(d)[0]; if (!u) throw new Error('Enhancer failed — try another image.'); await snd(c, { image: { url: u }, caption: '✨ Enhanced' });
});
def('ktool', ['sora', 'txt2video', 'aivideo'], '<describe the video>', async c => {
    if (!c.textIn) return c.reply(U(c.p, 'sora a cat playing piano')); await c.react('🎬'); await c.reply('🎬 Generating… this can take a minute.');
    const d = await jget(`${OKATSU}/ai/txt2video?text=${enc(c.textIn)}`, { timeout: 180000 }); const u = deepUrls(d).find(x => kindOf(x) === 'video') || deepUrls(d)[0]; if (!u) throw new Error('Video service is busy — try again later.');
    await snd(c, { video: { url: u }, caption: `🎬 ${clip(c.textIn, 120)}` });
});
def('ktool', ['jid'], '', async c => { const x = c.msg.message?.extendedTextMessage?.contextInfo; await c.reply(`🆔 Chat: ${c.from}\n👤 You: ${c.nowsender}${x && x.participant ? '\n↩️ Replied user: ' + x.participant : ''}`); });
def('ktool', ['telesticker', 'stickertelegram', 'tgsticker', 'tg'], '<t.me/addstickers/pack link>', async c => {
    const token = config.TG_TOKEN || process.env.TG_TOKEN; if (!token) return c.reply('⚠️ Set TG_TOKEN in .env (a Telegram bot token from @BotFather) to use this.');
    const name = (c.args[0] || '').replace(/^.*addstickers\//, ''); if (!name) return c.reply(U(c.p, 'telesticker https://t.me/addstickers/PackName'));
    const set = await jget(`https://api.telegram.org/bot${token}/getStickerSet?name=${enc(name)}`, { timeout: 20000 }); const list = (set.result && set.result.stickers) || [];
    if (!list.length) return c.reply('⚠️ Pack not found.'); await c.reply(`📦 ${set.result.title}: sending ${Math.min(list.length, 20)} of ${list.length}…`);
    for (const s of list.slice(0, 20)) { try { const f = await jget(`https://api.telegram.org/bot${token}/getFile?file_id=${s.file_id}`); const b = await getBuf(`https://api.telegram.org/file/bot${token}/${f.result.file_path}`); await snd(c, { sticker: b }); await new Promise(r => setTimeout(r, 700)); } catch { /* skip */ } }
});
def('ktool', ['listadmin', 'admins', 'infoadmin'], '', async c => {
    if (!c.isGroup) return c.reply('⚠️ Groups only!'); const m = await c.socket.groupMetadata(c.from); const a = m.participants.filter(p => p.admin);
    await c.socket.sendMessage(c.from, { text: `🛡️ ADMINS (${a.length})\n\n${a.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}${p.admin === 'superadmin' ? ' 👑' : ''}`).join('\n')}`, mentions: a.map(p => p.id) }, { quoted: c.msg });
});
def('ktool', ['tagnotadmin', 'tagmembers'], '<message>', async c => {
    if (!c.isGroup) return c.reply('⚠️ Groups only!'); if (!c.isSenderGroupAdmin && !c.isOwner && !c.isDevOverride) return c.reply('⚠️ Admins only!');
    const m = await c.socket.groupMetadata(c.from); const n = m.participants.filter(p => !p.admin);
    await c.socket.sendMessage(c.from, { text: `📢 ${c.textIn || 'Attention everyone!'}\n\n${n.map(p => '@' + p.id.split('@')[0]).join(' ')}`, mentions: n.map(p => p.id) }, { quoted: c.msg });
});

const NAMES = new Set(); for (const [, v] of CATS) if (v.tag === 'V9') v.names.forEach(n => NAMES.add(n));
module.exports = { NAMES, PROBES };
