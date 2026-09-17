# Single Next.js full-stack app instead of separate frontend/backend

The alternative was a React/Vite frontend talking to a standalone API service. We chose one Next.js codebase (UI + API routes + server rendering) because there's only one consumer of the data (this web app — no mobile client or third-party integration planned) and one deployable is simpler to build, run, and hand off to hospital IT on an intranet server. Revisit only if a second client (e.g. a mobile app) needs to hit the same API independently.
