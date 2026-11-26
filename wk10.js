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
def('botx', ['sudo', 'addmod', 'setmod', 'delmod', 'removemod', 'delsudo'], 'add | del | list  (@user or number)', async c => {
    if (needOwner(c)) return;
    const ctx = c.msg?.message?.extendedTextMessage?.contextInfo || {};
    const target = (ctx.mentionedJid && ctx.mentionedJid[0]) || ctx.participant || '';
    const num = String(target).split('@')[0] || (c.args[1] || '').replace(/\D/g, '');
    const alias = c.command || '';
    let sub = (c.args[0] || '').toLowerCase();
    if (/^(addmod|setmod)$/.test(alias)) sub = 'add'; else if (/^(delmod|removemod|delsudo)$/.test(alias)) sub = 'del';
    const numOnly = /^(add|del|remove)$/.test(sub) && !target ? (c.args[1] || c.args[0] || '').replace(/\D/g, '') : num;
    if (sub === 'add') { if (!autos.addSudo(numOnly)) return c.reply(`Usage: ${c.activePrefix}sudo add @user  (or reply, or a number with country code)`); return c.reply(`✅ ${numOnly} is now a sudo user (can use owner commands).`); }
    if (sub === 'del' || sub === 'remove') { return c.reply(autos.delSudo(numOnly) ? `✅ ${numOnly} removed from sudo.` : `⚠️ ${numOnly || 'That number'} was not a sudo user.`); }
    const list = autos.get().sudo; await c.reply(`👑 SUDO USERS (${list.length})\n\n${list.map((n, i) => `${i + 1}. +${n}`).join('\n') || 'none yet'}\n\nUsage: ${c.activePrefix}sudo add @user | del @user | list`);
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

const NAMES = new Set(); for (const n of ['infogp', 'infogrupo', 'groupinfo', 'setgdesc', 'setdesc', 'anularlink', 'resetlink', 'revokelink', 'clearsession', 'clearsesi', 'cleartmp', 'clear', 'insult', 'roastme', 'anticall', 'pmblocker', 'autoreact', 'areact', 'autoreaction', 'autotyping', 'antitag', 'antibadword', 'antibad', 'chatbot', 'sudo', 'addmod', 'setmod', 'delmod', 'removemod', 'delsudo', 'owners', 'modlist', 'mods', 'topmembers', 'topchatters', 'leaderboard']) if (REG.has(n)) NAMES.add(n);
module.exports = { NAMES };
