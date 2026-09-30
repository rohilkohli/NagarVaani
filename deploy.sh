#!/usr/bin/env bash
# deploy.sh — Build, push, and deploy NagarVaani to Cloud Run (asia-south1).
#
# Demo deploy: APP_MODE=demo requires only GEMINI_API_KEY in Secret Manager.
# Live deploy: additionally requires ADMIN_SESSION_SECRET, INTERNAL_JOB_KEY,
#              FIREBASE_SERVICE_ACCOUNT_JSON.
#
# Usage:
#   bash deploy.sh           # demo mode (default)
#   APP_MODE=live bash deploy.sh
set -euo pipefail

DEPLOY_MODE="${APP_MODE:-demo}"
PROJECT_ID="$(gcloud config get-value project)"
REGION="asia-south1"
SERVICE_NAME="nagarvaani"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"
IMAGE_TAG="${IMAGE}:${GIT_SHA}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NagarVaani deploy · mode=${DEPLOY_MODE} · ${REGION}"
echo "  project=${PROJECT_ID}  image=${IMAGE_TAG}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "🏗️  Building frontend + server bundle…"
npm run build

echo ""
echo "🐳 Building Docker image…"
docker build -t "${IMAGE_TAG}" -t "${IMAGE}:latest" .

echo ""
echo "📤 Pushing to Container Registry…"
docker push "${IMAGE_TAG}"
docker push "${IMAGE}:latest"

# ── Assemble gcloud deploy flags ─────────────────────────────────────────────

ENV_VARS="NODE_ENV=production,APP_MODE=${DEPLOY_MODE}"

# Secrets always present
SET_SECRETS="GEMINI_API_KEY=GEMINI_API_KEY:latest"

if [ "${DEPLOY_MODE}" = "live" ]; then
  echo ""
  echo "🔐 Live mode: attaching all secrets…"
  SET_SECRETS="${SET_SECRETS},ADMIN_SESSION_SECRET=ADMIN_SESSION_SECRET:latest"
  SET_SECRETS="${SET_SECRETS},INTERNAL_JOB_KEY=INTERNAL_JOB_KEY:latest"
  SET_SECRETS="${SET_SECRETS},FIREBASE_SERVICE_ACCOUNT_JSON=FIREBASE_SERVICE_ACCOUNT_JSON:latest"
  # WhatsApp is optional even in live mode
  if gcloud secrets describe WHATSAPP_ACCESS_TOKEN --project="${PROJECT_ID}" &>/dev/null; then
    SET_SECRETS="${SET_SECRETS},WHATSAPP_ACCESS_TOKEN=WHATSAPP_ACCESS_TOKEN:latest"
  fi
fi

echo ""
echo "🚀 Deploying to Cloud Run…"
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_TAG}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 1 \
  --set-env-vars "${ENV_VARS}" \
  --set-secrets "${SET_SECRETS}"

# ── Retrieve service URL and update APP_URL ───────────────────────────────────
SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format 'value(status.url)')"

echo ""
echo "✅ Deployed to: ${SERVICE_URL}"

# Update APP_URL env var on the running service (needed for WhatsApp reply links in live mode)
gcloud run services update "${SERVICE_NAME}" \
  --region "${REGION}" \
  --update-env-vars "APP_URL=${SERVICE_URL}"

# ── Health + readiness smoke checks ──────────────────────────────────────────
echo ""
echo "🩺 Running health checks…"
for attempt in $(seq 1 30); do
  if curl --fail --silent --max-time 5 "${SERVICE_URL}/api/health" > /dev/null; then
    echo "   /api/health ✅"
    break
  fi
  echo "   attempt ${attempt}/30 — waiting 3 s…"
  sleep 3
done

curl --fail --silent --show-error "${SERVICE_URL}/api/ready" | grep -q '"status":"ready"' && echo "   /api/ready ✅" || echo "   /api/ready ⚠️  (non-fatal in demo)"

# ── Full smoke test ───────────────────────────────────────────────────────────
echo ""
echo "🔥 Running smoke test against ${SERVICE_URL}…"
npm run smoke -- "${SERVICE_URL}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎉  NagarVaani is live at:"
echo "      ${SERVICE_URL}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
