'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('app/index.html', 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(m => m[1]).filter(s => s.trim());
if (!scripts.length) throw new Error('No inline scripts found');
for (const [i, script] of scripts.entries()) new vm.Script(script, { filename: `inline-script-${i + 1}.js` });
console.log(`PASS: ${scripts.length} inline script(s) parse successfully.`);
