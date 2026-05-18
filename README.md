# TaskFlow — Local dev

Run frontend and backend locally for development.

Frontend (Vite + React + TypeScript):

```bash
cd frontend
npm install
npm run dev
```

Backend (Node + Express):

```bash
cd backend
npm install
npm run dev
```

Notes:
- The backend scaffold uses an in-memory task store. Replace with Postgres integration under `backend/db` when ready.
- Add `.env` for DB credentials and other env vars; do not commit secrets.
 
Docker compose (local):

```bash
docker-compose up --build
```

This will build `frontend` and `backend` images and start a `postgres` service. Frontend is exposed on host port `5173` (served from nginx in the container) and backend on `3000`.

CI / Release:
- A workflow exists at `.github/workflows/ci.yml` which builds both frontend and backend and pushes images to Docker Hub. Set `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` in repository secrets before enabling pushes.
