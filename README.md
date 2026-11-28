<div align="center">

<img src="assets/whitekid-prime.jpg" width="130" alt="Whitekid Prime" />

# WHITEKID PRIME

**A multi-device WhatsApp bot with 950+ commands, a web pairing page and an optional Telegram pairing bot.**

`v9.7.1` · Node.js 18–24 · Baileys multi-device · by **WhiteKid Tech**

</div>

---

## Contents
1. [Features](#features)
2. [Quick start](#quick-start)
3. [Configuration](#configuration)
4. [Using the bot](#using-the-bot)
5. [The menu](#the-menu)
6. [Status, view-once and AI video](#status-view-once-and-ai-video-new-in-970)
7. [Make it yours](#make-it-yours-menu-and-custom-commands-new-in-971)
8. [Group tools and automations](#group-tools-and-automations)
9. [Owner and sudo](#owner-and-sudo)
10. [Deploying](#deploying)
11. [Web pairing page and HTTP routes](#web-pairing-page-and-http-routes)
12. [Project layout](#project-layout)
13. [Tests and health checks](#tests-and-health-checks)
14. [Troubleshooting](#troubleshooting)
15. [Safety notes](#safety-notes)
16. [Credits and licence](#credits-and-licence)
17. [Changelog](#changelog)

---

## Features

| | |
|---|---|
| 📥 **Downloads** | Music and video from YouTube (`.play`, `.song`, `.video`), TikTok, Instagram, Facebook, X, Spotify, SoundCloud, MediaFire, Mega, GitHub, APKs and more, with several fallback sources. |
| 🤖 **AI** | `.ai`, ChatGPT, Claude, Gemini, Copilot, DeepSeek, Llama, Mistral, Qwen, Grok and task helpers (code, translate, summary, recipe, poem…). Every answer shows which engine produced it. |
| 🎨 **AI studio and logos** | Image generation, vision, text-to-video, 35+ text-logo styles, image effects. |
| 🧰 **Tools** | Stickers, converters, text-to-speech in 20+ languages, QR codes, OCR, background removal, screenshots, URL shorteners, translators, schedulers. |
| 🛡️ **Group management** | Add/kick/promote, tag all, antilink, welcome/goodbye, warnings, plus anti-badword, anti-tag and top members. |
| 🎮 **Games and fun** | Tic-tac-toe, trivia, hangman, blackjack, quizzes, truth or dare, text fun, jokes, memes, reactions. |
| ⚽ **Sports and search** | Live scores, standings, weather, wiki, news, crypto, movies, Bible, Quran, stalk tools. |
| 🌐 **Web pairing** | A page where anyone can link their number with a pairing code, validated and rate-limited. |
| ♻️ **Reliable** | One connection path, reconnect with backoff, sessions kept on disk, bounded caches, 10 test suites that need no network. |

---

## Quick start

```bash
npm install
cp .env.example .env      # then edit .env
npm start                 # opens on http://localhost:3000
```

Requirements
- **Node.js 18 or newer** (works up to 24).
- **ffmpeg** on the machine for audio/video commands (or set `FFMPEG_PATH`).
- A **spare WhatsApp number** (see [Safety notes](#safety-notes)).

Link a number: open the web page, enter the number with its country code, then in WhatsApp go to *Settings → Linked devices → Link a device → Link with phone number instead* and type the code. You can also send `.pair +263xxxxxxxxx` to a bot that is already running.

---

## Configuration

Everything is read from `.env` (or your host's dashboard). Copy `.env.example` as a starting point and **never commit real values**.

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `3000` | Web server port. |
| `DATA_DIR` | `./data` | Where sessions and settings live. **Point this at a persistent disk on a host**, or every redeploy logs everyone out. |
| `PREFIX` | `.` | Command prefix. Owners can change it live with `.setprefix`. |
| `DEVELOPER_NUMBER` | built-in | Always an owner. Digits only. |
| `OWNER_NUMBERS` | – | Extra owners, comma separated, digits only. |
| `ADMIN_TOKEN` | – | Protects `/reconnect` and `/connect-all` (send it as the `x-admin-token` header). Empty disables those routes. |
| `AUTO_JOIN` | `true` | Auto-join the Whitekid group and channel when a number is first paired. |
| `BOT_FONT` | `small` | `small` = ᴛɪɴʏ ꜱᴍᴀʟʟ ᴄᴀᴘꜱ on every message and in the menu, `bold` = bold labels only, `none` = off. |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | – | Any OpenAI-compatible service. **Recommended**: gives the most reliable AI answers. Without it free public endpoints are used. |
| `TG_TOKEN` | – | Turns on the Telegram pairing bot. |
| `PAXSENIX_API_KEY`, `NEWS_API_KEY`, `TMDB_API_KEY`, `OPENWEATHER_KEY`, `TENOR_API_KEY`, `KNIGHT_API_KEY` | – | Optional keys for news, movies, weather, GIFs/emojimix and the Knight download sources. A feature without its key stays off or falls back. |
| `BOT_REPO_URL` | – | Added to the `.repo` reply. |
| `MESSAGE_STORE_MAX` | `2000` | Size of the antidelete cache. |
| `MAX_RECONNECTS` | `8` | Fast reconnect attempts before switching to one try every 5 minutes. |
| `LOG_LEVEL` | `silent` | Baileys log level. |
| `WA_LIB` | – | Switch the WhatsApp library, e.g. `@whiskeysockets/baileys`. |
| `RENDER_KEEP_ALIVE_URL` | – | Self-ping URL (Render sets `RENDER_EXTERNAL_URL` itself). |

---

## Using the bot

Commands start with the prefix (`.` by default).

| Command | What it does |
|---|---|
| `.menu` | The full menu as one message. |
| `.menu downloads` | One category only (a prefix is enough: `.menu down`). |
| `.play <song>` | Search YouTube, show a track card and send the audio. |
| `.ai <question>` | Ask the AI. |
| `.sticker` | Reply to an image or video to make a sticker. |
| `.repo` | Source and pairing repo links. |
| `.alive` · `.ping` | Check that the bot is running. |
| `.pair +number` | Get a pairing code for another number. |
| `.vv` | Reply to a view-once photo, video or voice note to reveal it (`.vv2` sends it to your own chat; owner only). |

The bot starts in **private** mode (only the owner can use it in private chats; groups always work). Owners switch with `.mode public` or `.mode private`.

---

## The menu

`.menu` sends the stats card and **every category in a single message**. Command names are shown in small caps (people still type them normally). Commands from the extra packs sit in the section where they belong, for example the YouTube tools are inside **Downloads**.

| Section | Contents |
|---|---|
| 🌐 NEXUS · 💬 QUOTES | Prime store, seasonal quotes. |
| ⚙️ GENERAL | Alive, ping, settings, bot info, pairing, calculator, help. |
| 🤖 AI CHAT · 🎨 AI STUDIO | Chat models, writing helpers, image/video/music generation. |
| 📥 DOWNLOADS | YouTube, TikTok, Instagram, Facebook, X, Spotify, SoundCloud, Mega, GitHub, APK, lyrics. |
| 🔎 SEARCH | Weather, wiki, news, crypto, movies, Bible, Quran, live data, offline knowledge. |
| 🎭 FUN · 🎲 FUN PACK · 🔤 TEXT FUN | Jokes, reactions, ship/rate/fortune, text transforms. |
| 🖼️ IMAGES · 🐉 ANIME | Pictures, wallpapers, image effects, anime search and pies. |
| 🧰 TOOLS · 🧮 UTILITIES | Stickers, converters, text-to-speech, QR, OCR, math, dates, generators. |
| 🛡️ GROUP ADMIN · 👑 OWNER | Group management and owner settings. |
| ⚽ SPORTS · 📧 TEMP MAIL · ✒️ LOGO MAKER · 🎮 GAMES | Scores, disposable mail, 35+ logo styles, games. |

**Editing the menu:** change `menudata.js` (core layout) or the `PACK_TO_SECTION` map in `ui.js` (where the pack commands go). `ui.test.js` fails if a menu entry has no handler or a command is listed twice.

---

## Status, view-once and AI video (new in 9.7.0)

| Command | Who | What it does |
|---|---|---|
| `.vv` / `.rvo` / `.vvx` | anyone | Reply to a view-once photo, video, video note or voice note to reveal it. If WhatsApp stripped the quote, the bot falls back to that sender's newest saved view-once. |
| `.antiviewonce on\|off` | owner | Copies **every** view-once the bot sees to your own chat the moment it arrives, so it cannot expire before you open it. |
| `.savestatus` | owner | Reply to a status to save it. |
| `.autosavestatus on\|off` | owner | Copies every status your contacts post (text, photo, video, voice) to your own chat. |
| `.antigroupstatus on\|off\|kick` | group admins | Deletes "group status" posts from non-admins (`kick` also removes the sender). The bot must be an admin. |
| `.antistatusmention on\|off\|kick` | group admins | Deletes the notice WhatsApp posts when someone mentions the group in a status. |
| `.afk [reason]` / `.unafk` | anyone | The bot tells people who tag or reply to you that you are away, and welcomes you back. |
| `.veo` `.sora` `.txt2vid` `.txt2video` `.aivid` `.aivideo` `<prompt>` | anyone | One AI-video chain: Paxsenix Veo 3.1 → Veo 2 → Runway → Okatsu → Nexray. If every video service is busy you still get a cinematic AI image instead of an error. |

Also new: `.bratvid` `.iqc` `.carbon` `.tofigure` `.capcut` `.bard` `.quillbot`, `.tagadmins` `.listonline` `.addbadword` `.removebadword` `.badwordlist`, `.alldl` `.tikdl` `.twtdl`, `.neko` `.kitsune` `.husbando` plus about 20 more reaction gifs, `.catfact`, and one menu command per section (`.downloadmenu`, `.groupmenu`, `.ownermenu`, `.aimenu`, `.gamesmenu`, `.toolsmenu`, `.funmenu`, `.animemenu`, `.searchmenu`, `.imagemenu`, `.sportsmenu`, `.logomenu`).

Notes
- Anti-status, anti-view-once and the status saver all need the bot number to stay online. They only see what reaches that number.
- Media is cached in memory only (about 80 MB, 24 hours), never written to disk.
- Run `.apicheck` after deploying: the new third-party endpoints (Bard, QuillBot, iQC, ToFigure, CapCut, Nexray) come from other open-source bots and can change without notice.

---

## Make it yours: menu and custom commands (new in 9.7.1)

The bot is built so you can change the important things from two small files, without touching the big ones. See [`EDITING.md`](EDITING.md) for the full map.

**`menu.config.js`** controls the whole menu: the stats card rows, the footer, the drawing style of each section, section order, names and icons, hiding or moving commands, and your own sections. Save the file and send `.menu` again; no restart. A typo never breaks the bot (it keeps the last good settings and prints the problem).

```js
renameSections: { 'GENERAL': 'MAIN MENU' },
sectionOrder:   ['DOWNLOADS', 'AI CHAT', 'GAMES'],
hideCommands:   ['hack'],
addSections:    [{ name: 'MY FAVOURITES', icon: '⭐', commands: ['play', 'sticker', 'vv'] }],
```

**`custom.js`** is where you add your own commands: a block with a `name` and a `reply` (or a small `run` function). They appear in the menu automatically. Restart after adding one.

---

## Group tools and automations

Settings are saved in `data/autos.json`. The bot must be a **group admin** for anything that deletes messages or edits the group. Admins and owners are never affected by the filters.

| Command | Who | What it does |
|---|---|---|
| `.antilink` | admin | Remove links from non-admins. |
| `.antibadword on/off/add/remove/list` | admin | Delete messages containing blocked words (whole words only). |
| `.antitag on/off` | admin | Delete messages that tag 5+ people or use `@everyone`. |
| `.welcome` · `.goodbye` | admin | Greeting messages. |
| `.topmembers` | anyone | Most active members (counted from when v9.3 was installed). |
| `.setgdesc` · `.anularlink` · `.infogp` | admin / anyone | Set description, reset invite link, group info. |
| `.chatbot on/off` | admin (groups) / owner (DMs) | AI replies; in groups only when someone replies to or @mentions the bot. |
| `.anticall` · `.pmblocker` · `.autoreact` · `.autotyping` | owner | Reject calls, block private messages, react to messages, show "typing…". |
| `.autobio on\|off\|set <text>\|reset` | owner | Keeps the bot's WhatsApp About updated every minute. Placeholders: `{time}` `{date}` `{uptime}` `{prefix}` `{bot}`. Set `AUTOBIO_INTERVAL` (seconds, min 30) to change the speed. |

---

## Owner and sudo

- Owners are `DEVELOPER_NUMBER`, `OWNER_NUMBERS`, the paired number itself and anyone added with `.sudo`.
- `.sudo add @user` / `.sudo del @user` / `.sudo list` (aliases `.addmod`, `.delmod`). **Sudo users get owner-level commands, so only add people you fully trust.**
- `.owners` lists everyone. `.ban` / `.unban`, `.mode`, `.setprefix`, `.antidelete`, `.autoread`, `.autostatus`, `.clearsession` (empties temp files only) and more are owner commands.
- `.apicheck` tests every API the bot depends on and reports which are down.

---

## Deploying

The bot is one Node process with an HTTP server, so any Node host works.

**Render / Railway / Koyeb / Heroku-style hosts**
1. Create a web service from this repo, build command `npm install`, start command `npm start`.
2. Add the variables from [Configuration](#configuration) in the dashboard.
3. Attach a **persistent disk** and set `DATA_DIR` to its path.
4. On Render the bot pings itself every 10 minutes to stay awake. Other hosts: set `RENDER_KEEP_ALIVE_URL` or point an uptime monitor at `/ping`.

**Auto-update from GitHub (no re-pairing)**
Set `UPDATE_REPO=owner/repo` (and `UPDATE_BRANCH`, `GITHUB_TOKEN` for a private repo). Every few minutes the bot checks GitHub, downloads changed files, syntax-checks them, keeps `data/`, `.env` and all sessions, installs new packages if `package.json` changed, then restarts itself in a few seconds. Linked numbers reconnect from disk. A bad push is rejected, and a version that crashes right after an update is rolled back automatically. Owners can run `.update`, `.update force` or `.update status`.
For this to work, **turn off your host's "auto-deploy on push"** (a redeploy replaces the whole disk, which is what logs everyone out), or keep `DATA_DIR` on a persistent disk.

**VPS with pm2**
```bash
npm install
pm2 start index.js --name whitekid-prime
pm2 save
```

`npm run check` syntax-checks the main files. Sessions stay on disk when the process stops, so a restart reconnects every linked number automatically.

---

## Web pairing page and HTTP routes

| Route | Purpose |
|---|---|
| `/` | Pairing page (`main.html`). `/?number=…` requests a code (rate-limited). |
| `/status?number=…` | `{ connected: true/false }` for a number. |
| `/active` | Count and masked list of connected numbers. |
| `/ping` · `/health` | Keep-alive and health checks (bot name, version, active sessions). |
| `/reconnect` · `/connect-all` | Reconnect saved sessions. **Need `ADMIN_TOKEN`.** |

---

## Project layout

Flat on purpose, no sub-folders.

| File | Job |
|---|---|
| `index.js` | Start-up, keep-alive, graceful shutdown. |
| `server.js`, `pairguard.js`, `main.html` | Web routes, number validation and rate limit, pairing page. |
| `manager.js` | Every WhatsApp connection: pairing, reconnect with backoff, logout, restore. |
| `handler.js` | Turns WhatsApp events into command calls and runs the automation hooks. |
| `commands.js` | Core commands (one big `switch`). |
| `games.js` | Games and fun pack. |
| `wk7*.js`, `wk8.js` … `wk12.js` | Command packs: v7 toolkit, v8 downloaders/converters/groups, v9 Knightbot pack, v10 Knight/Atlas extras. |
| `autos.js` | Anti-badword, anti-tag, anti-call, PM blocker, auto-react, auto-typing, chatbot, sudo, top members. |
| `ai.js`, `music.js`, `services.js` | AI engine with provider fallback, `.play` engine, API hub. |
| `events.js` | Antidelete, welcome/goodbye, antilink, scheduler, tic-tac-toe. |
| `menu.config.js`, `custom.js`, `EDITING.md` | **Yours to edit**: menu settings, your own commands, and the guide to both. |
| `menucfg.js`, `customcmds.js` | Load the two files above (no need to edit). |
| `ui.js`, `menudata.js` | Bot font, reply card, menu builder; the core command list per section. |
| `helpers.js`, `store.js`, `config.js` | Text styling and buttons, settings on disk, configuration. |
| `deps.js`, `wa.js` | Library loading (missing optional libraries never crash the bot). |
| `telegram.js` | Optional Telegram pairing bot (off unless `TG_TOKEN` is set). |
| `APIS.md` | Every external API the bot uses. |

---

## Tests and health checks

```bash
npm test          # guard, page, wk7, wk8, wk9, wk10, autos, viewonce, ui, smoke
npm run check     # syntax check of the main files
npm run apicheck  # probe the external APIs (or use .apicheck in WhatsApp)
```

The tests need no network and no WhatsApp: they use mocks. `wk7.test.js` alone runs more than 2,000 checks.

---

## Troubleshooting

| Problem | Try this |
|---|---|
| Everyone gets logged out after a redeploy | `DATA_DIR` is not on a persistent disk. |
| No pairing code | The number must have WhatsApp, include the country code and not already be linked. Wait a minute and retry (the page is rate-limited). |
| A command says the service did not respond | A free API is down. Run `.apicheck`; for AI set `AI_API_KEY`. |
| Audio/video converters fail | Install ffmpeg or set `FFMPEG_PATH`. |
| Bot stops answering after a WhatsApp library update | Pin `@whiskeysockets/baileys` in `package.json` to the last version that worked for you, or set `WA_LIB`. |
| Menu looks plain | `BOT_FONT=none` is set. |
| "Make the bot an admin first" | Group filters and group edits need the bot to be a group admin. |
| Telegram bot is silent | `TG_TOKEN` is empty. |

---

## Safety notes

- Automating a personal WhatsApp account can get it **banned**. Use a spare number.
- Keep `.env`, `data/` and session folders out of Git and out of any zip you share. They contain tokens and login sessions.
- Give `ADMIN_TOKEN` a long random value, and treat `.sudo` like handing over the bot.
- The bot is designed not to run arbitrary code: remote-exec and plugin-installer commands from other bots were deliberately left out.

---

## Credits and licence

Built by **WhiteKid Tech** (Zimbabwe). Some commands were ported or rebuilt from Knightbot-MD (ISC licence) and Atlas-MD. Powered by [Baileys](https://github.com/WhiskeySockets/Baileys). See `LICENSE` and `APIS.md`.

---

## Changelog

- **9.7.1** Easy editing. `menu.config.js` (live-reloading menu settings: header rows, footer, section look, order, rename, hide, move, your own sections), `custom.js` (add commands with a text reply or a small function), `EDITING.md` (where everything lives). The default menu is unchanged, character for character. New tests: `menucfg.test.js`.
- **9.7.0** New `wk12.js` pack plus hooks. **Status:** `.autosavestatus`, `.antigroupstatus`, `.antistatusmention`, `.afk`. **View-once:** `.antiviewonce` (save every view-once to your DM), video-note support, sender fallback for stripped quotes, `.vvx`. **AI video:** `.veo`, `.sora`, `.txt2vid`, `.txt2video`, `.aivid`, `.aivideo` share one source chain with an AI-image fallback. **New commands:** `.bratvid`, `.iqc`, `.carbon`, `.tofigure`, `.capcut`, `.bard`, `.quillbot`, `.tagadmins`, `.listonline`, bad-word list management, `.alldl`, `.tikdl`, `.twtdl`, anime pictures and reaction gifs, `.catfact`, per-section menu commands. Ideas and endpoints from Toxic-MD and XLICON-V2-MD. Test fixes: `autobio` coverage and the unknown-command check.
- **9.6.1** Sudo fix: users WhatsApp identifies by a LID in groups or chats are recognised, and `.sudo add/del @user` stores and removes both the phone number and the LID.
- **9.6.0** Flash-MD pack (`wk11.js`, 60+ commands): WhatsApp tools (`block`, `unblock`, `blocklist`, `privacy`, `lastseen`, `mydp`, `mystatus`, `myonline`, `removedp`, `fullpp`, `onwa`, `bizprofile`, `vcard`, `details`, `mygroups`, `star`, `archive`, `save`), groups (`rename`, `req`, `approve`, `reject`, `disap1/7/90/-off`, `create`, `poll`), `hack`, `jokes`, `inspire`, `quotes`, `host`, `language`, Instagram `posts` and `story`, `video-dl`, `image-dl`, `playlist`, `trim`, and 19 more text logos (`dragonball`, `naruto`, `sunset`, `gold`, `frozen`...). New APIs: noobs-api, bk9, popcat, favqs, mollygram. Flash-MD's `eval`/`exec` and its embedded third-party API keys were not copied.
- **9.5.0** Fixes: `.vv` now saves view-once media the moment it arrives, so it still works after the receiver opened it; `.savestatus` (`.savest`, `.sv`) rewritten (photo, video, voice note, sticker, status text; add `dm` to send it to yourself); reply-based `promote`, `demote`, `warn` and `kick` work again (the bot never filled in the replied-to message). Auto-update: the bot pulls new code from GitHub by itself (`UPDATE_REPO`), keeps every session and restarts without anyone pairing again. New `.update` owner command, supervisor with crash restart and automatic rollback of a bad update.
- **9.4.0** View-once rewrite (`.vv`/`.rvo`/`.viewonce` now handle every WhatsApp wrapper, photos, videos and voice notes, with a cache for stripped quotes; new `.vv2` sends to your own chat). Sudo fixes: only the real owner can add or remove sudo users, `@mention`/reply/number all work, and owner/sudo checks also match the phone number WhatsApp gives in LID groups.
- **9.3.1** Command names in the menu use the small-caps font.
- **9.3** Automations: anti-badword, anti-tag, anti-call, PM blocker, auto-react, auto-typing, chatbot, sudo, top members.
- **9.2** Knight/Atlas extras (`infogp`, `setgdesc`, `anularlink`, `clearsession`, `insult`) and many aliases; menu headers lose the counts.
- **9.1** One-message menu with v7/v8/v9 commands merged into the matching sections; bounded antidelete cache; sessions keep retrying instead of being dropped; scheduled messages survive reconnects.
- **9.0** Knightbot pack: image effects, text logos, anime and pies, fun texts, extra download sources.
- **8.0** About 190 commands: downloaders, YouTube tools, converters, text-to-speech, stickers, reactions, group admin, extra AI.
- **7.x** Flat layout like `astra-md-mini-v2-flat`, new menu and font, AI engine with fallbacks, new `.play`, web pairing page.
