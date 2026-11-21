'use strict';
const { app } = require('./server');
const { AI_FULL_NAME, AI_SHORT_NAME, DEVELOPER_NUMBER, PORT, config } = require('./config');
const { axios, chalk } = require('./deps');
const { getCustomPrefix, isPublicMode } = require('./store');
const { restoreAll, shutdown, startWatchdog } = require('./manager');
const wa = require('./wa');
const keepAlive = require('./keepalive');
const { restoreTelegramSessions, start } = require('./telegram');

process.on('uncaughtException', (err) => console.error('🔴 UncaughtException:', err));

process.on('unhandledRejection', (reason) => console.error('🔴 UnhandledRejection:', reason));

let server = null;

async function boot() {
    await wa.init(); // load the Whitekid socket (falls back to Baileys) before anything else
    server = app.listen(PORT, () => {
        console.log(chalk.bold.cyan('\n🤖 ' + AI_SHORT_NAME + ' v' + config.VERSION + ' — ' + AI_FULL_NAME + ' by WhiteKid Tech'));
        console.log(chalk.red('🔐 Developer Override:'), chalk.bold.red(DEVELOPER_NUMBER));
        console.log(chalk.yellow('🌐 Public Mode:'), isPublicMode() ? 'ON' : 'OFF', chalk.yellow('| 🔧 Prefix:'), getCustomPrefix());
        console.log('🚀 Server on port ' + PORT + '  → http://localhost:' + PORT + '/');
        restoreAll().catch((err) => console.error('Restore failed:', err));
        startWatchdog();
        keepAlive.start();
        try { start(); restoreTelegramSessions(); } catch (err) { console.error('Telegram start failed:', err.message); }
    });
}

boot().catch((err) => { console.error('Startup failed:', err); process.exit(1); });

function stop(signal) {
    console.log(signal + ' received, shutting down (sessions are kept on disk)');
    shutdown();
    if (server) server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGINT', () => stop('SIGINT'));

process.on('SIGTERM', () => stop('SIGTERM'));
