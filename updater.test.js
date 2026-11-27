'use strict';
// Offline test: a local fake GitHub serves a tarball; we check the update keeps data/.env, rejects bad code, and rolls back.
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path');
const { execSync } = require('child_process');
const U = require('./updater');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wkupd-'));
const app = path.join(tmp, 'app'), repoDir = path.join(tmp, 'whitekid-prime-abc123');
const w = (base, rel, txt) => { fs.mkdirSync(path.dirname(path.join(base, rel)), { recursive: true }); fs.writeFileSync(path.join(base, rel), txt); };

ok(U.parseRepo('https://github.com/me/bot.git') === 'me/bot' && U.parseRepo('me/bot') === 'me/bot' && U.parseRepo('') === '', 'parseRepo');
ok(U.cleanPath('x-1/commands.js') === 'commands.js' && U.cleanPath('x-1/data/a.json') === null && U.cleanPath('x-1/.env') === null && U.cleanPath('x-1/../evil.js') === null && U.cleanPath('x-1/node_modules/a/b.js') === null && U.cleanPath('x-1/sub/ok.js') === 'sub/ok.js', 'cleanPath');

// live bot folder (old version) with a session that must survive
w(app, 'package.json', JSON.stringify({ name: 'b', dependencies: { a: '1' } })); w(app, 'index.js', 'module.exports=1;'); w(app, 'commands.js', 'module.exports="old";');
w(app, '.env', 'SECRET=1'); w(app, 'data/session/session_263/creds.json', '{"registered":true}');

let sha = 'a'.repeat(40), served = 0, tarFile = null;
const server = http.createServer((req, res) => {
    if (req.url.startsWith('/repos/me/bot/commits/')) { res.end(sha); }
    else if (req.url.startsWith('/repos/me/bot/tarball/')) { served++; res.writeHead(302, { location: '/dl/code.tgz' }); res.end(); }
    else if (req.url === '/dl/code.tgz') { res.end(fs.readFileSync(tarFile)); }
    else { res.writeHead(404); res.end(); }
});

function publish(files, n) {
    fs.rmSync(repoDir, { recursive: true, force: true });
    for (const [k, v] of Object.entries(files)) w(repoDir, k, v);
    tarFile = path.join(tmp, 'c' + n + '.tgz');
    execSync(`tar -czf ${tarFile} -C ${tmp} whitekid-prime-abc123`);
}

server.listen(0, async () => {
    const api = 'http://127.0.0.1:' + server.address().port;
    let npmRuns = 0;
    const u = U.createUpdater({ root: app, repo: 'me/bot', api, env: {}, log: () => {}, npmInstall: () => { npmRuns++; return true; } });
    try {
        const long = 'deep/' + 'folder/'.repeat(20) + 'file.js';
        publish({ 'package.json': JSON.stringify({ name: 'b', dependencies: { a: '1', c: '2' } }), 'index.js': 'module.exports=1;', 'commands.js': 'module.exports="new";', 'data/session/x.json': 'EVIL', '.env': 'SECRET=hacked', [long]: 'module.exports=2;', 'newfile.js': 'module.exports=3;' }, 1);
        let r = await u.check();
        ok(r.status === 'updated' && r.sha === sha, 'first update applied ' + JSON.stringify(r));
        ok(fs.readFileSync(path.join(app, 'commands.js'), 'utf8') === 'module.exports="new";', 'file replaced');
        ok(fs.existsSync(path.join(app, long)), 'long path (pax) extracted');
        ok(fs.readFileSync(path.join(app, '.env'), 'utf8') === 'SECRET=1', '.env untouched');
        ok(fs.readFileSync(path.join(app, 'data/session/session_263/creds.json'), 'utf8') === '{"registered":true}' && !fs.existsSync(path.join(app, 'data/session/x.json')), 'session untouched');
        ok(npmRuns === 1 && r.depsChanged, 'npm install ran for new deps');
        ok(u.hasPending(), 'pending flag set');

        r = await u.check(); ok(r.status === 'current' && served === 1, 'same commit = no download');

        u.rollback();
        ok(fs.readFileSync(path.join(app, 'commands.js'), 'utf8') === 'module.exports="old";' && !fs.existsSync(path.join(app, 'newfile.js')) && !u.hasPending(), 'rollback restores old files and removes new ones');

        sha = 'b'.repeat(40);
        publish({ 'package.json': JSON.stringify({ name: 'b', dependencies: { a: '1' } }), 'index.js': 'module.exports=1;', 'commands.js': 'this is ( not valid js' }, 2);
        r = await u.check();
        ok(r.status === 'failed' && /syntax/.test(r.error), 'bad code rejected');
        ok(fs.readFileSync(path.join(app, 'commands.js'), 'utf8') === 'module.exports="old";', 'live files untouched after bad push');
        r = await u.check(); ok(r.status === 'failed' && served === 2, 'bad commit is not retried');

        sha = 'c'.repeat(40);
        publish({ 'package.json': JSON.stringify({ name: 'b', dependencies: { a: '1' } }), 'index.js': 'module.exports=1;', 'commands.js': 'module.exports="fixed";' }, 3);
        r = await u.check(); ok(r.status === 'updated' && npmRuns === 1, 'fixed push goes through');
        u.commit(); ok(!u.hasPending() && !fs.existsSync(path.join(app, '.update-backup')), 'commit clears backup');

        ok(U.createUpdater({ root: app, env: {}, log: () => {} }).status().enabled === false, 'off without a repo');
    } catch (e) { fails++; console.log('FAIL exception', e); }
    server.close(); fs.rmSync(tmp, { recursive: true, force: true });
    console.log(fails ? 'UPDATER FAIL' : 'UPDATER TESTS PASS'); process.exit(fails ? 1 : 0);
});
