'use strict';
// Tiny parent process. It keeps the bot alive: restarts it after an update (exit code 42) or a crash,
// and rolls a bad update back if the new version dies right after starting.
const path = require('path');
const { spawn } = require('child_process');
const updater = require('./updater');

const HEALTHY_MS = 90 * 1000;

function run() {
    let child = null, stopping = false, crashes = 0, startedAt = 0, healthy = null;

    function start() {
        startedAt = Date.now();
        child = spawn(process.execPath, [path.join(__dirname, 'bot.js'), ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, WK_CHILD: '1' } });
        healthy = setTimeout(() => { if (updater.hasPending()) { console.log('[SUPERVISOR] new version is stable, keeping it'); updater.commit(); } }, HEALTHY_MS);
        child.on('error', (e) => console.error('[SUPERVISOR] could not start the bot:', e.message));
        child.on('exit', (code, signal) => {
            clearTimeout(healthy);
            if (stopping) return process.exit(code || 0);
            const up = Date.now() - startedAt;
            if (code === updater.RESTART_CODE) { console.log('[SUPERVISOR] restarting with the new version'); crashes = 0; return setTimeout(start, 300); }
            if (code === 0 && !signal) return process.exit(0);
            crashes = up > 60000 ? 1 : crashes + 1;
            if (updater.hasPending() && up < HEALTHY_MS) { console.error('[SUPERVISOR] new version crashed right after the update, going back to the old one'); try { updater.rollback(); } catch (e) { console.error(e.message); } crashes = 0; return setTimeout(start, 1000); }
            const wait = Math.min(30000, 2000 * crashes);
            console.error('[SUPERVISOR] bot exited (' + (signal || code) + '), restarting in ' + wait / 1000 + 's');
            setTimeout(start, wait);
        });
    }

    for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => {
        stopping = true;
        if (!child) return process.exit(0);
        try { child.kill(sig); } catch {}
        setTimeout(() => process.exit(0), 5000).unref();
    });

    start();
}

module.exports = { run };
