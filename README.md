<div align="center">

# ⚡ WHITEKID PRIME

### THE NEXT GENERATION OF WHATSAPP AUTOMATION

**Powerful. Intelligent. Expandable. Multi-Device.**

[![Version](https://img.shields.io/badge/Version-9.5.0-blue?style=for-the-badge)](https://github.com/whitekidtechzw-creator/whitekid-prime-pair)
[![Node](https://img.shields.io/badge/Node.js-18--24-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-orange?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-WhatsApp-25D366?style=for-the-badge&logo=whatsapp)](https://whatsapp.com/)

**Developed with passion by WHITEKID TECHZW 🇿🇼**

[🌐 Live Pairing Website](https://whitekid-prime-pair-7a7k.onrender.com) • [💻 GitHub Repository](https://github.com/whitekidtechzw-creator/whitekid-prime-pair)

</div>

---

## 🚀 ABOUT WHITEKID PRIME

**WHITEKID PRIME** is a powerful WhatsApp Multi-Device automation project engineered to deliver an advanced messaging experience.

Built by **WhiteKid TechZW**, this project combines intelligent AI capabilities, powerful automation systems, multimedia downloading, group management, entertainment, utilities and an expandable command architecture.

Unlike ordinary WhatsApp bots, WHITEKID PRIME brings together multiple command systems, a dedicated web pairing interface and optional Telegram integration.

Our mission is simple:

> Build technology that pushes beyond ordinary limits. The future had already come.

---

## ✨ CORE FEATURES

| Feature | Description |
|---|---|
| 🤖 AI Intelligence | Multiple AI engines and intelligent assistants |
| 📱 Multi-Device | Connect WhatsApp accounts using pairing codes |
| 🌐 Web Pairing | Dedicated online number-pairing interface |
| 📥 Download Engine | Download multimedia from supported platforms |
| 🎨 AI Studio | Image generation, effects and creative tools |
| 🎵 Music System | Search and download music |
| 🛡️ Group Protection | Advanced group administration and moderation |
| 🎮 Entertainment | Games, quizzes, jokes and interactive commands |
| ⚙️ Automation | Automatic reactions, welcome messages and more |
| 🔄 Auto Reconnection | Restore saved WhatsApp sessions |
| 📡 Telegram Integration | Optional Telegram pairing bot |
| 🧰 Developer Tools | Utilities, converters, QR generation and more |
| 🔐 Security | Pairing validation, rate limiting and protected admin routes |
| ♻️ Auto Updates | GitHub-based updates with rollback support |

---

## 🧠 AI INTELLIGENCE

WHITEKID PRIME integrates multiple AI providers to deliver intelligent assistance.

Supported integrations include:

- ChatGPT
- Google Gemini
- Claude
- DeepSeek
- Grok
- Microsoft Copilot
- Llama
- Mistral
- Qwen

AI capabilities include:

- Intelligent conversations.
- Code generation.
- Text translation.
- Summarization.
- Creative writing.
- Recipe generation.
- AI-powered assistance.
- Image and creative generation integrations.

AI availability depends on configured API providers.

---

## 📥 ADVANCED DOWNLOAD SYSTEM

Access multimedia downloading tools from supported platforms.

Supported integrations include:

- YouTube
- TikTok
- Instagram
- Facebook
- X
- Spotify
- SoundCloud
- MediaFire
- Mega
- GitHub
- APK sources

Additional download sources and fallback integrations help improve reliability.

---

## 🛡️ GROUP MANAGEMENT

Take control of your WhatsApp groups.

Available administration features include:

- Anti-link protection.
- Anti-badword protection.
- Anti-tag protection.
- Welcome messages.
- Goodbye messages.
- Member management.
- Group information.
- Group description management.
- Warning systems.
- Top members.
- Automated group moderation.

Some operations require the bot to have group administrator privileges.

---

## 🎮 ENTERTAINMENT & FUN

Keep conversations entertaining with:

- Tic-Tac-Toe.
- Trivia.
- Hangman.
- Blackjack.
- Quizzes.
- Truth or Dare.
- Jokes.
- Memes.
- Reactions.
- Text transformations.
- Interactive games.

---

## 🌐 WEB PAIRING SYSTEM

WHITEKID PRIME includes a dedicated web interface for connecting WhatsApp accounts.

**Live pairing platform:**

https://whitekid-prime-pair-7a7k.onrender.com

### How to connect

1. Open the WHITEKID PRIME pairing website.
2. Enter your WhatsApp number with the country code.
3. Request your pairing code.
4. Open WhatsApp.
5. Navigate to Settings → Linked Devices.
6. Select Link a Device.
7. Choose Link with phone number instead.
8. Enter the pairing code.

Your WhatsApp account can now connect to WHITEKID PRIME.

**Important:** Never share your pairing code or WhatsApp session credentials with anyone.

---

## 📲 TELEGRAM PAIRING INTEGRATION

WHITEKID PRIME also supports an optional Telegram pairing bot.

When configured with `TG_TOKEN`, the Telegram integration provides an additional pairing interface.

The Telegram integration is optional and disabled when its token is not configured.

---

## ⚡ QUICK INSTALLATION

### Requirements

- Node.js 18–24.
- npm.
- FFmpeg for audio and video processing.
- A spare WhatsApp account.
- API keys for optional integrations.

### 1. Clone the repository

```bash
git clone https://github.com/whitekidtechzw-creator/whitekid-prime-pair.git
```

### 2. Enter the project directory

```bash
cd whitekid-prime-pair
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit your `.env` file and configure the required settings.

### 5. Start WHITEKID PRIME

```bash
npm start
```

The web pairing interface will be available at:

```text
http://localhost:3000
```

---

## ☁️ DEPLOYMENT

WHITEKID PRIME can run on Node.js-compatible hosting platforms.

### Recommended deployment platforms

- [Render](https://render.com/)
- [Railway](https://railway.com/)
- [Koyeb](https://www.koyeb.com/)
- VPS hosting with PM2.

### Render configuration

| Setting | Value |
|---|---|
| Runtime | Node.js |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Persistent Storage | Recommended |
| Environment | Configure `.env` variables |

**Important:** Configure persistent storage and set `DATA_DIR` appropriately. Without persistent storage, WhatsApp sessions may be lost after redeployment.

---

## ⚙️ ENVIRONMENT CONFIGURATION

WHITEKID PRIME supports configurable environment variables.

| Variable | Purpose |
|---|---|
| `PORT` | Web server port |
| `DATA_DIR` | Session and data storage |
| `PREFIX` | Bot command prefix |
| `DEVELOPER_NUMBER` | Developer number |
| `OWNER_NUMBERS` | Additional owners |
| `ADMIN_TOKEN` | Protected administrative routes |
| `AI_API_KEY` | AI provider authentication |
| `AI_BASE_URL` | AI provider endpoint |
| `AI_MODEL` | Selected AI model |
| `TG_TOKEN` | Telegram integration |
| `BOT_FONT` | Message font configuration |
| `BOT_REPO_URL` | Repository information |
| `UPDATE_REPO` | Automatic update repository |
| `GITHUB_TOKEN` | Optional private repository access |
| `FFMPEG_PATH` | FFmpeg executable location |

Additional optional API integrations are documented in `.env.example` and `APIS.md`.

**Never publish your API keys, tokens or WhatsApp sessions.**

---

## 💻 COMMAND EXAMPLES

The default command prefix is `.`.

| Command | Description |
|---|---|
| `.menu` | Display the complete command menu |
| `.menu downloads` | Display download commands |
| `.alive` | Check bot status |
| `.ping` | Check response speed |
| `.ai hello` | Chat with AI |
| `.play song name` | Search and play music |
| `.sticker` | Create a sticker |
| `.pair +263xxxxxxxxx` | Request a pairing code |
| `.repo` | Display repository information |
| `.apicheck` | Check external API availability |
| `.update` | Update the bot |
| `.update status` | Check update status |

---

## 🏗️ PROJECT ARCHITECTURE

WHITEKID PRIME uses a modular JavaScript architecture.

```text
WHITEKID-PRIME-PAIR/
│
├── assets/
├── .github/
├── .env.example
│
├── index.js
├── bot.js
├── server.js
├── main.html
│
├── commands.js
├── handler.js
├── manager.js
├── config.js
│
├── ai.js
├── music.js
├── services.js
├── telegram.js
│
├── games.js
├── events.js
├── autos.js
│
├── wk7.js
├── wk7-core.js
├── wk7-fun.js
├── wk7-info.js
├── wk7-math.js
├── wk7-net.js
├── wk7-text.js
│
├── wk8.js
├── wk9.js
├── wk10.js
│
├── ui.js
├── menudata.js
├── helpers.js
├── store.js
├── supervisor.js
├── updater.js
│
├── pairguard.js
├── keepalive.js
├── APIS.md
├── package.json
└── LICENSE
```

The architecture separates pairing, messaging, command handling, automation, integrations and user-interface components.

---

## 🧪 TESTING & RELIABILITY

The project includes automated tests for important components.

Run the test suite:

```bash
npm test
```

Check JavaScript syntax:

```bash
npm run check
```

Check API availability:

```bash
npm run apicheck
```

The tests use mocks and do not require a live WhatsApp connection.

---

## 🔒 SECURITY & RESPONSIBLE USAGE

Security matters.

- Use a spare WhatsApp number for testing.
- Never expose your `.env` file.
- Keep session folders private.
- Protect your administrative token.
- Only grant sudo privileges to trusted users.
- Do not share pairing codes or authentication credentials.
- Respect WhatsApp policies and the privacy of other users.

WHITEKID PRIME is provided for educational, development and personal automation purposes.

---

## 📜 LICENSE

This project is distributed under the **Apache License 2.0**.

See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 DEVELOPER & PROJECT OWNER

<div align="center">

# WHITEKID TECHZW

### 🇿🇼 ZIMBABWEAN DEVELOPER

**Founder • Developer • Project Creator**

WHITEKID PRIME is part of the WHITEKID TECH project ecosystem.

I build bots, automation systems, web applications and developer tools with a vision of creating technology that stands out.

**This is not just another bot. This is WHITEKID PRIME.**

</div>

### Connect with the developer

- GitHub: https://github.com/whitekidtechzw-creator
- Telegram: https://t.me/whitekid01
- Repository: https://github.com/whitekidtechzw-creator/whitekid-prime-pair

---

## 🌟 SUPPORT THE PROJECT

If you appreciate the work behind WHITEKID PRIME:

- ⭐ Star this repository.
- 🍴 Fork the project.
- 🐛 Report bugs through GitHub Issues.
- 💡 Suggest improvements.
- 📢 Share the project with other developers.

Every bit of support motivates further development.

---

<div align="center">

# ⚡ WHITEKID PRIME

**ENGINEERED BY WHITEKID TECHZW**

*THE FUTURE HAD ALREADY COME.*

🇿🇼 MADE WITH PASSION IN ZIMBABWE.

</div>
