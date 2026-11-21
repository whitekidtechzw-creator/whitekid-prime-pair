'use strict';
// Keeps free hosts (Render and similar) from putting the bot to sleep.
// - pings the bot's own public /ping every few minutes
// - boost(): pings every minute for a while, called whenever someone starts pairing
const http = require('http');
const https = require('https');

const SLOW = Math.max(60, Number(process.env.KEEP_ALIVE_SECONDS) || 240) * 1000; // default every 4 minutes
const FAST = 60 * 1000;
let last = 0, boostUntil = 0, fails = 0, timer = null, warned = false;

function urls() {
    const set = new Set();
    for (const v of [process.env.RENDER_EXTERNAL_URL, process.env.RENDER_KEEP_ALIVE_URL, process.env.KEEP_ALIVE_URL, process.env.APP_URL]) {
        if (v && /^https?:\/\//i.test(v.trim())) set.add(v.trim().replace(/\/+$/, ''));
    }
    return [...set];
}

function ping(base) {
    return new Promise((resolve) => {
        const lib = base.startsWith('https') ? https : http;
        const req = lib.get(base + '/ping', { timeout: 15000, headers: { 'user-agent': 'whitekid-keepalive' } }, (r) => { r.resume(); resolve(r.statusCode); });
        req.on('timeout', () => { req.destroy(); resolve(0); });
        req.on('error', () => resolve(0));
    });
}

async function tick() {
    const list = urls();
    if (!list.length) {
        if (!warned) { warned = true; console.log('💤 Keep-alive: no public URL found. Set KEEP_ALIVE_URL to your site address (Render sets RENDER_EXTERNAL_URL by itself).'); }
        return;
    }
    const now = Date.now();
    if (now >= boostUntil && now - last < SLOW) return;
    last = now;
    for (const u of list) {
        const code = await ping(u);
        if (code >= 200 && code < 500) { if (fails) console.log('✅ Keep-alive is back'); fails = 0; }
        else { fails++; if (fails === 1 || fails % 10 === 0) console.warn('[KEEP-ALIVE] ping failed (' + u + ')'); }
    }
}

function start() {
    if (timer) return;
    timer = setInterval(() => { tick().catch(() => {}); }, FAST);
    setTimeout(() => tick().catch(() => {}), 20000).unref?.();
    // deliberately NOT unref'd for the interval: a running timer is part of staying awake
}

// Someone is pairing: ping every minute for the next 20 minutes
function boost(minutes = 20) {
    boostUntil = Math.max(boostUntil, Date.now() + minutes * 60 * 1000);
    last = 0;
    tick().catch(() => {});
}

module.exports = { start, boost };
