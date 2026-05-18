# GitHub Copilot Instructions — TaskFlow

Purpose: give AI coding agents concise, project-specific guidance so generated changes are consistent with the team's architecture and workflows.

- 1) Big picture (what to know up front)
- This repo implements TaskFlow: a React + Vite frontend, Node/Express backend, and PostgreSQL data store. See the project outline in [implementation-guide.md](../implementation-guide.md#L1-L20) for the official stack and goals.
- Expected top-level layout: `frontend/`, `backend/`, `infrastructure/` (docker, kubernetes, helm, argocd), and `.github/workflows/`.
- Core data flow: frontend calls backend REST API (task endpoints: GET `/tasks`, POST `/tasks`, PUT `/tasks/:id`, DELETE `/tasks/:id` — listed in [implementation-guide.md](../implementation-guide.md#L145-L156)), backend persists to PostgreSQL.

2) Conventions & patterns to follow
- API surface: follow the `/tasks` routes described above; controllers should return JSON with `{ data, error? }` shape and proper HTTP status codes (200/201/400/404/500).
- Project structure: keep frontend code under `frontend/`, backend under `backend/`, infra manifests under `infrastructure/`. New services get their own top-level folder and CI workflow entry in `.github/workflows/`.
- Config & secrets: use environment variables for DB credentials and service ports; never hardcode secrets into code or manifests. Look for a future `infrastructure/docker` or `infrastructure/helm` for secret handling.
- Scripts: assume standard npm scripts for each service (verify `package.json` when present). For a Vite frontend use `npm install` + `npm run dev` locally and `npm run build` for production. For Node backend assume `npm run dev` (nodemon) and `npm start` for prod — confirm `package.json` before committing.

3) Developer workflows (how agents should run & test changes)
- Local dev: run frontend and backend in separate terminals inside `frontend/` and `backend/` using the scripts above. If `docker-compose.yml` is present under `infrastructure/docker/`, prefer reproducible compose-based runs for multi-service tests.
- Containerization: when adding Dockerfiles, follow multi-stage builds (install / build / runtime), expose the app port, and add a small health endpoint for readiness/liveness checks.
- CI/CD: every new service or change that affects build/test steps must add or update a workflow under `.github/workflows/`. Workflows should build, run linters, and run tests; if producing images, include image scans (Trivy) as a separate job.

4) Integration points and external dependencies
- PostgreSQL: backend expects a Postgres connection. Migration/seed scripts should be idempotent and live in `backend/db` or `backend/migrations`.
- Observability: the implementation guide calls for Prometheus/Grafana/Loki; when adding metrics or logs, prefer structured JSON logs and basic Prometheus counters/histograms in the backend.
- GitOps/infra: infrastructure manifests live in `infrastructure/argocd` or `infrastructure/kubernetes` for ArgoCD sync.

5) Safety checks and reviewer guidance for AI-generated changes
- Do not commit secrets or credentials. If a configuration requires secrets, add a comment telling reviewers where to put them (e.g., `infrastructure/helm/values.yaml` or secret manager).
- Keep changes minimal and focused: one PR per logical change (e.g., "add task create endpoint" vs "implement full feature + infra").
- Add or update tests for behavioral changes: unit tests for backend endpoints and a small integration smoke test where possible.

6) Examples & quick references (from this repo)
- Architecture summary: [implementation-guide.md](../implementation-guide.md#L1-L20)
- Task API endpoints to implement/test: [implementation-guide.md](../implementation-guide.md#L145-L156)
- Suggested repo layout: [implementation-guide.md](../implementation-guide.md#L60-L70)

7) When in doubt
- If files like `package.json`, `Dockerfile`, or workflow YAMLs exist, inspect them and match existing scripts and naming. Ask the human reviewer if conventions differ.
- If you need to modify deployment manifests, create a clear `README.md` inside the affected `infrastructure/` subfolder describing required environment variables and preview commands.

Please review this guidance and tell me any project-specific rules or examples you want included or corrected.