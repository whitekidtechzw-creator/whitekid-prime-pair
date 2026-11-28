'use strict';
/*
 * Whitekid Prime — look & feel.
 * One place for the bot font, the reply card, and the menu layout.
 *   bold(text)      -> 𝗦𝗮𝗻𝘀 𝗕𝗼𝗹𝗱 letters (the bot's label font)
 *   restyle(text)   -> puts labels / *headings* of ANY outgoing text in that font (idempotent, skips code & links)
 *   styleWA(text)   -> wraps a reply in the Prime card
 *   menuSections()  -> the menu, built from menudata.js + the v7 pack categories
 * BOT_FONT=small (default) = ᴛɪɴʏ ꜱᴍᴀʟʟ-ᴄᴀᴘꜱ on every message · bold = 𝗦𝗮𝗻𝘀 𝗕𝗼𝗹𝗱 labels only · none = no font (cards stay).
 */
const MENU = require('./menudata');
const menucfg = require('./menucfg');

const MODE = String(process.env.BOT_FONT || 'small').toLowerCase();
const FONT_ON = MODE !== 'none';
const SMALL = FONT_ON && MODE !== 'bold';
const BRAND = 'WHITEKID PRIME';

const SMALL_CAPS = { a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ' };

function small(s) {
    let o = '';
    for (const ch of String(s)) o += /[A-Za-z]/.test(ch) ? SMALL_CAPS[ch.toLowerCase()] : ch;
    return o;
}

// the font used for labels, titles and headings
function bold(s) {
    if (!FONT_ON) return String(s);
    if (SMALL) return small(s);
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
const PROTECT = /```[\s\S]*?```|`[^`\n]+`|https?:\/\/\S+|[\w.+-]+@[\w-]+\.[\w.-]+|@\d{5,}|(?<![\w])[.!#\/][a-z][a-z0-9_]{1,24}\b/gi;

function mapOutside(text, fn) {
    let out = '', last = 0, m;
    PROTECT.lastIndex = 0;
    while ((m = PROTECT.exec(text))) { out += fn(text.slice(last, m.index)) + m[0]; last = m.index + m[0].length; }
    return out + fn(text.slice(last));
}

// *Heading* -> bold font, and  "Label: value"  at the start of a line -> bold label
const CODE_LIKE = /^[A-Z0-9]{4}-?[A-Z0-9]{4}$|^[A-Za-z0-9+\/=_-]{24,}$/;   // pairing codes, tokens: must stay copy-able

function restyle(text) {
    const t = String(text ?? '');
    if (SMALL) {
        if (!t || /^\s*[\[{]/.test(t)) return t;
        return mapOutside(t, seg => seg.split('\n').map(l => CODE_LIKE.test(l.trim()) ? l : small(l)).join('\n'));
    }
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

// command names in the menu use the small-caps font too (the prefix stays normal)
const cmdFont = c => (FONT_ON ? small(c) : String(c));

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');

// every v7/v8/v9 pack category is folded into the main section where it belongs,
// so people find (for example) the YouTube tools inside DOWNLOADS instead of a separate "V8 YOUTUBE" block
const PACK_TO_SECTION = {
    yt: 'DOWNLOADS', dl: 'DOWNLOADS',
    conv: 'TOOLS', stk: 'TOOLS', ktool: 'TOOLS',
    react: 'FUN', kfun: 'FUN',
    pics: 'IMAGES', fx: 'IMAGES',
    grp: 'GROUP ADMIN',
    botx: 'GENERAL', sys: 'GENERAL',
    txt: 'LOGO MAKER',
    anim: 'ANIME',
    text: 'TEXT FUN',
    math: 'UTILITIES', time: 'UTILITIES', gen: 'UTILITIES',
    games: 'GAMES',
    info: 'SEARCH', net: 'SEARCH'
};
// a few pack commands belong somewhere other than their pack's default section
const CMD_TO_SECTION = {
    listadmin: 'GROUP ADMIN', infoadmin: 'GROUP ADMIN', tagnotadmin: 'GROUP ADMIN', tagmembers: 'GROUP ADMIN',
    sora: 'AI STUDIO', aivideo: 'AI STUDIO', gpt: 'AI CHAT', gpt3: 'AI CHAT',
    restart: 'OWNER', reboot: 'OWNER', banlist: 'OWNER', listbans: 'OWNER'
};
const FIRST = new Set(['yt']);   // pack categories listed right after the core commands, before the rest

function customList() { try { return require('./customcmds').ENTRIES; } catch { return []; } }

// the menu = menudata.js + the pack categories + your own custom.js commands, then reshaped by menu.config.js
function menuSections(p = '.', WK7 = null) {
    const cfg = menucfg.get();
    const secs = MENU.map(([name, cmds]) => ({ orig: name, name, icon: ICONS[name] || '\u2726', cmds: [...cmds] }));
    const byName = new Map(secs.map(s => [s.name, s]));
    if (WK7 && typeof WK7.categories === 'function') {
        const packs = [...WK7.categories()].filter(([id, v]) => v.names.length && id !== 'custom');
        packs.sort((a, b) => (FIRST.has(b[0]) ? 1 : 0) - (FIRST.has(a[0]) ? 1 : 0));
        for (const [id, v] of packs) {
            const target = byName.get(PACK_TO_SECTION[id]);
            if (target) for (const n of v.names) (byName.get(CMD_TO_SECTION[n]) || target).cmds.push(n);
            else { const sec = { orig: (v.tag || 'V7') + ' ' + v.title, name: (v.tag || 'V7') + ' ' + v.title, icon: v.icon || '\u2726', cmds: [...v.names] }; secs.push(sec); byName.set(sec.name, sec); }
        }
    }
    const find = (name) => { const k = slug(name); return secs.find(s => slug(s.name) === k || slug(s.orig) === k) || null; };
    const place = (cmd, section, icon) => { let t = find(section); if (!t) { t = { orig: section, name: section, icon: icon || '\u2726', cmds: [] }; secs.push(t); } t.cmds.push(cmd); };
    for (const c of customList()) for (const n of [].concat(c.name)) if (n && (!WK7 || WK7.has(n))) place(n, c.section || 'MY COMMANDS', c.icon);
    const seen = new Set();   // a command shows up once, in the first section that lists it
    for (const s of secs) { s.cmds = s.cmds.filter(c => !seen.has(c) && seen.add(c)); }
    // ── your edits from menu.config.js ──
    const hide = new Set(cfg.hideCommands);
    for (const s of secs) s.cmds = s.cmds.filter(c => !hide.has(c));
    for (const [cmd, target] of Object.entries(cfg.moveCommands)) { for (const s of secs) s.cmds = s.cmds.filter(c => c !== cmd); place(cmd, String(target)); }
    for (const a of cfg.addSections) { let t = find(a.name); if (!t) { t = { orig: a.name, name: a.name, icon: a.icon, cmds: [] }; secs.push(t); } else if (a.icon) t.icon = a.icon; t.cmds.push(...a.commands.filter(c => !t.cmds.includes(c))); }
    const look = (map, s) => { for (const [k, v] of Object.entries(map)) if (slug(k) === slug(s.name) || slug(k) === slug(s.orig)) return v; return undefined; };
    for (const s of secs) { const r = look(cfg.renameSections, s); const ic = look(cfg.icons, s); if (r) s.name = String(r); if (ic) s.icon = String(ic); }
    const hidden = new Set(cfg.hideSections.map(slug));
    let out = secs.filter(s => s.cmds.length && !hidden.has(slug(s.name)) && !hidden.has(slug(s.orig)));
    if (cfg.sectionOrder.length) { const ord = cfg.sectionOrder.map(slug), rank = s => { const i = ord.findIndex(k => k === slug(s.name) || k === slug(s.orig)); return i < 0 ? 1e6 : i; }; out = out.map((s, i) => [s, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(x => x[0]); }
    for (const s of out) {
        const lines = [menucfg.fmt(cfg.look.top, { icon: s.icon, name: bold(s.name), prefix: p })];
        for (const c of s.cmds) lines.push(menucfg.fmt(cfg.look.line, { icon: s.icon, prefix: p, cmd: cmdFont(c) }));
        lines.push(menucfg.fmt(cfg.look.bottom, { icon: s.icon, name: bold(s.name) }));
        s.text = lines.join('\n');
        s.key = slug(s.name);
    }
    return out;
}

function findSection(secs, want) {
    const w = slug(want); if (!w) return null;
    return secs.find(s => s.key === w) || secs.find(s => s.key.startsWith(w)) || secs.find(s => s.key.includes(w)) || null;
}

function menuIndex(secs, p = '.') {
    return card('Menu index', [...secs.map(s => `${s.icon} ${p}menu ${cmdFont(s.key)}`), '', `Tip: ${p}menu ai`]);
}

function menuHeader(i) {
    const h = menucfg.get().header; if (!h.show) return '';
    const fillRow = r => [menucfg.fmt(r[0], i), menucfg.fmt(r[1], i)];
    return card(h.title, h.rows.map(fillRow), menucfg.fmt(h.tip, i, bold));
}
/** last line of the menu, from menu.config.js */
function menuFooter() { return menucfg.fmt(menucfg.get().footer, {}, bold); }
/** title and body of the menu picture card */
function menuBrand(i = {}) { const c = menucfg.get(); return { title: menucfg.fmt(c.brand, i), body: menucfg.fmt(c.thumbBody, i) }; }

// stats card + every section as ONE message
function menuFull(header, secs, footer) {
    return (header ? header + '\n\n' : '') + secs.map(s => s.text).join('\n\n') + (footer ? '\n\n' + footer : '');
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

module.exports = { BRAND, FONT_ON, SMALL, small, bold, card, chunkSections, findSection, menuBrand, menuFooter, menuFull, menuHeader, menuIndex, menuSections, plain, restyle, styleWA };
