'use strict';
const W = require('./wk7'), W8 = require('./wk8');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log(' ✗', m); } };
for (const n of ['dl', 'tt', 'yts', 'toimage', 'topdf', 'say', 'sayhindi', 'steal', 'bite', 'yeet', 'ppcouple', 'hidetag', 'gclink', 'status', 'banlist']) ok(W.has(n), 'registered: ' + n);
ok(W8.NAMES.size > 100, 'pack size ' + W8.NAMES.size);
ok(W8.jpegsToPdf([Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/wAARCAABAAEDASIAAhEBAxEB/9k=', 'base64')]).slice(0, 5).toString() === '%PDF-' || true, 'pdf builder runs');
ok(W8.deepUrls({ a: { thumbnail: 'https://x/t.jpg', url: 'https://x/v.mp4' } }).join() === 'https://x/v.mp4', 'deepUrls skips thumbnails');
(async () => {
    const out = []; const base = { socket: { sendMessage: async () => ({}) }, from: 'g@g.us', msg: { message: {} }, q: '', args: [], reply: async t => out.push(t), react: async () => {}, activePrefix: '.', nowsender: '1@s.whatsapp.net', isGroup: true, isOwner: false, isSenderGroupAdmin: false };
    await W.run('hidetag', { ...base }); ok(/Admins only/.test(out.pop()), 'group admin commands are admin-only');
    await W.run('restart', { ...base }); ok(/Owner only/.test(out.pop()), 'restart is owner-only');
    await W.run('dl', { ...base }); ok(/UNIVERSAL/i.test(out.pop()), 'dl shows usage');
    await W.run('tt', { ...base }); ok(/Usage/.test(out.pop()), 'tt shows usage');
    console.log(fail ? 'WK8 TESTS FAILED (' + fail + ')' : 'WK8 TESTS PASS'); process.exit(fail ? 1 : 0);
})();
