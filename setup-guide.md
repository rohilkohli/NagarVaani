# NagarVaani — Setup & Deployment Guide

NagarVaani is an AI-powered multilingual platform for citizen infrastructure
grievance aggregation. It runs in two modes:

| Mode | Firebase | Auth | What judges see |
|---|---|---|---|
| `demo` (default) | ❌ not needed | ❌ not needed | In-memory sandbox, seed data pre-loaded |
| `live` | ✅ required | ✅ required | Real Firestore, Firebase Auth, full admin roles |

---

## 0 · Prerequisites

```bash
node --version   # ≥ 20
npm --version    # ≥ 10
gcloud --version # Google Cloud SDK ≥ 470
docker --version # Docker Desktop running
```

---

## 1 · Local demo run (zero credentials)

```bash
git clone https://github.com/rohilkohli/NagarVaani.git
cd NagarVaani
npm install
APP_MODE=demo NODE_ENV=development npm run dev
```

Open http://localhost:3000 — seed data is pre-loaded, no login needed.

To test with Gemini classification:

```bash
APP_MODE=demo GEMINI_API_KEY=<your-key> npm run dev
```

---

## 2 · Acceptance test (local production build)

Verify the acceptance criteria from the task spec:

```bash
# Build the production bundle + server binary
APP_MODE=demo NODE_ENV=production GEMINI_API_KEY=x npm run build

# Start the production server
APP_MODE=demo NODE_ENV=production GEMINI_API_KEY=x npm start

# In a second terminal — smoke test must pass
npm run smoke -- http://localhost:3000
```

---

## 3 · Deploy to Cloud Run (demo mode) — manual steps

### Step 1 — Authenticate and set project

```bash
gcloud auth login
gcloud auth configure-docker
gcloud config set project YOUR_PROJECT_ID
```

### Step 2 — Enable required APIs (one-time)

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com
```

### Step 3 — Store the Gemini API key in Secret Manager

> Only GEMINI_API_KEY is required for demo mode. If you already have it stored,
> skip this step.

```bash
# Create (first time)
echo -n "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
    --data-file=- \
    --replication-policy=automatic

# Or update an existing secret
echo -n "YOUR_GEMINI_API_KEY" | \
  gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

### Step 4 — Grant Cloud Run the secret accessor role

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 5 — Build and push the Docker image

```bash
IMAGE="gcr.io/YOUR_PROJECT_ID/nagarvaani"
GIT_SHA=$(git rev-parse --short HEAD)

npm run build
docker build -t "${IMAGE}:${GIT_SHA}" -t "${IMAGE}:latest" .
docker push "${IMAGE}:${GIT_SHA}"
docker push "${IMAGE}:latest"
```

### Step 6 — Deploy to Cloud Run

```bash
gcloud run deploy nagarvaani \
  --image "gcr.io/YOUR_PROJECT_ID/nagarvaani:${GIT_SHA}" \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 1 \
  --set-env-vars "NODE_ENV=production,APP_MODE=demo" \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

> **`--max-instances=1`** is intentional: the in-memory idempotency LRU and
> demo sandbox are per-instance. One instance handles demo load comfortably.
> For live mode, raise this and switch to a shared queue / Firestore idempotency.

### Step 7 — Retrieve the service URL and update APP_URL

```bash
SERVICE_URL=$(gcloud run services describe nagarvaani \
  --region asia-south1 \
  --format 'value(status.url)')

echo "Live at: ${SERVICE_URL}"

gcloud run services update nagarvaani \
  --region asia-south1 \
  --update-env-vars "APP_URL=${SERVICE_URL}"
```

### Step 8 — Verify health and run smoke test

```bash
curl -f "${SERVICE_URL}/api/health"
curl -f "${SERVICE_URL}/api/ready"
npm run smoke -- "${SERVICE_URL}"
```

### Or run everything in one command

```bash
# The script does steps 5-8 automatically:
bash deploy.sh
```

---

## 4 · Automated deploy via Cloud Build

Trigger a full build+deploy+health-check pipeline:

```bash
gcloud builds submit --config cloudbuild.yaml .
```

The build submits the local repo context, runs `docker build`, pushes the image,
deploys to Cloud Run (asia-south1, max-instances=1, APP_MODE=demo), waits up to
90 seconds for `/api/health`, then verifies `/api/ready`.

---

## 5 · Switching to live mode (full Firebase)

Additional secrets needed:

```bash
# Firebase Admin service account JSON
gcloud secrets create FIREBASE_SERVICE_ACCOUNT_JSON \
  --data-file=firebase-service-account.json \
  --replication-policy=automatic

# Staff session signing secret (≥32 random chars)
openssl rand -base64 32 | \
  gcloud secrets create ADMIN_SESSION_SECRET --data-file=-

# Internal job dispatch key
openssl rand -base64 32 | \
  gcloud secrets create INTERNAL_JOB_KEY --data-file=-
```

Deploy in live mode:

```bash
APP_MODE=live bash deploy.sh
```

This attaches all three secrets and sets `APP_MODE=live`.

---

## 6 · WhatsApp integration

Requires live mode plus:

```bash
echo -n "$WHATSAPP_ACCESS_TOKEN" | \
  gcloud secrets create WHATSAPP_ACCESS_TOKEN --data-file=-
```

Set the webhook URL in Meta Developer Portal:

```
https://YOUR_CLOUD_RUN_URL/api/whatsapp/webhook
```

Verify token: set `WHATSAPP_WEBHOOK_VERIFY_TOKEN` as an env var on the service.

Local testing:

```bash
META_APP_SECRET=demo-meta-secret INTERNAL_JOB_KEY=local-job-key npm run dev
# In another terminal:
META_APP_SECRET=demo-meta-secret npm exec tsx scripts/simulate-whatsapp.ts
```

---

## 7 · Environment variables reference

| Variable | Demo | Live | Description |
|---|---|---|---|
| `APP_MODE` | `demo` | `live` | Runtime mode |
| `NODE_ENV` | `production` | `production` | Node environment |
| `GEMINI_API_KEY` | optional | required | From aistudio.google.com |
| `APP_URL` | auto-set | auto-set | Cloud Run service URL |
| `ADMIN_SESSION_SECRET` | ❌ | required | Staff JWT signing secret |
| `INTERNAL_JOB_KEY` | ❌ | required | Internal job dispatch auth |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | ❌ | required | Firebase Admin credentials |
| `VITE_FIREBASE_*` | ❌ | required | Client Firebase config |
| `GOOGLE_MAPS_API_KEY` | optional | optional | Runtime Maps API key (injected via `/config.js`) |
| `VITE_GOOGLE_MAPS_API_KEY` | optional | optional | Optional build-time Maps API key fallback |
| `META_APP_SECRET` | ❌ | required for WhatsApp | Webhook signature |
| `WHATSAPP_ACCESS_TOKEN` | ❌ | required for WhatsApp | Cloud API token |
| `RETENTION_DAYS` | — | 365 | Retention policy (days) |

### Google Maps runtime key & referrer restrictions

1. In Google Cloud Console, enable **Maps JavaScript API**.
2. Set website restrictions strictly to:
   - `https://nagarvaani-636001394004.asia-south1.run.app/*`
   - `http://localhost:3000/*`
   - `http://localhost:5173/*`
3. In Cloud Run, update the runtime environment variable:
   ```bash
   gcloud run services update nagarvaani --region asia-south1 --update-env-vars GOOGLE_MAPS_API_KEY=<key>
   ```
4. Geocoding automatically uses `google.maps.Geocoder` from the JS API so HTTP referrer restrictions work seamlessly without `REQUEST_DENIED`. If no key is set, NagarVaani renders the non-map telemetry fallback.


---

## 8 · Scheduled retention job

In live mode, schedule a daily Pub/Sub-triggered Cloud Run job:

```bash
gcloud scheduler jobs create http nagarvaani-retention \
  --schedule="0 2 * * *" \
  --uri="${SERVICE_URL}/api/internal/retention" \
  --message-body='{"retentionDays":365}' \
  --headers="X-Internal-Job-Key=YOUR_INTERNAL_JOB_KEY,Content-Type=application/json" \
  --location=asia-south1
```
