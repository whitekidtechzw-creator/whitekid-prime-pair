'use strict';
const { path } = require('./deps');

try { require('dotenv').config(); } catch { /* dotenv is optional */ }

const AUTO_JOIN = String(process.env.AUTO_JOIN === undefined ? 'true' : process.env.AUTO_JOIN).toLowerCase() !== 'false';

const PORT = Number(process.env.PORT) || 3000;

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');

const envList = v => String(v || '').split(',').map(s => s.replace(/[^0-9]/g, '')).filter(Boolean);

// The Whitekid Prime emblem ships with the bot (assets/whitekid-prime.jpg), so it never depends on an outside host.
const BOT_IMAGE = require('path').join(__dirname, 'assets', 'whitekid-prime.jpg');
const BOT_IMAGES = [BOT_IMAGE];

const AI_FULL_NAME = 'Whitekid Prime';

const AI_SHORT_NAME = 'Whitekid Prime';

const DEVELOPER_NUMBER = process.env.DEVELOPER_NUMBER || '263789846423';

const AI_SYSTEM_IDENTITY = `You are ${AI_SHORT_NAME}, whose full name is ${AI_FULL_NAME}. Created by WhiteKid Tech in 2026. Never claim to be any other AI.`;

const config = {
    PREFIX: process.env.PREFIX || '.', BOT_NAME: AI_SHORT_NAME, BOT_FULL_NAME: AI_FULL_NAME, VERSION: '9.3.1',
    OWNER_NUMBERS: [DEVELOPER_NUMBER, ...envList(process.env.OWNER_NUMBERS)],
    OWNER_NAME: 'WhiteKid Tech',
    OWNER_TG: 'https://t.me/whitekid01', OWNER_WA: `https://wa.me/${DEVELOPER_NUMBER}`,
    BOT_IMAGES, NEWSLETTER_JID: '',  // filled in at runtime from the channel link (see helpers.resolveChannelJid)
    USER_CHANNEL_URL: 'https://whatsapp.com/channel/0029VbE9GwO2P59fKhOKUT3B', NEWSLETTER_NAME: 'Whitekid Prime bot',
    RCD_IMAGE_PATH: BOT_IMAGE,
    WATERMARK: '\n',
    MAX_RETRIES: 3, OTP_EXPIRY: 300000,
    GROUP_INVITE_LINK: 'https://chat.whatsapp.com/BnGr96zHiz075lNTZzvRUN?s=cl&p=a&mlu=0',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE',
    TG_TOKEN: process.env.TG_TOKEN || '',
    PAXSENIX_API_KEY: process.env.PAXSENIX_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    TMDB_API_KEY: process.env.TMDB_API_KEY || 'YOUR_TMDB_API_KEY',
    NEWS_API_KEY: process.env.NEWS_API_KEY || '',
    GIFTED_TECH_API: 'https://api.giftedtech.co.ke', GIFTED_API_KEY: 'free_key@maher_apis',
    SPORTS_API_BASE: 'https://apiskeith.top',
    PAXSENIX_URL: 'https://api.paxsenix.org',
    DAVID_API: 'https://apis.davidcyril.name.ng',
    NEXRAY_API: 'https://api.nexray.web.id',
    NEXRAY_EU: 'https://api.nexray.eu.cc',
    ELITE_API: 'https://eliteprotech-apis.zone.id',
    DELINE_API: 'https://api.deline.web.id',
    RYNEKOO_API: 'https://rynekoo-api.hf.space',
    QASIM_API: 'https://api.qasimdev.dpdns.org',
    NEOXR_API: 'https://api.neoxr.eu',
    PRINCE_API: 'https://api.princetechn.com/api', PRINCE_KEY: 'prince',
    PREXZY_API: 'https://apis.prexzyvilla.site',
    DISCARD_API: 'https://discardapi.dpdns.org',
    SILENT_API: 'https://darkvibe314-silent-movies-api.hf.space',
    OKATSU_API: 'https://okatsu-rolezapiiz.vercel.app',
    NAYAN_API: 'https://nayan-video-downloader.vercel.app',
    PAIR_REPO_URL: 'https://github.com/whitekidtechzw-creator/whitekid-prime-pair', PAIR_REPO_PATH: 'whitekidtechzw-creator/whitekid-prime-pair',
    GITHUB_PROFILE_URL: 'https://github.com/whitekidtechzw-creator', BOT_REPO_URL: process.env.BOT_REPO_URL || '',
    BOT_FOOTER: '✰Whitekid Prime',
    AUTO_RECORDING: 'true'
};

const WM = config.WATERMARK;

module.exports = { ADMIN_TOKEN, AI_FULL_NAME, AI_SHORT_NAME, AI_SYSTEM_IDENTITY, BOT_IMAGES, DATA_DIR, DEVELOPER_NUMBER, PORT, WM, config };
