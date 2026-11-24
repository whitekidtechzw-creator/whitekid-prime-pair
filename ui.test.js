'use strict';
// Menu / font / AI / music checks. No network, no WhatsApp.
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const UI = require('./ui'), AI = require('./ai'), WK7 = require('./wk7'), MENU = require('./menudata');

// every menu command has a handler (switch case or v7 pack)
const src = fs.readFileSync(path.join(__dirname, 'commands.js'), 'utf8');
const cases = new Set([...src.matchAll(/\bcase\s*'([^'\n]+)'\s*:/g)].map(m => m[1]));
for (const [cat, cmds] of MENU) for (const c of cmds) ok(cases.has(c) || WK7.has(c), `menu command .${c} (${cat}) has no handler`);
for (const n of AI.NAMES) ok(cases.has(n), `AI command ${n} has no case`);
ok(cases.has('play') && cases.has('repo'), 'play and repo exist');

// font + card
const b = UI.bold('Hi 7'); ok(b !== 'Hi 7' && /^[^A-Za-z]+$/.test(b.replace(/ /g, '')), 'bold font applied: ' + b);
ok(UI.restyle('*Title*\nUsage: .play x https://a.b/Usage: z').includes('https://a.b/Usage: z'), 'links untouched');
ok(UI.restyle('```\nname: value\n```') === '```\nname: value\n```', 'code untouched');
ok(UI.restyle(UI.restyle('Mode: x')) === UI.restyle('Mode: x'), 'restyle is idempotent');
const st = UI.styleWA('✅ Done\nMode: Public'); ok(/┏━❖/.test(st) && /┗━/.test(st), 'card drawn');
const secs = UI.menuSections('.', WK7); ok(secs.length >= 25, 'menu sections built: ' + secs.length);
ok(UI.chunkSections(secs).every(c => c.length < 4200), 'menu chunks are a safe size');
ok(UI.findSection(secs, 'ai') && UI.findSection(secs, 'down'), 'menu <category> lookup');

// AI: answer cleaning and fallback order (fetch mocked)
ok(AI.pickText({ choices: [{ message: { content: 'hi!' } }] }) === 'hi!', 'openai shape');
ok(AI.pickText({ status: true, result: { text: 'deep' } }) === 'deep', 'nested result');
ok(AI.pickText({ status: false, result: 'nope' }) === null, 'status:false rejected');
ok(!AI.good('<html>bad gateway</html>') && AI.good('Hello there'), 'html rejected');
(async () => {
    const real = global.fetch; let calls = 0;
    global.fetch = async () => { calls++; if (calls === 1) return { ok: true, text: async () => '<html>oops</html>' }; if (calls === 2) return { ok: false, status: 500, text: async () => '' }; return { ok: true, text: async () => JSON.stringify({ choices: [{ message: { content: 'Real answer' } }] }) }; };
    const r = await AI.ask('what is 2+2', { cmd: 'gemini' });
    ok(r && r.text === 'Real answer' && calls >= 3, 'falls through bad providers: ' + JSON.stringify(r));
    global.fetch = async () => { throw new Error('offline'); };
    const none = await AI.handle('chatgpt', 'hello', {}); ok(none.error, 'clean error when everything is down');
    const use = await AI.handle('aitranslate', '', {}); ok(use.usage, 'usage shown');
    global.fetch = real;
    const { sniffAudio } = require('./music');
    ok(sniffAudio(Buffer.concat([Buffer.from('ID3'), Buffer.alloc(20)])).kind === 'mp3', 'sniff mp3');
    ok(sniffAudio(Buffer.from('<html><body>error</body></html>')) === null, 'html is not audio');
    console.log(fails ? `UI TESTS FAILED (${fails})` : 'UI TESTS PASS');
    process.exit(fails ? 1 : 0);
})();
