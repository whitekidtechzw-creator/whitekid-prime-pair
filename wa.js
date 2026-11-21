'use strict';
// WhatsApp library loader.
// Tries the Whitekid socket first, then falls back to Baileys, so the bot still starts if one is missing.
// The libraries are ES modules, so they are loaded with import() by init(), which index.js awaits before anything starts.
// Set WA_LIB to force one library, for example WA_LIB=@whiskeysockets/baileys

const bf = {
    default: () => ({}), useMultiFileAuthState: async () => ({ state: { creds: {}, keys: {} }, saveCreds: () => {} }),
    delay: ms => new Promise(r => setTimeout(r, ms)), getContentType: () => 'conversation',
    makeCacheableSignalKeyStore: k => k, Browsers: { macOS: () => [] },
    jidNormalizedUser: j => j, downloadContentFromMessage: async () => (async function* () { yield Buffer.from([]); })(),
    fetchLatestBaileysVersion: async () => ({ version: [2, 3000, 1015901307] }),
    DisconnectReason: { loggedOut: 401 }, proto: {}, prepareWAMessageMedia: async () => ({}),
    generateWAMessageFromContent: () => ({}), S_WHATSAPP_NET: '@s.whatsapp.net',
    downloadMediaMessage: async () => Buffer.from([]), generateWAMessageContent: async () => ({})
};

let B = null;
let libName = 'none';

const makeOf = (lib) => lib && (typeof lib.makeWASocket === 'function' ? lib.makeWASocket : (typeof lib.default === 'function' ? lib.default : null));

function pick(m) {
    if (m && m.useMultiFileAuthState) return m;
    return m && m.default && typeof m.default === 'object' ? m.default : m;
}

async function init() {
    if (B) return libName;
    const candidates = process.env.WA_LIB ? [process.env.WA_LIB] : ['whitekid-sockets', '@whiskeysockets/baileys'];
    for (const name of candidates) {
        try {
            const lib = pick(await import(name));
            if (typeof makeOf(lib) !== 'function' || typeof lib.useMultiFileAuthState !== 'function') throw new Error('not a WhatsApp socket library');
            B = lib; libName = name;
            if (typeof lib.printBanner === 'function') { try { lib.printBanner(); } catch {} }
            console.log('🔌 WhatsApp library: ' + name);
            return libName;
        } catch (e) { console.warn('⚠️ Could not load ' + name + ': ' + e.message); }
    }
    console.warn('⚠️ No WhatsApp library could be loaded, running in offline fallback mode');
    B = {}; libName = 'fallback';
    return libName;
}

const get = (k) => (B && B[k] !== undefined ? B[k] : bf[k]);
const fn = (k) => (...a) => get(k)(...a);
const obj = (k) => new Proxy({}, { get: (_, p) => { const o = get(k); return o ? o[p] : undefined; }, has: (_, p) => p in (get(k) || {}) });

const makeWASocket = (...a) => {
    if (!B) throw new Error('WhatsApp library is not loaded yet (init() has not finished)');
    return (makeOf(B) || bf.default)(...a);
};

// Older code asks for a WhatsApp Web version. The Whitekid socket picks its own, so return undefined and let it.
const fetchLatestBaileysVersion = async () => {
    try { if (B && typeof B.fetchLatestBaileysVersion === 'function') return await B.fetchLatestBaileysVersion(); } catch {}
    return { version: undefined, isLatest: false };
};

module.exports = {
    init, libraryName: () => libName,
    Browsers: obj('Browsers'), DisconnectReason: obj('DisconnectReason'), proto: obj('proto'),
    delay: fn('delay'), downloadContentFromMessage: fn('downloadContentFromMessage'), downloadMediaMessage: fn('downloadMediaMessage'),
    fetchLatestBaileysVersion, generateWAMessageContent: fn('generateWAMessageContent'), generateWAMessageFromContent: fn('generateWAMessageFromContent'),
    getContentType: fn('getContentType'), jidNormalizedUser: fn('jidNormalizedUser'), makeCacheableSignalKeyStore: fn('makeCacheableSignalKeyStore'),
    makeWASocket, prepareWAMessageMedia: fn('prepareWAMessageMedia'), useMultiFileAuthState: fn('useMultiFileAuthState')
};
