<div align="center">

<img src="tg-pair.png" alt="WhiteKid Prime pairing banner" width="100%" />

# ✦ WHITEKID PRIME
### `v7.1.0` · The next level of WhatsApp automation

**A powerful multi-device WhatsApp assistant engineered by WhiteKid Tech.**  
Pair through the web, connect with a code, explore hundreds of commands, and manage your bot from one flexible platform.

<p>
  <a href="https://whitekid-prime-pair-4w1b.onrender.com/"><img src="https://img.shields.io/badge/PAIR%20YOUR%20DEVICE-00D9FF?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Pair your device"></a>
  <a href="https://t.me/whitekid01"><img src="https://img.shields.io/badge/DEVELOPER-WhiteKid%20Tech-8A2BE2?style=for-the-badge&logo=telegram&logoColor=white" alt="Developer"></a>
</p>

<p>
  <img src="https://img.shields.io/badge/VERSION-7.1.0-00D9FF?style=flat-square" />
  <img src="https://img.shields.io/badge/NODE-%3E%3D18-3C873A?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PLATFORM-WHATSAPP-25D366?style=flat-square&logo=whatsapp&logoColor=white" />
  <img src="https://img.shields.io/badge/LICENSE-Apache--2.0-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/STATUS-ACTIVE-00C853?style=flat-square" />
</p>

> **THE FUTURE HAD ALREADY COME.**  
> Built with vision. Powered by technology. Representing **WHITEKID TECH**.

</div>

---

## ◈ PROJECT OVERVIEW

WhiteKid Prime is a feature-rich, multi-device WhatsApp bot built with Node.js and Baileys. It combines a browser-based pairing page, WhatsApp pairing commands, an optional Telegram pairing bot, AI integrations, media tools, group utilities, games, automation, and owner controls.

The project uses a modular flat-file architecture, persistent session storage, reconnection handling, and protected administrative routes.

### ⚡ Quick access

| Destination | Link |
|---|---|
| 🌐 **Pairing Website** | [Open WhiteKid Prime Pair](https://whitekid-prime-pair-4w1b.onrender.com/) |
| 💬 **Developer Telegram** | [@whitekid01](https://t.me/whitekid01) |
| 📢 **WhatsApp Channel** | [Follow WhiteKid Prime](https://whatsapp.com/channel/0029Vb86qKOA89Mi8iCgNe1R) |
| 👥 **WhatsApp Community** | [Join the community](https://chat.whatsapp.com/BnGr96zHiz075lNTZzvRUN) |

---

## ✨ FEATURE SHOWCASE

<table>
<tr>
<td width="50%">

### 📲 Smart Pairing
- Web-based number pairing page
- WhatsApp `.pair` command
- Pairing-code validation
- Pairing rate protection
- Connection status endpoint

</td>
<td width="50%">

### 🧠 AI & Creative Tools
- AI chat integrations
- GPT, Gemini, Llama and DeepSeek command routes
- AI image generation integrations
- Text-to-image and video tools
- Voice replies and AI utilities

</td>
</tr>
<tr>
<td>

### 🎬 Media & Downloads
- YouTube search and downloads
- Song and audio tools
- Video download integrations
- Movie search and information
- Lyrics and audio utilities
- Media upload helpers

</td>
<td>

### 🛡️ Group & Automation
- Welcome and goodbye messages
- Anti-link controls
- Anti-delete support
- Auto-read and auto-record settings
- Status utilities
- Scheduled tasks

</td>
</tr>
<tr>
<td>

### 🎮 Entertainment
- Games and interactive commands
- Tic-tac-toe
- Quotes and special-day messages
- Fun and text-style utilities

</td>
<td>

### 👑 Owner Control
- Public/private mode
- Custom command prefix
- AI and voice toggles
- Session overview
- Ban and unban controls
- Developer override panel

</td>
</tr>
</table>

### 🔥 More built-in capabilities

- Multi-session management and session restoration
- Automatic reconnect handling with retry logic
- Optional Telegram pairing bot
- Sports scores and search integrations
- Translation, calculations, search and information commands
- Bot uptime, status, health and statistics endpoints
- Persistent settings and session data
- Graceful shutdown handling
- API integrations managed through the services layer

*Feature availability can depend on API uptime, configured API keys, installed system tools, and the relevant provider's limits.*

---

## 🖼️ PROJECT PREVIEWS

The repository includes the following Telegram pairing illustrations:

<div align="center">
  <table>
    <tr>
      <td align="center"><img src="tg-start.png" alt="Telegram pairing start" width="250"><br><sub>Pairing start</sub></td>
      <td align="center"><img src="tg-pair.png" alt="Telegram pairing flow" width="250"><br><sub>Pairing flow</sub></td>
    </tr>
    <tr>
      <td align="center"><img src="tg-info.png" alt="Telegram pairing information" width="250"><br><sub>Pairing information</sub></td>
      <td align="center"><img src="tg-success.png" alt="Telegram pairing success" width="250"><br><sub>Pairing success</sub></td>
    </tr>
  </table>
</div>

---

## 🚀 INSTALLATION

### Requirements

- Node.js **18 or newer** (supported range: Node 18–24)
- npm
- Git
- FFmpeg for audio/video commands
- A WhatsApp account for the device you intend to link

### 1. Clone the repository

```bash
git clone https://github.com/whitekid-tech/Whitekid-Prime-Bot-.git
cd Whitekid-Prime-Bot-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your environment file:

```bash
cp .env.example .env
```

Open `.env` and configure the values you need:

```env
PORT=3000
DATA_DIR=./data

# Security
ADMIN_TOKEN=change_this_to_a_long_random_secret

# Owner configuration
DEVELOPER_NUMBER=263789846423
OWNER_NUMBERS=
PREFIX=.

# Pairing and integrations
AUTO_JOIN=true
TG_TOKEN=

# Optional API keys
PAXSENIX_API_KEY=
NEWS_API_KEY=
OPENAI_API_KEY=
TMDB_API_KEY=

# Optional runtime settings
LOG_LEVEL=silent
MAX_RECONNECTS=8
WA_LIB=
RENDER_KEEP_ALIVE_URL=
```

**Important:** Keep real tokens and API keys private. Never commit your `.env` file, authentication sessions, or private credentials to GitHub.

### 4. Start WhiteKid Prime

```bash
npm start
```

The web server will run on:

```text
http://localhost:3000
```

### 5. Run project checks

```bash
npm test
npm run check
```

---

## 🔗 HOW TO PAIR YOUR WHATSAPP

### Method A — Pairing website

1. Open the [WhiteKid Prime Pairing Website](https://whitekid-prime-pair-4w1b.onrender.com/).
2. Enter your WhatsApp number with its country code.
3. Submit the number and wait for the pairing code.
4. On your phone, open WhatsApp.
5. Go to **Settings → Linked Devices → Link a Device**.
6. Select **Link with phone number instead**.
7. Enter the pairing code displayed by the website.

### Method B — WhatsApp command

If the bot is already running and the command is available, send:

```text
.pair +26378XXXXXXXX
```

Replace the example with your own number, including the country code.

**Security note:** Only pair a number you own or have explicit permission to connect. Never share your pairing code with another person.

---

## ⚙️ CONFIGURATION REFERENCE

| Variable | Purpose |
|---|---|
| `PORT` | Web server port |
| `DATA_DIR` | Persistent storage for sessions and settings |
| `ADMIN_TOKEN` | Protects administrative reconnect routes |
| `DEVELOPER_NUMBER` | Main developer/owner number |
| `OWNER_NUMBERS` | Additional owner numbers, comma-separated |
| `PREFIX` | Default command prefix |
| `AUTO_JOIN` | Controls automatic group/channel joining after first pairing |
| `TG_TOKEN` | Enables the optional Telegram pairing bot |
| `PAXSENIX_API_KEY` | Optional API integration key |
| `OPENAI_API_KEY` | Optional OpenAI integration key |
| `NEWS_API_KEY` | Optional news integration key |
| `TMDB_API_KEY` | Optional movie database integration key |
| `WA_LIB` | Optional WhatsApp library override |
| `MAX_RECONNECTS` | Reconnection configuration |
| `RENDER_KEEP_ALIVE_URL` | Optional keep-alive URL |

---

## 🌍 WEB API ROUTES

The Express server exposes these routes:

| Route | Description |
|---|---|
| `/` | Pairing page; accepts a `number` query for pairing |
| `/status?number=...` | Checks whether a number has an active session |
| `/active` | Returns active-session count and masked numbers |
| `/ping` | Returns bot and service status information |
| `/health` | Health-check response |
| `/reconnect` | Restores saved sessions; requires admin authentication |
| `/connect-all` | Restores saved sessions; requires admin authentication |

Administrative reconnect routes require the `x-admin-token` request header. They are disabled when `ADMIN_TOKEN` is not configured.

---

## 🧩 PROJECT STRUCTURE

This release uses a flat layout to keep the application easy to navigate.

| File | Responsibility |
|---|---|
| `index.js` | Application startup, keep-alive and shutdown |
| `server.js` | Express server and web routes |
| `manager.js` | WhatsApp session creation, restoration and reconnects |
| `handler.js` | Incoming WhatsApp event and message handling |
| `commands.js` | Main command router |
| `wk7.js` and `wk7-*.js` | Modular toolkit command pack |
| `services.js` | API integrations, AI, media and download services |
| `events.js` | Group events, scheduling and interactive game events |
| `games.js` | Game and entertainment command handlers |
| `helpers.js` | Shared formatting and messaging helpers |
| `store.js` | Persistent settings, bans and session state |
| `config.js` | Runtime configuration |
| `telegram.js` | Optional Telegram pairing bot |
| `pairguard.js` | Pairing input validation and rate limiting |
| `main.html` | Browser pairing interface |
| `wa.js` | WhatsApp library adapter |
| `deps.js` | Dependency loading helpers |
| `.env.example` | Environment configuration template |

---

## ☁️ DEPLOYMENT & SESSION STORAGE

WhiteKid Prime can run locally or on a Node.js hosting platform.

For production hosting:

1. Use Node.js 18–24.
2. Set the start command to `npm start`.
3. Install dependencies with `npm install`.
4. Configure environment variables in the hosting dashboard.
5. Attach a **persistent disk/volume** and set `DATA_DIR` to its mounted path.
6. Keep `ADMIN_TOKEN` private.
7. Confirm that the host allows the network access required by WhatsApp and configured APIs.

> **Critical:** Session data is stored under `DATA_DIR`. If your host uses an ephemeral filesystem, redeployments or restarts may remove session files and require devices to pair again. Always use persistent storage for production.

---

## 🧪 TESTING

Run the included automated checks:

```bash
npm test
```

This runs the guard, pairing-page, toolkit and smoke tests.

Check key JavaScript files:

```bash
npm run check
```

Check configured API integrations:

```bash
npm run apicheck
```

---

## 🤝 CONTRIBUTORS & COLLABORATION

<div align="center">

### BUILT BY WHITEKID TECH

**Founder / Project Maintainer:** WhiteKid Tech  
**Project:** WhiteKid Prime  
**Current release:** v7.1.0

</div>

No additional collaborator names are declared in the supplied project files. Contributors are welcome — submit a pull request with a clear description of your changes, or report an issue with steps to reproduce it. Approved contributors can be credited here in future releases.

### Contribution workflow

1. Fork the repository.
2. Create a feature branch.
3. Keep changes focused and test them.
4. Run `npm test` and `npm run check`.
5. Open a pull request explaining the improvement.

Please do not submit API keys, WhatsApp session files, personal numbers, or other secrets.

---

## 🔐 SECURITY & RESPONSIBLE USE

- Use a separate WhatsApp number for testing where possible.
- Pair only accounts you own or are authorized to manage.
- Protect `.env`, session folders, API keys and admin tokens.
- Use persistent storage with appropriate access controls.
- Do not expose administrative routes or tokens publicly.
- Respect WhatsApp rules, local laws, API provider terms and the privacy of other users.
- Automated use of a personal WhatsApp account may lead to restrictions or account bans. Use this project responsibly.

---

## 📜 LICENSE

This project declares the **Apache License 2.0**. See the [`LICENSE`](LICENSE) file for the full license text.

---

## 💎 THE WHITEKID TECH NETWORK

<div align="center">

**WHITEKID TECH — BUILDING BEYOND LIMITS**

[🌐 Pair WhiteKid Prime](https://whitekid-prime-pair-4w1b.onrender.com/)  
[✈️ Telegram Developer](https://t.me/whitekid01)  
[📢 WhatsApp Channel](https://whatsapp.com/channel/0029Vb86qKOA89Mi8iCgNe1R)

### ✦ WHITEKID PRIME
#### THE FUTURE HAD ALREADY COME.

<sub>Designed, developed and maintained by WhiteKid Tech · 2026</sub>

</div>
