# Secure local OpenRouter key setup

Patroner intentionally does not embed an OpenRouter API key in HTML, JavaScript, or a distributable archive. Browser-visible credentials can be extracted and abused.

For local development:

1. Revoke any key that has been exposed in chat or shared text.
2. Run `npm run configure` in an interactive terminal.
3. Paste the replacement key at the hidden prompt. The helper stores it in `.env`, applies restrictive file permissions where supported, and does not print it.
4. Run `npm start`.
5. Keep `.env` private. It is excluded by `.gitignore` and should never be uploaded or committed.

The OpenRouter key is read only by `server.js`. The browser calls the local server, which enforces request limits and forwards the request to `openrouter/free`. Defaults are eight requests per UTC day, three requests per minute per client, a 4 MiB image cap, 900 output tokens, 45-second timeout, and no automatic retries. These are local safety limits, not a guarantee of provider availability or cost; also set limits in the OpenRouter dashboard.

For remote hosting, use the hosting platform's secret manager rather than this local `.env` workflow. Bind the server privately, enable HTTPS, and configure `PATRONER_ACCESS_TOKEN`.
