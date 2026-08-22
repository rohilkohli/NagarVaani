#!/bin/bash
set -e

PROJECT_ID=$(gcloud config get-value project)
REGION="asia-south1"
SERVICE_NAME="nagarvaani"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🏗️  Building NagarVaani..."
npm run build

echo "🐳 Building Docker image..."
docker build -t $IMAGE .

echo "📤 Pushing to Container Registry..."
docker push $IMAGE

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest,\
WHATSAPP_ACCESS_TOKEN=WHATSAPP_ACCESS_TOKEN:latest"

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)')

echo "✅ Deployed to: $SERVICE_URL"
echo "Update APP_URL in Cloud Run env vars to: $SERVICE_URL"
