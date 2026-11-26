# Whitekid Prime v9.1

A multi-device WhatsApp bot (350+ commands) with a web page where people pair their number, plus an optional Telegram pairing bot. This is the v7 bot restructured into the same flat layout as `astra-md-mini-v2-flat`.

## Run it
```bash
npm install
cp .env.example .env    # edit it
npm start               # http://localhost:3000
npm test                # guard, page, wk7 pack and smoke tests
```
Node 18+. `ffmpeg` is needed for audio/video commands.
**Hosting:** point `DATA_DIR` at a persistent disk, otherwise sessions are lost on every redeploy.

## Layout (flat, no folders)
| File | Job |
|---|---|
| `index.js` | start-up, keep-alive, graceful shutdown |
| `server.js` | web routes: `/`, `/status`, `/active`, `/ping`, `/health`, admin `/reconnect` |
| `manager.js` | every WhatsApp connection: pairing, reconnect with backoff, logout, restore |
| `handler.js` | turns WhatsApp events into command calls (antidelete, welcome, status, etc.) |
| `commands.js` | all commands (one big `switch`) |
| `games.js` | games/fun pack commands (`wkRun`) |
| `wk7*.js` | the v7 toolkit pack (246 offline/online commands) + `wk7.test.js` |
| `services.js` | API hub, downloaders, AI, uploads, lyrics, movies |
| `events.js` | antidelete, group welcome/goodbye/antilink, scheduler, tic-tac-toe |
| `ui.js`, `menudata.js` | bot font, reply card, menu layout (`.menu`, `.menu <category>`) |
| `ai.js` | AI engine: every AI command, answer cleaning, provider fallback |
| `music.js` | `.play` / `.song` / `.video` engine |
| `helpers.js` | text styling, buttons/carousels, group/newsletter join |
| `store.js` | settings on disk, bans, shared state, session folders |
| `config.js` | all settings, read from `.env` |
| `telegram.js` | optional Telegram pairing bot (off unless `TG_TOKEN` is set) |
| `deps.js`, `wa.js` | third-party libraries / WhatsApp library loader (`WA_LIB` switches it) |
| `pairguard.js`, `main.html` | number validation + rate limit, pairing page |
| `tg-*.png` | Telegram banner images |

## What changed from the old layout
- `pair.js` (4,900 lines) is split into the files above; behaviour is the same.
- One connection path. Website, `.pair`, and restarts all go through `manager.js`; previously each had its own socket code, so reconnects could stack sockets and listeners.
- Sessions are kept on disk in `DATA_DIR` and are **no longer deleted when the process exits**. GitHub session backup is gone (it pointed at a third-party repo).
- Secrets are env-only: `TG_TOKEN`, `PAXSENIX_API_KEY`, `NEWS_API_KEY` no longer have defaults in code. **Set them in `.env`**, or Telegram and those APIs stay off.
- No runtime `npm install` and no `pm2 restart` on errors; dependencies are in `package.json`.
- Welcome message and auto-join now happen once, when a number is first paired (not on every reconnect). `AUTO_JOIN=false` turns the auto-join off.
- `/reconnect` and `/connect-all` need `ADMIN_TOKEN` (`x-admin-token` header).
- `.deleteme`, `.pair`, owner settings and the developer override (`.whitekid`) work as before.

Automating a personal WhatsApp account can get it banned. Use a spare number.

## v7.2 changes
- **Menu**: new card style, built from `menudata.js` (edit that file to add or move commands). `.menu` sends the stats card + all categories; `.menu ai` shows one category. A test fails if a menu entry has no handler.
- **Font**: labels, titles and `*headings*` in every bot message use the bold font. `BOT_FONT=none` turns it off. Links, code blocks and `.commands` are never touched.
- **AI**: `.ai .chatgpt .chatgpt4 .gpt4 .claude .gemini .copilot .blackbox .deepseek .llama .mistral .qwen .grok .mathgpt .aicode .aitranslate .animeai .aisummary`. For the most reliable answers set `AI_API_KEY` (any OpenAI-compatible service, see `.env.example`); without it free public endpoints are used. Each answer shows which engine produced it.
- **Play**: searches YouTube first, shows a track card, tries download sources in parallel, checks the file is really audio, sends mp3/m4a/ogg (or a document if it is too big), local yt-dlp/ytdl-core as last resort.
- **`.repo`** shows the pairing repo https://github.com/whitekidtechzw-creator/whitekid-prime-pair (set `BOT_REPO_URL` to add the bot repo too).
- **Welcome message** sent to the owner's inbox after pairing was redesigned.
- Menu entries without handlers are fixed (`devdetails`, `desc`, `admin`, `greet`); `spam` was removed from the menu.

## v8 additions
~190 extra commands (downloaders, YouTube tools, converters, text-to-speech, sticker tools, reactions, pictures, group admin, bot info) and 8 new AI commands. See `APIS.md` for every API used. Optional `.env`: `TENOR_API_KEY` (gif + emojimix), `FFMPEG_PATH`. Converters need ffmpeg on the host.

## v9 additions (Knightbot pack)
~85 more commands: image effects (`.heart .triggered .tweet .jail …`), text logos (`.metallic .blackpink .glitch …`), pies/anime, fun texts, `.gpt`, `.ss`, `.removebg`, `.remini`, `.sora`, `.telesticker`, `.listadmin`, `.tagnotadmin`, plus more song/video/AI download sources. Run `npm install` (adds `mumaker`). Optional `.env`: `KNIGHT_API_KEY`, `TG_TOKEN`.

## v9.1 changes
- **Menu**: the stats card and every category now arrive as ONE message. v7/v8/v9 commands sit inside the matching main section (YouTube tools and downloaders under DOWNLOADS, text logos under LOGO MAKER, group tools under GROUP ADMIN, and so on) instead of separate V7/V8/V9 blocks. Each header shows its command count.
- **Stability**: the antidelete cache is capped (`MESSAGE_STORE_MAX`, default 2000) and deletes evicted media files; paired sessions keep retrying every 5 minutes after the fast reconnects fail instead of being dropped until a restart; scheduled messages use the newest connection and are retried for 10 minutes if a send fails instead of being lost.
- Optional `.env`: `OPENWEATHER_KEY` for `.weather`.
