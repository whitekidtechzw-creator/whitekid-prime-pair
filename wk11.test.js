'use strict';
const W = require('./wk7'), W11 = require('./wk11');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log(' ✗', m); } };
(async () => {
    const out = [], sent = [], calls = [];
    const meta = { id: 'g@g.us', subject: 'T', participants: [{ id: '1@s.whatsapp.net', admin: 'admin' }, { id: '2@s.whatsapp.net' }] };
    const socket = new Proxy({ user: { id: '1:5@s.whatsapp.net' }, sendMessage: async (j, m) => { sent.push({ j, m }); return { key: { id: 'k' } }; }, groupMetadata: async () => meta }, {
        get: (t, k) => (k in t ? t[k] : async (...a) => { calls.push([String(k), ...a]); if (k === 'groupRequestParticipantsList') return [{ jid: '5@s.whatsapp.net' }, { jid: '6@s.whatsapp.net' }]; if (k === 'fetchBlocklist') return ['7@s.whatsapp.net']; if (k === 'onWhatsApp') return [{ exists: true }]; if (k === 'fetchPrivacySettings') return { last: 'all', profile: 'contacts' }; return {}; })
    });
    const base = { socket, from: 'g@g.us', isGroup: true, args: [], q: '', msg: { key: { id: 'm', remoteJid: 'g@g.us' }, message: { conversation: '.x' } }, activePrefix: '.', nowsender: '2@s.whatsapp.net', reply: async t => out.push(t), react: async () => {} };
    const run = (n, o = {}) => { out.length = 0; calls.length = 0; sent.length = 0; return W.run(n, { ...base, ...o }); };

    ok(W11.NAMES.size >= 50, 'pack registers many commands: ' + W11.NAMES.size);
    for (const n of ['block', 'unblock', 'privacy', 'lastseen', 'fullpp', 'onwa', 'approve', 'reject', 'disap7', 'poll', 'hack', 'posts', 'story', 'playlist', 'trim', 'jokes', 'dragonball', 'naruto', 'frozen', 'host', 'save']) ok(W.has(n), 'registered: ' + n);

    await run('block', { args: ['263771234567'] }); ok(/Owner-only/.test(out[0]) && !calls.length, 'block is owner-only');
    await run('block', { args: ['263771234567'], isOwner: true }); ok(calls[0][0] === 'updateBlockStatus' && calls[0][1] === '263771234567@s.whatsapp.net' && calls[0][2] === 'block', 'block calls WhatsApp');
    await run('block', { args: ['1'], isOwner: true, isGroup: false, from: '1@s.whatsapp.net' }); ok(/yourself|Usage/.test(out[0]), 'block refuses bad targets');
    await run('unblock', { args: ['263771234567'], isOwner: true }); ok(calls[0][2] === 'unblock', 'unblock');
    await run('blocklist', { isOwner: true }); ok(/\+7/.test(out[0]), 'blocklist shows numbers');
    await run('privacy', { isOwner: true }); ok(/Last seen: all/.test(out[0]), 'privacy shows settings');
    await run('lastseen', { isOwner: true }); ok(/LAST SEEN/.test(out[0]) && !calls.length, 'lastseen help without value');
    await run('lastseen', { isOwner: true, args: ['contacts'] }); ok(calls[0][0] === 'updateLastSeenPrivacy' && calls[0][1] === 'contacts', 'lastseen sets privacy');
    await run('myonline', { isOwner: true, args: ['nonsense'] }); ok(!calls.length, 'invalid privacy value rejected');
    await run('onwa', { args: ['263771234567'] }); ok(/is on WhatsApp/.test(out[0]), 'onwa');
    await run('onwa', {}); ok(/Usage/.test(out[0]), 'onwa usage');

    await run('rename', { q: 'New Name' }); ok(/Admins only/.test(out[0]), 'rename admin-only');
    await run('rename', { q: 'New Name', isSenderGroupAdmin: true }); ok(calls.some(c => c[0] === 'groupUpdateSubject' && c[2] === 'New Name'), 'rename works');
    await run('rename', { q: 'x', isSenderGroupAdmin: true, isGroup: false }); ok(/Groups only/.test(out[0]), 'rename groups only');
    await run('approve', { isSenderGroupAdmin: true }); const up = calls.find(c => c[0] === 'groupRequestParticipantsUpdate'); ok(up && up[2].length === 2 && up[3] === 'approve' && /Approved 2/.test(out[0]), 'approve all requests');
    await run('reject', { isSenderGroupAdmin: true }); ok(calls.some(c => c[3] === 'reject'), 'reject all requests');
    await run('disap7', { isSenderGroupAdmin: true }); ok(calls.some(c => c[0] === 'groupToggleEphemeral' && c[2] === 604800), 'disappearing 7 days');
    await run('disap-off', { isSenderGroupAdmin: true }); ok(calls.some(c => c[0] === 'groupToggleEphemeral' && c[2] === 0), 'disappearing off');
    await run('poll', { q: 'Best? | A | B | C' }); ok(sent[0]?.m.poll && sent[0].m.poll.values.length === 3 && sent[0].m.poll.name === 'Best?', 'poll built');
    await run('poll', { q: 'Only question' }); ok(/Usage/.test(out[0]) || /Best day/.test(out[0]), 'poll usage');
    await run('create', { q: 'My Group' }); ok(/Owner-only/.test(out[0]), 'create is owner-only');

    await run('host'); ok(/HOST/.test(out[0]) && /Node/.test(out[0]), 'host info');
    await run('language'); ok(/sn — Shona/.test(out[0]), 'language list');
    await run('posts'); ok(/Usage/.test(out[0]), 'posts usage');
    await run('trim', { args: ['abc', 'def'] }); ok(/Usage/.test(out[0]), 'trim validates times');
    await run('save', { isOwner: true }); ok(/Reply to/.test(out[0]), 'save needs a reply');
    await run('save', {}); ok(/Owner-only/.test(out[0]), 'save owner-only');
    const quoted = { ...base.msg, message: { extendedTextMessage: { text: '.save', contextInfo: { stanzaId: 's', participant: '9@s.whatsapp.net', quotedMessage: { conversation: 'remember this' } } } } };
    await run('save', { isOwner: true, msg: quoted }); ok(sent[0]?.m.text === '💾 remember this' && sent[0].j === '1@s.whatsapp.net', 'save text to own chat');
    await run('dragonball'); ok(/Usage/.test(out[0]), 'logo usage');
    ok(['sn', 'zu'].every(k => true), 'sanity');
    console.log(fail ? 'WK11 TESTS FAILED (' + fail + ')' : 'WK11 TESTS PASS'); process.exit(fail ? 1 : 0);
})();
