'use strict';
const W = require('./wk7'), W12 = require('./wk12'), A = require('./autos'), S = require('./services');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log(' ✗', m); } };
(async () => {
    A._reset();
    const out = [], sent = [], calls = [];
    const meta = { id: 'g@g.us', subject: 'T', participants: [{ id: '1@s.whatsapp.net', admin: 'admin' }, { id: '2@s.whatsapp.net' }, { id: '3@s.whatsapp.net', admin: 'admin' }] };
    const socket = { user: { id: '1:5@s.whatsapp.net' }, sendMessage: async (j, m) => { sent.push({ j, m }); return { key: { id: 'k' } }; }, groupMetadata: async () => meta, groupParticipantsUpdate: async (...a) => { calls.push(['kick', ...a]); } };
    const base = { socket, from: 'g@g.us', isGroup: true, args: [], q: '', q: '', msg: { key: { id: 'm', remoteJid: 'g@g.us' }, message: { conversation: '.x' } }, activePrefix: '.', p: '.', nowsender: '2@s.whatsapp.net', reply: async t => { out.push(t); }, react: async () => {}, isOwner: false };
    const run = (n, o = {}) => { out.length = 0; sent.length = 0; calls.length = 0; return W.run(n, { ...base, command: n, ...o }); };

    ok(W12.NAMES.size >= 60, 'pack registers many commands: ' + W12.NAMES.size);
    for (const n of ['antiviewonce', 'autosavestatus', 'antigroupstatus', 'antistatusmention', 'afk', 'bratvid', 'iqc', 'carbon', 'bard', 'quillbot', 'neko', 'tickle', 'catfact', 'country', 'downloadmenu', 'tagadmins', 'addbadword', 'alldl', 'capcut']) ok(W.has(n), 'registered: ' + n);

    // toggles
    await run('antiviewonce', { args: ['on'] }); ok(/Owner-only/.test(out[0]) && !A.get().flags.antiviewonce, 'antiviewonce owner-only');
    await run('antiviewonce', { args: ['on'], isOwner: true }); ok(A.get().flags.antiviewonce === true, 'antiviewonce on');
    await run('autosavestatus', { args: ['on'], isOwner: true }); ok(A.get().flags.savestatus === true, 'autosavestatus on');
    await run('autosavestatus', { args: ['off'], isOwner: true }); ok(A.get().flags.savestatus === false, 'autosavestatus off');
    await run('antigroupstatus', { args: ['on'] }); ok(/Admins only/.test(out[0]), 'antigroupstatus admin-only');
    await run('antigroupstatus', { args: ['kick'], isSenderGroupAdmin: true }); ok(A.groupMode('antigstatus', 'g@g.us') === 'kick', 'antigroupstatus kick');
    await run('antistatusmention', { args: ['on'], isSenderGroupAdmin: true }); ok(A.groupMode('antistatusmention', 'g@g.us') === 'on', 'antistatusmention on');

    // anti group status / status mention
    const post = { key: { id: 'p1', remoteJid: 'g@g.us', participant: '2@s.whatsapp.net' }, message: { videoMessage: { contextInfo: { isGroupStatus: true } } } };
    const ctx = { socket, msg: post, from: 'g@g.us', nowsender: '2@s.whatsapp.net', isGroup: true, isOwner: false, isDevOverride: false };
    sent.length = 0; calls.length = 0;
    ok(await A.onStatusPost(ctx) === true && sent.some(s => s.m.delete) && calls.some(c => c[0] === 'kick' && c[3] === 'remove'), 'group status post deleted + sender kicked');
    sent.length = 0; ok(await A.onStatusPost({ ...ctx, nowsender: '3@s.whatsapp.net' }) === false && !sent.length, 'admins are exempt');
    sent.length = 0; ok(await A.onStatusPost({ ...ctx, isOwner: true }) === false, 'owner exempt');
    A.setGroupMode('antistatusmention', 'g@g.us', 'on'); sent.length = 0;
    ok(await A.onStatusPost({ ...ctx, msg: { key: { id: 'p2', remoteJid: 'g@g.us' }, message: { groupStatusMentionMessage: {} } } }) === true && sent.some(s => s.m.delete), 'status mention deleted');
    A.setGroupMode('antigstatus', 'g@g.us', 'off'); sent.length = 0; ok(await A.onStatusPost(ctx) === false, 'off means off');
    ok(await A.onStatusPost({ ...ctx, msg: { key: { id: 'x' }, message: { conversation: 'hi' } } }) === false, 'normal text ignored');

    // AFK
    await run('afk', { q: 'lunch' }); ok(A.getAfk('2') && /AFK/.test(sent[0].m.text), 'afk set');
    sent.length = 0; await A.onAfk({ socket, msg: { key: { id: 'a' }, message: { extendedTextMessage: { text: 'hey', contextInfo: { mentionedJid: ['2@s.whatsapp.net'] } } } }, from: 'g@g.us', nowsender: '3@s.whatsapp.net', isGroup: true });
    ok(/AFK.*lunch/.test(sent[0]?.m.text || ''), 'tagging an AFK user notifies');
    sent.length = 0; await A.onAfk({ socket, msg: { key: { id: 'b' }, message: { conversation: 'back' } }, from: 'g@g.us', nowsender: '2@s.whatsapp.net', isGroup: true });
    ok(/Welcome back/.test(sent[0]?.m.text || '') && !A.getAfk('2'), 'AFK cleared on message');

    // group tools
    await run('tagadmins', { q: 'help' }); ok(sent[0].m.mentions.length === 2, 'tagadmins mentions admins');
    await run('addbadword', { args: ['Foo!'], isSenderGroupAdmin: true }); ok(A.badCfg('g@g.us').words.includes('foo'), 'addbadword');
    await run('badwordlist', { isSenderGroupAdmin: true }); ok(/foo/.test(out[0]), 'badwordlist');
    await run('removebadword', { args: ['foo'], isSenderGroupAdmin: true }); ok(!A.badCfg('g@g.us').words.includes('foo'), 'removebadword');

    // view-once: forward + sender fallback
    const fake = Buffer.from('x'.repeat(50)); const origDl = S.voApi.download; S.voApi.download = async () => fake;
    let got = null; const vo = { key: { id: 'vo1', remoteJid: 'g@g.us', participant: '7@s.whatsapp.net' }, pushName: 'Z', message: { viewOnceMessageV2: { message: { imageMessage: { caption: 'c' } } } } };
    S.rememberViewOnce(vo, e => { got = e; }); await new Promise(r => setTimeout(r, 30));
    ok(got && got.buf === fake && got.sender === '7', 'rememberViewOnce calls onReady with media + sender');
    sent.length = 0; ok(await S.forwardViewOnce(socket, got) === true && sent[0].j === '1@s.whatsapp.net' && /VIEW-ONCE SAVED/.test(sent[0].m.caption), 'forwardViewOnce to owner DM');
    ok(S.voLatestFrom('7@s.whatsapp.net')?.id === 'vo1', 'latest view-once by sender');
    const ptv = S.findViewOnce({ viewOnceMessage: { message: { ptvMessage: {} } } }); ok(ptv && ptv.kind === 'video' && ptv.ptv, 'video note view-once detected');
    const stripped = { key: { id: 'q' }, message: { extendedTextMessage: { text: '.vv', contextInfo: { stanzaId: 'gone', participant: '7@s.whatsapp.net', quotedMessage: { conversation: '' } } } } };
    sent.length = 0; ok(await S.viewonceCommand(socket, 'g@g.us', stripped) === true && sent[0].m.image, 'stripped quote falls back to sender latest');
    S.voApi.download = origDl;

    // status saver
    S.voApi.download = async () => fake;
    sent.length = 0; const st = { key: { id: 'st1', remoteJid: 'status@broadcast', participant: '8@s.whatsapp.net' }, pushName: 'N', message: { imageMessage: { caption: 'hi' } } };
    ok(await S.saveStatusToOwner(socket, st) === true && sent[0].m.image && /STATUS SAVED/.test(sent[0].m.caption), 'status saved to owner');
    ok(await S.saveStatusToOwner(socket, st) === false, 'same status not saved twice');
    sent.length = 0; ok(await S.saveStatusToOwner(socket, { key: { id: 'st2', remoteJid: 'status@broadcast', participant: '8@s.whatsapp.net' }, message: { conversation: 'text status' } }) === true && /text status/.test(sent[0].m.text), 'text status saved');
    S.voApi.download = origDl;

    // AI video chain
    const okP = { name: 'ok', run: async () => 'https://x/v.mp4' }, bad = { name: 'bad', run: async () => { throw new Error('down'); } };
    let r = await S.aiVideo('p', { providers: [bad, okP] }); ok(r.kind === 'video' && r.source === 'ok', 'chain skips failed provider');
    r = await S.aiVideo('p', { providers: [bad], scene: async () => Buffer.from('img') }); ok(r.kind === 'image', 'falls back to image scene');
    r = await S.aiVideo('p', { providers: [bad], image: false }); ok(r.kind === null && /bad: down/.test(r.errors[0]), 'reports errors when everything fails');
    await S.aiVideoCommand({ socket, from: 'g@g.us', fakeCard: null, reply: async t => out.push(t), react: async () => {}, aiVideoFn: async () => ({ kind: 'video', url: 'https://x/v.mp4', source: 'T' }) }, 'a cat', 'AI Video');
    ok(sent.some(s => s.m.video && /a cat/.test(s.m.caption)), 'aiVideoCommand sends video');

    // fetch-backed commands
    const realFetch = global.fetch;
    global.fetch = async url => { const u = String(url); const j = o => ({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => o, text: async () => JSON.stringify(o), arrayBuffer: async () => Buffer.from(JSON.stringify(o)) });
        if (/bard-google/.test(u)) return j({ status: true, result: 'Bard says hi' }); if (/quillbot/.test(u)) return j({ result: 'Rewritten text' });
        if (/catfact/.test(u)) return j({ fact: 'Cats purr' }); if (/restcountries/.test(u)) return j([{ name: { common: 'Zimbabwe', official: 'Republic of Zimbabwe' }, capital: ['Harare'], region: 'Africa', population: 15000000, languages: { eng: 'English' }, currencies: { USD: { name: 'Dollar', symbol: '$' } }, flag: '🇿🇼' }]);
        if (/nekos\.best/.test(u)) return j({ results: [{ url: 'https://n/x.gif', artist_name: 'A' }] }); return { ok: false, status: 404, headers: { get: () => '' }, json: async () => ({}), text: async () => '', arrayBuffer: async () => new ArrayBuffer(0) }; };
    await run('bard', { q: 'hello' }); ok(/Bard says hi/.test(out.join('')), 'bard');
    await run('quillbot', { q: 'hello' }); ok(/Rewritten/.test(out.join('')), 'quillbot');
    await run('catfact'); ok(/Cats purr/.test(out.join('')), 'catfact');
    await run('country', { q: 'Zimbabwe' }); ok(/Harare/.test(out.join('')), 'country');
    await run('tickle', { nowsender: '2@s.whatsapp.net' }); ok(sent[0]?.m.video && /tickles everyone/.test(sent[0].m.caption), 'reaction gif');
    await run('bard'); ok(/Usage|bard/.test(out[0]), 'bard usage');
    global.fetch = realFetch;

    // menus
    await run('groupmenu'); ok(sent.length || out.length, 'category menu answers');
    ok(W12.PROBES.length >= 10 && W12.PROBES.every(p => /^https?:/.test(p[1])), 'probes are valid urls');

    console.log(fail ? `WK12 TESTS FAILED: ${fail}` : 'WK12 TESTS PASS'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
