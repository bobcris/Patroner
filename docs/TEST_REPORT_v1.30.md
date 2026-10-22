# Patroner v1.30 test report

Date: 2026-10-22

## Automated checks

- PASS: all previous geometry, grading, manufacturing, vision-schema, assembly, and draft-pipeline regression tests.
- PASS: standalone inline JavaScript syntax parsing.
- PASS: server access-token gate on API routes.
- PASS: quota status metadata reports model, daily limit, usage, and remaining allowance without exposing the API key.
- PASS: application HTML is served so the user can enter a separate Patroner access token when configured.
- PASS: vision endpoint fails closed with HTTP 503 when `OPENROUTER_API_KEY` is not configured.

## Guardrails implemented

- Model: `openrouter/free` (free model router; exact provider model may vary).
- Daily Patroner cap: 8 requests per UTC day by default, configurable up to 20.
- Per-client request limit: 3 per rolling minute.
- Input image cap: 4 MiB; accepted JPEG, PNG, WebP.
- Output cap: 900 tokens; 45-second upstream timeout.
- No automatic retries; requests are counted before upstream calls.
- API key remains server-side; prompt and image are not persisted by Patroner.

## Not verified

- No live OpenRouter request was made because no API key was supplied through a secure server environment.
- No browser-driven UI test was completed in this environment.
- Free-model availability, image capability, output quality, and provider quota are dynamic and can change.
- AI interpretations are not body measurements and do not certify fit or manufacturing readiness.
