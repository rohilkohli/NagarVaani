#!/bin/bash
set -e

PROJECT_ID=$(gcloud config get-value project)
REGION="asia-south1"
SERVICE_NAME="nagarvaani"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME"
IMAGE_TAG="${IMAGE}:$(git rev-parse --short HEAD)"

echo "🏗️  Building NagarVaani..."
npm run build

echo "🐳 Building Docker image..."
docker build -t "$IMAGE_TAG" .

echo "📤 Pushing to Container Registry..."
docker push "$IMAGE_TAG"

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image "$IMAGE_TAG" \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --set-env-vars "NODE_ENV=production,APP_URL=https://nagarvaani-bootstrap.invalid" \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest,\
ADMIN_SESSION_SECRET=ADMIN_SESSION_SECRET:latest,\
INTERNAL_JOB_KEY=INTERNAL_JOB_KEY:latest,\
FIREBASE_SERVICE_ACCOUNT_JSON=FIREBASE_SERVICE_ACCOUNT_JSON:latest,\
WHATSAPP_ACCESS_TOKEN=WHATSAPP_ACCESS_TOKEN:latest"

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)')

echo "✅ Deployed to: $SERVICE_URL"
gcloud run services update "$SERVICE_NAME" \
  --region "$REGION" \
  --update-env-vars "APP_URL=$SERVICE_URL"

echo "🩺 Running smoke checks..."
npm run smoke -- "$SERVICE_URL"
