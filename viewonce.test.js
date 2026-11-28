'use strict';
const S = require('./services'), W = require('./wk7');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log(' ✗', m); } };
(async () => {
    const sent = []; const sock = { user: { id: '9:1@s.whatsapp.net' }, sendMessage: async (j, m, o) => { sent.push({ j, m }); } };
    S.voApi.download = async (obj, kind) => obj.broken ? Buffer.alloc(0) : Buffer.from(kind + ':' + (obj.tag || ''));
    const reply = (quoted, extra = {}) => ({ key: { id: 'cmd' }, message: { extendedTextMessage: { text: '.vv', contextInfo: { quotedMessage: quoted, ...extra } } } });
    const run = async (m, to) => { sent.length = 0; const r = await S.viewonceCommand(sock, 'chat@g.us', m, null, to); return r; };

    // every wrapper WhatsApp uses
    const img = { imageMessage: { tag: 'a', caption: 'hi' } };
    ok(await run(reply({ viewOnceMessageV2: { message: img } })) && sent[0].m.image && sent[0].m.caption === 'hi', 'V2 wrapper image');
    ok(await run(reply({ viewOnceMessage: { message: { videoMessage: { tag: 'v' } } } })) && sent[0].m.video, 'V1 wrapper video');
    ok(await run(reply({ viewOnceMessageV2Extension: { message: { audioMessage: { ptt: true, tag: 'p' } } } })) && sent[0].m.audio && sent[0].m.ptt === true, 'V2Extension voice note');
    ok(await run(reply({ imageMessage: { viewOnce: true, tag: 'f' } })) && sent[0].m.image, 'plain media with viewOnce flag');
    ok(await run(reply({ ephemeralMessage: { message: { viewOnceMessageV2: { message: img } } } })) && sent[0].m.image, 'ephemeral + view-once');
    // not view-once → helpful message, nothing revealed
    ok(await run(reply({ imageMessage: { tag: 'normal' } })) === false && /Reply to a view-once/.test(sent[0].m.text), 'normal image is not revealed');
    ok(await run({ key: { id: 'z' }, message: { conversation: '.vv' } }) === false, 'no reply → usage message');
    // cache fallback when the quote lost the media
    S.rememberViewOnce({ key: { id: 'orig1' }, message: { viewOnceMessageV2: { message: { imageMessage: { tag: 'cached' } } } } });
    ok(await run(reply({ conversation: 'stub' }, { stanzaId: 'orig1' })) && sent[0].m.image, 'cache used when quote is stripped');
    // broken download → clear error, no crash
    ok(await run(reply({ viewOnceMessageV2: { message: { imageMessage: { broken: true } } } })) === false && /Could not open/.test(sent[0].m.text), 'failed download reports an error');
    // vv2 sends to the owner's own chat
    ok(await run(reply({ viewOnceMessageV2: { message: img } }), '9@s.whatsapp.net') && sent[0].j === '9@s.whatsapp.net', 'destination override');
    // the commands exist
    for (const n of ['vv2', 'vvdm', 'vvowner']) ok(W.has(n), 'registered: ' + n);
    const out = []; await W.run('vv2', { socket: sock, from: 'c@g.us', msg: reply({ viewOnceMessageV2: { message: img } }), args: [], q: '', reply: async t => out.push(t), react: async () => {}, activePrefix: '.', nowsender: '1@s.whatsapp.net' });
    ok(/Owner-only/.test(out.pop()), 'vv2 is owner-only');

    // ── 9.5: eager download, so .vv still works after the receiver opened the view-once ──
    {
        const calls = []; const orig = S.voApi.download;
        S.voApi.download = async (obj, kind) => { calls.push(obj.tag); return Buffer.from('early:' + obj.tag); };
        S.rememberViewOnce({ key: { id: 'early1' }, message: { viewOnceMessageV2: { message: { imageMessage: { tag: 'e1' } } } } });
        await new Promise(r => setTimeout(r, 20));
        ok(calls.length === 1 && calls[0] === 'e1', 'media downloaded as soon as the view-once arrives');
        S.voApi.download = async () => { throw new Error('gone from WhatsApp servers'); };
        sent.length = 0;
        const r1 = await S.viewonceCommand(sock, 'chat@g.us', reply({ conversation: 'stub' }, { stanzaId: 'early1' }), null);
        ok(r1 === true && sent[0].m.image && String(sent[0].m.image) === 'early:e1', '.vv uses the saved copy even when the download now fails');
        S.voApi.download = orig;
    }
    // ── quoted message + media helpers (savestatus, promote, demote, warn rely on msg.quoted) ──
    {
        const m = { key: { id: 'c1' }, message: { extendedTextMessage: { text: '.savestatus', contextInfo: { stanzaId: 'st1', participant: '2637111@s.whatsapp.net', quotedMessage: { videoMessage: { mimetype: 'video/mp4' } } } } } };
        const q = S.buildQuoted(m, 'chat@g.us');
        ok(q && q.key.participant === '2637111@s.whatsapp.net' && q.key.id === 'st1' && q.message.videoMessage, 'buildQuoted gives key.participant and message');
        ok(S.buildQuoted({ message: { conversation: 'x' } }, 'c') === null, 'no reply -> no quoted');
        ok(S.buildQuoted({ message: { imageMessage: { caption: '.x', contextInfo: { stanzaId: 'i', quotedMessage: { conversation: 'hi' } } } } }, 'c@g.us') !== null, 'quoted found on an image reply too');
        ok(S.findMedia({ ephemeralMessage: { message: { imageMessage: { a: 1 } } } }).kind === 'image', 'findMedia unwraps ephemeral');
        ok(S.findMedia({ conversation: 'hi' }) === null && S.findText({ extendedTextMessage: { text: 'status words' } }) === 'status words', 'text-only status detected');
    }
    console.log(fail ? 'VIEWONCE TESTS FAILED (' + fail + ')' : 'VIEWONCE TESTS PASS'); process.exit(fail ? 1 : 0);
})();
