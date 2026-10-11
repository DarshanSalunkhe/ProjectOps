# Shared AI setup and verification

ProjectOps routes supported project questions to deterministic backend logic, then personalized generation to backend Ollama/Gemma, then to configurable Gemini. Client device capabilities do not determine routing. Existing membership checks protect every project chat and personalized planning request.

Configuration belongs in the root `.env.local`, which the existing backend configuration reads. See `backend/.env.example` for the new variables. Start Ollama on the backend host and pull the configured model (`ollama pull gemma3:4b`). For cloud fallback configure `GEMINI_API_KEY`; default model is `gemini-3.5-flash-lite`. Model and pricing remain configurable. Rates were checked against https://ai.google.dev/gemini-api/docs/pricing (0.30 USD input and 2.50 USD output per million tokens). Keys remain on the backend.

The frontend now defaults to same-origin `/api`; Vite proxies it in development. For phone access, expose the frontend on the LAN and configure allowed backend CORS origins if using a separate `VITE_API_URL`. In production route `/api` to the shared backend. Ollama does not need to be exposed to clients.

Reuse migration 019 for accounting. It is already applied in the configured database. Monthly budgets use usage-log totals in the current calendar month, rather than stale spend counters. User and project row locks serialize accounting across backend processes. Cloud requests reserve a conservative maximum cost, including ambiguous failures. Caching and concurrent duplicate suppression are bounded, in-process and scoped to user/project/context; horizontally scaled deployments need shared cache/dedup storage. Subscription entitlements can be configured through `AI_ENTITLEMENTS_JSON`, with a default entitlement and optional `users` map keyed by user ID. Payments are not implemented.

Plans are previews until the existing approval action is selected. Applying a plan validates task IDs, dependencies/cycles, milestone dates and task titles, locks the project, rejects duplicate titles, writes through the existing transaction and records activity. Recovery continues using saved proposals, snapshot checks and existing approval permissions. AI explanations do not change backend scores or calculations. Chat change suggestions can be reviewed and applied with the existing task editor; they do not execute automatically. Conversation history lasts while the chat is mounted and resets on project changes.

Verified on October 11, 2026:
- Fresh production frontend build and backend syntax build passed.
- Backend startup connected to PostgreSQL; health endpoint succeeded.
- 16 backend tests passed (14 existing regressions and 2 new AI routing tests).
- 11 frontend tests passed.
- 3 Chromium checks passed: Sign In, Sign Up (colour, hover, focus, dark mode), and sidebar chat typing/send/loading/history and provider-error recovery with isolated mocked data.
- Live authorized chat returned a database-grounded built-in answer (200).
- Invalid calendar date and injected system-role history returned 400; unauthenticated chat returned 401.
- Live personalized chat used Gemini fallback (200); live personalized planning returned a Gemini-generated preview (200). No preview was applied to existing project tasks.
- Mocked local Gemma, cloud fallback, permission-scoped caching, in-flight dedup, budget rejection, and unavailable-provider error paths passed.

Remaining setup/verification limits: Ollama is not running on this host, so real Gemma execution is unverified. Start Ollama and install the configured model to exercise the local path. Live phone/LAN access and live applying generated proposals were not tested; existing transaction/approval regression tests passed. Existing unrelated workspace modifications were preserved. The previous Gemini 2.5 Flash-Lite default returned 404 for new-user access and was replaced with the available model above.
