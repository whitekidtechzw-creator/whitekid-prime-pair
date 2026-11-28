'use strict';
// Turns the blocks in custom.js into real commands. You do not need to edit this file.
const core = require('./wk7-core');
const { REG, CATS, category } = core;
const fs = require('fs'), path = require('path');
const NAMES = new Set(), ENTRIES = [];
const CASES = new Set();
try { for (const m of fs.readFileSync(path.join(__dirname, 'commands.js'), 'utf8').matchAll(/case\s*'([^'\n]+)'\s*:/g)) CASES.add(m[1]); } catch { /* optional */ }

const fill = (t, c) => String(t)
    .replace(/\{user\}/g, c.senderName || 'friend').replace(/\{prefix\}/g, c.p || '.').replace(/\{bot\}/g, 'Whitekid Prime')
    .replace(/\{args\}/g, c.q || '').replace(/\{date\}/g, new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Harare' }))
    .replace(/\{time\}/g, new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Harare' }));

function register(list) {
    category('custom', '⭐', 'CUSTOM'); CATS.get('custom').tag = 'CUSTOM';
    const problems = [];
    (Array.isArray(list) ? list : []).forEach((e, i) => {
        if (!e || typeof e !== 'object' || !e.name) return problems.push(`custom.js block #${i + 1}: missing "name"`);
        if (e.reply === undefined && typeof e.run !== 'function') return problems.push(`custom.js ".${e.name}": needs a "reply" or a "run" function`);
        const names = [].concat(e.name, e.aliases || []).map(n => String(n).toLowerCase().replace(/^[^\w]+/, '')).filter(Boolean);
        const free = names.filter(n => !REG.has(n) && !CASES.has(n));
        for (const n of names) if (!free.includes(n)) problems.push(`custom.js ".${n}" skipped — the bot already has a command with that name`);
        if (!free.length) return;
        e.name = free[0];
        const fn = typeof e.run === 'function' ? e.run : async c => { await c.reply(fill([].concat(e.reply).join('\n'), c)); };
        core.def('custom', free, e.help || '', fn);
        free.forEach(n => NAMES.add(n)); ENTRIES.push({ name: free, section: e.section, icon: e.icon });
    });
    for (const p of problems) console.error('⚠️', p);
    return problems;
}

let entries = []; try { entries = require('./custom'); } catch (e) { console.error('⚠️ custom.js has a mistake — your custom commands are off until it is fixed:', e.message); }
const PROBLEMS = register(entries);
module.exports = { ENTRIES, NAMES, PROBLEMS, register, fill };
