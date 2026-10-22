'use strict';
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { once } = require('node:events');

(async () => {
  const port = 19000 + Math.floor(Math.random() * 1000);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'patroner-server-test-'));
  const server = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', OPENROUTER_API_KEY: '', PATRONER_ACCESS_TOKEN: 'test-only-token', PATRONER_DAILY_AI_LIMIT: '2' },
    stdio: 'ignore'
  });
  try {
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try { const r = await fetch(`${base}/api/status`); if (r.status === 401) { ready = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 100));
    }
    assert.ok(ready, 'server should start and require the access token');
    let r = await fetch(`${base}/api/status`);
    assert.equal(r.status, 401, 'reject requests without the access token');
    r = await fetch(`${base}/api/status`, { headers: { Authorization: 'Bearer test-only-token' } });
    assert.equal(r.status, 200);
    const status = await r.json();
    assert.equal(status.configured, false, 'must report missing server key without exposing secrets');
    assert.equal(status.model, 'openrouter/free');
    assert.equal(status.dailyLimit, 2);
    r = await fetch(`${base}/`);
    assert.equal(r.status, 200, 'serve the app shell so users can enter the separate server access token');
    const html = await r.text();
    assert.match(html, /analyzeImageWithAI/);
    assert.match(html, /Patroner v1\.30/);
    r = await fetch(`${base}/api/vision-analysis`, { method: 'POST', headers: { Authorization: 'Bearer test-only-token', 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    assert.equal(r.status, 503, 'do not proxy upstream when server key is absent');
    const error = await r.json();
    assert.match(error.error, /OPENROUTER_API_KEY/);
    console.log('PASS: server access-token gate, status/quota metadata, app serving, and missing-key fail-closed behavior.');
  } finally {
    server.kill('SIGTERM');
    await Promise.race([once(server, 'exit'), new Promise(r => setTimeout(r, 1000))]);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
