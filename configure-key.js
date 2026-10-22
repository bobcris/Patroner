'use strict';
// Secure local setup helper: accepts the API key without echoing it and writes only to ignored .env.
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const envPath = path.join(__dirname, '.env');

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
      reject(new Error('Run this setup in an interactive terminal so the key can be hidden.'));
      return;
    }
    process.stdout.write(prompt);
    let value = '';
    const stdin = process.stdin;
    const cleanup = () => { stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData); process.stdout.write('\n'); };
    const onData = (buf) => {
      for (const ch of buf.toString('utf8')) {
        if (ch === '\u0003') { cleanup(); reject(new Error('Cancelled.')); return; }
        if (ch === '\r' || ch === '\n') { cleanup(); resolve(value.trim()); return; }
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else if (ch >= ' ') value += ch;
      }
    };
    stdin.setRawMode(true); stdin.resume(); stdin.on('data', onData);
  });
}

(async () => {
  try {
    const key = await readHidden('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');
    if (!key || !/^sk-or-v1-[A-Za-z0-9_-]+$/.test(key)) throw new Error('That does not look like an OpenRouter API key. No file was changed.');
    let existing = '';
    try { existing = fs.readFileSync(envPath, 'utf8'); } catch {}
    const lines = existing.split(/\r?\n/).filter(line => !/^\s*OPENROUTER_API_KEY\s*=/.test(line));
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    lines.push(`OPENROUTER_API_KEY=${key}`);
    fs.writeFileSync(envPath, lines.join('\n') + '\n', { mode: 0o600 });
    try { fs.chmodSync(envPath, 0o600); } catch {}
    process.stdout.write('Saved the key to local .env. The key was not printed.\nNext: npm start, then open http://127.0.0.1:8787\n');
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exitCode = 1;
  }
})();
