'use strict';
// Launcher. Runs the bot (bot.js) under a small supervisor so it can restart itself after an auto-update
// without going offline or asking anyone to pair again. Set WK_NO_SUPERVISOR=1 to run bot.js directly.
if (process.env.WK_CHILD || process.env.WK_NO_SUPERVISOR === '1') require('./bot');
else require('./supervisor').run();
