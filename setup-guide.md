# NagarVaani — System Setup & Deployment Guide

NagarVaani is an AI-powered municipal intelligence platform for citizen grievance redressal, multilingual voice triage, and cross-border BRICS urban policy decision-making.

---

## Quick Start Setup (8 Steps)

### Step 1: Create a Firebase Project
1. Navigate to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it `nagarvaani` (or your preferred name).
3. Disable or enable Google Analytics as desired, then complete project creation.

### Step 2: Enable Firebase Firestore, Auth, and Storage
1. In the left navigation, go to **Build → Firestore Database** and click **Create Database** (start in Test mode or configure production security rules).
2. Go to **Build → Authentication**, click **Get Started**, and enable **Anonymous** or **Email/Password** sign-in provider.
3. Go to **Build → Storage**, click **Get Started**, and initialize cloud storage for complaint photo attachments.

### Step 3: Configure Environment Variables
1. In Firebase Console, open **Project Settings** (gear icon) → **General** tab.
2. Scroll to **Your apps**, click the **Web (</>)** icon, and register the app.
3. Copy the Firebase configuration parameters.
4. Duplicate `.env.example` to `.env.local` (or edit existing `.env.local`) and set:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   ```

### Step 4: Obtain Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API Key** and create a new key in a Google Cloud project.
3. Add the key to `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```

### Step 5: Enable Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Google Cloud project and open **APIs & Services → Library**.
3. Search for and enable:
   - **Maps JavaScript API**
   - **Geocoding API**
4. Generate an API key under **APIs & Services → Credentials** and add it to `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

### Step 6: Install Dependencies & Run Development Server
In your terminal, execute:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 7: Seed Initial Demo Data
1. Navigate to the Policy Dashboard at [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
2. Click the **"🌱 Seed Demo Data"** button in the dark navy navigation bar.
3. 50+ rich civic complaint records across India, Brazil, Russia, South Africa, and China will be seeded into Firestore.

### Step 8: Explore the Populated Dashboard
- **📊 Overview Tab:** Key stats summary, cluster urgency telemetry, geospatial heatmap with 50km radius analyzer, and Gemini-ranked municipal budget allocations.
- **🗺️ Heatmap Tab:** Full-screen 650px Deck.gl density visualization with domain sector filters (Roads, Water, Electricity, Sanitation, Health).
- **🌍 BRICS View Tab:** Cross-border comparative matrix showcasing identical civic problem categories side-by-side with 7-day sparklines and cross-border insights.
- **📋 All Reports Tab:** Filterable, searchable, sortable registry of all complaints with audio transcripts and AI summaries.

---

## Architecture Overview

- **Citizen Intake Portal (`/`):** Multilingual voice input with Gemini Live Audio transcribe & image analysis.
- **Policymaker Dashboard (`/dashboard`):** Real-time Firestore sync, Deck.gl geospatial heatmap, automated budget prioritization, and BRICS policy comparison.
- **Backend API Routes (`/api/*`):**
  - `/api/classify` — Gemini 2.5 categorization & urgency scoring.
  - `/api/prioritize` — AI algorithmic budget triage.
  - `/api/transcribe` — Multilingual audio transcription.
  - `/api/seed` — Demo sandbox generation.
