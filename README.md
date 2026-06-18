# Likeness Finder

Mac-first web dashboard to upload your face, run multi-source searches, and sort every photo of your likeness into **Good**, **Neutral**, **Bad**, and **NSFW**.

**Repo:** https://github.com/rocbase/likeness-finder

---

## Prerequisites

| Tool | Required for | Install |
|------|----------------|---------|
| **Docker Desktop** | All setups (CompreFace + NudeNet) | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Node.js 20+** | Local dev only (not Docker-only) | [nodejs.org](https://nodejs.org/) |

---

## How to run

### Option 1 — Docker only (recommended, no Node required)

Runs the dashboard + CompreFace + NudeNet entirely in containers.

```bash
# 1. Clone
git clone https://github.com/rocbase/likeness-finder.git
cd likeness-finder

# 2. Optional: add API keys (demo mode works without them)
cp .env.docker.example .env
# edit .env if you have FaceCheck / SerpAPI / OpenAI keys

# 3. Start everything (first run builds images — takes a few minutes)
docker compose --profile full up -d --build

# 4. Wait for CompreFace to finish starting (~60–90 seconds on first launch)
docker compose logs -f compreface-api
# Stop following logs when you see the service is up (Ctrl+C)

# 5. Open the dashboard
open http://localhost:3000
```

**Shortcuts:**

```bash
npm run docker:full    # same as step 3
npm run docker:logs    # tail app logs
npm run docker:down    # stop all containers
```

**Pages:**

| URL | Mode |
|-----|------|
| http://localhost:3000 | Full search (all sites) |
| http://localhost:3000/budget | Budget tier (~$0) |
| http://localhost:3000/nsfw | NSFW-only (porn/image boards) |

**Data persistence:** Scan history, photos, and thumbnails are stored in the Docker volume `app-data`. They survive restarts.

**Stop & remove:**

```bash
docker compose --profile full down        # stop containers
docker compose --profile full down -v     # also delete volumes (wipes scan data)
```

---

### Option 2 — Hybrid (Docker services + local Node dev)

Best for development. Docker runs face/NSFW services; Next.js runs on your Mac with hot reload.

```bash
git clone https://github.com/rocbase/likeness-finder.git
cd likeness-finder

# 1. Start backing services only (CompreFace + NudeNet)
docker compose up -d
# or: npm run docker:up

# 2. Configure environment
cp .env.local.example .env.local

# 3. Install & run the app locally
npm install
npm run dev
```

Open **http://localhost:3000** (or **:3001** if 3000 is already in use).

`.env.local` for hybrid mode:

```bash
DEMO_MODE=true
COMPREFACE_URL=http://localhost:8000
NUDENET_URL=http://localhost:5001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Option 3 — Production build (local Node, no Docker app container)

```bash
docker compose up -d          # still need CompreFace + NudeNet in Docker
cp .env.local.example .env.local
npm install
npm run build
npm run start
```

Open **http://localhost:3000**.

---

## First-time CompreFace setup (optional)

CompreFace works out of the box for basic face verification. For API-key auth or advanced config:

1. After `docker compose up`, wait ~90 seconds for CompreFace to initialize.
2. Open **http://localhost:8000** (CompreFace API status) — should return OK.
3. (Optional) Access CompreFace Admin UI if exposed, create an application, copy the API key into `.env` / `.env.local` as `COMPREFACE_API_KEY`.

The app falls back to pseudo-similarity scoring if CompreFace is unreachable (demo mode).

---

## Verify services are running

```bash
# CompreFace
curl http://localhost:8000/api/v1/status

# NudeNet sidecar
curl http://localhost:5001/health

# App status (Docker-only or local dev)
curl http://localhost:3000/api/status
```

In the dashboard sidebar, green dots next to **compreface** and **nudenet** mean local services are connected.

---

## Scan modes

### Full search (`/`)

Multi-source deep search across the open web. Good / Neutral / Bad / NSFW tabs.

### Budget tier (`/budget`) — ~$0/scan

- CompreFace + NudeNet (local Docker, free)
- Heuristic classification (no OpenAI)
- Paste URLs to verify manually
- Optional: `SERPAPI_KEY` for 1 Google Lens call per scan (~$0.01)

### NSFW-only (`/nsfw`)

- Restricted to **porn tubes, image boards, and adult forums**
- LinkedIn, Twitter, news, etc. are excluded
- Only NSFW face matches shown (blurred until reveal)
- **18+ consent required**

Supported categories: Pornhub, XVideos, XHamster, 4chan/booru, leak boards, OnlyFans, etc.

---

## Environment variables

Copy the example file for your setup:

| File | Use with |
|------|----------|
| `.env.local.example` → `.env.local` | Hybrid / local dev |
| `.env.docker.example` → `.env` | Docker-only (`--profile full`) |

| Variable | Budget | Full | NSFW-only |
|----------|--------|------|-----------|
| `DEMO_MODE` | optional | optional | optional |
| `COMPREFACE_URL` | auto in Docker | auto in Docker | auto in Docker |
| `NUDENET_URL` | auto in Docker | auto in Docker | auto in Docker |
| `SERPAPI_KEY` | optional | required | recommended |
| `FACECHECK_API_KEY` | — | required | required for live adult search |
| `OPENAI_API_KEY` | — | recommended | optional |
| `YANDEX_SEARCH_API_KEY` | — | optional | optional |

**Cost estimates (10 deep scans/month):**

| Tier | Monthly |
|------|---------|
| Budget (Docker only) | $0–5 |
| Full deep | $65–115 |

---

## Typical workflow

1. Upload 1–3 clear face photos
2. Pick tier: **Budget**, **Full**, or open **/nsfw** for adult-only
3. Confirm consent (+ 18+ where required)
4. Start scan — progress bar shows pipeline status
5. Review results: Good · Neutral · Bad · NSFW (blurred)
6. NSFW hits: click **Reveal** → read **Takedown guidance**
7. Export **Good** photos as ZIP (NSFW = source links only)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 3000 in use | Stop other apps or change `ports: "3001:3000"` in `docker-compose.yml` |
| CompreFace not connected | Wait 90s after first `docker compose up`; check `docker compose logs compreface-api` |
| NudeNet not connected | `docker compose logs nudenet` — rebuild with `docker compose build nudenet` |
| Demo results only | Expected without API keys; set `DEMO_MODE=false` and add keys in `.env` |
| Scan data lost | Don't run `docker compose down -v` unless you want to wipe volumes |
| `better-sqlite3` build error (local) | Use Node 20+, or use Docker-only mode instead |

---

## Privacy

- Face data stored locally in `.data/` (or Docker volume `app-data`)
- NSFW thumbnails blurred by default
- CSAM-flagged content blocked (NCMEC guidance only)
- Personal use only — not a surveillance tool

---

## Project structure

```
likeness-finder/
├── docker-compose.yml      # CompreFace + NudeNet (+ app with --profile full)
├── Dockerfile              # Next.js app image
├── services/nudenet/       # Local NSFW scoring sidecar
├── src/app/                # Dashboard pages (/  /budget  /nsfw)
├── src/lib/services/       # Search pipeline, classifiers
└── .data/                  # Local SQLite + photos (gitignored)
```