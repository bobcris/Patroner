# Patroner v1.30 — OpenRouter vision integration

## Architecture

The browser sends an image only after the user presses **Analyze image with free AI**. The browser talks to Patroner's Node server; the server calls OpenRouter. `OPENROUTER_API_KEY` is read only from the server environment and is never sent to the browser or written to logs. The selected router is `openrouter/free`, which may select different free models over time.

## Quota and cost guardrails

- Patroner server-side daily cap: 8 analysis requests per UTC day by default (`PATRONER_DAILY_AI_LIMIT`, capped at 20).
- Server-side per-client rate limit: 3 requests per rolling minute.
- Maximum image: 4 MiB; accepted formats: JPEG, PNG and WebP.
- Maximum generated output: 900 tokens.
- Upstream timeout: 45 seconds.
- No automatic retries. Requests are counted before upstream calls so repeated errors cannot bypass the cap.
- Daily usage count is stored locally in `data/ai-usage.json`; image bytes, prompts and model responses are not stored by the server.
- These limits are Patroner-side safeguards, not a guarantee of OpenRouter account quota. Set separate OpenRouter key limits and monitor account activity.

## Local setup

Requires Node.js 20.6 or later.

1. Revoke any API key that was pasted into a chat, issue tracker, or source file. Create a replacement key.
2. Copy `.env.example` to `.env`.
3. Put the replacement in `OPENROUTER_API_KEY` in `.env`. Never paste it into HTML, client JavaScript, a prompt, or this repository.
4. Run `npm start`.
5. Open `http://127.0.0.1:8787` on the same device.

For a cloud deployment, configure `OPENROUTER_API_KEY` using the host's secret manager and set a long random `PATRONER_ACCESS_TOKEN`. Also configure `HOST=0.0.0.0` and `PORT` as required by the host. Enter only the Patroner server access token in the app's optional token field. Put the service behind HTTPS and platform authentication where possible. Do not expose a public unauthenticated server with a usable OpenRouter key.

## AI output and limits

The model is instructed to return `patroner.vision-analysis` JSON with visible/inferred/unknown evidence, confidence, missing measurements, questions, proposed pieces and warnings. The imported result still requires schema validation and human review. Image pixels do not reveal reliable body measurements without calibration. AI output does not establish fit, seam correctness, or production readiness.

## Privacy and data handling

The image is not uploaded until the user explicitly requests analysis. It is sent to the configured Patroner server and then to OpenRouter for inference. Patroner does not persist the image or prompt. Provider-side handling is subject to OpenRouter and the selected model provider's current policies. Avoid sending identifiable or sensitive photos unless appropriate consent and data handling are in place.
