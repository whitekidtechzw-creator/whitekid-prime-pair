'use strict';
/*
 * Whitekid Prime — AI engine.
 * Every AI command goes through ask(): it walks an ordered list of providers, throws away empty / HTML / error
 * answers, and returns the first real text plus the name of the engine that produced it.
 *
 * Most reliable setup: set AI_API_KEY (+ optional AI_BASE_URL, AI_MODEL) in .env to any OpenAI-compatible
 * service (OpenAI, Groq, OpenRouter, Gemini's OpenAI endpoint, ...). It is tried first for every AI command.
 * Without a key the bot falls back to free public endpoints, which can be slow or down at any time.
 */
const { AI_FULL_NAME, AI_SHORT_NAME, AI_SYSTEM_IDENTITY, DEVELOPER_NUMBER, config } = require('./config');

const ENV = () => ({ key: process.env.AI_API_KEY || '', base: (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''), model: process.env.AI_MODEL || 'gpt-4o-mini' });

async function http(url, { method = 'GET', headers = {}, body, timeout = 20000, text = false } = {}) {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), timeout);
    try {
        const res = await fetch(url, { method, headers: { 'user-agent': 'Mozilla/5.0 (WhitekidPrime)', ...headers }, body, signal: ac.signal });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const raw = await res.text();
        if (text) return raw;
        try { return JSON.parse(raw); } catch { return raw; }
    } finally { clearTimeout(t); }
}

// ───── answer cleaning ─────
const KEYS = ['result', 'response', 'message', 'text', 'answer', 'output', 'reply', 'content', 'data', 'msg', 'completion'];
function pickText(d, depth = 0) {
    if (d === null || d === undefined || depth > 4) return null;
    if (typeof d === 'string') { const s = d.trim(); return s || null; }
    if (Array.isArray(d)) { for (const x of d) { const r = pickText(x, depth + 1); if (r) return r; } return null; }
    if (typeof d === 'object') {
        if (d.status === false || d.success === false || d.error) return null;
        const c = d.choices && d.choices[0];
        if (c) { const r = pickText(c.message ? c.message.content : (c.text ?? (c.delta && c.delta.content)), depth + 1); if (r) return r; }
        for (const k of KEYS) if (k in d) { const r = pickText(d[k], depth + 1); if (r) return r; }
    }
    return null;
}
const BAD = /^(<!doctype|<html|<\?xml|error\b|invalid\b|unauthori[sz]ed|forbidden|not found|bad gateway|service unavailable|rate limit|too many requests|\{\s*"?error|ok$|success$|true$|false$|null$|undefined$)/i;
const good = s => typeof s === 'string' && s.trim().length > 1 && !BAD.test(s.trim()) && !/^https?:\/\/\S+$/.test(s.trim());

// ───── providers ─────
const POL_MODEL = { chatgpt: 'openai', chatgpt4: 'openai', gpt4: 'openai', ai: 'openai', claude: 'claude', gemini: 'gemini', deepseek: 'deepseek', llama: 'llama', mistral: 'mistral', qwen: 'qwen-coder', aicode: 'qwen-coder' };

const enc = encodeURIComponent;
const flat = (system, user) => `${system}\n\nUser: ${user}`.slice(0, 1800);

function dedicated(cmd, user, system) {
    const pax = m => config.PAXSENIX_API_KEY ? [`paxsenix ${m}`, () => http(`${config.PAXSENIX_URL}/ai/${m}`, { method: 'POST', headers: { Authorization: `Bearer ${config.PAXSENIX_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ message: flat(system, user) }), timeout: 30000 })] : null;
    const dreaded = p => [`dreaded ${p}`, () => http(`https://api.dreaded.site/api/${p}?text=${enc(flat(system, user))}`, { timeout: 25000 })];
    const gifted = p => [`gifted ${p}`, () => http(`${config.GIFTED_TECH_API}/api/ai/${p}?apikey=gifted&q=${enc(flat(system, user))}`, { timeout: 20000 })];
    const L = {
        chatgpt4: [pax('gpt-4o'), dreaded('chatgpt4')], gpt4: [pax('gpt-4o'), dreaded('chatgpt4')],
        chatgpt: [pax('gpt-4o'), dreaded('chatgpt4')],
        gemini: [pax('gemini-2.0-flash'), dreaded('gemini'), gifted('geminiaipro')],
        claude: [pax('claude-3-5-haiku')],
        deepseek: [pax('deepseek-v3'), dreaded('deepseek'), ['siputzx deepseek', () => http(`https://api.siputzx.my.id/api/ai/deepseek?text=${enc(flat(system, user))}`, { timeout: 25000 })]],
        llama: [['nexray llama', () => http(`${config.NEXRAY_API}/ai/llamacoder?model=qwen3-coder&prompt=${enc(flat(system, user))}`, { timeout: 30000 })], pax('llama-3.1-8b')],
        aicode: [['siputzx code', () => http(`https://api.siputzx.my.id/api/ai/codegpt?prompt=${enc(user)}`, { timeout: 30000 })], pax('gpt-4o')],
        mathgpt: [['elite mathgpt', () => http(`${config.ELITE_API}/mathgpt?question=${enc(user)}`, { timeout: 30000 })]],
        ai: [pax('gpt-4o'), pax('gemini-2.0-flash')]
    };
    return (L[cmd] || [pax('gpt-4o')]).filter(Boolean);
}

function chain(cmd, user, system) {
    const E = ENV(), list = [];
    const messages = [{ role: 'system', content: system }, { role: 'user', content: user }];
    const openai = (name, base, key, model) => [name, () => http(`${base}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ model, messages }), timeout: 45000 })];
    if (E.key) list.push(openai('your AI key', E.base, E.key, E.model));
    else if (config.OPENAI_API_KEY) list.push(openai('openai', 'https://api.openai.com/v1', config.OPENAI_API_KEY, 'gpt-4o-mini'));
    list.push(...dedicated(cmd, user, system));
    const pm = POL_MODEL[cmd] || 'openai';
    for (const m of [...new Set([pm, 'openai'])]) {
        list.push([`pollinations ${m}`, () => http('https://text.pollinations.ai/openai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: m, messages, private: true }), timeout: 40000 })]);
    }
    list.push(['pollinations text', () => http(`https://text.pollinations.ai/${enc(user.slice(0, 1500))}?model=${pm}&system=${enc(system.slice(0, 400))}&private=true`, { text: true, timeout: 40000 })]);
    list.push(['hostify grok', () => http('https://api.hostify.indevs.in/api/ai/grok', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: flat(system, user) }), timeout: 30000 })]);
    list.push(['knight chat', () => http(`https://knightbotapi.stream/api/ai/chat?apikey=${process.env.KNIGHT_API_KEY || 'knight'}&text=${enc(flat(system, user))}&query=${enc(flat(system, user))}`, { timeout: 40000 })]);
    list.push(['knight gpt', () => http(`https://knightbotapi.stream/api/ai/gpt?apikey=${process.env.KNIGHT_API_KEY || 'knight'}&text=${enc(flat(system, user))}&query=${enc(flat(system, user))}`, { timeout: 40000 })]);
    list.push(['shizo gpt', () => http(`https://api.shizo.top/ai/gpt?apikey=shizo&query=${enc(flat(system, user))}`, { timeout: 30000 })]);
    list.push(['zell chatbot', () => http(`https://zellapi.autos/ai/chatbot?text=${enc(flat(system, user))}`, { timeout: 30000 })]);
    list.push(['vapis gemini', () => http(`https://vapis.my.id/api/gemini?q=${enc(flat(system, user))}`, { timeout: 30000 })]);
    list.push(['faa gemini', () => http(`https://api-faa.my.id/faa/gemini-ai?text=${enc(flat(system, user))}`, { timeout: 30000 })]);
    list.push(['hercai', () => http(`https://hercai.onrender.com/v3/hercai?question=${enc(flat(system, user))}`, { timeout: 30000 })]);
    list.push(['dreaded gemini', () => http(`https://api.dreaded.site/api/gemini?text=${enc(flat(system, user))}`, { timeout: 25000 })]);
    list.push(['siputzx deepseek', () => http(`https://api.siputzx.my.id/api/ai/deepseek?text=${enc(flat(system, user))}`, { timeout: 25000 })]);
    return list;
}

const BASE_SYSTEM = `${AI_SYSTEM_IDENTITY} You are chatting on WhatsApp: answer clearly and helpfully, keep it reasonably short, use short paragraphs, no markdown tables or headings.`;

const IDENTITY = ['who created you', 'who made you', 'who are you', 'your creator', 'who built you', 'what is your name', 'what are you', 'introduce yourself', 'tell me about yourself', 'what does prime stand for', 'full name'];
const identityText = () => `🤖 I am *${AI_SHORT_NAME}* — *${AI_FULL_NAME}*.\n\nCreated by *WhiteKid Tech*, in 2026.\n📞 wa.me/${DEVELOPER_NUMBER}\n📱 t.me/whitekid01`;

async function ask(user, { cmd = 'ai', system, deadline = 75000 } = {}) {
    const u = String(user || '').trim();
    if (!u) return null;
    if (!system && IDENTITY.some(t => u.toLowerCase().includes(t))) return { text: identityText(), engine: 'built-in' };
    const t0 = Date.now(), tried = [];
    for (const [name, run] of chain(cmd, u, system || BASE_SYSTEM)) {
        if (Date.now() - t0 > deadline) break;
        try {
            const text = pickText(await run());
            if (good(text)) return { text: text.trim(), engine: name, tried };
            tried.push(name + ': empty');
        } catch (e) { tried.push(`${name}: ${e.name === 'AbortError' ? 'timeout' : e.message}`); }
    }
    console.error('[AI] all providers failed →', tried.join(' | '));
    return null;
}

// ───── commands ─────
const SPECS = {
    ai: { title: 'Prime AI', icon: '🤖', react: '🤖', usage: 'ai <your question>' },
    chatgpt: { title: 'ChatGPT', icon: '🧠', react: '🧠', usage: 'chatgpt <question>' },
    chatgpt4: { title: 'ChatGPT 4', icon: '🧠', react: '🧠', usage: 'chatgpt4 <question>' },
    gpt4: { title: 'GPT-4', icon: '🧠', react: '🧠', usage: 'gpt4 <question>' },
    claude: { title: 'Claude', icon: '🪄', react: '🪄', usage: 'claude <question>' },
    gemini: { title: 'Gemini', icon: '💎', react: '💎', usage: 'gemini <question>' },
    copilot: { title: 'Copilot', icon: '🛩️', react: '🛩️', usage: 'copilot <question>' },
    blackbox: { title: 'Blackbox', icon: '⬛', react: '⬛', usage: 'blackbox <question or code task>', system: BASE_SYSTEM + ' You are especially good at programming; put code in fenced blocks.' },
    deepseek: { title: 'DeepSeek', icon: '🧬', react: '🧬', usage: 'deepseek <question>' },
    llama: { title: 'LLaMA', icon: '🦙', react: '🦙', usage: 'llama <question>' },
    mistral: { title: 'Mistral', icon: '🌪️', react: '🌪️', usage: 'mistral <question>' },
    qwen: { title: 'Qwen', icon: '🐉', react: '🐉', usage: 'qwen <question>' },
    grok: { title: 'Grok', icon: '⚡', react: '⚡', usage: 'grok <question>' },
    mathgpt: { title: 'MathGPT', icon: '🔢', react: '🔢', usage: 'mathgpt <math problem>', system: BASE_SYSTEM + ' You are a patient maths tutor: solve step by step, then state the final answer clearly.' },
    aicode: { title: 'AI Code', icon: '💻', react: '💻', usage: 'aicode <what to build>', system: BASE_SYSTEM + ' Write clean, working, commented code in a fenced block, then explain it in one or two lines.' },
    animeai: { title: 'Anime AI', icon: '🌸', react: '🌸', usage: 'animeai <say something>', system: BASE_SYSTEM + ' Role-play as Prime-chan, a cheerful, playful anime girl. Stay in character, use a few emojis, keep replies short.' },
    aiwrite: { title: 'AI Writer', icon: '✍️', react: '✍️', usage: 'aiwrite <topic or what to write>', system: BASE_SYSTEM + ' Write a well-structured piece of writing on the requested topic.' },
    aiexplain: { title: 'AI Explain', icon: '🎓', react: '🎓', usage: 'aiexplain <anything>', system: BASE_SYSTEM + ' Explain the topic simply, like to a curious teenager, with one short example.' },
    aigrammar: { title: 'AI Grammar', icon: '✅', react: '✅', usage: 'aigrammar <text>   (or reply to a message)', system: BASE_SYSTEM + ' Correct spelling and grammar. Reply with the corrected text first, then a one-line list of what changed.' },
    airecipe: { title: 'AI Recipe', icon: '🍲', react: '🍲', usage: 'airecipe <dish or ingredients you have>', system: BASE_SYSTEM + ' Give a simple recipe: ingredients, then short numbered steps.' },
    aiemail: { title: 'AI Email', icon: '📧', react: '📧', usage: 'aiemail <what the email is about>', system: BASE_SYSTEM + ' Write a clear, polite email with a subject line.' },
    aipoem: { title: 'AI Poem', icon: '🪶', react: '🪶', usage: 'aipoem <topic>', system: BASE_SYSTEM + ' Write a short original poem on the topic.' },
    aistory: { title: 'AI Story', icon: '📖', react: '📖', usage: 'aistory <idea>', system: BASE_SYSTEM + ' Write a short, original story (under 250 words) with a clear ending.' },
    aiplan: { title: 'AI Planner', icon: '🗓️', react: '🗓️', usage: 'aiplan <goal>', system: BASE_SYSTEM + ' Turn the goal into a practical step-by-step plan with realistic timings.' },
    aisummary: { title: 'AI Summary', icon: '📝', react: '📝', usage: 'aisummary <text>   (or reply to a message)', system: BASE_SYSTEM + ' Summarise the user text into a few clear bullet points, then one line of takeaway.' },
    aitranslate: { title: 'AI Translate', icon: '🌍', react: '🌍', usage: 'aitranslate <language> | <text>   (or reply to a message: aitranslate french)' }
};
const NAMES = Object.keys(SPECS);

const LANG = { english: 'en', shona: 'sn', ndebele: 'nd', swahili: 'sw', french: 'fr', spanish: 'es', portuguese: 'pt', german: 'de', italian: 'it', arabic: 'ar', hindi: 'hi', chinese: 'zh-CN', japanese: 'ja', korean: 'ko', russian: 'ru', turkish: 'tr', zulu: 'zu', afrikaans: 'af', indonesian: 'id', dutch: 'nl' };

function quotedTextOf(msg) {
    const qm = msg && msg.message && msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.quotedMessage;
    if (!qm) return '';
    return qm.conversation || (qm.extendedTextMessage && qm.extendedTextMessage.text) || (qm.imageMessage && qm.imageMessage.caption) || (qm.videoMessage && qm.videoMessage.caption) || '';
}

// returns { title, icon, text, engine } | { usage } | { error }
async function handle(cmd, q, { quoted = '', translateLib = null } = {}) {
    const spec = SPECS[cmd]; if (!spec) return { error: 'unknown AI command' };
    q = String(q || '').trim(); quoted = String(quoted || '').trim();
    const base = { title: spec.title, icon: spec.icon };

    if (cmd === 'aitranslate') {
        let lang = '', text = '';
        if (q.includes('|')) { const i = q.indexOf('|'); lang = q.slice(0, i).trim(); text = q.slice(i + 1).trim(); }
        else if (quoted) { lang = q; text = quoted; }
        else { const [l, ...r] = q.split(/\s+/); lang = l || ''; text = r.join(' '); }
        if (!lang || !text) return { usage: spec.usage };
        const r = await ask(`Translate the following text into ${lang}. Reply with ONLY the translation, nothing else.\n\n${text}`, { cmd: 'ai', system: 'You are a precise translator. Output only the translated text.' });
        if (r) return { ...base, text: `🌍 ${lang}\n\n${r.text}`, engine: r.engine };
        const code = LANG[lang.toLowerCase()] || (/^[a-z]{2}(-[A-Za-z]{2})?$/.test(lang) ? lang : null);
        if (code && translateLib) { try { const fn = translateLib.translate || translateLib; const t = await fn(text, { to: code }); if (t && t.text) return { ...base, text: `🌍 ${lang}\n\n${t.text}`, engine: 'google translate' }; } catch { /* fall through */ } }
        return { error: 'Translation is unavailable right now. Try again in a moment.' };
    }

    let input = q;
    if (cmd === 'aisummary' || cmd === 'aigrammar') input = q || quoted;
    else if (q && quoted) input = `${q}\n\n(Context — the message being replied to:)\n${quoted}`;
    else if (!q) input = quoted;
    if (!input) return { usage: spec.usage };

    const r = await ask(input, { cmd: cmd === 'animeai' || cmd === 'aisummary' ? 'ai' : cmd, system: spec.system });
    if (!r) return { error: `${spec.title} is not answering right now. Please try again in a moment, or use another AI command.` };
    return { ...base, text: r.text.length > 4000 ? r.text.slice(0, 4000) + '…' : r.text, engine: r.engine };
}

module.exports = { NAMES, SPECS, ask, chain, good, handle, identityText, pickText, quotedTextOf };
