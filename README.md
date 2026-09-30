# NagarVaani 🏛️
### Multilingual AI Platform for Citizen Infrastructure Intelligence

> Built for **Build with AI: Code for Communities — Second Edition** (Google Cloud × Hack2Skill)  
> **Track 1: AI for Digital Public Infrastructure & Governance** | BRICS Theme: Innovation

NagarVaani aggregates citizen infrastructure complaints via voice, text, and photo across 
BRICS nations, uses Gemini 3.7 Flash to classify and prioritise them, and surfaces 
actionable recommendations to policymakers on a real-time dashboard.

---

## Live Demo
🔗 [Deployed Link] ← add after Cloud Run deployment

---

## The Problem
Governments across BRICS nations receive 10 crore+ citizen helpline calls monthly. 
40–60% go unresolved — not from lack of schemes, but from fragmented, 
non-digitised intake systems with no AI triage layer.

## Our Solution
A scalable Digital Public Good that:
- Accepts citizen complaints in **any language** via voice, text, or photo
- Uses **Gemini 3.7 Flash** to classify, translate, and score urgency in real time
- Aggregates into a **geospatial heatmap** showing demand hotspots
- Generates **AI-ranked priority recommendations** for policymakers
- Demonstrates **BRICS cross-border applicability** in a dedicated comparison view

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 |
| AI Engine | Gemini 3.7 Flash (`@google/genai`) |
| Backend | Express + Vite SSR (`server.ts`) |
| Database | Firebase Firestore (real-time) |
| Storage | Firebase Storage (photo uploads) |
| Maps | Google Maps API + deck.gl HeatmapLayer |
| Deployment | Cloud Run |

---

## Quick Start

```bash
git clone https://github.com/rohilkohli/NagarVaani.git
cd NagarVaani
npm install
cp .env.example .env
# Add your API keys to .env (see setup-guide.md)
npm run dev
```

Open http://localhost:3000

For an intentionally credential-free demo run, use:

```bash
APP_MODE=demo NODE_ENV=development GEMINI_API_KEY=demo-key npm run dev
```

The server uses `PORT=3000` by default. Set `PORT` to another available port
when running alongside another local service.

## Validation and deployment checks

Run the same checks used by CI locally:

```bash
npm run check:env
npm run lint
npm test
npm run build
npm run dev
# in another terminal:
npm run smoke -- http://localhost:3000
```

Cloud Run deployment expects the production secrets `GEMINI_API_KEY`,
`ADMIN_SESSION_SECRET`, `INTERNAL_JOB_KEY`, and `FIREBASE_SERVICE_ACCOUNT_JSON`
to exist in Secret Manager. The deployment script updates `APP_URL` to the
assigned service URL and runs the health/readiness smoke test automatically.

Retention cleanup is exposed only to the internal scheduler at
`POST /api/internal/retention` with the `INTERNAL_JOB_KEY`. Configure Cloud
Scheduler or a Pub/Sub-triggered job to call it daily. Status changes and staff
session creation are written to the backend-only `audit_logs` collection.

### Accessibility

On a visitor's first visit, NagarVaani asks whether accessibility support is
needed. Visitors can enable larger text, higher contrast, and reduced motion.
The choice is stored locally in the browser and does not require an account.

---

## Environment Variables

```
GEMINI_API_KEY=           # From aistudio.google.com
VITE_FIREBASE_API_KEY=    # From Firebase Console
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_MAPS_API_KEY= # From Google Cloud Console
ADMIN_SESSION_SECRET=      # Long random secret used only for short-lived staff sessions
INTERNAL_JOB_KEY=          # Long random secret for internal asynchronous AI job dispatch
GRAPH_API_VERSION=v23.0    # Meta Graph API version used by WhatsApp media and replies
PII_REDACTION_ENABLED=true # Redact contact and identity patterns before Gemini requests
RETENTION_DAYS=365         # Retention policy used by scheduled deletion jobs
WHATSAPP_PHONE_NUMBER_ID= # Meta Business WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=    # Meta Cloud API System User Token
WHATSAPP_WEBHOOK_VERIFY_TOKEN= # Set a private random verification token
META_APP_SECRET=          # Meta App Secret
```

WhatsApp message idempotency is held in a bounded, 10,000-entry per-process LRU
with a 24-hour TTL. It is per server instance; production deployments should
also use a shared queue or Firestore idempotency record for cross-instance retry
deduplication.

### Staff authentication and roles

Dashboard access uses Firebase Authentication with Google sign-in; there is no shared
dashboard password or production password fallback. After creating a Firebase Auth user,
provision a matching Firestore document at `users/{firebaseUid}`:

```json
{
  "email": "operator@example.org",
  "displayName": "Operations User",
  "role": "operator",
  "disabled": false
}
```

Supported roles are `admin`, `supervisor`, `operator`, and `auditor`. The backend
verifies the Firebase ID token, loads this persistent role record, and signs a
short-lived session used by protected operational APIs. Only `admin` and `supervisor`
accounts can seed demo data; `admin`, `supervisor`, and `operator` accounts can update
complaint status.

---

## WhatsApp Integration Setup
1. Create Meta Business account at business.facebook.com
2. Create an app → Add WhatsApp product
3. Get a test phone number from Meta
4. Set webhook URL: `{YOUR_CLOUD_RUN_URL}/api/whatsapp/webhook`
5. Set verify token from `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
6. Subscribe to: `messages`, `message_deliveries`
7. Add env vars: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `META_APP_SECRET`
8. Citizens can now report by WhatsApp to your number!

---

## Deploy to Cloud Run

### Prerequisites
- Google Cloud SDK installed
- Docker Desktop running  
- Project with billing enabled

### One-command deploy:
```bash
# Login to Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com

# Store secrets
echo -n "$GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY --data-file=-

# Deploy
bash deploy.sh
```

The script outputs your live Cloud Run URL.
Update APP_URL in Cloud Run env vars to that URL.

---

## Evaluation Criteria Alignment

| Criterion | Weight | How We Address It |
|---|---|---|
| AI/Technical Execution | 25% | Gemini 3.7 Flash for classification, transcription, prioritisation |
| Problem-Solution Fit | 20% | Directly solves Track 1 challenge statement |
| Cross-Border Applicability | 20% | Live BRICS comparison view, 5-nation seed data |
| Deployability & Scalability | 20% | Cloud Run deployment, Firebase real-time, no infra changes per nation |
| Impact Potential | 10% | 3.6B BRICS citizens, government policymaker-ready output |
| Presentation & Clarity | 5% | Live demo, seed data pre-loaded |

---

## Project Structure

```
├── app/
│   ├── citizen/page.tsx         # Citizen complaint portal (warm light UI)
│   ├── dashboard/page.tsx       # Policymaker dashboard (dark bento UI)
│   └── api/                     # classify / prioritize / transcribe / seed
├── components/
│   ├── citizen/VoiceInput.tsx   # Mic recording + Gemini transcription
│   └── dashboard/
│       ├── StatsPanel.tsx       # 4 stat cards + category breakdown + trend
│       ├── DemandHeatmap.tsx    # Google Maps + deck.gl HeatmapLayer
│       ├── PriorityPanel.tsx    # AI priority sidebar widget
│       ├── PriorityRankingsView.tsx  # Full AI priorities page
│       └── BRICSComparison.tsx  # Cross-border comparison table
├── lib/
│   ├── types.ts                 # Submission + PriorityRecommendation interfaces
│   ├── seedData.ts              # 60 realistic submissions across 5 BRICS nations
│   └── firebase.ts              # Firestore + Storage init
└── server.ts                    # Express API server (Gemini calls live here)
```

---

*Submitted to Build with AI: Code for Communities — Second Edition | Demo Day: Sept 4, 2026*
