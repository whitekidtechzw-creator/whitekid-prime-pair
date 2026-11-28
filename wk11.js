'use strict';
/*
 * WHITEKID PRIME v11 — FLASH-MD EXTRAS
 * Commands and APIs ported/rebuilt from Flash-MD V3 (MIT, © franceking1) that Whitekid Prime did not have yet:
 * WhatsApp profile/privacy tools, group join-requests + disappearing messages, polls, Instagram posts/stories,
 * quotes/jokes, 18 more text-logo styles. Same registry as the other packs, so the menu and dispatcher find them.
 * Left out on purpose: eval/exec (remote code execution from chat) and anything that needs someone else's secret API key.
 */
const core = require('./wk7-core');
const { REG, CATS, category, fx, U, clip, rnd } = core;
const { config } = require('./config');
const { H } = require('./wk8');
const { snd, jget, getBuf, mediaOf, ff, kindOf } = H;
const S = require('./services');
const fs = require('fs'), path = require('path'), os = require('os');
const enc = encodeURIComponent;

// ───── every external API this pack uses (also tested by .apicheck) ─────
const API = {
    NOOBS: config.NOOBS_API || 'https://noobs-api.top', BK9: config.BK9_API || 'https://bk9.fun',
    MOLLY: config.MOLLYGRAM_API || 'https://media.mollygram.com', NAYAN: config.NAYAN_API || 'https://nayan-video-downloader.vercel.app',
    POPCAT: config.POPCAT_API || 'https://api.popcat.xyz', FAVQS: 'https://favqs.com/api/qotd', ADVICE: 'https://api.adviceslip.com/advice',
    QUOTES: 'https://type.fit/api/quotes', NEKOS_FACT: 'https://nekos.life/api/v2/fact', TRIVIA: 'https://opentdb.com/api.php',
    EXCHANGE: 'https://api.exchangerate-api.com/v4/latest', URBAN: 'http://api.urbandictionary.com/v0/define',
    COUNTRY: 'https://api.siputzx.my.id/api/tools/countryInfo', BIBLE: 'https://bible-api.com', EPHOTO: 'https://en.ephoto360.com/'
};
const PROBES = [
    ['popcat joke', `${API.POPCAT}/joke`], ['favqs qotd', API.FAVQS], ['adviceslip', API.ADVICE], ['nekos fact', API.NEKOS_FACT],
    ['bk9 alldownload', `${API.BK9}/download/alldownload?url=https://youtu.be/dQw4w9WgXcQ`], ['nayan playlist', `${API.NAYAN}/ytsearch/playlist?url=https://youtu.be/dQw4w9WgXcQ`],
    ['mollygram', `${API.MOLLY}/?url=instagram&method=allposts`]
];

// ───── helpers ─────
const CASES = new Set();
try { for (const m of fs.readFileSync(path.join(__dirname, 'commands.js'), 'utf8').matchAll(/case\s*'([^'\n]+)'\s*:/g)) CASES.add(m[1]); } catch { /* optional */ }
const NAMES = new Set();
function def(cat, names, help, fn) { const arr = [].concat(names).filter(n => !REG.has(n) && !CASES.has(n)); if (arr.length) { core.def(cat, arr, help, fn); arr.forEach(n => NAMES.add(n)); } }
const tag = (id, icon, title) => { category(id, icon, title); CATS.get(id).tag = 'V11'; };
tag('wa', '📲', 'WHATSAPP PROFILE & PRIVACY');
for (const [id, icon, title] of [['grp', '👥', 'GROUP ADMIN'], ['dl', '📥', 'DOWNLOADERS'], ['yt', '▶️', 'YOUTUBE'], ['botx', '🤖', 'BOT INFO'], ['gen', '🎲', 'GENERATORS'], ['games', '🎮', 'GAMES & SOCIAL'], ['txt', '🎨', 'TEXT LOGOS'], ['conv', '🔄', 'CONVERT & TTS']]) category(id, icon, title);

const own = c => c.isOwner || c.isDevOverride;
const OWN_MSG = '🔐 Owner-only command.';
const canAdmin = c => c.isSenderGroupAdmin || c.isOwner || c.isDevOverride;
const myJid = c => (c.socket.user?.id || '').split(':')[0].split('@')[0] + '@s.whatsapp.net';
const num = j => String(j || '').split('@')[0].split(':')[0];
function jidOf(c) {
    const ci = S.getContextInfo(c.msg.message) || {};
    if (ci.mentionedJid && ci.mentionedJid[0]) return ci.mentionedJid[0];
    if (ci.participant && ci.quotedMessage) return ci.participant;
    const d = String(c.args[0] || '').replace(/\D/g, '');
    if (d.length >= 7) return d + '@s.whatsapp.net';
    return c.isGroup ? null : c.from; // in a private chat the other person
}
async function botIsAdmin(c, meta) { const me = num(c.socket.user?.id); return meta.participants.some(p => p.admin && num(p.id) === me); }
async function groupGuard(c, { admin = true, botAdmin = true } = {}) {
    if (!c.isGroup) { await c.reply('⚠️ Groups only!'); return null; }
    if (admin && !canAdmin(c)) { await c.reply('⚠️ Admins only!'); return null; }
    const meta = await c.socket.groupMetadata(c.from);
    if (botAdmin && !(await botIsAdmin(c, meta))) { await c.reply('⚠️ Make the bot an admin first.'); return null; }
    return meta;
}
const PRIV = ['all', 'contacts', 'contact_blacklist', 'none'];
const PRIV_HELP = '• all — everyone\n• contacts — my contacts\n• contact_blacklist — contacts except…\n• none — nobody';

// ═══════════ WHATSAPP PROFILE & PRIVACY (owner) ═══════════
def('wa', ['block'], '<reply | @user | number>', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    const j = jidOf(c); if (!j) return c.reply(U(c.p, 'block 263771234567  (or reply to the person)'));
    if (num(j) === num(c.socket.user?.id)) return c.reply('⚠️ You cannot block yourself.');
    await c.socket.updateBlockStatus(j, 'block'); await c.reply(`🚫 Blocked +${num(j)}`);
});
def('wa', ['unblock'], '<reply | @user | number>', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    const j = jidOf(c); if (!j) return c.reply(U(c.p, 'unblock 263771234567  (or reply to the person)'));
    await c.socket.updateBlockStatus(j, 'unblock'); await c.reply(`✅ Unblocked +${num(j)}`);
});
def('wa', ['blocklist', 'blocked'], '', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    const list = await c.socket.fetchBlocklist();
    if (!list || !list.length) return c.reply('✅ Nobody is blocked.');
    await c.reply(`🚫 BLOCKED (${list.length})\n\n` + clip(list.map((j, i) => `${i + 1}. +${num(j)}`).join('\n')));
});
def('wa', ['privacy'], '', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    const p = await c.socket.fetchPrivacySettings(true);
    await c.reply(`🔒 PRIVACY SETTINGS\n\nOnline: ${p.online || 'N/A'}\nProfile photo: ${p.profile || 'N/A'}\nLast seen: ${p.last || 'N/A'}\nRead receipts: ${p.readreceipts || 'N/A'}\nStatus: ${p.status || 'N/A'}\nGroup add: ${p.groupadd || 'N/A'}\nCalls: ${p.calladd || 'N/A'}`);
});
const privCmd = (names, label, method, allowed, help) => def('wa', names, '<' + allowed.join(' | ') + '>', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    const v = (c.args[0] || '').toLowerCase();
    if (!allowed.includes(v)) return c.reply(`🔒 ${label.toUpperCase()}\n\n${U(c.p, names[0] + ' ' + allowed[0])}\n\n${help}`);
    await c.socket[method](v); await c.reply(`✅ ${label} privacy set to: ${v}`);
});
privCmd(['lastseen'], 'Last seen', 'updateLastSeenPrivacy', PRIV, PRIV_HELP);
privCmd(['mydp'], 'Profile photo', 'updateProfilePicturePrivacy', PRIV, PRIV_HELP);
privCmd(['mystatus'], 'Status', 'updateStatusPrivacy', PRIV, PRIV_HELP);
privCmd(['myonline'], 'Online', 'updateOnlinePrivacy', ['all', 'match_last_seen'], '• all — everyone sees when you are online\n• match_last_seen — same people as last seen');
def('wa', ['removedp', 'removepp'], '', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    await c.socket.removeProfilePicture(myJid(c)); await c.reply('✅ Profile picture removed.');
});
def('wa', ['fullpp', 'fullprofilepic'], '(reply to an image)', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    const m = await mediaOf(c, ['image']); if (!m) return c.reply(`📷 Reply to an image with ${c.p}fullpp — the whole picture is used, nothing is cropped.`);
    let buf = m.buffer;
    try { const sharp = require('sharp'); buf = await sharp(m.buffer).resize(720, 720, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } }).jpeg({ quality: 90 }).toBuffer(); } catch { /* sharp missing: use the original */ }
    await c.socket.updateProfilePicture(myJid(c), buf); await c.reply('✅ Profile picture updated (full image).');
});
def('wa', ['onwa', 'checkid', 'checkno'], '<number>', async c => {
    const n = String(c.args[0] || '').replace(/\D/g, ''); if (n.length < 7) return c.reply(U(c.p, 'onwa 263771234567'));
    const [r] = await c.socket.onWhatsApp(n + '@s.whatsapp.net');
    await c.reply(r && r.exists ? `✅ +${n} is on WhatsApp.` : `⚠️ +${n} is not on WhatsApp.`);
});
def('wa', ['bizprofile', 'bizp'], '<reply | @user | number>', async c => {
    const j = jidOf(c); if (!j) return c.reply(U(c.p, 'bizprofile 263771234567'));
    const b = await c.socket.getBusinessProfile(j);
    if (!b) return c.reply('⚠️ That number does not have a WhatsApp Business profile.');
    await c.reply(`🏢 BUSINESS PROFILE\n\nNumber: +${num(j)}\nDescription: ${b.description || 'none'}\nCategory: ${b.category || 'none'}\nEmail: ${b.email || 'none'}\nWebsite: ${[].concat(b.website || []).join(', ') || 'none'}\nAddress: ${b.address || 'none'}`);
});
def('wa', ['vcard', 'card'], '<reply | @user | number>', async c => {
    const j = jidOf(c); if (!j) return c.reply(U(c.p, 'vcard 263771234567'));
    const name = (await c.socket.onWhatsApp(j).catch(() => null)) ? '+' + num(j) : '+' + num(j);
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;type=VOICE;waid=${num(j)}:+${num(j)}\nEND:VCARD`;
    await snd(c, { contacts: { displayName: name, contacts: [{ vcard }] } });
});
def('wa', ['details', 'rawmsg'], '(reply to a message)', async c => {
    const ci = S.getContextInfo(c.msg.message); if (!ci || !ci.quotedMessage) return c.reply('📎 Reply to a message to see its raw structure.');
    const json = JSON.stringify(ci.quotedMessage, (k, v) => (typeof v === 'object' && v && v.type === 'Buffer') || (typeof v === 'string' && v.length > 200) ? '[hidden]' : v, 2);
    for (const part of (json.match(/[\s\S]{1,3500}/g) || []).slice(0, 4)) await c.reply('```' + part + '```');
});
def('wa', ['mygroups'], '', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    const all = Object.values(await c.socket.groupFetchAllParticipating());
    if (!all.length) return c.reply('You are not in any group.');
    await c.reply(`👥 MY GROUPS (${all.length})\n\n` + clip(all.map((g, i) => `${i + 1}. ${g.subject} — ${g.participants.length}`).join('\n')));
});
def('wa', ['star'], '(reply to a message)', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    const q = c.msg.quoted; if (!q || !q.key.id) return c.reply('⭐ Reply to the message you want to star.');
    await c.socket.chatModify({ star: { messages: [{ id: q.key.id, fromMe: !!q.key.fromMe }], star: true } }, c.from); await c.reply('⭐ Starred.');
});
def('wa', ['unstar'], '(reply to a message)', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    const q = c.msg.quoted; if (!q || !q.key.id) return c.reply('Reply to the message you want to unstar.');
    await c.socket.chatModify({ star: { messages: [{ id: q.key.id, fromMe: !!q.key.fromMe }], star: false } }, c.from); await c.reply('✅ Unstarred.');
});
def('wa', ['archive'], '', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    await c.socket.chatModify({ archive: true, lastMessages: [{ key: c.msg.key, messageTimestamp: c.msg.messageTimestamp }] }, c.from); await c.reply('📦 Chat archived.');
});
def('wa', ['unpin'], '', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    await c.socket.chatModify({ pin: false }, c.from); await c.reply('📌 Chat unpinned.');
});
def('wa', ['save'], '(reply to anything)', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    const ci = S.getContextInfo(c.msg.message), qm = ci && ci.quotedMessage; if (!qm) return c.reply('💾 Reply to a photo, video, voice note, sticker or text to save it to your own chat.');
    const me = myJid(c), f = S.findMedia(qm);
    if (!f) { const t = S.findText(qm); if (!t) return c.reply('⚠️ Nothing to save in that message.'); await c.socket.sendMessage(me, { text: '💾 ' + t }); return c.reply('✅ Saved to your chat.'); }
    const buf = await S.voApi.download(f.obj, f.kind); if (!buf || !buf.length) throw new Error('empty media (it may have expired)');
    const cap = f.obj.caption || '';
    if (f.kind === 'image') await c.socket.sendMessage(me, { image: buf, caption: cap });
    else if (f.kind === 'video') await c.socket.sendMessage(me, { video: buf, caption: cap, mimetype: f.obj.mimetype || 'video/mp4' });
    else if (f.kind === 'audio') await c.socket.sendMessage(me, { audio: buf, mimetype: f.obj.mimetype || 'audio/ogg; codecs=opus', ptt: !!f.obj.ptt });
    else if (f.kind === 'sticker') await c.socket.sendMessage(me, { sticker: buf });
    else await c.socket.sendMessage(me, { document: buf, mimetype: f.obj.mimetype || 'application/octet-stream', fileName: f.obj.fileName || 'file' });
    await c.reply('✅ Saved to your chat.');
});

// ═══════════ GROUPS ═══════════
def('grp', ['rename', 'gname'], '<new group name>', async c => {
    const m = await groupGuard(c); if (!m) return;
    if (!c.q) return c.reply(U(c.p, 'rename New Group Name'));
    if (c.q.length > 100) return c.reply('⚠️ Group names can be 100 characters at most.');
    await c.socket.groupUpdateSubject(c.from, c.q); await c.reply('✅ Group name updated.');
});
def('grp', ['req', 'requests', 'joinrequests'], '', async c => {
    const m = await groupGuard(c, { botAdmin: true }); if (!m) return;
    const list = await c.socket.groupRequestParticipantsList(c.from);
    if (!list || !list.length) return c.reply('✅ No pending join requests.');
    await c.reply(`📨 PENDING REQUESTS (${list.length})\n\n` + clip(list.map((r, i) => `${i + 1}. +${num(r.jid || r.phone_number || r)}`).join('\n')) + `\n\n${c.p}approve all · ${c.p}reject all`);
});
const reqAction = (action, names) => def('grp', names, 'all', async c => {
    const m = await groupGuard(c); if (!m) return;
    const list = await c.socket.groupRequestParticipantsList(c.from);
    if (!list || !list.length) return c.reply('✅ No pending join requests.');
    const jids = list.map(r => r.jid || r.phone_number || r).filter(Boolean);
    let done = 0;
    for (let i = 0; i < jids.length; i += 20) { await c.socket.groupRequestParticipantsUpdate(c.from, jids.slice(i, i + 20), action); done += jids.slice(i, i + 20).length; }
    await c.reply(`${action === 'approve' ? '✅ Approved' : '🚫 Rejected'} ${done} request(s).`);
});
reqAction('approve', ['approve', 'approve-all', 'approveall', 'accept']);
reqAction('reject', ['reject', 'rejectall', 'reject-all', 'rej']);
const disap = (names, secs, label) => def('grp', names, '', async c => {
    const m = await groupGuard(c); if (!m) return;
    await c.socket.groupToggleEphemeral(c.from, secs); await c.reply(secs ? `⏳ Disappearing messages ON: ${label}.` : '✅ Disappearing messages turned OFF.');
});
disap(['disap1', 'disap24h'], 86400, '24 hours'); disap(['disap7', 'disap7d'], 604800, '7 days'); disap(['disap90', 'disap90d'], 7776000, '90 days'); disap(['disap-off', 'disapoff'], 0, 'off');
def('grp', ['disap'], '', async c => c.reply(`⏳ DISAPPEARING MESSAGES\n\n${c.p}disap1 — 24 hours\n${c.p}disap7 — 7 days\n${c.p}disap90 — 90 days\n${c.p}disap-off — off`));
def('grp', ['create', 'newgroup', 'newgc'], '<name>', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    if (!c.q) return c.reply(U(c.p, 'create My New Group'));
    const g = await c.socket.groupCreate(c.q.slice(0, 100), [c.nowsender].filter(Boolean));
    let link = ''; try { link = 'https://chat.whatsapp.com/' + await c.socket.groupInviteCode(g.id); } catch { /* optional */ }
    await c.reply(`✅ Group created: ${g.subject}\n${link}`);
});
def('grp', ['poll'], 'Question | option 1 | option 2 | …', async c => {
    const parts = c.q.split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length < 3) return c.reply(`📊 ${U(c.p, 'poll Best day? | Friday | Saturday | Sunday')}\n\nAt least 2 options, 12 at most.`);
    const [name, ...values] = parts;
    await snd(c, { poll: { name: name.slice(0, 250), values: values.slice(0, 12).map(v => v.slice(0, 100)), selectableCount: 1 } });
});

// ═══════════ FUN, QUOTES, INFO ═══════════
def('gen', ['jokes', 'joke2'], '', async c => { const d = await jget(`${API.POPCAT}/joke`, { timeout: 15000 }); if (!d || !d.joke) throw new Error('empty'); await c.reply('😂 ' + d.joke); });
def('gen', ['inspire', 'inspiration'], '', async c => {
    const d = await core.tryApis([{ url: API.FAVQS, pick: x => x && x.quote && { t: x.quote.body, a: x.quote.author } }, { url: API.ADVICE, pick: x => x && x.slip && { t: x.slip.advice, a: 'Advice' } }]);
    await c.reply(`✨ INSPIRATION\n\n“${d.t}”\n— ${d.a || 'Unknown'}`);
});
def('gen', ['quotes', 'quote2'], '', async c => {
    const d = await core.tryApis([{ url: API.FAVQS, pick: x => x && x.quote && { t: x.quote.body, a: x.quote.author } }, { url: API.QUOTES, pick: x => Array.isArray(x) && x.length ? (q => ({ t: q.text, a: String(q.author || 'Unknown').replace(/, type\.fit$/, '') }))(rnd.pick(x)) : null }]);
    await c.reply(`💬 QUOTE\n\n“${d.t}”\n— ${d.a}`);
});
def('games', ['hack', 'fakehack', 'h4ck'], '<@user | name>', async c => {
    const who = c.q || (jidOf(c) ? '+' + num(jidOf(c)) : 'target');
    const steps = ['💻 Connecting to server…', '🔎 Scanning ports… 22 80 443', '🧬 Injecting payload… ▓▓░░░░░░░░ 20%', '🔓 Bypassing firewall… ▓▓▓▓▓░░░░░ 50%', '📡 Extracting data… ▓▓▓▓▓▓▓▓░░ 80%', '✅ Done… ▓▓▓▓▓▓▓▓▓▓ 100%'];
    const sent = await c.socket.sendMessage(c.from, { text: `🕵️ HACKING ${who}\n\n${steps[0]}` }, { quoted: c.msg });
    for (let i = 1; i < steps.length; i++) { await new Promise(r => setTimeout(r, 1300)); try { await c.socket.sendMessage(c.from, { text: `🕵️ HACKING ${who}\n\n${steps.slice(0, i + 1).join('\n')}`, edit: sent.key }); } catch { /* edits can fail on old clients */ } }
    await new Promise(r => setTimeout(r, 1300));
    await c.reply(`😂 Just kidding. ${who} is safe — this is only a prank.`);
});
def('botx', ['host', 'platform'], '', async c => {
    const e = process.env;
    const plat = e.RENDER ? 'Render' : e.DYNO ? 'Heroku' : e.RAILWAY_ENVIRONMENT ? 'Railway' : e.KOYEB_APP_NAME ? 'Koyeb' : e.FLY_APP_NAME ? 'Fly.io' : e.REPL_ID ? 'Replit' : e.P_SERVER_UUID ? 'Pterodactyl panel' : e.pm_id ? 'VPS (pm2)' : os.platform() === 'android' ? 'Termux' : 'Unknown / VPS';
    await c.reply(`🖥️ HOST\n\nPlatform: ${plat}\nOS: ${os.type()} ${os.release()} (${os.arch()})\nNode: ${process.version}\nCPU: ${(os.cpus()[0] || {}).model || 'n/a'} ×${os.cpus().length}\nRAM: ${((os.totalmem() - os.freemem()) / 1048576).toFixed(0)} / ${(os.totalmem() / 1048576).toFixed(0)} MB\nUptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor(process.uptime() % 3600 / 60)}m`);
});
const LANGS = { af: 'Afrikaans', ar: 'Arabic', bn: 'Bengali', zh: 'Chinese', nl: 'Dutch', en: 'English', fr: 'French', de: 'German', el: 'Greek', hi: 'Hindi', id: 'Indonesian', it: 'Italian', ja: 'Japanese', ko: 'Korean', ms: 'Malay', pt: 'Portuguese', ru: 'Russian', es: 'Spanish', sw: 'Swahili', ta: 'Tamil', th: 'Thai', tr: 'Turkish', uk: 'Ukrainian', ur: 'Urdu', vi: 'Vietnamese', zu: 'Zulu', sn: 'Shona', xh: 'Xhosa', st: 'Sesotho', ny: 'Chichewa' };
def('botx', ['language', 'lang', 'langs', 'idioma', 'lugha', 'bahasa'], '', async c => c.reply(`🌍 LANGUAGE CODES\n\n${Object.entries(LANGS).map(([k, v]) => `${k} — ${v}`).join('\n')}\n\nUse them with ${c.p}translate / ${c.p}tr: ${c.p}tr sn Hello`));

// ═══════════ DOWNLOADS & YOUTUBE ═══════════
async function mollyItems(user, method) {
    const r = await fx(`${API.MOLLY}/?url=${enc(user)}&method=${method}`, { timeout: 30000, headers: { referer: 'https://mollygram.com/', origin: 'https://mollygram.com' } });
    const d = await r.json(); if (d.status !== 'ok' || !d.html) return [];
    const items = []; const re = /<div[^>]*class="[^"]*load[^"]*"[\s\S]*?(?=<div[^>]*class="[^"]*load[^"]*"|$)/g;
    for (const blk of d.html.match(re) || [d.html]) { const v = blk.match(/<source[^>]+src="([^"]+)"/); const i = blk.match(/<img[^>]+src="([^"]+)"/); if (v) items.push({ type: 'video', url: v[1].replace(/&amp;/g, '&') }); else if (i) items.push({ type: 'image', url: i[1].replace(/&amp;/g, '&') }); }
    return items;
}
const igCmd = (names, method, label) => def('dl', names, '<instagram username>', async c => {
    const u = (c.args[0] || '').replace(/^@/, '').replace(/[^\w.]/g, ''); if (!u) return c.reply(U(c.p, names[0] + ' username'));
    await c.react('📥'); const items = (await mollyItems(u, method)).slice(0, 5);
    if (!items.length) return c.reply(`⚠️ No ${label} found for @${u} (private account, nothing posted, or the service is busy).`);
    for (const it of items) { await snd(c, it.type === 'video' ? { video: { url: it.url }, caption: `📸 @${u}` } : { image: { url: it.url }, caption: `📸 @${u}` }); await new Promise(r => setTimeout(r, 1500)); }
});
igCmd(['posts', 'igposts', 'instafeed'], 'allposts', 'posts'); igCmd(['story', 'igstories', 'stories', 'igstory'], 'allstories', 'stories');
def('dl', ['video-dl', 'vddownload', 'alldl2'], '<video link>', async c => {
    const u = c.args[0]; if (!/^https?:\/\//i.test(u || '')) return c.reply(U(c.p, 'video-dl https://…'));
    await c.react('📥');
    const url = await core.tryApis([{ url: `${API.BK9}/download/alldownload?url=${enc(u)}`, pick: d => { const x = d && (d.BK9 || d.result || d); return x && (x.high || x.low || x.url || x.video || (Array.isArray(x) && x[0])); } }, { url: `${API.NOOBS}/dipto/alldl?url=${enc(u)}`, pick: d => d && (d.result || d.url || d.downloadLink) }], { timeout: 40000 });
    await snd(c, { video: { url: typeof url === 'string' ? url : url.url }, caption: '📥 Done' });
});
def('dl', ['image-dl', 'imgdl'], '<direct image link>', async c => {
    const u = c.args[0]; if (!/^https?:\/\//i.test(u || '')) return c.reply(U(c.p, 'image-dl https://…/photo.jpg'));
    const buf = await getBuf(u, { timeout: 40000 }); await snd(c, kindOf(u) === 'video' ? { video: buf } : { image: buf, caption: '🖼️ Done' });
});
def('yt', ['playlist', 'ytlist', 'pl'], '<playlist link | video link | search>', async c => {
    if (!c.q) return c.reply(U(c.p, 'playlist https://youtube.com/playlist?list=…'));
    let url = c.q;
    if (!/youtu\.?be|youtube\.com/i.test(url)) { const yts = require('yt-search'); const r = await yts(c.q); if (!r.videos[0]) return c.reply('⚠️ Nothing found.'); url = r.videos[0].url; }
    const d = await jget(`${API.NAYAN}/ytsearch/playlist?url=${enc(url)}`, { timeout: 40000 });
    const vids = d && d.videos; if (!d || !d.status || !vids || !vids.length) return c.reply('⚠️ Could not read that playlist.');
    await c.reply(`🎞️ PLAYLIST (${vids.length})\n\n` + clip(vids.slice(0, 15).map((v, i) => `${i + 1}. ${v.title || v.name}\n   ${v.url || v.link || ''}`).join('\n')));
});
def('conv', ['trim', 'cut'], '<start> <end> (reply to a video)  e.g. trim 00:00:05 00:00:20', async c => {
    const t = /^(\d+:)?\d{1,2}:\d{2}$|^\d+(\.\d+)?$/; const [a, b] = c.args;
    if (!t.test(a || '') || !t.test(b || '')) return c.reply(U(c.p, 'trim 00:05 00:20') + '\n\nReply to a video. Times are mm:ss or seconds.');
    const m = await mediaOf(c, ['video', 'audio']); if (!m) return c.reply('🎬 Reply to a video or voice note.');
    await c.react('✂️'); const ext = m.type === 'video' ? 'mp4' : 'mp3';
    const out = await ff(['-ss', a, '-to', b, ...(m.type === 'video' ? ['-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac'] : [])], m.buffer, ext, ext);
    await snd(c, m.type === 'video' ? { video: out, caption: '✂️ Trimmed' } : { audio: out, mimetype: 'audio/mpeg' });
});

// ═══════════ MORE TEXT LOGOS (ephoto360 through mumaker) ═══════════
const LOGOS = {
    dragonball: 'create-dragon-ball-style-text-effects-online-809.html', naruto: 'naruto-shippuden-logo-style-text-effect-online-808.html', sunset: 'create-sunset-light-text-effects-online-807.html',
    chocolate: 'chocolate-text-effect-353.html', mechanical: 'create-your-name-in-a-mechanical-style-306.html', rain: 'foggy-rainy-text-effect-75.html', cloth: 'text-on-cloth-effect-62.html',
    water: 'create-water-effect-text-online-295.html', graffiti: 'create-a-cartoon-style-graffiti-text-effect-online-668.html', boom: 'boom-text-comic-style-text-effect-675.html',
    foggyglass: 'handwritten-text-on-foggy-glass-online-680.html', gold: 'modern-gold-4-213.html', incandescent: 'text-effects-incandescent-bulbs-219.html', wetglass: 'write-text-on-wet-glass-online-589.html',
    pavement: 'typography-text-effect-on-pavement-online-774.html', steel: 'dragon-steel-text-effect-online-347.html', sunlight: 'sunlight-shadow-text-204.html', frozen: 'create-a-frozen-christmas-text-effect-online-792.html', starnight: 'stars-night-online-1-85.html'
};
let mumaker = null; try { mumaker = require('mumaker'); } catch { /* optional dependency */ }
for (const [name, page] of Object.entries(LOGOS)) def('txt', [name, 'logo' + name], '<text>', async c => {
    if (!c.textIn) return c.reply(U(c.p, `${name} Whitekid`)); if (!mumaker) return c.reply('⚠️ Run `npm install` to enable text logos (needs the mumaker package).');
    await c.react('🎨'); const r = await mumaker.ephoto(API.EPHOTO + page, c.textIn.slice(0, 40)); if (!r || !r.image) throw new Error('Logo service is busy — try again in a minute.');
    await snd(c, { image: { url: r.image }, caption: `✨ ${name.toUpperCase()}` });
});
// Flash-MD's short names, kept as aliases where they are free
for (const [alias, name] of [['typo', 'pavement'], ['child', 'wetglass'], ['night', 'starnight']]) if (!REG.has(alias) && !CASES.has(alias) && REG.has(name)) { const e = REG.get(name); REG.set(alias, e); CATS.get(e.cat).names.push(alias); NAMES.add(alias); }

module.exports = { NAMES, API, PROBES, LOGOS };
