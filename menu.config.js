/*
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   MENU SETTINGS — edit this file to change how .menu looks   ║
 * ╚══════════════════════════════════════════════════════════════╝
 * Save the file and send .menu again. No restart needed.
 * If you make a typo the bot keeps working and uses the last good settings (check the console).
 * Delete a line to go back to its default.
 *
 * Words you can put inside texts:   {user} {owner} {date} {node} {uptime} {prefix} {mode} {ram} {total} {version}
 * Text between double stars becomes the bot's bold font:   **like this**
 */
module.exports = {

    // ── names and texts ───────────────────────────────────────────
    brand: 'WHITEKID PRIME',                              // title on the menu picture
    thumbBody: '{total} commands · {prefix}menu <category>', // small line under it
    footer: '⌬ **Whitekid Prime**',                       // last line of the menu

    // ── the stats card at the top ─────────────────────────────────
    header: {
        show: true,                                       // false = no stats card, only the sections
        title: 'Whitekid Prime',
        rows: [                                           // [label, value] — add, remove or reorder rows
            ['👤 User', '{user}'],
            ['👑 Owner', '{owner}'],
            ['⚡ Engine', 'Baileys multi-device'],
            ['📅 Date', '{date}'],
            ['🧬 Type', 'Node.js {node}'],
            ['⏱️ Uptime', '{uptime}'],
            ['🔑 Prefix', '{prefix}'],
            ['🌐 Mode', '{mode}'],
            ['💾 RAM', '{ram}'],
            ['📦 Commands', '{total}'],
            ['🟢 Status', 'Online'],
            ['🏷️ Version', '{version}']
        ],
        tip: '✦ **Browse**: {prefix}menu <category>   e.g. {prefix}menu ai'
    },

    // ── how each section is drawn ─────────────────────────────────
    // {icon} {name} {prefix} {cmd} are filled in for you
    look: {
        top: '╭─❮ {icon} {name} ❯─────',
        line: '│ ◦ {prefix}{cmd}',
        bottom: '╰──────────●'
    },

    // ── sections ──────────────────────────────────────────────────
    sectionOrder: [],                                     // e.g. ['DOWNLOADS', 'AI CHAT', 'GAMES'] → these come first, the rest follow
    hideSections: [],                                     // e.g. ['TEMP MAIL'] → not shown in the menu (commands still work)
    renameSections: {},                                   // e.g. { 'GENERAL': 'MAIN MENU', 'GROUP ADMIN': 'GROUPS' }
    icons: {},                                            // e.g. { 'GAMES': '🕹️' }  (use the section's current name)

    // ── single commands ───────────────────────────────────────────
    hideCommands: [],                                     // e.g. ['hack', 'insult'] → not listed (still work if typed)
    moveCommands: {},                                     // e.g. { sora: 'FUN', vv: 'TOOLS' } → show a command in another section

    // ── your own sections ─────────────────────────────────────────
    addSections: [
        // { name: 'MY FAVOURITES', icon: '⭐', commands: ['play', 'sticker', 'vv', 'veo'] },
    ]
};
