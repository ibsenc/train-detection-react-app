# Overnight Train Detection Dashboard

A React + TypeScript frontend (built with Vite) that visualizes automated audio-based train detections recorded overnight near a railroad crossing in Old Town, Tacoma, WA.

A recording device captures audio overnight (11PM–7AM) from indoors 2 blocks from the McCarver Street railroad crossing. A backend service (AWS Lambda + API Gateway) analyzes the audio and flags 65+ decibel events as "suspected trains." This dashboard displays that data via several panels:

- **Stats Panel** — aggregate metrics: total events, confirmed trains, false positives, unreviewed detections, last 24h/7d counts, avg/max decibel levels
- **Latest Train** — the most recent detected event with timestamp, decibel level, duration, and confirmation status
- **Detection Chart** — a chart of detections over time
- **Time Range Query** — filter and browse detections by date range
- **Audio Playback** — listen to the audio clip for any detection
- **Review Buttons** — manually confirm or reject whether a detection was actually a train

Visit the website: http://train-detection-ui-833495381683-us-west-2-an.s3-website-us-west-2.amazonaws.com/

---

## Local Development

```bash
npm install
npm run dev
```

The dev server uses backend url defined in `.env.local`:

```
VITE_API_BASE_URL=http://localhost:3000
```

---

## API URLs

Vite replaces all `import.meta.env.VITE_*` references at **build time** with literal values from the appropriate env file. No `.env` files are shipped — the URL is baked directly into the compiled JS.

| Context | File loaded | API target |
|---|---|---|
| `npm run dev` | `.env.local` | `http://localhost:3000` (proxied) |
| `npm run build` | `.env.production` | Lambda API Gateway URL |

The production URL is set in `.env.production`:

```
VITE_API_BASE_URL=https://x3ijuy265l.execute-api.us-west-2.amazonaws.com/prod/train-detection-express
```

To point to a different backend, update `.env.production` and rebuild.

---

## Production Deployment

Use the deploy script to build, archive, and push to S3 in one step:

```bash
./deploy.sh
```

The script will abort if you have uncommitted changes or are not on `main`. Once those checks pass, it will:
1. Run `npm run build`
2. Sync `dist/` to the S3 bucket, deleting stale files
3. Copy the deployed build to `deployments/<timestamp>/` as a local archive

> **Note:** Archives in `deployments/` are local only — if this machine is lost, rollback history is gone. Consider syncing archives to a second S3 bucket in the future (see the TODO in `deploy.sh`).

> **First-time setup:** The current live S3 build is not yet archived locally. To save it before your first deploy, run:
> ```bash
> aws s3 sync s3://train-detection-ui-833495381683-us-west-2-an/ deployments/pre-script/ --profile train-detection-deploy
> ```

### Manual rollback

To restore a previous build, pass its archive folder to `aws s3 sync`:

```bash
aws s3 sync deployments/<timestamp>/ s3://train-detection-ui-833495381683-us-west-2-an --delete --profile train-detection-deploy
```

List available archives:

```bash
ls deployments/
```

### 3. Verify

Open the S3 static website endpoint in your browser and confirm the dashboard loads and the API calls reach the Lambda. Link at the top of this file.
