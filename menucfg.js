'use strict';
/*
 * Loads menu.config.js (the file YOU edit) and fills in anything you left out.
 * - Saved changes show up on the next .menu — no restart needed.
 * - A typo or crash in menu.config.js never breaks the bot: the last good settings (or the defaults) are used
 *   and the problem is printed in the console.
 */
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, 'menu.config.js');

const DEFAULTS = Object.freeze({
    brand: 'WHITEKID PRIME',
    thumbBody: '{total} commands · {prefix}menu <category>',
    footer: '⌬ **Whitekid Prime**',
    header: {
        show: true,
        title: 'Whitekid Prime',
        rows: [['👤 User', '{user}'], ['👑 Owner', '{owner}'], ['⚡ Engine', 'Baileys multi-device'], ['📅 Date', '{date}'], ['🧬 Type', 'Node.js {node}'], ['⏱️ Uptime', '{uptime}'],
            ['🔑 Prefix', '{prefix}'], ['🌐 Mode', '{mode}'], ['💾 RAM', '{ram}'], ['📦 Commands', '{total}'], ['🟢 Status', 'Online'], ['🏷️ Version', '{version}']],
        tip: '✦ **Browse**: {prefix}menu <category>   e.g. {prefix}menu ai'
    },
    look: { top: '╭─❮ {icon} {name} ❯─────', line: '│ ◦ {prefix}{cmd}', bottom: '╰──────────●' },
    sectionOrder: [], hideSections: [], renameSections: {}, icons: {}, hideCommands: [], moveCommands: {}, addSections: []
});

let cache = null, mtime = -1, lastGood = null, warned = '', override = null;
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const strs = a => (Array.isArray(a) ? a.map(String) : []);

function normalise(user) {
    const u = isObj(user) ? user : {}, d = DEFAULTS, h = isObj(u.header) ? u.header : {}, l = isObj(u.look) ? u.look : {};
    const rows = Array.isArray(h.rows) ? h.rows.filter(r => Array.isArray(r) && r.length >= 2).map(r => [String(r[0]), String(r[1])]) : d.header.rows;
    return {
        brand: typeof u.brand === 'string' ? u.brand : d.brand,
        thumbBody: typeof u.thumbBody === 'string' ? u.thumbBody : d.thumbBody,
        footer: typeof u.footer === 'string' ? u.footer : d.footer,
        header: { show: h.show !== false, title: typeof h.title === 'string' ? h.title : d.header.title, rows, tip: typeof h.tip === 'string' ? h.tip : d.header.tip },
        look: { top: typeof l.top === 'string' ? l.top : d.look.top, line: typeof l.line === 'string' ? l.line : d.look.line, bottom: typeof l.bottom === 'string' ? l.bottom : d.look.bottom },
        sectionOrder: strs(u.sectionOrder), hideSections: strs(u.hideSections), hideCommands: strs(u.hideCommands),
        renameSections: isObj(u.renameSections) ? u.renameSections : {}, icons: isObj(u.icons) ? u.icons : {}, moveCommands: isObj(u.moveCommands) ? u.moveCommands : {},
        addSections: Array.isArray(u.addSections) ? u.addSections.filter(s => isObj(s) && s.name).map(s => ({ name: String(s.name), icon: s.icon ? String(s.icon) : '✦', commands: strs(s.commands) })) : []
    };
}

function get() {
    if (override) return override;
    let m = 0; try { m = fs.statSync(FILE).mtimeMs; } catch { /* no file → defaults */ }
    if (cache && m === mtime) return cache;
    mtime = m;
    try {
        if (!m) { cache = normalise({}); return cache; }
        delete require.cache[require.resolve(FILE)];
        cache = lastGood = normalise(require(FILE)); warned = '';
    } catch (e) {
        if (warned !== e.message) { warned = e.message; console.error('⚠️ menu.config.js has a mistake — using the last good menu settings:', e.message); }
        cache = lastGood || normalise({});
    }
    return cache;
}

/** replaces {name} placeholders; **text** becomes the bot's bold font. */
function fmt(tpl, vars, bold) {
    const s = String(tpl).replace(/\{(\w+)\}/g, (all, k) => (vars && vars[k] !== undefined ? vars[k] : all));
    return typeof bold === 'function' ? s.replace(/\*\*([^*]+)\*\*/g, (_, t) => bold(t)) : s;
}

module.exports = { get, fmt, normalise, DEFAULTS, FILE, set(o) { override = o ? normalise(o) : null; }, _reset() { override = null; cache = null; mtime = -1; lastGood = null; warned = ''; } };
