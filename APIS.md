# Whitekid Prime — API list (v8)

Run `.apicheck` (owner) to see which of these are alive right now. Every command tries several sources in order, so one dead API does not break a command.

## YouTube (search / audio / video)
- yt-search library → YouTube results page (scraped) → api-faa `/faa/youtube` (search)
- Audio: Nayan, Prince, Prexzy, Nexray `/downloader/ytmp3`, Elite, Okatsu, **api-faa `/faa/ytmp3`**, **api-faa `/faa/ytplay`** (search + download by name)
- Video: Nayan, Prince, Nexray, **api-faa `/faa/ytmp4`**, **Nexray `/downloader/ytmp4`**, Elite

## Video / social downloaders (`.dl <link>` picks the right one)
TikTok: tikwm, kelvdra · Instagram: api-faa `igdl`, Nexray · Pinterest: api-faa `pin-down` · Facebook: api-faa `fbdownload`, Nexray
X/Twitter, Videy, Threads, Mega, SoundCloud, Spotify, Sfile: Nexray `/downloader/*` · MediaFire: api-faa

## AI (tried in order, first real answer wins)
Your own key (AI_API_KEY) → Paxsenix → Dreaded → Gifted → Pollinations → Hostify Grok → **api-faa Gemini** → **Hercai** → Siputzx DeepSeek

## Media & fun
waifu.pics + nekos.best (reactions) · memegen (memes) · bot.lyo.su (quote stickers) · couple-pfp-api · pixelcut (HD upscale)
Google TTS (say commands) · QRServer · TinyURL · catbox (temporary upload for memes) · Bing images (image/wall) · meloboom (ringtones)
Tenor (gif, emojimix) — needs your own free key: `TENOR_API_KEY` in `.env`

Credits: many endpoints and command ideas come from Atlas-MD by FantoX (MIT licence).

## Added in v9 (from Knightbot-MD, ISC licence)
- **Song / play audio sources:** Knight API (`knightbotapi.stream`, key `KNIGHT_API_KEY`, default `knight`), Hector worker, Yupra, Izumi, EliteProTech, Keith (`apis-keith.vercel.app`) — added to the existing chain
- **Video sources:** Knight ytmp4, Prince `ytvideo`, Hector, EliteProTech mp4, Yupra mp4, Okatsu mp4
- **AI:** Knight chat + gpt, Shizo gpt, Zell chatbot, Vapis Gemini
- **Image effects:** some-random-api canvas (misc + overlay) · **Pies:** shizo.top · **Anime:** some-random-api animu
- **Fun texts:** shizoapi texts, Prince roseday · **Tools:** siputzx ssweb + removebg, Prince remini, Okatsu text-to-video
- **Text logos:** ephoto360 through the `mumaker` package · **Telegram stickers:** Telegram Bot API (`TG_TOKEN`)
