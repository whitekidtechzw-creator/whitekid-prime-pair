'use strict';
const A = require('./autos'), W = require('./wk7');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log(' ✗', m); } };
(async () => {
    A._reset();
    const sent = [], out = [];
    const sock = { user: { id: '9:1@s.whatsapp.net' }, sendMessage: async (j, m) => { sent.push(m); }, sendPresenceUpdate: async () => {}, rejectCall: async () => { sent.push({ rejected: true }); }, updateBlockStatus: async (j, a) => { sent.push({ block: a }); } };
    const base = { socket: sock, from: 'g@g.us', msg: { key: { id: 'k' }, message: {} }, nowsender: '5@s.whatsapp.net', isGroup: true, isOwner: false, isDevOverride: false, isSenderGroupAdmin: false, isCmd: false, body: 'hello' };
    const cmd = (name, args = [], over = {}) => W.run(name, { socket: sock, from: 'g@g.us', msg: { message: {} }, q: args.join(' '), args, reply: async t => out.push(t), react: async () => {}, activePrefix: '.', nowsender: '1@s.whatsapp.net', isGroup: true, isSenderGroupAdmin: false, ...over });

    // permissions
    await cmd('anticall', ['on']); ok(/Owner-only/.test(out.pop()), 'anticall needs owner');
    await cmd('antibadword', ['on']); ok(/Admins only/.test(out.pop()), 'antibadword needs admin');
    await cmd('sudo', ['add', '263789000111']); ok(/Owner-only/.test(out.pop()), 'sudo needs owner');

    // flags
    await cmd('anticall', ['on'], { isOwner: true }); ok(A.get().flags.anticall === true, 'anticall on');
    await A.onCall(sock, [{ id: 'c1', from: '7@s.whatsapp.net', status: 'offer' }]); ok(sent.some(s => s.rejected), 'call rejected');
    sent.length = 0; await A.onCall(sock, [{ id: 'c2', from: '7@s.whatsapp.net', status: 'ringing' }]); ok(!sent.length, 'only offers are rejected');
    await cmd('pmblocker', ['on'], { isOwner: true }); sent.length = 0;
    ok(await A.onPrivate(sock, '8@s.whatsapp.net') === true && sent.some(s => s.block === 'block'), 'pm blocked');
    await cmd('pmblocker', ['off'], { isOwner: true }); ok(await A.onPrivate(sock, '8@s.whatsapp.net') === false, 'pmblocker off lets DMs through');

    // antibadword
    await cmd('antibadword', ['on'], { isSenderGroupAdmin: true }); sent.length = 0;
    ok(await A.onMessage({ ...base, body: 'you are a bitch' }) === true && sent.some(s => s.delete), 'bad word deleted');
    ok(await A.onMessage({ ...base, body: 'class assignment' }) === false, 'no false positive on "class"/"ass" inside words');
    ok(await A.onMessage({ ...base, body: 'shit', isSenderGroupAdmin: true }) === false, 'admins are exempt');
    await cmd('antibadword', ['add', 'kwaaa'], { isSenderGroupAdmin: true }); ok(await A.onMessage({ ...base, body: 'oh kwaaa' }) === true, 'custom word works');
    await cmd('antibadword', ['remove', 'kwaaa'], { isSenderGroupAdmin: true }); ok(await A.onMessage({ ...base, body: 'oh kwaaa' }) === false, 'custom word removed');

    // antitag
    await cmd('antitag', ['on'], { isSenderGroupAdmin: true });
    const many = { ...base, msg: { key: { id: 'k2' }, message: { extendedTextMessage: { contextInfo: { mentionedJid: ['1', '2', '3', '4', '5', '6'].map(n => n + '@s.whatsapp.net') } } } }, body: '@1 @2 @3 @4 @5 @6' };
    sent.length = 0; ok(await A.onMessage(many) === true && sent.some(s => s.delete), 'mass tag deleted');
    ok(await A.onMessage({ ...base, body: 'hi @everyone' }) === true, '@everyone deleted');

    // chatbot
    A.api.ask = async t => 'bot says hi';
    await cmd('chatbot', ['on'], { isSenderGroupAdmin: true }); sent.length = 0;
    ok(await A.onMessage({ ...base, body: 'hello there' }) === false && !sent.some(s => s.text === 'bot says hi'), 'group chatbot ignores unaddressed messages');
    const addressed = { ...base, msg: { key: { id: 'k3' }, message: { extendedTextMessage: { contextInfo: { mentionedJid: ['9@s.whatsapp.net'] } } } } };
    ok(await A.onMessage(addressed) === true && sent.some(s => s.text === 'bot says hi'), 'group chatbot answers when mentioned');
    ok(await A.onMessage({ ...base, isCmd: true, body: '.menu' }) === false, 'commands are never hijacked by the chatbot');

    // sudo
    await cmd('sudo', ['add', '263789000111'], { isOwner: true }); ok(A.isSudo('+263 789 000 111'), 'sudo added');
    await cmd('sudo', ['list'], { isOwner: true }); ok(/263789000111/.test(out.pop()), 'sudo list');
    await cmd('delmod', ['263789000111'], { isOwner: true }); ok(!A.isSudo('263789000111'), 'delmod removes sudo');

    // topmembers
    A._reset(); for (let i = 0; i < 3; i++) await A.onMessage({ ...base, nowsender: '5@s.whatsapp.net' }); await A.onMessage({ ...base, nowsender: '6@s.whatsapp.net' });
    sent.length = 0; await cmd('topmembers'); ok(/@5 — 3 messages/.test(sent.pop()?.text || ''), 'topmembers ranks by count');
    ok(await A.onMessage({ ...base, msg: { key: { fromMe: true } } }) === false, 'own messages are ignored');
    console.log(fail ? 'AUTOS TESTS FAILED (' + fail + ')' : 'AUTOS TESTS PASS'); process.exit(fail ? 1 : 0);
})();
