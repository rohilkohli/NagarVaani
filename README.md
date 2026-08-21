# NagarVaani 🏛️

**NagarVaani** is a full-stack multilingual AI platform for aggregating citizen infrastructure complaints and surfacing priority recommendations to government policymakers across BRICS nations (India, Brazil, South Africa, Russia, China, and expanding partners).

---

## 🚀 Key Features

1. **Multilingual Citizen Intake Portal (`/citizen`)**:
   - Voice & text input in native languages (Hindi, Portuguese, Russian, Mandarin, English, Tamil, Marathi, Zulu, etc.).
   - BRICS Country, State, and District jurisdiction selector with live GPS coordinate pinpointing.
   - Evidence photo upload with camera support.
   - Severity & Urgency rating (1 to 5) with category tagging (Water, Roads, Electricity, Sanitation, Health, Education, Other).
   - Real-time AI triage preview using **Gemini 3.7 Flash**.

2. **Policymaker Command Dashboard (`/dashboard`)**:
   - **Gemini 3.7 Flash Priority Recommendations Matrix**: Synthesizes cluster density, severity scores, and population impact into ranked policy directives for municipal engineers and district collectors.
   - **Geospatial Heatmap & Incident Clusters**: Visualizes regional infrastructure distress across BRICS cities (Mumbai, São Paulo, Johannesburg, Moscow, Beijing, etc.).
   - **Clean Active Requests Data Table**: High-density interactive table with multi-criteria filters (Sector, Urgency, Country, Status, Search).
   - **Status Workflow & Inspection Modal**: Seamless transition from *Pending* → *Classified* → *Prioritized*.
   - **One-Click CSV Export**: Formats civic datasets for governmental review and departmental dispatch.

3. **AI Core & Cloud Infrastructure**:
   - **Gemini 3.7 Flash** via `@google/genai` for real-time translation, category classification, and policy rationale generation.
   - **Firebase** (Firestore + Auth + Storage) client integration in `lib/firebase.ts`.
   - **Server-Side API (`/api/classify`)**: Express + Vite backend keeping API keys secure.

---

## 📂 Project Structure

```
nagarvaani/
├── app/
│   ├── layout.tsx              # Root layout with Tailwind styling & typography
│   ├── page.tsx                # Entry point redirecting to /citizen
│   ├── citizen/
│   │   └── page.tsx            # Citizen complaint intake portal
│   ├── dashboard/
│   │   └── page.tsx            # Policymaker dashboard with data table & AI recommendations
│   └── api/
│       └── classify/
│           └── route.ts        # Gemini 3.7 Flash classification API route
├── components/
│   ├── ui/                     # Reusable shadcn/ui components (Button, Badge, Card, Input, Table, etc.)
│   └── shared/
│       └── Navbar.tsx          # Shared navigation with NagarVaani 🏛️ branding
├── lib/
│   ├── firebase.ts             # Firebase initialization exporting db, auth, storage
│   ├── gemini.ts               # Gemini client initialization & getGeminiModel()
│   ├── types.ts                # TypeScript interfaces (Submission, PriorityRecommendation)
│   ├── data.ts                 # Sample dataset & recommendation aggregation algorithm
│   └── utils.ts                # Tailwind clsx/twMerge utilities
├── .env.local.example          # Environment variables template
├── .env.example                # Environment variables documentation
├── server.ts                   # Full-stack Express server with Vite middleware
├── package.json                # Project dependencies and scripts
└── README.md                   # Documentation and setup guide
```

---

## ⚙️ Environment Variables

Create `.env.local` or configure your secrets with the following keys:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## 🛠️ Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```
   The application will be served at `http://localhost:3000`.

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Start production server**:
   ```bash
   npm start
   ```

---

## 🏛️ Shared Types Specification

```typescript
export interface Submission {
  id?: string;
  text: string;
  language: string;
  category: 'roads' | 'water' | 'electricity' | 'sanitation' | 
            'health' | 'education' | 'other';
  urgency: 1 | 2 | 3 | 4 | 5;
  summary_english: string;
  district: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  photo_url?: string;
  created_at: Date;
  status: 'pending' | 'classified' | 'prioritized';
}

export interface PriorityRecommendation {
  rank: number;
  category: string;
  district: string;
  count: number;
  avg_urgency: number;
  ai_rationale: string;
  estimated_population_affected: number;
}
```
