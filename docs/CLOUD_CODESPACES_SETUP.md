# Cloud development with VS Code in the browser

Use the `patroner-v1.30-secure-setup.zip` starter archive with the workspace setup kit. Keep the OpenRouter key in the Codespaces secret named `OPENROUTER_API_KEY`; do not enter it into a source file. In the Codespace terminal, run `cd patroner`, `npm run configure:cloud`, then `npm start`. The configure script creates a random local `PATRONER_ACCESS_TOKEN` and configures the server to bind to port 8787 for a private forwarded preview. Enter the printed Patroner access token in the app. Never set the forwarded port to Public.
