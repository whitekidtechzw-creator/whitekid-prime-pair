'use strict';
/*
 * Whitekid Prime — look & feel.
 * One place for the bot font, the reply card, and the menu layout.
 *   bold(text)      -> 𝗦𝗮𝗻𝘀 𝗕𝗼𝗹𝗱 letters (the bot's label font)
 *   restyle(text)   -> puts labels / *headings* of ANY outgoing text in that font (idempotent, skips code & links)
 *   styleWA(text)   -> wraps a reply in the Prime card
 *   menuSections()  -> the menu, built from menudata.js + the v7 pack categories
 * BOT_FONT=none turns the font off (cards stay).
 */
const MENU = require('./menudata');

const FONT_ON = String(process.env.BOT_FONT || 'bold').toLowerCase() !== 'none';
const BRAND = 'WHITEKID PRIME';

function bold(s) {
    if (!FONT_ON) return String(s);
    let o = '';
    for (const ch of String(s)) {
        const c = ch.charCodeAt(0);
        if (c >= 65 && c <= 90) o += String.fromCodePoint(0x1D5D4 + c - 65);
        else if (c >= 97 && c <= 122) o += String.fromCodePoint(0x1D5EE + c - 97);
        else if (c >= 48 && c <= 57) o += String.fromCodePoint(0x1D7EC + c - 48);
        else o += ch;
    }
    return o;
}

// text we never touch: code blocks, inline code, links, @mentions, .commands
const PROTECT = /```[\s\S]*?```|`[^`\n]+`|https?:\/\/\S+|@\d{5,}|(?<![\w])[.!#\/][a-z][a-z0-9_]{1,24}\b/gi;

function mapOutside(text, fn) {
    let out = '', last = 0, m;
    PROTECT.lastIndex = 0;
    while ((m = PROTECT.exec(text))) { out += fn(text.slice(last, m.index)) + m[0]; last = m.index + m[0].length; }
    return out + fn(text.slice(last));
}

// *Heading* -> bold font, and  "Label: value"  at the start of a line -> bold label
function restyle(text) {
    const t = String(text ?? '');
    if (!FONT_ON || !t || /```/.test(t) || /^\s*[\[{]/.test(t)) return t;
    return t.split('\n').map(line => mapOutside(line, seg => seg
        .replace(/\*([^*\n]{1,60})\*/g, (_, x) => bold(x))
        .replace(/^([^\p{L}\p{N}\n]{0,6})([A-Za-z][A-Za-z ]{1,22})(:)(?= )/u, (_, p, l, c) => p + bold(l) + c))).join('\n');
}

function plain(raw) {
    return String(raw || '').split('\n')
        .filter(l => !l.includes('━━━━━━━━━━━━━'))
        .map(l => l.replace(/^\*┃\*\s?/, '').replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?]|$)/g, '$1$2').replace(/^> /, ''))
        .join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function styleWA(raw, tone) {
    const text = plain(raw);
    if (!text) return text;
    const t = tone || (/^\s*(⚠️|❌|🚫|❗|🔐|⛔)/.test(text) ? 'err' : /^\s*(✅|🎉|👁️|🔓)/.test(text) ? 'ok' : 'info');
    const icon = { err: '✖', ok: '✔', info: '✦' }[t];
    const lines = text.split('\n');
    let title = BRAND, bodyLines = lines;
    const first = lines[0].replace(/\*/g, '').replace(/^[^\p{L}\p{N}]+/u, '').replace(/[|:\s]+$/, '').trim();
    if (lines.length > 1 && first && first.length <= 34) { title = first.toUpperCase(); bodyLines = lines.slice(1); }
    else if (lines.length === 1 && first.length <= 34) { title = { err: 'HOLD ON', ok: 'DONE', info: BRAND }[t]; bodyLines = [lines[0].replace(/^[^\p{L}\p{N}`.]+/u, '')]; }
    const isLong = text.length > 900;
    const body = bodyLines.map(l => {
        if (!l.trim()) return isLong ? '' : '┃';
        let o = l.replace(/^\s*[•\-\*▪●]\s+/, '◦ ');
        if (!isLong) {
            const m = o.match(/^(\s*[^\p{L}\p{N}\s]{0,3}\s*)([A-Za-z][A-Za-z ]{1,18}):\s+(.+)$/u);
            if (m && !/^https?$/i.test(m[2])) o = `${m[1]}${bold(m[2].trim())} ➜ ${m[3]}`;
        }
        o = restyle(o);
        return isLong ? o : '┃ ' + o;
    }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    const head = `┏━❖ ${bold(title.toUpperCase())} ${icon} ━━━━`;
    const foot = `┗━━━━━━━━━━━━━●\n⌬ ${bold('Whitekid Prime')}`;
    return isLong ? `${head}\n\n${body}\n\n${foot}` : `${head}\n${body}\n${foot}`;
}

// a ready-made card: card('Title', [['Label', 'value'], 'plain line', ''], 'footer')
function card(title, rows = [], footer) {
    const body = rows.map(r => Array.isArray(r) ? `┃ ${bold(r[0])} ➜ ${r[1]}` : (r === '' ? '┃' : `┃ ${restyle(r)}`)).join('\n');
    return `┏━❖ ${bold(String(title).toUpperCase())} ❖━━━━\n${body}\n┗━━━━━━━━━━━━━●${footer ? '\n' + footer : ''}`;
}

// ───── menu ─────
const ICONS = {
    NEXUS: '🌐', QUOTES: '💬', GENERAL: '⚙️', 'AI CHAT': '🤖', 'AI STUDIO': '🎨', DOWNLOADS: '📥', SEARCH: '🔎', FUN: '🎭',
    IMAGES: '🖼️', ANIME: '🐉', TOOLS: '🧰', 'GROUP ADMIN': '🛡️', OWNER: '👑', SPORTS: '⚽', 'TEMP MAIL': '📧',
    'LOGO MAKER': '✒️', GAMES: '🎮', 'FUN PACK': '🎲', 'TEXT FUN': '🔤', UTILITIES: '🧮'
};

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');

function menuSections(p = '.', WK7 = null) {
    const secs = MENU.map(([name, cmds]) => ({ name, icon: ICONS[name] || '✦', cmds }));
    if (WK7 && typeof WK7.categories === 'function') {
        for (const [, v] of WK7.categories()) if (v.names.length) secs.push({ name: 'V7 ' + v.title, icon: v.icon || '✦', cmds: v.names });
    }
    for (const s of secs) {
        const lines = [`╭─❮ ${s.icon} ${bold(s.name)} ❯─────`];
        for (const c of s.cmds) lines.push(`│ ◦ ${p}${c}`);
        lines.push('╰──────────●');
        s.text = lines.join('\n');
        s.key = slug(s.name);
    }
    return secs;
}

function findSection(secs, want) {
    const w = slug(want); if (!w) return null;
    return secs.find(s => s.key === w) || secs.find(s => s.key.startsWith(w)) || secs.find(s => s.key.includes(w)) || null;
}

function menuIndex(secs, p = '.') {
    return card('Menu index', [...secs.map(s => `${s.icon} ${p}menu ${s.key}  (${s.cmds.length})`), '', `Tip: ${p}menu ai`]);
}

function menuHeader(i) {
    return card('Whitekid Prime', [
        ['👤 User', i.user], ['👑 Owner', i.owner], ['⚡ Engine', 'Baileys multi-device'], ['📅 Date', i.date],
        ['🧬 Type', 'Node.js ' + i.node], ['⏱️ Uptime', i.uptime], ['🔑 Prefix', i.prefix], ['🌐 Mode', i.mode],
        ['💾 RAM', i.ram], ['📦 Commands', i.total], ['🟢 Status', 'Online'], ['🏷️ Version', i.version]
    ], `✦ ${bold('Browse')}: ${i.prefix}menu <category>   e.g. ${i.prefix}menu ai`);
}

// split the menu into messages that stay under WhatsApp's comfortable size
function chunkSections(secs, max = 3600) {
    const out = []; let cur = '';
    for (const s of secs) {
        if (cur && (cur.length + s.text.length + 2) > max) { out.push(cur); cur = ''; }
        cur += (cur ? '\n\n' : '') + s.text;
    }
    if (cur) out.push(cur);
    return out;
}

module.exports = { BRAND, FONT_ON, bold, card, chunkSections, findSection, menuHeader, menuIndex, menuSections, plain, restyle, styleWA };
