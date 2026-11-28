# Editing Whitekid Prime — where things live

You almost never need to touch the big files. Start here.

| I want to… | Edit this | Restart? |
|---|---|---|
| Change how the **menu** looks, rename or reorder sections, hide or move commands, change the footer or the stats card | `menu.config.js` | **No** — save, then send `.menu` |
| Add my **own commands** (a text reply, or a small function) | `custom.js` | Yes |
| Change the bot name, prefix, owner, keys | `.env` (see `.env.example`) | Yes |
| Change the **pairing web page** | `main.html` | No |
| Change which commands exist in a core menu section | `menudata.js` | Yes |

## The menu in 30 seconds

Open `menu.config.js`. Every setting has an example next to it.

```js
renameSections: { 'GENERAL': 'MAIN MENU' },        // rename a section
sectionOrder:   ['DOWNLOADS', 'AI CHAT', 'GAMES'], // these come first
hideSections:   ['TEMP MAIL'],                      // hide a whole section
hideCommands:   ['hack'],                           // hide single commands (they still work)
moveCommands:   { sora: 'FUN' },                    // show a command in another section
addSections:    [{ name: 'MY FAVOURITES', icon: '⭐', commands: ['play', 'sticker', 'vv'] }],
footer:         '⌬ **My Bot**',                     // **double stars** = bold font
look: { top: '╭─❮ {icon} {name} ❯─────', line: '│ ◦ {prefix}{cmd}', bottom: '╰──────────●' },
```

- A mistake in the file never breaks the bot. It keeps the last good menu and prints the problem in the console.
- Delete any line to return to its default.
- Section names are the ones you see in the menu (`DOWNLOADS`, `GROUP ADMIN`, …). Capital letters and spaces do not matter.

## Adding a command

Open `custom.js`, copy a block, change it, restart:

```js
{ name: 'rules', section: 'MY COMMANDS', reply: ['📜 Rules', '1. Be kind', '2. No spam'] },
{ name: 'hello', reply: 'Hello {user}! Send {prefix}menu to see what I can do.' },
{ name: 'echo',  run: async c => c.reply(c.q || 'Say something!') },
```

It appears in the menu by itself. If the name is already used by the bot it is skipped and the console tells you.

Handy things inside `run: async c => …`: `c.reply(text)`, `c.react('✅')`, `c.q` (text after the command), `c.args` (words), `c.p` (prefix), `c.senderName`, `c.isOwner`, `c.isGroup`, `c.socket` (WhatsApp connection), `c.from` (chat id).

## Where the rest lives

| File | What is in it |
|---|---|
| `commands.js` | The first, hand-written commands (`menu`, `alive`, `play`, `veo`, `vv`, …). |
| `wk7*.js`, `wk8.js` … `wk12.js` | Command packs (one file per batch). Each command is one `def(...)` block. |
| `autos.js` | Automations: anti-badword, anti-tag, anti-call, anti-status, AFK, auto-bio, sudo. |
| `services.js` | Shared helpers: AI video chain, view-once, status saver, downloads. |
| `ui.js` | The bot font, reply cards, and the menu builder (reads `menu.config.js`). |
| `handler.js`, `events.js` | What happens when a message, call or status arrives. |
| `config.js` | Defaults for everything that comes from `.env`. |

After editing code, run `npm run check` (syntax) and `npm test` before you deploy.
