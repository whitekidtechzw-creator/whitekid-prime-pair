'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const W = require('./wk7'), UI = require('./ui'), CFG = require('./menucfg'), CC = require('./customcmds');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log(' ✗', m); } };
(async () => {
    CFG._reset();
    const base = UI.menuSections('.', W);
    ok(base.length >= 20, 'default menu builds: ' + base.length + ' sections');
    ok(/^╭─❮ .+ ❯─────\n│ ◦ \.\S+/.test(base[0].text) && /\n╰──────────●$/.test(base[0].text), 'default look is unchanged');
    const i = { user: 'U', owner: 'O', date: 'D', node: 'v1', uptime: '1m', prefix: '.', mode: 'Public', ram: '1MB', total: 999, version: '9.7.0' };
    const h = UI.menuHeader(i); ok(h.includes('999') && h.includes('9.7.0') && h.includes('Public') && h.includes('v1'), 'default header filled in');
    ok(UI.menuFooter().includes('⌬') && !UI.menuFooter().includes('**'), 'default footer');
    ok(UI.menuBrand({ total: 5, prefix: '.' }).title === 'WHITEKID PRIME' && /5 commands/.test(UI.menuBrand({ total: 5, prefix: '.' }).body), 'default picture title/body');

    // every setting
    const names = base.map(s => s.name), first = names[2], second = names[0];
    CFG.set({ brand: 'MY BOT', footer: 'bye **now**', header: { show: false },
        look: { top: '== {icon} {name} ==', line: '- {prefix}{cmd}', bottom: '==' },
        sectionOrder: [first], hideSections: ['GAMES'], renameSections: { [second]: 'RENAMED' }, icons: { [first]: '🔥' },
        hideCommands: ['ping'], moveCommands: { alive: 'FUN' }, addSections: [{ name: 'MY FAVOURITES', icon: '⭐', commands: ['menu', 'alive'] }] });
    const s = UI.menuSections('!', W), by = n => s.find(x => x.name === n);
    ok(s[0].name === first && s[0].icon === '🔥', 'sectionOrder + icons');
    ok(by('RENAMED') && !s.some(x => x.name === second), 'renameSections');
    ok(!s.some(x => x.key === 'games'), 'hideSections');
    ok(!s.some(x => x.cmds.includes('ping')), 'hideCommands');
    ok(by('FUN') && by('FUN').cmds.includes('alive') && !s.some(x => x.name !== 'FUN' && x.name !== 'MY FAVOURITES' && x.cmds.includes('alive')), 'moveCommands');
    const fav = by('MY FAVOURITES'); ok(fav && fav.icon === '⭐' && fav.cmds.join() === 'menu,alive', 'addSections');
    ok(/^== ⭐ .+ ==\n- !\S+\n- !\S+\n==$/.test(fav.text), 'custom look + prefix');
    ok(UI.menuHeader(i) === '' && UI.menuFull('', s, UI.menuFooter()).startsWith('== '), 'header can be turned off');
    ok(UI.menuFooter().endsWith('𝗻𝗼𝘄') || /bye .+/.test(UI.menuFooter()), 'footer bold markers'); ok(UI.menuBrand({}).title === 'MY BOT', 'brand');
    ok(UI.findSection(s, 'renamed'), 'findSection uses the new name');

    // a mistake in the config file never breaks the menu
    CFG.set({ hideSections: 'oops', icons: 5, addSections: [null, 3, { nothing: 1 }], header: { rows: 'x' }, look: 7, sectionOrder: { a: 1 } });
    ok(UI.menuSections('.', W).length === base.length, 'wrong types fall back to defaults');
    // hot reload from the real file + syntax errors
    CFG._reset();
    const real = fs.readFileSync(CFG.FILE, 'utf8');
    try {
        fs.writeFileSync(CFG.FILE, "module.exports = { footer: 'EDITED' };"); await new Promise(r => setTimeout(r, 20));
        ok(CFG.get().footer === 'EDITED', 'edit is picked up without restart');
        fs.writeFileSync(CFG.FILE, 'module.exports = { footer: ;;; broken'); const t = new Date(Date.now() + 5000); fs.utimesSync(CFG.FILE, t, t);
        const log = console.error; let warned = false; console.error = () => { warned = true; };
        const g = CFG.get(); console.error = log;
        ok(g.footer === 'EDITED' && warned, 'broken edit keeps the last good settings and warns');
    } finally { fs.writeFileSync(CFG.FILE, real); CFG._reset(); }
    ok(CFG.get().footer === CFG.DEFAULTS.footer, 'shipped menu.config.js equals the defaults');

    // custom commands
    const probs = CC.register([{ name: 'zzhello', aliases: ['zzhi'], section: 'MY COMMANDS', reply: ['Hi {user}', 'prefix {prefix} args {args}'] }, { name: 'zzrun', run: async c => c.reply('ran') }, { name: 'menu', reply: 'x' }, { reply: 'no name' }, { name: 'zzbad' }]);
    ok(W.has('zzhello') && W.has('zzhi') && W.has('zzrun'), 'custom commands registered');
    ok(probs.some(p => /"\.menu" skipped/.test(p)) && probs.some(p => /missing "name"/.test(p)) && probs.some(p => /zzbad/.test(p)), 'custom.js problems are reported: ' + probs.length);
    const out = []; await W.run('zzhello', { socket: {}, from: 'x', args: ['a', 'b'], q: 'a b', activePrefix: '!', p: '!', senderName: 'Sam', reply: async t => out.push(t), react: async () => {}, msg: { key: {}, message: {} } });
    ok(out[0] === 'Hi Sam\nprefix ! args a b', 'custom reply placeholders: ' + JSON.stringify(out[0]));
    CFG._reset(); ok(UI.menuSections('.', W).some(x => x.cmds.includes('zzhello')), 'custom commands appear in the menu');

    console.log(fail ? `MENUCFG TESTS FAILED: ${fail}` : 'MENUCFG TESTS PASS'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
