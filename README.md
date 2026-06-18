# Likeness Finder

Mac-first web dashboard to upload your face, run multi-source searches, and sort every photo of your likeness into **Good**, **Neutral**, **Bad**, and **NSFW**.

## Two cost tiers

| Tier | Per scan | ~Monthly (10 scans) | Best for |
|------|----------|----------------------|----------|
| **Budget** | $0–0.02 | $0–5 | Paste URLs you found, local face verify + NSFW scoring |
| **Full deep** | $6–12 | $65–115 | FaceCheck + Lens + Yandex + AI + deep crawl |

### Budget tier (~$0)

Uses only free local services plus optional **one** SerpAPI Google Lens call per scan:

- CompreFace face verification (Docker, free)
- NudeNet NSFW detection (Docker, free)
- Heuristic classification (no OpenAI)
- Paste URLs to verify & classify
- Optional: `SERPAPI_KEY` for 1 Lens search (~$0.01/scan)

Open the budget UI at [/budget](http://localhost:3000/budget) or select **Budget** on the main dashboard.

### Full tier (~$65–115/mo)

- FaceCheck API (incl. adult indexes)
- SerpAPI Google Lens + Yandex Images
- Deep web crawl
- GPT-4o vision classification

## Quick start

```bash
npm install
docker compose up -d   # CompreFace + NudeNet (free, needed for budget tier)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo mode works without API keys.

## Environment variables

```bash
cp .env.local.example .env.local
```

| Variable | Budget | Full |
|----------|--------|------|
| `DEMO_MODE` | optional | optional |
| `COMPREFACE_URL` | recommended | recommended |
| `NUDENET_URL` | recommended | recommended |
| `SERPAPI_KEY` | optional (1 Lens/scan) | required |
| `FACECHECK_API_KEY` | — | required |
| `OPENAI_API_KEY` | — | recommended |
| `YANDEX_SEARCH_API_KEY` | — | optional |

## Flow

1. Upload 1–3 reference face photos
2. Choose **Budget** or **Full deep** tier
3. Confirm consent (+ 18+ for adult indexes on full tier)
4. Budget: paste URLs to check · Full: enable deep crawl
5. Review tabs: All · Good · Neutral · Bad · NSFW (blurred)
6. Export Good photos as ZIP

## Privacy

- Face data stored locally in `.data/`
- NSFW blurred by default
- Personal use only

## Repo

https://github.com/rocbase/likeness-finder