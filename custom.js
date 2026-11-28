/*
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   YOUR OWN COMMANDS — add commands here, no coding needed    ║
 * ╚══════════════════════════════════════════════════════════════╝
 * Each command is one block. Copy a block, change it, then restart the bot.
 * (The menu itself updates live — see menu.config.js.)
 *
 *   name     what people type after the prefix            (required)
 *   aliases  other names for the same command             (optional)
 *   section  menu section it is listed in                  (optional, default 'MY COMMANDS')
 *   icon     icon if the section has to be created         (optional)
 *   reply    the answer: a text, or a list of lines
 *            you can use {user} {prefix} {bot} {date} {time} {args}
 *   run      OR a function for anything fancier: run: async c => c.reply('hi')
 *
 * A name that already exists in the bot is skipped, and the console tells you.
 * Remove the "//" at the start of the lines to switch an example on.
 */
module.exports = [

    // {
    //     name: 'rules',
    //     aliases: ['rule'],
    //     section: 'MY COMMANDS',
    //     reply: ['📜 *Group rules*', '1. Be respectful', '2. No spam', '3. No links without asking']
    // },
    // {
    //     name: 'hello',
    //     section: 'GENERAL',
    //     reply: 'Hello {user}! 👋 Send {prefix}menu to see what I can do.'
    // },
    // {
    //     name: 'echo',
    //     run: async c => c.reply(c.q ? c.q : 'Say something after the command!')
    // },

];
