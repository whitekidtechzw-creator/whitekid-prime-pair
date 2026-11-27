'use strict';
// Self-updater: pulls the newest code from GitHub into this folder WITHOUT touching sessions, data or .env,
// then asks the supervisor (supervisor.js) to restart the process. Linked numbers reconnect from disk, so nobody has to pair again.
// Uses only Node built-ins so the supervisor can load it too.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const http = require('http');
const https = require('https');
const { spawnSync } = require('child_process');

const RESTART_CODE = 42;
const EXCLUDE = ['data/', 'node_modules/', '.git/', 'session/', 'sessions/', 'tmp/', 'temp/', '.update-', '.env', '.DS_Store'];
const MAX_DOWNLOAD = 150 * 1024 * 1024;

const str = (b, s, l) => { const x = b.subarray(s, s + l); const z = x.indexOf(0); return x.subarray(0, z < 0 ? x.length : z).toString('utf8'); };

function parsePax(data) {
    const out = {}; let i = 0;
    while (i < data.length) {
        const sp = data.indexOf(32, i); if (sp < 0) break;
        const len = parseInt(data.subarray(i, sp).toString(), 10); if (!len) break;
        const rec = data.subarray(sp + 1, i + len - 1).toString('utf8'), eq = rec.indexOf('=');
        if (eq > 0) out[rec.slice(0, eq)] = rec.slice(eq + 1);
        i += len;
    }
    return out;
}

// Minimal tar reader (ustar + pax + GNU long names). Regular files only.
function parseTar(buf) {
    const files = []; let off = 0, pax = {}, longName = null;
    while (off + 512 <= buf.length) {
        const h = buf.subarray(off, off + 512);
        if (h.every(b => b === 0)) break;
        let name = str(h, 0, 100);
        const mode = parseInt(str(h, 100, 8).trim() || '644', 8) || 0o644, size = parseInt(str(h, 124, 12).trim() || '0', 8) || 0;
        const type = h[156] ? String.fromCharCode(h[156]) : '0', prefix = str(h, 345, 155), ustar = str(h, 257, 5) === 'ustar';
        off += 512;
        const data = buf.subarray(off, off + size);
        off += Math.ceil(size / 512) * 512;
        if (type === 'x') { pax = parsePax(data); continue; }
        if (type === 'g') continue;
        if (type === 'L') { longName = data.toString('utf8').replace(/\0+$/, ''); continue; }
        if (ustar && prefix) name = prefix + '/' + name;
        if (pax.path) name = pax.path;
        if (longName) name = longName;
        pax = {}; longName = null;
        if (type === '0') files.push({ name, mode, data: Buffer.from(data) });
    }
    return files;
}

// 'owner/name' or any github.com URL -> 'owner/name'
function parseRepo(s) {
    s = String(s || '').trim().replace(/\.git$/, '').replace(/\/+$/, '');
    const m = s.match(/github\.com[/:]([^/\s]+)\/([^/\s]+)/i) || s.match(/^([\w.-]+)\/([\w.-]+)$/);
    return m ? m[1] + '/' + m[2] : '';
}

// Strip the "<repo>-<sha>/" folder GitHub adds, drop unsafe and protected paths.
function cleanPath(name) {
    const rel = String(name).split('/').slice(1).join('/');
    if (!rel || rel.includes('\0') || path.isAbsolute(rel) || rel.split('/').some(p => p === '..' || p === '')) return null;
    if (EXCLUDE.some(e => (e.endsWith('/') || e.startsWith('.update-') ? rel.startsWith(e) : rel === e))) return null;
    return rel;
}

function httpGet(url, headers = {}, redirects = 5, timeout = 60000) {
    return new Promise((resolve, reject) => {
        const u = new URL(url), lib = u.protocol === 'http:' ? http : https;
        const req = lib.get(u, { headers: { 'user-agent': 'whitekid-prime-updater', ...headers }, timeout }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.resume();
                if (!redirects) return reject(new Error('too many redirects'));
                const next = new URL(res.headers.location, u), h = { ...headers };
                if (next.host !== u.host) delete h.Authorization;
                return resolve(httpGet(next.href, h, redirects - 1, timeout));
            }
            const chunks = []; let total = 0;
            res.on('data', (c) => { total += c.length; if (total > MAX_DOWNLOAD) return req.destroy(new Error('download too large')); chunks.push(c); });
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
            res.on('error', reject);
        });
        req.on('timeout', () => req.destroy(new Error('timeout')));
        req.on('error', reject);
    });
}

function createUpdater(opts = {}) {
    const root = opts.root || __dirname;
    const env = opts.env || process.env;
    const repo = parseRepo(opts.repo || env.UPDATE_REPO || env.BOT_REPO_URL);
    const branch = opts.branch || env.UPDATE_BRANCH || 'main';
    const api = String(opts.api || env.GITHUB_API || 'https://api.github.com').replace(/\/+$/, '');
    const token = opts.token !== undefined ? opts.token : (env.GITHUB_TOKEN || '');
    const enabled = !!repo && String(opts.enabled !== undefined ? opts.enabled : (env.AUTO_UPDATE === undefined ? 'true' : env.AUTO_UPDATE)).toLowerCase() !== 'false';
    const intervalMs = Math.max(1, Number(opts.intervalMin || env.UPDATE_INTERVAL_MIN) || 5) * 60 * 1000;
    const npmInstall = opts.npmInstall || (() => spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], { cwd: root, stdio: 'inherit', timeout: 10 * 60 * 1000 }).status === 0);
    const log = opts.log || ((...a) => console.log('[UPDATE]', ...a));

    const P = (n) => path.join(root, n);
    const STATE = P('.update-state.json'), PENDING = P('.update-pending.json'), BACKUP = P('.update-backup'), STAGING = P('.update-staging');
    const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
    const writeJson = (p, v) => { try { fs.writeFileSync(p, JSON.stringify(v, null, 2)); } catch {} };
    const authHeaders = () => (token ? { Authorization: 'Bearer ' + token } : {});
    let busy = false, hooks = { beforeRestart: null }, timer = null;

    function writeAtomic(dest, data, mode) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const tmp = dest + '.wk-tmp';
        fs.writeFileSync(tmp, data, { mode: mode || 0o644 });
        fs.renameSync(tmp, dest);
    }

    function syntaxOk(file) {
        if (!file.endsWith('.js')) return true;
        const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
        if (r.status !== 0) log('syntax error in ' + path.basename(file) + ': ' + String(r.stderr || '').split('\n').slice(0, 3).join(' '));
        return r.status === 0;
    }

    function rollback() {
        const m = readJson(path.join(BACKUP, 'manifest.json'), null);
        if (!m) { fs.rmSync(PENDING, { force: true }); return false; }
        for (const rel of m.files || []) { try { writeAtomic(P(rel), fs.readFileSync(path.join(BACKUP, 'files', rel))); } catch (e) { log('rollback failed for ' + rel + ': ' + e.message); } }
        for (const rel of m.created || []) fs.rmSync(P(rel), { force: true });
        const st = readJson(STATE, {}); writeJson(STATE, { ...st, sha: m.previousSha || '', failedSha: m.sha || st.failedSha });
        fs.rmSync(BACKUP, { recursive: true, force: true }); fs.rmSync(PENDING, { force: true });
        log('rolled back to the previous version');
        return true;
    }

    // Called by the supervisor once the new version stayed up long enough.
    function commit() { fs.rmSync(BACKUP, { recursive: true, force: true }); fs.rmSync(PENDING, { force: true }); }

    const hasPending = () => fs.existsSync(PENDING);

    async function remoteSha() {
        const r = await httpGet(`${api}/repos/${repo}/commits/${encodeURIComponent(branch)}`, { Accept: 'application/vnd.github.sha', ...authHeaders() });
        if (r.status !== 200) throw new Error('GitHub answered ' + r.status + (r.status === 404 ? ' (wrong UPDATE_REPO/UPDATE_BRANCH, or private repo without GITHUB_TOKEN)' : ''));
        const sha = r.body.toString().trim();
        if (!/^[0-9a-f]{7,64}$/i.test(sha)) throw new Error('unexpected reply from GitHub');
        return sha;
    }

    // Returns { status: 'disabled' | 'current' | 'failed' | 'updated', ... }. Never throws.
    async function check({ force = false } = {}) {
        if (!enabled) return { status: 'disabled' };
        if (busy) return { status: 'busy' };
        busy = true;
        try {
            const state = readJson(STATE, {});
            const sha = await remoteSha();
            if (!force && state.sha === sha) { writeJson(STATE, { ...state, checkedAt: Date.now() }); return { status: 'current', sha }; }
            if (!force && state.failedSha === sha) return { status: 'failed', sha, error: 'this commit was already rejected' };

            const tar = await httpGet(`${api}/repos/${repo}/tarball/${sha}`, authHeaders(), 5, 120000);
            if (tar.status !== 200) throw new Error('download failed (' + tar.status + ')');
            const entries = parseTar(zlib.gunzipSync(tar.body));
            const incoming = [];
            for (const e of entries) { const rel = cleanPath(e.name); if (rel) incoming.push({ rel, data: e.data, mode: e.mode & 0o777 }); }
            if (!incoming.some(f => f.rel === 'package.json') || !incoming.some(f => f.rel === 'index.js')) throw new Error('downloaded archive does not look like the bot (no package.json/index.js)');

            const changed = incoming.filter(f => { try { return !fs.readFileSync(P(f.rel)).equals(f.data); } catch { return true; } });
            if (!changed.length) { writeJson(STATE, { sha, checkedAt: Date.now() }); return { status: 'current', sha }; }

            // 1) stage + syntax check everything before touching the live files
            fs.rmSync(STAGING, { recursive: true, force: true });
            for (const f of changed) writeAtomic(path.join(STAGING, f.rel), f.data, f.mode);
            const bad = changed.find(f => !syntaxOk(path.join(STAGING, f.rel)));
            fs.rmSync(STAGING, { recursive: true, force: true });
            if (bad) { writeJson(STATE, { ...state, failedSha: sha, checkedAt: Date.now() }); return { status: 'failed', sha, error: 'syntax error in ' + bad.rel + ', update skipped' }; }

            // 2) back up what we overwrite, then copy the new files in
            fs.rmSync(BACKUP, { recursive: true, force: true });
            const manifest = { sha, previousSha: state.sha || '', files: [], created: [] };
            for (const f of changed) {
                if (fs.existsSync(P(f.rel))) { writeAtomic(path.join(BACKUP, 'files', f.rel), fs.readFileSync(P(f.rel))); manifest.files.push(f.rel); }
                else manifest.created.push(f.rel);
            }
            writeJson(path.join(BACKUP, 'manifest.json'), manifest);
            let depsChanged = false;
            try {
                const oldDeps = JSON.stringify(readJson(P('package.json'), {}).dependencies || {});
                const pkg = changed.find(f => f.rel === 'package.json');
                depsChanged = !!pkg && JSON.stringify(JSON.parse(pkg.data.toString()).dependencies || {}) !== oldDeps;
            } catch { depsChanged = false; }
            for (const f of changed) writeAtomic(P(f.rel), f.data, f.mode);

            // 3) new dependencies? install them while the old process is still running
            if (depsChanged) {
                log('dependencies changed, running npm install');
                let ok = false; try { ok = npmInstall(); } catch { ok = false; }
                if (!ok) { rollback(); writeJson(STATE, { ...state, failedSha: sha, checkedAt: Date.now() }); return { status: 'failed', sha, error: 'npm install failed, update rolled back' }; }
            }

            writeJson(PENDING, { sha, at: Date.now() });
            writeJson(STATE, { sha, previousSha: state.sha || '', checkedAt: Date.now(), updatedAt: Date.now() });
            log('updated to ' + sha.slice(0, 7) + ' (' + changed.length + ' file(s) changed)');
            return { status: 'updated', sha, files: changed.length, depsChanged };
        } catch (err) {
            return { status: 'failed', error: err.message };
        } finally { busy = false; }
    }

    // check + restart when something changed. Used by the timer and by the .update command.
    async function run({ force = false, delayMs = 2500 } = {}) {
        const r = await check({ force });
        if (r.status === 'updated') {
            log('restarting to load the new version (linked numbers stay linked)');
            setTimeout(async () => { try { if (hooks.beforeRestart) await hooks.beforeRestart(); } catch {} restart(); }, delayMs);
        } else if (r.status === 'failed') log('check failed: ' + r.error);
        return r;
    }

    function restart() {
        if (process.env.WK_CHILD || process.env.pm_id) return process.exit(RESTART_CODE);
        log('update installed. Restart the bot to load it (it is not running under the supervisor or pm2).');
    }

    function start(h = {}) {
        hooks = { ...hooks, ...h };
        if (!enabled) { log('auto-update is off (set UPDATE_REPO=owner/name to turn it on)'); return false; }
        log('watching ' + repo + '@' + branch + ' every ' + Math.round(intervalMs / 60000) + ' min');
        const first = setTimeout(() => { run().catch(() => {}); }, 20000);
        timer = setInterval(() => { run().catch(() => {}); }, intervalMs);
        for (const t of [first, timer]) if (t.unref) t.unref();
        return true;
    }

    function stop() { if (timer) clearInterval(timer); timer = null; }

    const status = () => ({ enabled, repo, branch, intervalMin: Math.round(intervalMs / 60000), ...readJson(STATE, {}) });

    return { check, run, start, stop, status, rollback, commit, hasPending, restart };
}

const defaultUpdater = createUpdater();

module.exports = { ...defaultUpdater, createUpdater, parseTar, parseRepo, cleanPath, RESTART_CODE };
