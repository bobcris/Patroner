'use strict';
// Create a local cloud preview token. The OpenRouter key should be a Codespaces secret.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const envPath = path.join(__dirname, '.env');
const token = crypto.randomBytes(32).toString('base64url');
let existing = '';
try { existing = fs.readFileSync(envPath, 'utf8'); } catch {}
const keep = existing.split(/\r?\n/).filter(line => line && !/^\s*(PATRONER_ACCESS_TOKEN|HOST|PORT|PATRONER_DAILY_AI_LIMIT)\s*=/.test(line));
keep.push('HOST=0.0.0.0', 'PORT=8787', 'PATRONER_DAILY_AI_LIMIT=8', `PATRONER_ACCESS_TOKEN=${token}`);
fs.writeFileSync(envPath, keep.join('\n') + '\n', { mode: 0o600 });
try { fs.chmodSync(envPath, 0o600); } catch {}
process.stdout.write('\nPatroner cloud access token (shown once; enter it in the app, do not share it):\n' + token + '\n\nOpenRouter key is expected from the Codespaces secret OPENROUTER_API_KEY.\n.env is ignored by Git and must never be committed.\n');
