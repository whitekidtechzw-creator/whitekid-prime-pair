'use strict';
/*
 * WHITEKID PRIME — AUTOMATIONS (ported from Knightbot-MD / Atlas-MD ideas)
 * antibadword · antitag · anticall · pmblocker · autoreact · autotyping · chatbot · sudo · topmembers
 * Settings live in data/autos.json (kept in memory, written a moment after each change).
 */
const fs = require('fs'), path = require('path');
const { DATA_DIR } = require('./config');
const FILE = path.join(DATA_DIR, 'autos.json');

const DEFAULTS = () => ({ flags: { autoreact: false, autotyping: false, anticall: false, pmblocker: false, antiviewonce: false, savestatus: false }, antibadword: {}, antitag: {}, chatbot: {}, sudo: [], counts: {}, bio: {}, antigstatus: {}, antistatusmention: {}, afk: {} });
let S = DEFAULTS(), loaded = false, timer = null;

function load() {
    if (loaded) return S; loaded = true;
    try { const j = JSON.parse(fs.readFileSync(FILE, 'utf8')); S = { ...DEFAULTS(), ...j, flags: { ...DEFAULTS().flags, ...(j.flags || {}) } }; } catch { S = DEFAULTS(); }
    return S;
}
function flush() { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(S)); } catch (e) { console.error('[autos save]', e.message); } }
function save() { if (timer) return; timer = setTimeout(() => { timer = null; flush(); }, 2000); if (timer.unref) timer.unref(); }
process.on('exit', () => { if (timer) flush(); });

const get = () => load();
const digits = s => String(s || '').replace(/\D/g, '');

// ───── sudo ─────
const isSudo = num => load().sudo.includes(digits(num));
function addSudo(num) { const n = digits(num); if (n.length < 7) return false; if (!load().sudo.includes(n)) { S.sudo.push(n); save(); } return true; }
function delSudo(num) { const n = digits(num), had = load().sudo.includes(n); S.sudo = S.sudo.filter(x => x !== n); save(); return had; }

// ───── flags ─────
function setFlag(name, v) { load().flags[name] = !!v; save(); }

// ───── per-group / per-chat settings ─────
const DEFAULT_BAD = ['fuck', 'shit', 'bitch', 'bastard', 'asshole', 'dickhead', 'cunt', 'motherfucker'];
function badCfg(gid) { const a = load().antibadword; if (!a[gid]) a[gid] = { on: false, words: [] }; return a[gid]; }
function setBad(gid, patch) { Object.assign(badCfg(gid), patch); save(); }
function setTag(gid, on) { load().antitag[gid] = !!on; save(); }
function setChatbot(jid, on) { load().chatbot[jid] = !!on; save(); }

function hasBadWord(text, cfg) {
    const t = String(text || '').toLowerCase();
    const words = [...DEFAULT_BAD, ...(cfg.words || [])];
    return words.some(w => w && new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(t));
}

// ───── activity counter (topmembers) ─────
function count(gid, jid) {
    const c = load().counts; const g = c[gid] || (c[gid] = {}); const n = digits(jid);
    g[n] = (g[n] || 0) + 1; save();
}
function top(gid, n = 10) { return Object.entries(load().counts[gid] || {}).sort((a, b) => b[1] - a[1]).slice(0, n); }

// ───── message hook (called by the handler for every text message) ─────
const REACTS = ['❤️', '🔥', '😂', '👍', '😍', '🎉', '💯', '🙌', '✨', '😎', '🤩', '👏'];
const lastReact = new Map();
const CHATBOT_SYSTEM = 'You are Whitekid Prime, a friendly WhatsApp assistant made by WhiteKid Tech. Reply briefly (1-4 sentences) in the same language as the user.';
const api = { ask: async (text) => { const r = await require('./ai').ask(text, { cmd: 'chatgpt', system: CHATBOT_SYSTEM }); return r && r.text; } };

/** returns true when the message was dealt with here and the handler should stop */
async function onMessage(x) {
    const { socket, msg, from, body, nowsender, isGroup, isOwner, isDevOverride, isSenderGroupAdmin, isCmd } = x;
    if (!msg || msg.key?.fromMe) return false;
    const cfg = load(), privileged = isOwner || isDevOverride || isSenderGroupAdmin;
    try {
        if (isGroup) count(from, nowsender);
        if (cfg.flags.autotyping && isCmd) socket.sendPresenceUpdate('composing', from).catch(() => {});
        if (cfg.flags.autoreact && Date.now() - (lastReact.get(from) || 0) > 3000) {
            lastReact.set(from, Date.now());
            socket.sendMessage(from, { react: { text: REACTS[Math.floor(Math.random() * REACTS.length)], key: msg.key } }).catch(() => {});
        }
        if (isGroup && !privileged) {
            const bad = cfg.antibadword[from];
            if (bad && bad.on && hasBadWord(body, bad)) {
                await socket.sendMessage(from, { delete: msg.key }).catch(() => {});
                await socket.sendMessage(from, { text: `⚠️ @${nowsender.split('@')[0]} watch your language — that message was removed.`, mentions: [nowsender] });
                return true;
            }
            if (cfg.antitag[from]) {
                const ment = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                if (ment.length >= 5 || /@(everyone|all)\b/i.test(body)) {
                    await socket.sendMessage(from, { delete: msg.key }).catch(() => {});
                    await socket.sendMessage(from, { text: `⚠️ @${nowsender.split('@')[0]} mass-tagging is not allowed here.`, mentions: [nowsender] });
                    return true;
                }
            }
        }
        if (!isCmd && cfg.chatbot[from] && body && body.trim().length > 1) {
            const me = (socket.user?.id || '').split(':')[0].split('@')[0];
            const ctxI = msg.message?.extendedTextMessage?.contextInfo || {};
            const addressed = !isGroup || (ctxI.mentionedJid || []).some(j => j.startsWith(me)) || String(ctxI.participant || '').startsWith(me);
            if (addressed) {
                socket.sendPresenceUpdate('composing', from).catch(() => {});
                const text = await api.ask(body.replace(/@\d+/g, '').trim());
                if (text) await socket.sendMessage(from, { text }, { quoted: msg });
                return true;
            }
        }
    } catch (e) { console.error('[autos]', e.message); }
    return false;
}



// ───── group status protection (ideas from Toxic-MD) ─────
// antigstatus:       delete a "group status" post (contextInfo.isGroupStatus) from non-admins
// antistatusmention: delete a "this group was mentioned in a status" notice (groupStatusMentionMessage); mode "kick" also removes the sender
const STATUS_KINDS = { antigstatus: 'antigstatus', antistatusmention: 'antistatusmention' };
function groupMode(kind, gid) { return (load()[STATUS_KINDS[kind]] || {})[gid] || 'off'; }
function setGroupMode(kind, gid, mode) { const k = STATUS_KINDS[kind]; if (!k) return false; load(); if (!S[k]) S[k] = {}; S[k][gid] = mode; save(); return true; }
function isGroupStatusPost(m) {
    if (!m || typeof m !== 'object') return false;
    for (const k of ['extendedTextMessage', 'imageMessage', 'videoMessage', 'documentMessage', 'audioMessage', 'stickerMessage']) if (m[k] && m[k].contextInfo && m[k].contextInfo.isGroupStatus === true) return true;
    return false;
}
const isStatusMention = m => !!(m && (m.groupStatusMentionMessage || (m.messageContextInfo && m.groupStatusMentionMessage)));
/** Called for every group message (also media without caption). Returns true when it removed something. */
async function onStatusPost(x) {
    const { socket, msg, from, nowsender, isGroup, isOwner, isDevOverride } = x;
    try {
        if (!isGroup || !msg || !msg.message || msg.key?.fromMe) return false;
        const m = msg.message, post = isGroupStatusPost(m), mention = isStatusMention(m);
        if (!post && !mention) return false;
        const kind = post ? 'antigstatus' : 'antistatusmention', mode = groupMode(kind, from);
        if (mode === 'off') return false;
        if (isOwner || isDevOverride || isSudo(nowsender)) return false;
        const meta = await socket.groupMetadata(from), me = digits(String(socket.user?.id || '').split(':')[0].split('@')[0]);
        const who = digits(String(nowsender).split('@')[0].split(':')[0]);
        const isAdm = j => meta.participants.some(p => p.admin && [p.id, p.phoneNumber, p.jid].some(v => v && digits(String(v).split('@')[0].split(':')[0]) === j));
        if (isAdm(who)) return false;
        if (!isAdm(me)) { await socket.sendMessage(from, { text: `⚠️ @${who} sent a ${post ? 'group status' : 'status mention'}. Make me an admin so I can remove it.`, mentions: [nowsender] }); return false; }
        await socket.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: msg.key.id, participant: msg.key.participant || nowsender } }).catch(() => {});
        if (mode === 'kick') { await socket.groupParticipantsUpdate(from, [nowsender], 'remove').catch(() => {}); await socket.sendMessage(from, { text: `🚫 @${who} was removed for a ${post ? 'group status' : 'status mention'}.`, mentions: [nowsender] }); }
        else await socket.sendMessage(from, { text: `⚠️ @${who} ${post ? 'group status posts' : 'status mentions'} are not allowed here.`, mentions: [nowsender] });
        return true;
    } catch (e) { console.error('[antistatus]', e.message); return false; }
}

// ───── AFK ─────
function setAfk(num, reason) { load(); if (!S.afk) S.afk = {}; S.afk[digits(num)] = { at: Date.now(), reason: String(reason || '').slice(0, 200) }; save(); }
function clearAfk(num) { load(); const n = digits(num), had = !!(S.afk && S.afk[n]); if (had) { delete S.afk[n]; save(); } return had; }
function getAfk(num) { return (load().afk || {})[digits(num)] || null; }
function fmtAfk(ms) { const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : m ? `${m}m` : `${s}s`; }
/** group messages: welcome an AFK person back, and tell people who tag or reply to someone who is AFK */
async function onAfk(x) {
    const { socket, msg, from, nowsender, isGroup } = x;
    try {
        if (!isGroup || !msg || msg.key?.fromMe) return false;
        const A = load().afk || {}; if (!Object.keys(A).length) return false;
        const me = digits(String(nowsender).split('@')[0].split(':')[0]);
        if (A[me]) { const a = A[me]; clearAfk(me); await socket.sendMessage(from, { text: `👋 Welcome back @${me}! You were AFK for ${fmtAfk(Date.now() - a.at)}.`, mentions: [nowsender] }, { quoted: msg }); }
        const ci = msg.message?.extendedTextMessage?.contextInfo || {};
        const hit = new Set([...(ci.mentionedJid || []), ci.participant].filter(Boolean).map(j => digits(String(j).split('@')[0].split(':')[0])));
        const lines = []; for (const n of hit) if (A[n] && n !== me) lines.push(`💤 @${n} is AFK (${fmtAfk(Date.now() - A[n].at)})${A[n].reason ? ': ' + A[n].reason : ''}`);
        if (lines.length) { await socket.sendMessage(from, { text: lines.join('\n'), mentions: [...hit].map(n => n + '@s.whatsapp.net') }, { quoted: msg }); return true; }
    } catch (e) { console.error('[afk]', e.message); }
    return false;
}

// ───── autobio: keeps the bot's WhatsApp "About" fresh (time, date, uptime) ─────
// Settings are per bot number: bio[number] = { on, text }. {time} {date} {uptime} {prefix} {bot} are filled in on every update.
const BIO_DEFAULT = '🤖 WHITEKID PRIME • ⏱ {uptime} • 🕒 {time} • {prefix}menu';
const BIO_MAX = 139;   // WhatsApp's limit for the About text
const BIO_EVERY = Math.max(30, Number(process.env.AUTOBIO_INTERVAL) || 60) * 1000;
const botNum = sock => digits(String((sock && sock.user && sock.user.id) || '').split(':')[0].split('@')[0]);
function bioCfg(num) { const b = load().bio || (S.bio = {}); if (!b[num]) b[num] = { on: false, text: '' }; return b[num]; }
function setBio(num, patch) { Object.assign(bioCfg(num), patch); save(); }
function fmtUp(sec) { sec = Math.max(0, Math.floor(sec)); const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60); return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`; }
function renderBio(num, template) {
    const tz = 'Africa/Harare', now = new Date();
    let started = 0, prefix = '.';
    try { started = require('./store').socketCreationTime.get(num) || 0; } catch { /* optional */ }
    try { prefix = require('./store').getCustomPrefix() || '.'; } catch { /* optional */ }
    const up = started ? (Date.now() - started) / 1000 : process.uptime();
    const vars = {
        time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }),
        date: now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }),
        uptime: fmtUp(up), prefix, bot: 'WHITEKID PRIME'
    };
    const out = String(template || BIO_DEFAULT).replace(/\{(time|date|uptime|prefix|bot)\}/gi, (_, k) => vars[k.toLowerCase()]);
    return [...out].slice(0, BIO_MAX).join('');   // spread = never cut an emoji in half
}
const lastBio = new Map();
/** sets the About text for this socket; returns the text, or null when nothing was sent */
async function applyBio(sock, force) {
    const num = botNum(sock); if (!num || typeof sock.updateProfileStatus !== 'function') return null;
    const cfg = bioCfg(num); if (!cfg.on && !force) return null;
    const text = renderBio(num, cfg.text);
    if (!force && lastBio.get(num) === text) return null;
    await sock.updateProfileStatus(text);
    lastBio.set(num, text);
    return text;
}
/** called once per socket by the handler; stops by itself when that socket closes */
function startBio(sock) {
    if (!sock || !sock.ev || typeof sock.ev.on !== 'function') return;
    let busy = false, failed = 0;
    const t = setInterval(async () => {
        if (busy) return; busy = true;
        try { await applyBio(sock, false); failed = 0; }
        catch (e) { if (++failed === 1 || failed % 20 === 0) console.error('[autobio]', e.message); }
        busy = false;
    }, BIO_EVERY);
    if (t.unref) t.unref();
    sock.ev.on('connection.update', u => { if (u && u.connection === 'close') clearInterval(t); });
}

// ───── calls & private chats ─────
async function onCall(socket, calls) {
    if (!load().flags.anticall) return;
    for (const call of calls || []) {
        if (call.status !== 'offer') continue;
        try {
            if (typeof socket.rejectCall === 'function') await socket.rejectCall(call.id, call.from);
            await socket.sendMessage(call.from, { text: '📵 Calls are not allowed — this is a bot. Please send a message instead.' });
        } catch (e) { console.error('[anticall]', e.message); }
    }
}
const warnedPm = new Set();
async function onPrivate(socket, from) {   // returns true if the sender was blocked
    if (!load().flags.pmblocker) return false;
    try {
        if (!warnedPm.has(from)) { warnedPm.add(from); await socket.sendMessage(from, { text: '🚫 Private messages to this bot are blocked. Please use the bot in a group.' }); }
        await socket.updateBlockStatus(from, 'block');
    } catch (e) { console.error('[pmblocker]', e.message); }
    return true;
}

module.exports = { groupMode, setGroupMode, isGroupStatusPost, onStatusPost, setAfk, clearAfk, getAfk, onAfk, api, get, bioCfg, setBio, renderBio, applyBio, startBio, botNum, BIO_DEFAULT, BIO_MAX, isSudo, addSudo, delSudo, setFlag, badCfg, setBad, setTag, setChatbot, hasBadWord, count, top, onMessage, onCall, onPrivate, _reset: () => { S = DEFAULTS(); loaded = true; } };
