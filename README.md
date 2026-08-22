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
- Uses **Gemini 2.5 Flash** to classify, translate, and score urgency in real time
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
```

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
