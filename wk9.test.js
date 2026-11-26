'use strict';
const W = require('./wk7'), W9 = require('./wk9');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log(' ✗', m); } };
for (const n of ['heart', 'triggered', 'tweet', 'metallic', 'blackpink', 'pies', 'japan', 'animuquote', 'flirt', 'gpt', 'ss', 'removebg', 'remini', 'sora', 'jid', 'telesticker', 'listadmin', 'tagnotadmin']) ok(W.has(n) || require('fs').readFileSync('commands.js', 'utf8').includes(`case '${n}'`), 'registered: ' + n);
ok(W9.NAMES.size > 50, 'knight pack size ' + W9.NAMES.size);
(async () => {
    const out = []; const base = { socket: { sendMessage: async () => ({}) }, from: 'g@g.us', msg: { message: {} }, q: '', args: [], reply: async t => out.push(t), react: async () => {}, activePrefix: '.', nowsender: '1@s.whatsapp.net', isGroup: true, isSenderGroupAdmin: false };
    await W.run('tagnotadmin', { ...base }); ok(/Admins only/.test(out.pop() || ''), 'tagnotadmin is admin-only');
    await W.run('tweet', { ...base }); ok(/Usage/i.test(out.pop() || ''), 'tweet shows usage');
    await W.run('oogway2', { ...base }); ok(/oogway2/.test(out.pop() || ''), 'oogway2 shows its own usage');
    await W.run('metallic', { ...base }); ok(/Usage/i.test(out.pop() || ''), 'logo shows usage');
    console.log(fail ? 'WK9 TESTS FAILED (' + fail + ')' : 'WK9 TESTS PASS'); process.exit(fail ? 1 : 0);
})();
