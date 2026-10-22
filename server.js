'use strict';
// Patroner v1.30 OpenRouter proxy. Keep OPENROUTER_API_KEY server-side only.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const API_KEY = process.env.OPENROUTER_API_KEY || '';
const ACCESS_TOKEN = process.env.PATRONER_ACCESS_TOKEN || '';
const DAILY_LIMIT = Math.max(1, Math.min(20, Number(process.env.PATRONER_DAILY_AI_LIMIT || 8)));
const MINUTE_LIMIT = 3;
const MAX_BODY = 6 * 1024 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_OUTPUT_TOKENS = 900;
const USAGE_FILE = path.join(ROOT, 'data', 'ai-usage.json');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
const minuteBuckets = new Map();

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(payload), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(payload);
}
function utcDay() { return new Date().toISOString().slice(0, 10); }
function readUsage() {
  try { const x = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8')); return x.day === utcDay() ? x : { day: utcDay(), count: 0 }; }
  catch { return { day: utcDay(), count: 0 }; }
}
function writeUsage(x) {
  fs.mkdirSync(path.dirname(USAGE_FILE), { recursive: true });
  const tmp = USAGE_FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(x), { mode: 0o600 }); fs.renameSync(tmp, USAGE_FILE);
}
function authorized(req) {
  if (!ACCESS_TOKEN) return true;
  const supplied = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!supplied || supplied.length !== ACCESS_TOKEN.length) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(ACCESS_TOKEN));
}
function clientKey(req) { return String(req.socket.remoteAddress || 'unknown').slice(0, 100); }
function rateLimited(req) {
  const now = Date.now(), key = clientKey(req), old = (minuteBuckets.get(key) || []).filter(t => now - t < 60_000);
  if (old.length >= MINUTE_LIMIT) { minuteBuckets.set(key, old); return true; }
  old.push(now); minuteBuckets.set(key, old);
  if (minuteBuckets.size > 5000) for (const [k, times] of minuteBuckets) if (!times.some(t => now - t < 60_000)) minuteBuckets.delete(k);
  return false;
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0, chunks = [];
    req.on('data', chunk => { size += chunk.length; if (size > MAX_BODY) { reject(Object.assign(new Error('Request too large.'), { status: 413 })); req.destroy(); return; } chunks.push(chunk); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(Object.assign(new Error('Invalid JSON request.'), { status: 400 })); } });
    req.on('error', reject);
  });
}
function sendFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) return json(res, 404, { error: 'Not found.' });
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'content-length': data.length, 'x-content-type-options': 'nosniff', 'cache-control': 'no-store', 'content-security-policy': "default-src 'self' data: blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" }); res.end(data);
  });
}
function makePrompt(data) {
  const allowed = ['skirt','trouser','bodice','sleeve','dress','jacket','shirt','unknown'];
  const garment = allowed.includes(data.garment) ? data.garment : 'unknown';
  const notes = String(data.designNotes || '').slice(0, 3000);
  return `You are Patroner, a garment design analysis assistant. Analyze the attached reference image for sewing-pattern planning. Return ONLY one valid JSON object matching this schema: {"schema":"patroner.vision-analysis","schemaVersion":"1.0.0","garment":"${garment}","confidence":0.0,"views":["front"],"features":{"silhouette":{"value":"...","evidence":"visible|inferred|unknown","confidence":0.0},"neckline":{"value":"...","evidence":"visible|inferred|unknown","confidence":0.0},"sleeve":{"value":"...","evidence":"visible|inferred|unknown","confidence":0.0},"waistPlacement":{"value":"...","evidence":"visible|inferred|unknown","confidence":0.0},"hem":{"value":"...","evidence":"visible|inferred|unknown","confidence":0.0},"closure":{"value":"...","evidence":"visible|inferred|unknown","confidence":0.0},"fabric":{"value":"...","evidence":"visible|inferred|unknown","confidence":0.0},"details":{"value":"...","evidence":"visible|inferred|unknown","confidence":0.0}},"missingMeasurements":[],"questions":[],"unobservable":[],"proposedPieces":[],"warnings":[]}. Confidence must be between 0 and 1. Never infer true body dimensions or scale from an uncalibrated image. Distinguish visible evidence from inference, state uncertainty, do not claim production readiness. User's garment-family hint: ${garment}. Additional design intent: ${notes || '(none)'}. If a feature is not visible, mark it unknown and explain what additional view is needed.`;
}
async function analyze(req, res) {
  if (!API_KEY) return json(res, 503, { error: 'Server is not configured. Set OPENROUTER_API_KEY in the server environment; never place it in the HTML.' });
  if (rateLimited(req)) return json(res, 429, { error: `Local rate limit: at most ${MINUTE_LIMIT} AI requests per minute.` });
  const usage = readUsage();
  if (usage.count >= DAILY_LIMIT) return json(res, 429, { error: `Patroner daily safety limit reached (${DAILY_LIMIT} requests UTC day). Try again after UTC midnight.`, remaining: 0, dailyLimit: DAILY_LIMIT });
  const data = await readBody(req);
  if (!data || typeof data !== 'object') return json(res, 400, { error: 'Expected a JSON object.' });
  const image = String(data.imageDataUrl || '');
  const match = image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return json(res, 400, { error: 'Choose a JPEG, PNG, or WebP image.' });
  const imageBytes = Buffer.from(match[2], 'base64');
  if (!imageBytes.length || imageBytes.length > MAX_IMAGE_BYTES) return json(res, 413, { error: 'Image must be smaller than 4 MB.' });
  if (imageBytes.toString('base64').replace(/=+$/, '') !== match[2].replace(/=+$/, '')) return json(res, 400, { error: 'Malformed image data.' });
  // Count before calling upstream so repeated failures cannot evade the daily cap.
  usage.count += 1; writeUsage(usage);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', signal: controller.signal,
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost:8787', 'X-Title': 'Patroner v1.30' },
      body: JSON.stringify({ model: 'openrouter/free', messages: [{ role: 'user', content: [{ type: 'text', text: makePrompt(data) }, { type: 'image_url', image_url: { url: image } }] }], max_tokens: MAX_OUTPUT_TOKENS, temperature: 0.1, stream: false })
    });
    const raw = await upstream.text();
    let result; try { result = JSON.parse(raw); } catch { result = null; }
    if (!upstream.ok) return json(res, upstream.status === 429 ? 429 : 502, { error: `OpenRouter request failed (${upstream.status}). No automatic retry was attempted.`, remaining: Math.max(0, DAILY_LIMIT - usage.count), dailyLimit: DAILY_LIMIT });
    const content = result && result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content;
    if (typeof content !== 'string') return json(res, 502, { error: 'The selected free model returned an unsupported response format.', remaining: Math.max(0, DAILY_LIMIT - usage.count), dailyLimit: DAILY_LIMIT });
    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    let parsed; try { parsed = JSON.parse(cleaned); } catch { return json(res, 502, { error: 'The free model did not return valid JSON. Request counted; no retry was made.', raw: cleaned.slice(0, 5000), remaining: Math.max(0, DAILY_LIMIT - usage.count), dailyLimit: DAILY_LIMIT }); }
    return json(res, 200, { analysis: parsed, model: result.model || 'openrouter/free', usage: result.usage || null, remaining: Math.max(0, DAILY_LIMIT - usage.count), dailyLimit: DAILY_LIMIT, warning: 'AI interpretation is an unverified design hypothesis. Confirm features and measurements before drafting.' });
  } catch (e) {
    return json(res, 502, { error: e.name === 'AbortError' ? 'OpenRouter timed out. Request counted; no retry was made.' : 'Could not reach OpenRouter. Request counted; no retry was made.', remaining: Math.max(0, DAILY_LIMIT - usage.count), dailyLimit: DAILY_LIMIT });
  } finally { clearTimeout(timeout); }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/') && !authorized(req)) return json(res, 401, { error: 'Patroner server access token required.' });
    if (req.method === 'GET' && url.pathname === '/api/status') {
      const usage = readUsage(); return json(res, 200, { configured: Boolean(API_KEY), model: 'openrouter/free', dailyLimit: DAILY_LIMIT, usedToday: usage.count, remaining: Math.max(0, DAILY_LIMIT - usage.count), imageMaxBytes: MAX_IMAGE_BYTES, outputTokenCap: MAX_OUTPUT_TOKENS, timezone: 'UTC' });
    }
    if (req.method === 'POST' && url.pathname === '/api/vision-analysis') return await analyze(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed.' });
    const requested = url.pathname === '/' ? '/app/index.html' : decodeURIComponent(url.pathname);
    const file = path.resolve(ROOT, '.' + requested);
    if (!file.startsWith(ROOT + path.sep)) return json(res, 403, { error: 'Forbidden.' });
    return sendFile(res, file);
  } catch (e) { if (!res.headersSent) json(res, e.status || 500, { error: e.message || 'Server error.' }); else res.destroy(); }
});
server.listen(PORT, HOST, () => console.log(`Patroner v1.30 listening at http://${HOST}:${PORT}; model=openrouter/free; dailyLimit=${DAILY_LIMIT}; keyConfigured=${Boolean(API_KEY)}; accessTokenRequired=${Boolean(ACCESS_TOKEN)}`));
