'use strict';
/*
 * WHITEKID PRIME v12 — STATUS · VIEW-ONCE · AI VIDEO · EXTRAS
 * Ideas and endpoints taken from Toxic-MD and XLICON-V2-MD that Whitekid Prime did not have yet:
 *   • status tools   — .autosavestatus (copy contacts' statuses to your DM), .antigroupstatus, .antistatusmention
 *   • view-once      — .antiviewonce (save every view-once to your DM), .vvx
 *   • makers / AI    — .bratvid, .iqc, .carbon, .tofigure, .bard, .quillbot, .capcut
 *   • group tools    — .afk, .tagadmins, .listonline, .addbadword / .removebadword / .badwordlist
 *   • anime & fun    — .neko .kitsune .husbando + more reaction gifs, .catfact, .country
 *   • menus          — .downloadmenu .groupmenu .ownermenu .aimenu .gamesmenu .toolsmenu …
 * Left out on purpose: eval/shell/run-code commands (remote code execution from chat), nude/“bugil” editors, and
 * anything that needs somebody else's private API key (Toxic's .toghibli ships a key that is not ours).
 * Same registry as the other packs, so the menu, .cmds and the dispatcher find everything.
 */
const core = require('./wk7-core');
const { REG, CATS, category, U, clip, rnd } = core;
const { config } = require('./config');
const W8 = require('./wk8');
const { snd, jget, getBuf, mediaOf, deepUrls, kindOf, catbox } = W8.H;
const S = require('./services');
const autos = require('./autos');
const fs = require('fs'), path = require('path');
const enc = encodeURIComponent;

// ───── every external API this pack uses (also tested by .apicheck) ─────
const API = {
    FAA: (W8.API && W8.API.FAA) || 'https://api-faa.my.id',
    NEXRAY_EU: config.NEXRAY_EU || 'https://api.nexray.eu.cc', DELINE: 'https://api.deline.web.id', CARBON: 'https://carbonara.solopov.dev/api/cook',
    FIGURE: 'https://api.fikmydomainsz.xyz/imagecreator/tofigur', SIPUTZX: 'https://api.siputzx.my.id/api', NEKOS: 'https://nekos.best/api/v2',
    CATFACT: 'https://catfact.ninja/fact', COUNTRY: 'https://restcountries.com/v3.1', POLLINATIONS: 'https://image.pollinations.ai/prompt',
    PAX: config.PAXSENIX_URL || 'https://api.paxsenix.org', OKATSU: config.OKATSU_API || 'https://okatsu-rolezapiiz.vercel.app'
};
const PROBES = [
    ['faa bard', `${API.FAA}/faa/bard-google?query=hi`], ['faa quillbot', `${API.FAA}/faa/quillbot?text=hello`],
    ['nexray bratvid', `${API.NEXRAY_EU}/maker/bratvid?text=hi`], ['nexray text2video', `${API.NEXRAY_EU}/ai/text2video`],
    ['deline iqc', `${API.DELINE}/maker/iqc?text=hi&chatTime=10:00&statusBarTime=10:00`], ['carbonara', API.CARBON.replace('/api/cook', '')],
    ['tofigure', `${API.FIGURE}?url=https://example.com/a.jpg`], ['siputzx capcut', `${API.SIPUTZX}/d/capcut?url=https://www.capcut.com/`],
    ['nekos.best neko', `${API.NEKOS}/neko`], ['catfact.ninja', API.CATFACT], ['restcountries', `${API.COUNTRY}/name/zimbabwe?fullText=true`],
    ['pollinations (video fallback)', `${API.POLLINATIONS}/test?width=64&height=64&nologo=true`], ['paxsenix', API.PAX], ['okatsu txt2video', `${API.OKATSU}/ai/txt2video?text=test`]
];

// ───── helpers ─────
const CASES = new Set();
try { for (const m of fs.readFileSync(path.join(__dirname, 'commands.js'), 'utf8').matchAll(/case\s*'([^'\n]+)'\s*:/g)) CASES.add(m[1]); } catch { /* optional */ }
const NAMES = new Set();
function def(cat, names, help, fn) { const arr = [].concat(names).filter(n => !REG.has(n) && !CASES.has(n)); if (arr.length) { core.def(cat, arr, help, fn); arr.forEach(n => NAMES.add(n)); } }
const tag = (id, icon, title) => { category(id, icon, title); CATS.get(id).tag = 'V12'; };
tag('stat', '📺', 'STATUS & VIEW-ONCE'); tag('vid', '🎬', 'MAKERS & EFFECTS'); tag('ai2', '🤖', 'MORE AI');
for (const [id, icon, title] of [['grp', '👥', 'GROUP ADMIN'], ['dl', '📥', 'DOWNLOADERS'], ['botx', '🤖', 'BOT INFO'], ['react', '💞', 'REACTIONS'], ['gen', '🎲', 'GENERATORS'], ['anim', '🌸', 'ANIME & PIES']]) category(id, icon, title);

const own = c => c.isOwner || c.isDevOverride;
const OWN_MSG = '🔐 Owner-only command.';
const canAdmin = c => c.isSenderGroupAdmin || c.isOwner || c.isDevOverride;
const num = j => String(j || '').split('@')[0].split(':')[0];
const st = v => (v ? 'ON 🟢' : 'OFF 🔴');
function onoff(a) { const v = String(a || '').toLowerCase(); if (['on', 'enable', 'true', '1', 'yes'].includes(v)) return true; if (['off', 'disable', 'false', '0', 'no'].includes(v)) return false; return null; }
const mentionedOrReply = c => { const ci = S.getContextInfo(c.msg.message) || {}; return (ci.mentionedJid && ci.mentionedJid[0]) || (ci.quotedMessage && ci.participant) || null; };

// ═══════════ STATUS & VIEW-ONCE ═══════════
def('stat', ['antiviewonce', 'antivv', 'autovv'], 'on | off  (owner) — every view-once the bot sees is also saved to your DM', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    const v = onoff(c.args[0]), cur = !!autos.get().flags.antiviewonce;
    if (v === null) return c.reply(`👁️ *ANTI VIEW-ONCE*: ${st(cur)}\n\nWhen ON, each view-once photo, video or voice note that reaches the bot is copied to your own chat the moment it arrives — before it can expire.\n\n${U(c.p, 'antiviewonce on')}  /  ${U(c.p, 'antiviewonce off').replace('📌 Usage: ', '')}\nTo open one by hand: reply to it with ${c.p}vv`);
    autos.setFlag('antiviewonce', v); await c.reply(`👁️ Anti view-once is now ${st(v)}`);
});
def('stat', ['vvx', 'vvone', 'openvv'], '(reply to a view-once)', async c => { await S.viewonceCommand(c.socket, c.from, c.msg, c.fakeCard); });
def('stat', ['autosavestatus', 'statussaver', 'autosavest', 'autostatussave'], 'on | off  (owner) — copy every status your contacts post to your DM', async c => {
    if (!own(c)) return c.reply(OWN_MSG);
    const v = onoff(c.args[0]), cur = !!autos.get().flags.savestatus;
    if (v === null) return c.reply(`📥 *STATUS SAVER*: ${st(cur)}\n\nWhen ON, every status (text, photo, video, voice) posted by your contacts is copied to your own chat.\n\n${U(c.p, 'autosavestatus on')}\nTo save just one by hand: reply to the status with ${c.p}savestatus`);
    autos.setFlag('savestatus', v); await c.reply(`📥 Status saver is now ${st(v)}`);
});
function groupToggle(kind, label, help) {
    return async c => {
        if (!c.isGroup) return c.reply('⚠️ Groups only!'); if (!canAdmin(c)) return c.reply('⚠️ Admins only!');
        const a = String(c.args[0] || '').toLowerCase(), cur = autos.groupMode(kind, c.from);
        if (a === 'on' || a === 'delete') { autos.setGroupMode(kind, c.from, 'on'); return c.reply(`🛡️ ${label} is ON — offending messages from non-admins are deleted.\nThe bot must be an admin.`); }
        if (a === 'kick') { autos.setGroupMode(kind, c.from, 'kick'); return c.reply(`🛡️ ${label} is ON (kick) — the message is deleted and the sender is removed.\nThe bot must be an admin.`); }
        if (a === 'off') { autos.setGroupMode(kind, c.from, 'off'); return c.reply(`🛡️ ${label} is OFF.`); }
        return c.reply(`🛡️ *${label}*: ${cur === 'off' ? 'OFF 🔴' : cur === 'kick' ? 'ON 🟢 (kick)' : 'ON 🟢'}\n${help}\n\n${c.p}${c.command} on | off | kick`);
    };
}
def('stat', ['antigroupstatus', 'antigcstatus', 'ags', 'nogroupstatus'], 'on | off | kick  (admins) — removes group-status posts from non-admins', groupToggle('antigstatus', 'ANTI GROUP STATUS', 'Deletes "group status" posts made by members who are not admins.'));
def('stat', ['antistatusmention', 'antistatusmentions', 'nostatusmention'], 'on | off | kick  (admins) — removes "group mentioned in a status" notices', groupToggle('antistatusmention', 'ANTI STATUS MENTION', 'Deletes the notice WhatsApp posts when someone mentions this group in their status.'));
def('stat', ['afk', 'away'], '[reason]', async c => {
    if (!c.isGroup) return c.reply('⚠️ Groups only!');
    autos.setAfk(num(c.nowsender), c.textIn); await c.socket.sendMessage(c.from, { text: `💤 @${num(c.nowsender)} is now AFK${c.textIn ? ': ' + clip(c.textIn, 150) : ''}.\nI will tell people who tag you, and welcome you back when you write again.`, mentions: [c.nowsender] }, { quoted: c.msg });
});
def('stat', ['unafk', 'back'], '', async c => { await c.reply(autos.clearAfk(num(c.nowsender)) ? '👋 Welcome back — AFK removed.' : 'You were not AFK.'); });

// ═══════════ GROUP TOOLS ═══════════
def('grp', ['tagadmins', 'calladmins', 'pingadmins'], '[message]', async c => {
    if (!c.isGroup) return c.reply('⚠️ Groups only!');
    const meta = await c.socket.groupMetadata(c.from), ad = meta.participants.filter(p => p.admin);
    if (!ad.length) return c.reply('No admins found.');
    await c.socket.sendMessage(c.from, { text: `🛡️ *ADMINS* (${ad.length})\n${c.textIn ? c.textIn + '\n' : ''}\n${ad.map(p => '@' + num(p.id)).join(' ')}`, mentions: ad.map(p => p.id) }, { quoted: c.msg });
});
def('grp', ['listonline', 'onlinelist', 'whosonline'], '', async c => {
    if (!c.isGroup) return c.reply('⚠️ Groups only!');
    let seen = new Map(); try { seen = require('./store').presenceTracker || seen; } catch { /* optional */ }
    const meta = await c.socket.groupMetadata(c.from), now = Date.now(), live = new Set();
    for (const [j, t] of seen) if (now - t < 5 * 60 * 1000) live.add(num(j));
    const on = meta.participants.filter(p => live.has(num(p.id)) || (p.phoneNumber && live.has(num(p.phoneNumber))));
    if (!on.length) return c.reply('🟢 Nobody has been seen online in the last 5 minutes (WhatsApp only reports presence for people the bot can see).');
    await c.socket.sendMessage(c.from, { text: `🟢 *ONLINE NOW* (${on.length})\n\n${on.map(p => '@' + num(p.id)).join('\n')}`, mentions: on.map(p => p.id) }, { quoted: c.msg });
});
def('grp', ['addbadword', 'addword', 'newbadword'], '<word>  (admins) — adds a word to this group\'s antibadword list', async c => {
    if (!c.isGroup) return c.reply('⚠️ Groups only!'); if (!canAdmin(c)) return c.reply('⚠️ Admins only!');
    const w = String(c.args[0] || '').toLowerCase().replace(/[^\p{L}\p{N}_-]/gu, ''); if (!w) return c.reply(U(c.p, 'addbadword <word>'));
    const cfg = autos.badCfg(c.from); if ((cfg.words || []).includes(w)) return c.reply(`"${w}" is already on the list.`);
    autos.setBad(c.from, { words: [...(cfg.words || []), w] }); await c.reply(`✅ "${w}" added.${cfg.on ? '' : `\nTurn the filter on with ${c.p}antibadword on`}`);
});
def('grp', ['removebadword', 'delbadword', 'rbw'], '<word>  (admins)', async c => {
    if (!c.isGroup) return c.reply('⚠️ Groups only!'); if (!canAdmin(c)) return c.reply('⚠️ Admins only!');
    const w = String(c.args[0] || '').toLowerCase(); if (!w) return c.reply(U(c.p, 'removebadword <word>'));
    const cfg = autos.badCfg(c.from); if (!(cfg.words || []).includes(w)) return c.reply(`"${w}" is not on this group's custom list.`);
    autos.setBad(c.from, { words: cfg.words.filter(x => x !== w) }); await c.reply(`✅ "${w}" removed.`);
});
def('grp', ['badwordlist', 'badwords', 'listbadwords'], '(admins)', async c => {
    if (!c.isGroup) return c.reply('⚠️ Groups only!'); if (!canAdmin(c)) return c.reply('⚠️ Admins only!');
    const cfg = autos.badCfg(c.from), w = cfg.words || [];
    await c.reply(`🤬 *BAD WORDS* — filter ${st(cfg.on)}\n\nCustom words (${w.length}): ${w.length ? w.join(', ') : 'none'}\n\nA built-in list of common swear words is always active when the filter is on.`);
});

// ═══════════ DOWNLOAD SHORTCUTS ═══════════
for (const [names, hint] of [[['alldl', 'allvideo'], 'any supported link'], [['tikdl'], 'a TikTok link'], [['twtdl'], 'an X/Twitter link']]) def('dl', names, `<${hint}>`, async c => { await core.run('dl', c); });
def('dl', ['capcut', 'capcutdl'], '<capcut template link>', async c => {
    const u = (String(c.textIn).match(/https?:\/\/\S+/) || [])[0]; if (!u) return c.reply(U(c.p, 'capcut <link>'));
    await c.react('⏳'); const d = await jget(`${API.SIPUTZX}/d/capcut?url=${enc(u)}`, { timeout: 60000 });
    const link = deepUrls(d).find(x => kindOf(x) === 'video') || deepUrls(d)[0]; if (!link) throw new Error('No video found in that CapCut link.');
    await snd(c, { video: { url: link }, caption: '🎬 CapCut' }); await c.react('✅');
});

// ═══════════ MAKERS ═══════════
def('vid', ['bratvid', 'bratvideo', 'bratanimated'], '<text>  → animated brat sticker', async c => {
    if (!c.textIn) return c.reply(U(c.p, 'bratvid i need a break')); await c.react('⌛');
    const buf = await getBuf(`${API.NEXRAY_EU}/maker/bratvid?text=${enc(c.textIn.slice(0, 120))}`, { timeout: 60000 });
    if (buf.length < 1000) throw new Error('The brat service returned an empty video.');
    let sticker = null; try { const { Sticker, StickerTypes } = require('wa-sticker-formatter'); sticker = await new Sticker(buf, { pack: 'Whitekid Prime', author: c.senderName || 'WhiteKid Tech', type: StickerTypes.FULL, quality: 50, background: 'transparent' }).toBuffer(); } catch { /* falls back to a video */ }
    if (sticker) await snd(c, { sticker }); else await snd(c, { video: buf, gifPlayback: true, caption: '🎬 brat' }); await c.react('✅');
});
def('vid', ['iqc', 'iphonechat', 'fakechat'], '<text>  → iPhone-style chat bubble', async c => {
    if (!c.textIn) return c.reply(U(c.p, 'iqc hello there')); await c.react('💬');
    const t = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Harare' });
    const buf = await getBuf(`${API.DELINE}/maker/iqc?text=${enc(c.textIn.slice(0, 300))}&chatTime=${enc(t)}&statusBarTime=${enc(t)}`, { timeout: 40000 });
    if (buf.length < 1000) throw new Error('The chat-bubble service returned an empty image.'); await snd(c, { image: buf, caption: '💬 iPhone chat' });
});
def('vid', ['carbon'], '(reply to some code)  → code screenshot', async c => {
    const code = c.quotedText || c.textIn; if (!code) return c.reply('💻 Reply to a code message (or write the code after the command).'); await c.react('💻');
    const res = await core.fx(API.CARBON, { method: 'POST', timeout: 40000, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: code.slice(0, 3000), backgroundColor: '#1F816D' }) });
    if (!res.ok) throw new Error('HTTP ' + res.status); const buf = Buffer.from(await res.arrayBuffer()); if (buf.length < 1000) throw new Error('Carbon returned an empty image.');
    await snd(c, { image: buf, caption: '💻 Carbon' });
});
def('vid', ['tofigure', 'figure'], '(reply to a photo)  → AI collectible-figure version', async c => {
    const m = await mediaOf(c, ['image']); if (!m) return c.reply('📸 Reply to a photo.'); await c.react('🧸');
    const d = await jget(`${API.FIGURE}?url=${enc(await catbox(m.buffer, 'x.jpg'))}`, { timeout: 90000 });
    const u = d && d.result && typeof d.result === 'string' ? d.result : deepUrls(d)[0]; if (!u) throw new Error('The figure service is busy — try another photo later.');
    await snd(c, { image: await getBuf(u, { timeout: 60000 }), caption: '🧸 Figure' });
});

// ═══════════ MORE AI ═══════════
const faaText = (path_, key) => async c => {
    if (!c.textIn) return c.reply(U(c.p, `${c.command} <your text>`)); await c.react('🤖');
    const d = await jget(`${API.FAA}/faa/${path_}?${key}=${enc(c.textIn.slice(0, 1500))}`, { timeout: 45000 });
    const out = d && (d.result || d.data || d.answer); if (!out || typeof out !== 'string') throw new Error('No answer came back — try again in a minute.');
    await c.reply(clip(out, 3500));
};
def('ai2', ['bard', 'bardai', 'googlebard'], '<question>', faaText('bard-google', 'query'));
def('ai2', ['quillbot', 'paraphrase', 'rewrite'], '<text to rewrite>', faaText('quillbot', 'text'));

// ═══════════ ANIME & FUN ═══════════
const NEKO_PICS = { neko: ['catgirl', 'nekopic'], kitsune: ['foxgirl'], husbando: ['animeguy'], waifu: [] };
for (const [cat, al] of Object.entries(NEKO_PICS)) def('anim', [cat, ...al], '', async c => {
    await c.react('🌸'); const d = await jget(`${API.NEKOS}/${cat}`, { timeout: 15000 }); const r = d && d.results && d.results[0]; if (!r || !r.url) throw new Error('No picture came back — try again.');
    await snd(c, { image: { url: r.url }, caption: `🌸 ${cat}${r.artist_name ? '\n🎨 ' + r.artist_name : ''}` });
});
const REACTS = { pat: 'pats', smug: 'looks smug at', blush: 'blushes at', bored: 'is bored of', cry: 'cries with', dance: 'dances with', facepalm: 'facepalms at', happy: 'is happy with', laugh: 'laughs at', nod: 'nods at', nope: 'says nope to', pout: 'pouts at', shrug: 'shrugs at', sleep: 'sleeps next to', smile: 'smiles at', stare: 'stares at', thumbsup: 'gives a thumbs up to', wave: 'waves at', wink: 'winks at', yawn: 'yawns at', baka: 'calls baka', bite: 'bites', cuddle: 'cuddles', feed: 'feeds', handhold: 'holds hands with', highfive: 'high-fives', hug: 'hugs', kick: 'kicks', kiss: 'kisses', lurk: 'lurks near', nom: 'nibbles', peck: 'pecks', poke: 'pokes', punch: 'punches', shoot: 'shoots', slap: 'slaps', tickle: 'tickles', yeet: 'yeets', think: 'thinks about' };
for (const [name, verb] of Object.entries(REACTS)) def('react', [name], '[@user]', async c => {
    const d = await jget(`${API.NEKOS}/${name}`, { timeout: 15000 }); const r = d && d.results && d.results[0]; if (!r || !r.url) throw new Error('No gif came back — try again.');
    const target = mentionedOrReply(c), me = num(c.nowsender);
    const text = target ? `@${me} ${verb} @${num(target)}` : `@${me} ${verb} everyone`;
    await c.socket.sendMessage(c.from, { video: { url: r.url }, gifPlayback: true, caption: text, mentions: [c.nowsender, ...(target ? [target] : [])] }, { quoted: c.msg });
});
def('gen', ['catfact', 'catfacts', 'meowfact'], '', async c => { const d = await jget(API.CATFACT, { timeout: 10000 }); if (!d || !d.fact) throw new Error('No fact came back.'); await c.reply(`🐱 *CAT FACT*\n\n${d.fact}`); });
def('gen', ['country', 'countryinfo', 'nation'], '<country name>', async c => {
    if (!c.textIn) return c.reply(U(c.p, 'country Zimbabwe'));
    let d; try { d = await jget(`${API.COUNTRY}/name/${enc(c.textIn)}?fullText=true`, { timeout: 12000 }); } catch { d = await jget(`${API.COUNTRY}/name/${enc(c.textIn)}`, { timeout: 12000 }); }
    const k = Array.isArray(d) && d[0]; if (!k) throw new Error('Country not found.');
    const cur = Object.values(k.currencies || {}).map(x => `${x.name} (${x.symbol || ''})`).join(', '), lang = Object.values(k.languages || {}).join(', ');
    await c.reply(`${k.flag || '🌍'} *${k.name.common}* — ${k.name.official}\n\n🏛️ Capital: ${(k.capital || ['—']).join(', ')}\n🌐 Region: ${k.region}${k.subregion ? ' · ' + k.subregion : ''}\n👥 Population: ${Number(k.population).toLocaleString('en-US')}\n💬 Languages: ${lang || '—'}\n💰 Currency: ${cur || '—'}\n📞 Calling code: ${k.idd && k.idd.root ? k.idd.root + ((k.idd.suffixes || [])[0] || '') : '—'}`);
});

// ═══════════ CATEGORY MENUS (the same sections as .menu, one command each) ═══════════
const MENUS = { downloadmenu: ['download', ['dlmenu']], groupmenu: ['group', ['grupmenu', 'adminmenu']], ownermenu: ['owner', ['ownercmds']], aimenu: ['ai', []], gamesmenu: ['games', []], toolsmenu: ['tools', ['utilsmenu']], funmenu: ['fun', []], animemenu: ['anime', ['animmenu']], searchmenu: ['search', []], imagemenu: ['images', ['picsmenu']], sportsmenu: ['sports', []], logomenu: ['logo', ['effectsmenu', 'fxmenu']] };
for (const [name, [section, al]] of Object.entries(MENUS)) def('botx', [name, ...al], '', async c => {
    const UI = require('./ui'), W7 = require('./wk7'); const secs = UI.menuSections(c.p, W7), one = UI.findSection(secs, section);
    if (!one) return c.reply(`📋 Use ${c.p}menu to see every section.`);
    await c.socket.sendMessage(c.from, { text: one.text + '\n\n' + UI.menuFooter() }, { quoted: c.fakeCard || c.msg });
});

module.exports = { NAMES, API, PROBES, MENUS, REACTS };
