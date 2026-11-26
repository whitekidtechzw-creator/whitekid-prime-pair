'use strict';
/*
 * WHITEKID PRIME — AUTOMATIONS (ported from Knightbot-MD / Atlas-MD ideas)
 * antibadword · antitag · anticall · pmblocker · autoreact · autotyping · chatbot · sudo · topmembers
 * Settings live in data/autos.json (kept in memory, written a moment after each change).
 */
const fs = require('fs'), path = require('path');
const { DATA_DIR } = require('./config');
const FILE = path.join(DATA_DIR, 'autos.json');

const DEFAULTS = () => ({ flags: { autoreact: false, autotyping: false, anticall: false, pmblocker: false }, antibadword: {}, antitag: {}, chatbot: {}, sudo: [], counts: {} });
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

module.exports = { api, get, isSudo, addSudo, delSudo, setFlag, badCfg, setBad, setTag, setChatbot, hasBadWord, count, top, onMessage, onCall, onPrivate, _reset: () => { S = DEFAULTS(); loaded = true; } };
