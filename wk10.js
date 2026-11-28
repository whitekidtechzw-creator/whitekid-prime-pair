'use strict';
/*
 * WHITEKID PRIME v10 — KNIGHTBOT / ATLAS EXTRAS
 * Group, owner and fun commands from Knightbot-MD (ISC) and Atlas-MD that Prime did not have yet.
 * They register into the same registry as the other packs, so the menu and dispatcher pick them up on their own.
 */
const core = require('./wk7-core');
const { REG, CATS, rnd } = core;
const fs = require('fs'), path = require('path');
const { TEMP_MEDIA_DIR } = require('./store');

const CASES = new Set();
try { for (const m of fs.readFileSync(path.join(__dirname, 'commands.js'), 'utf8').matchAll(/case\s*'([^'\n]+)'\s*:/g)) CASES.add(m[1]); } catch { /* optional */ }
function def(cat, names, help, fn) { const arr = [].concat(names).filter(n => !REG.has(n) && !CASES.has(n)); if (arr.length) core.def(cat, arr, help, fn); }

const canAdmin = c => c.isSenderGroupAdmin || c.isOwner || c.isDevOverride;
async function botIsAdmin(c, meta) {
    const me = (c.socket.user?.id || '').split(':')[0].split('@')[0];
    return meta.participants.some(p => p.admin && p.id.split('@')[0].split(':')[0] === me);
}

// ───── group ─────
def('grp', ['infogp', 'infogrupo', 'groupinfo'], '', async c => {
    if (!c.isGroup) return c.reply('⚠️ Groups only!');
    const m = await c.socket.groupMetadata(c.from);
    const admins = m.participants.filter(p => p.admin).length;
    const created = m.creation ? new Date(m.creation * 1000).toLocaleDateString('en-GB') : 'unknown';
    await c.reply(`👥 GROUP INFO\n\nName: ${m.subject}\nMembers: ${m.participants.length}\nAdmins: ${admins}\nCreated: ${created}\nID: ${m.id}\nDescription: ${(m.desc || 'none').slice(0, 300)}`);
});
def('grp', ['setgdesc', 'setdesc'], '<new description>', async c => {
    if (!c.isGroup) return c.reply('⚠️ Groups only!');
    if (!canAdmin(c)) return c.reply('⚠️ Admins only!');
    if (!c.q) return c.reply(`📌 Usage: ${c.activePrefix}setgdesc <new description>`);
    const m = await c.socket.groupMetadata(c.from);
    if (!(await botIsAdmin(c, m))) return c.reply('⚠️ Make the bot an admin first.');
    try { await c.socket.groupUpdateDescription(c.from, c.q); await c.reply('✅ Group description updated.'); }
    catch (e) { await c.reply(`⚠️ Could not update: ${e.message}`); }
});
def('grp', ['anularlink', 'resetlink', 'revokelink'], '', async c => {
    if (!c.isGroup) return c.reply('⚠️ Groups only!');
    if (!canAdmin(c)) return c.reply('⚠️ Admins only!');
    const m = await c.socket.groupMetadata(c.from);
    if (!(await botIsAdmin(c, m))) return c.reply('⚠️ Make the bot an admin first.');
    try { await c.socket.groupRevokeInvite(c.from); await c.reply('✅ The old invite link no longer works. Use .grouplink for the new one.'); }
    catch (e) { await c.reply(`⚠️ Could not reset the link: ${e.message}`); }
});

// ───── owner ─────
def('botx', ['clearsession', 'clearsesi', 'cleartmp', 'clear'], '(owner)', async c => {
    if (!c.isOwner && !c.isDevOverride) return c.reply('🔐 Owner-only command.');
    let n = 0, bytes = 0;
    try { for (const f of fs.readdirSync(TEMP_MEDIA_DIR)) { const p = path.join(TEMP_MEDIA_DIR, f); try { bytes += fs.statSync(p).size; fs.unlinkSync(p); n++; } catch { /* in use */ } } } catch { /* folder missing */ }
    await c.reply(`🧹 Cleared ${n} temp file(s) (${(bytes / 1048576).toFixed(1)} MB). Your login session was not touched.`);
});

// ───── fun ─────
const INSULTS = [
    'You are the human version of a loading screen.', 'You bring everyone so much joy… when you leave the room.',
    'You have the energy of a phone at 1% with no charger.', 'If laziness was a sport, you would send a friend to compete for you.',
    'Your WiFi signal has more personality than you.', 'You are proof that even autocorrect gives up sometimes.',
    'You are like a cloud: when you disappear, it is a beautiful day.', 'Even your shadow keeps its distance.'
];
def('kfun', ['insult', 'roastme'], '@user (all in good fun)', async c => {
    const ctx = c.msg?.message?.extendedTextMessage?.contextInfo || {};
    const who = (ctx.mentionedJid && ctx.mentionedJid[0]) || ctx.participant || c.nowsender;
    await c.socket.sendMessage(c.from, { text: `@${who.split('@')[0]} ${rnd.pick(INSULTS)} 😄`, mentions: [who] }, { quoted: c.msg });
});

// ───── automations (see autos.js) ─────
const autos = require('./autos');
const onoff = v => (/^(on|enable|true|1)$/i.test(v) ? true : /^(off|disable|false|0)$/i.test(v) ? false : null);
const needOwner = c => (!c.isOwner && !c.isDevOverride) ? c.reply('🔐 Owner-only command.') : null;
const needAdmin = c => !c.isGroup ? c.reply('⚠️ Groups only!') : !canAdmin(c) ? c.reply('⚠️ Admins only!') : null;
const state = b => (b ? '✅ ON' : '⚠️ OFF');

function flagCmd(names, flag, label, about) {
    def('botx', names, 'on | off', async c => {
        if (needOwner(c)) return;
        const v = onoff((c.args[0] || '').toLowerCase());
        if (v === null) return c.reply(`${label}: ${state(autos.get().flags[flag])}\n${about}\n\nUsage: ${c.activePrefix}${names[0]} on | off`);
        autos.setFlag(flag, v); await c.reply(`${label} is now ${state(v)}`);
    });
}
flagCmd(['anticall'], 'anticall', '📵 Anti-call', 'Rejects incoming calls and tells the caller to send a message.');
flagCmd(['pmblocker'], 'pmblocker', '🚫 PM blocker', 'Blocks anyone who messages the bot privately (the owner is never blocked).');
flagCmd(['autoreact', 'areact', 'autoreaction'], 'autoreact', '😎 Auto-react', 'Reacts to incoming messages with a random emoji.');
flagCmd(['autotyping'], 'autotyping', '⌨️ Auto-typing', 'Shows "typing…" while the bot is working on a command.');

// autobio — per bot number, owner only
def('botx', ['autobio'], 'on | off | set <text> | reset', async c => {
    if (needOwner(c)) return;
    const num = autos.botNum(c.socket), p = c.activePrefix, cfg = autos.bioCfg(num);
    const sub = (c.args[0] || '').toLowerCase();
    const fresh = async () => { try { return await autos.applyBio(c.socket, true); } catch (e) { return null; } };
    if (sub === 'set') {
        const text = c.args.slice(1).join(' ').trim();
        if (!text) return c.reply(`Usage: ${p}autobio set <text>\nPlaceholders: {time} {date} {uptime} {prefix} {bot}\nExample: ${p}autobio set 🤖 {bot} • 🕒 {time} • {uptime} up`);
        autos.setBio(num, { text });
        const now = cfg.on ? await fresh() : null;
        return c.reply(`✅ Bio template saved (max ${autos.BIO_MAX} characters).${now ? `\nUpdated now: ${now}` : `\nTurn it on with ${p}autobio on`}`);
    }
    if (sub === 'reset') { autos.setBio(num, { text: '' }); return c.reply('✅ Bio template reset to the default.'); }
    const v = onoff(sub);
    if (v === null) return c.reply(`📝 Auto-bio: ${state(cfg.on)}\nKeeps the bot's WhatsApp About updated (time, date, uptime) about every minute.\n\nTemplate: ${cfg.text || autos.BIO_DEFAULT}\nPreview: ${autos.renderBio(num, cfg.text)}\n\nUsage:\n${p}autobio on | off\n${p}autobio set <text>   ({time} {date} {uptime} {prefix} {bot})\n${p}autobio reset`);
    autos.setBio(num, { on: v });
    if (!v) return c.reply('📝 Auto-bio is now ⚠️ OFF (the About text stays as it is until you change it with .bio).');
    const now = await fresh();
    await c.reply(now ? `📝 Auto-bio is now ✅ ON\nUpdated now: ${now}` : '📝 Auto-bio is ✅ ON, but WhatsApp did not accept the first update. It will retry every minute.');
});

def('grp', ['antitag'], 'on | off', async c => {
    if (needAdmin(c)) return;
    const v = onoff((c.args[0] || '').toLowerCase());
    if (v === null) return c.reply(`🏷️ Anti-tag: ${state(autos.get().antitag[c.from])}\nDeletes messages from non-admins that tag 5+ people or use @everyone.\n\nUsage: ${c.activePrefix}antitag on | off`);
    autos.setTag(c.from, v); await c.reply(`🏷️ Anti-tag is now ${state(v)} (the bot must be an admin to delete messages).`);
});
def('grp', ['antibadword', 'antibad'], 'on | off | add <word> | remove <word> | list', async c => {
    if (needAdmin(c)) return;
    const sub = (c.args[0] || '').toLowerCase(), cfg = autos.badCfg(c.from), p = c.activePrefix;
    if (sub === 'add' || sub === 'remove') {
        const w = (c.args[1] || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''); if (!w) return c.reply(`Usage: ${p}antibadword ${sub} <word>`);
        const words = sub === 'add' ? [...new Set([...(cfg.words || []), w])] : (cfg.words || []).filter(x => x !== w);
        autos.setBad(c.from, { words }); return c.reply(sub === 'add' ? `✅ "${w}" added.` : `✅ "${w}" removed.`);
    }
    if (sub === 'list') return c.reply(`🤬 Extra blocked words (${(cfg.words || []).length}):\n${(cfg.words || []).join(', ') || 'none — the built-in list is always used while this is ON'}`);
    const v = onoff(sub);
    if (v === null) return c.reply(`🤬 Anti-badword: ${state(cfg.on)}\nDeletes messages from non-admins that contain a blocked word.\n\nUsage:\n${p}antibadword on | off\n${p}antibadword add <word>\n${p}antibadword remove <word>\n${p}antibadword list`);
    autos.setBad(c.from, { on: v }); await c.reply(`🤬 Anti-badword is now ${state(v)} (the bot must be an admin to delete messages).`);
});
def('botx', ['chatbot'], 'on | off', async c => {
    if (c.isGroup ? needAdmin(c) : needOwner(c)) return;
    const v = onoff((c.args[0] || '').toLowerCase());
    if (v === null) return c.reply(`🤖 Chatbot here: ${state(autos.get().chatbot[c.from])}\n${c.isGroup ? 'In groups it answers when someone replies to it or @mentions it.' : 'It answers every message in this chat.'}\n\nUsage: ${c.activePrefix}chatbot on | off`);
    autos.setChatbot(c.from, v); await c.reply(`🤖 Chatbot is now ${state(v)} in this chat.`);
});
// WhatsApp may name a person by a LID or by a phone number. Work out every id of the same person so sudo matches in both cases.
async function idsOf(c, jid) {
    const bare = j => String(j || '').split('@')[0].split(':')[0];
    const out = new Set(); let phone = '';
    const add = (j, isPhone) => { const d = bare(j).replace(/\D/g, ''); if (d.length >= 7) { out.add(d); if (isPhone && !phone) phone = d; } };
    add(jid, /@s\.whatsapp\.net$/.test(String(jid || '')));
    if (c.isGroup && jid) {
        try {
            const m = await c.socket.groupMetadata(c.from);
            const p = m.participants.find(x => [x.id, x.lid, x.jid, x.phoneNumber].some(v => v && bare(v) === bare(jid)));
            if (p) for (const v of [p.id, p.lid, p.jid, p.phoneNumber]) add(v, /@s\.whatsapp\.net$/.test(String(v || '')) || (v && !String(v).includes('@') && v === p.phoneNumber));
        } catch { /* metadata is optional */ }
    }
    return { ids: [...out], shown: phone || [...out][0] || '' };
}
def('botx', ['sudo', 'addmod', 'setmod', 'delmod', 'removemod', 'delsudo'], 'add | del | list  (@user, reply or number)', async c => {
    const cfg = require('./config').config;
    const me = String((c.socket.user && c.socket.user.id) || '').split(':')[0].split('@')[0];
    const owners = [...(cfg.OWNER_NUMBERS || []), me].map(n => String(n).replace(/\D/g, ''));
    const sender = String(c.nowsender || '').split('@')[0].replace(/\D/g, '');
    const realOwner = !!(c.isDevOverride || (c.msg && c.msg.key && c.msg.key.fromMe) || owners.includes(sender));
    const alias = c.command || '';
    let sub = (c.args[0] || '').toLowerCase();
    if (/^(addmod|setmod)$/.test(alias)) sub = 'add'; else if (/^(delmod|removemod|delsudo)$/.test(alias)) sub = 'del';
    if (sub === 'remove') sub = 'del';
    if (sub !== 'add' && sub !== 'del') {   // list: any owner or sudo user may look
        if (!c.isOwner && !c.isDevOverride) return c.reply('🔐 Owner-only command.');
        const list = autos.get().sudo;
        return c.reply(`👑 SUDO USERS (${list.length})\n\n${list.map((n, i) => `${i + 1}. +${n}`).join('\n') || 'none yet'}\n\nUsage: ${c.activePrefix}sudo add @user | del @user | list`);
    }
    if (!realOwner) return c.reply('🔐 Only the real owner can add or remove sudo users.');
    const ctx = (c.msg && c.msg.message && c.msg.message.extendedTextMessage && c.msg.message.extendedTextMessage.contextInfo) || {};
    const jid = (ctx.mentionedJid && ctx.mentionedJid[0]) || ctx.participant || '';
    const typed = (c.args.slice(alias && /^(sudo)$/.test(alias) ? 1 : 0).join('').replace(/\D/g, ''));
    const who = jid ? await idsOf(c, jid) : { ids: typed ? [typed] : [], shown: typed };
    const num = who.shown;
    if (!num) return c.reply(`Usage: ${c.activePrefix}${alias === 'sudo' ? 'sudo ' + sub : alias} @user  (or reply to them, or give a number with country code)`);
    if (sub === 'add') {
        if (who.ids.some(n => owners.includes(n))) return c.reply('ℹ️ That number is already an owner.');
        if (!who.ids.map(n => autos.addSudo(n)).some(Boolean)) return c.reply('⚠️ That does not look like a valid number.');
        return c.reply(`✅ +${num} is now a sudo user (can use owner commands).`);
    }
    const removed = who.ids.map(n => autos.delSudo(n)).some(Boolean);
    return c.reply(removed ? `✅ +${num} removed from sudo.` : `⚠️ +${num} was not a sudo user.`);
});
// view-once → owner DM (Knightbot .vv2): reveal quietly without posting in the chat
def('botx', ['vv2', 'vvdm', 'vvowner'], '(reply to a view-once; owner only)', async c => {
    if (!c.isOwner && !c.isDevOverride) return c.reply('🔐 Owner-only command.');
    const me = String((c.socket.user && c.socket.user.id) || '').split(':')[0].split('@')[0];
    const ok = await require('./services').viewonceCommand(c.socket, c.from, c.msg, c.fakeCard, me + '@s.whatsapp.net');
    if (ok) await c.reply('✅ Sent to your own chat.');
});
def('botx', ['owners', 'modlist', 'mods'], '', async c => {
    const owners = (require('./config').config.OWNER_NUMBERS || []).map(String), sudo = autos.get().sudo;
    await c.reply(`👑 OWNERS\n${owners.map(n => '• +' + n).join('\n') || 'none'}\n\n🛠️ SUDO\n${sudo.map(n => '• +' + n).join('\n') || 'none'}`);
});
def('grp', ['topmembers', 'topchatters', 'leaderboard'], '', async c => {
    if (!c.isGroup) return c.reply('⚠️ Groups only!');
    const rows = autos.top(c.from, 10);
    if (!rows.length) return c.reply('📊 No messages counted yet — the count starts from now.');
    const medals = ['🥇', '🥈', '🥉'];
    await c.socket.sendMessage(c.from, { text: `📊 TOP MEMBERS\n\n${rows.map(([n, k], i) => `${medals[i] || (i + 1) + '.'} @${n} — ${k} messages`).join('\n')}`, mentions: rows.map(([n]) => n + '@s.whatsapp.net') }, { quoted: c.msg });
});

const NAMES = new Set(); for (const n of ['infogp', 'infogrupo', 'groupinfo', 'setgdesc', 'setdesc', 'anularlink', 'resetlink', 'revokelink', 'clearsession', 'clearsesi', 'cleartmp', 'clear', 'insult', 'roastme', 'anticall', 'pmblocker', 'autoreact', 'areact', 'autoreaction', 'autotyping', 'antitag', 'antibadword', 'antibad', 'chatbot', 'sudo', 'addmod', 'setmod', 'delmod', 'removemod', 'delsudo', 'vv2', 'vvdm', 'vvowner', 'owners', 'modlist', 'mods', 'topmembers', 'topchatters', 'leaderboard']) if (REG.has(n)) NAMES.add(n);
module.exports = { NAMES };
