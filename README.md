# Patroner v1.30

Rule-driven garment patternmaking prototype with an optional server-side OpenRouter vision-analysis path.

## Quick start (AI-enabled)

1. Install Node.js 20.6+.
2. Open a terminal in this folder and run `npm run configure`.
3. Paste a **new** OpenRouter key when prompted. Input is hidden; the key is stored only in local `.env` with restrictive file permissions. Do not share `.env` or include it in uploads.
4. Run `npm start` and open `http://127.0.0.1:8787`.
5. Choose a JPEG, PNG or WebP garment reference and press **Analyze image with free AI**.

If an API key has been pasted into chat or another shared location, revoke it and configure a replacement. The setup helper does not put credentials in HTML or JavaScript source.

The integration uses OpenRouter's `openrouter/free` model router. Patroner defaults to 8 AI requests per UTC day, 3 requests per minute, a 4 MiB image cap, 900 output tokens, a 45-second timeout, and no automatic retries. Configure a separate provider key limit and monitor OpenRouter activity as an additional control.

For a hosted deployment, set `OPENROUTER_API_KEY` as a server secret, set `PATRONER_ACCESS_TOKEN` to a long random value, use HTTPS, and follow `docs/OPENROUTER_INTEGRATION_v1.30.md`. The access token is distinct from the OpenRouter API key.

## Offline use

`app/index.html` retains the drafting and validation features. Directly opening the standalone HTML does not enable remote AI analysis; run the server for the secure proxy path.

## Tests

```sh
npm test
```

The automated tests verify geometry/grading regression, inline script syntax, server access-token gating, quota metadata, static app serving and fail-closed behavior when no API key is configured. They do not call OpenRouter or verify live vision quality.

## Known limits

Vision analysis is a design interpretation, not a source of true body measurements. AI output must be reviewed and confirmed before drafting. Skirt construction is experimental; trouser and bodice constructors remain scaffolds. Browser-driven interaction, professional reference-block comparisons and physical toile validation remain outstanding.
