<div align="center">

<img src="assets/whitekid-prime.jpg" width="130" alt="Whitekid Prime" />

# WHITEKID PRIME

**A multi-device WhatsApp bot with 950+ commands, a web pairing page and an optional Telegram pairing bot.**

`v9.3.1` · Node.js 18–24 · Baileys multi-device · by **WhiteKid Tech**

</div>

---

## Contents
1. [Features](#features)
2. [Quick start](#quick-start)
3. [Configuration](#configuration)
4. [Using the bot](#using-the-bot)
5. [The menu](#the-menu)
6. [Group tools and automations](#group-tools-and-automations)
7. [Owner and sudo](#owner-and-sudo)
8. [Deploying](#deploying)
9. [Web pairing page and HTTP routes](#web-pairing-page-and-http-routes)
10. [Project layout](#project-layout)
11. [Tests and health checks](#tests-and-health-checks)
12. [Troubleshooting](#troubleshooting)
13. [Safety notes](#safety-notes)
14. [Credits and licence](#credits-and-licence)
15. [Changelog](#changelog)

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
| ♻️ **Reliable** | One connection path, reconnect with backoff, sessions kept on disk, bounded caches, 9 test suites that need no network. |

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
| `wk7*.js`, `wk8.js`, `wk9.js`, `wk10.js` | Command packs: v7 toolkit, v8 downloaders/converters/groups, v9 Knightbot pack, v10 Knight/Atlas extras. |
| `autos.js` | Anti-badword, anti-tag, anti-call, PM blocker, auto-react, auto-typing, chatbot, sudo, top members. |
| `ai.js`, `music.js`, `services.js` | AI engine with provider fallback, `.play` engine, API hub. |
| `events.js` | Antidelete, welcome/goodbye, antilink, scheduler, tic-tac-toe. |
| `ui.js`, `menudata.js` | Bot font, reply card, menu layout. |
| `helpers.js`, `store.js`, `config.js` | Text styling and buttons, settings on disk, configuration. |
| `deps.js`, `wa.js` | Library loading (missing optional libraries never crash the bot). |
| `telegram.js` | Optional Telegram pairing bot (off unless `TG_TOKEN` is set). |
| `APIS.md` | Every external API the bot uses. |

---

## Tests and health checks

```bash
npm test          # guard, page, wk7, wk8, wk9, wk10, autos, ui, smoke
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

- **9.3.1** Command names in the menu use the small-caps font.
- **9.3** Automations: anti-badword, anti-tag, anti-call, PM blocker, auto-react, auto-typing, chatbot, sudo, top members.
- **9.2** Knight/Atlas extras (`infogp`, `setgdesc`, `anularlink`, `clearsession`, `insult`) and many aliases; menu headers lose the counts.
- **9.1** One-message menu with v7/v8/v9 commands merged into the matching sections; bounded antidelete cache; sessions keep retrying instead of being dropped; scheduled messages survive reconnects.
- **9.0** Knightbot pack: image effects, text logos, anime and pies, fun texts, extra download sources.
- **8.0** About 190 commands: downloaders, YouTube tools, converters, text-to-speech, stickers, reactions, group admin, extra AI.
- **7.x** Flat layout like `astra-md-mini-v2-flat`, new menu and font, AI engine with fallbacks, new `.play`, web pairing page.
