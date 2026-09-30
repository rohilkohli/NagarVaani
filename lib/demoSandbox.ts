/**
 * lib/demoSandbox.ts
 *
 * In-memory sandbox for APP_MODE=demo.
 * Submissions submitted via the citizen form are classified (Gemini if key
 * present, rule-based otherwise) and stored here for the lifetime of the
 * process instance. Nothing is written to Firestore or Firebase Storage.
 *
 * The store is bounded to 500 entries (oldest-first eviction) to protect
 * against abuse; per-IP rate limits on the demo endpoints do the primary work.
 */

import { randomUUID } from 'crypto';
import { ALL_SEED_SUBMISSIONS } from './seedData';
import type { Submission } from './types';

const MAX_ENTRIES = 500;

// Pre-populate with the same seed data the live dashboard uses so judges
// see a full dashboard immediately without submitting anything.
const store: Submission[] = ALL_SEED_SUBMISSIONS.map((s) => ({
  ...s,
  id: s.id ?? `NV-SEED-${randomUUID().slice(0, 6).toUpperCase()}`,
  firestoreId: randomUUID(),
  created_at: s.created_at instanceof Date ? s.created_at : new Date(s.created_at as string),
  status_history: [],
  upvotes: typeof (s as any).upvotes === 'number' ? (s as any).upvotes : 0,
  synthetic: true,
}));

export function demoGetSubmissions(): Submission[] {
  return [...store].sort((a, b) => {
    const at = a.created_at instanceof Date ? a.created_at.getTime() : new Date(a.created_at as string).getTime();
    const bt = b.created_at instanceof Date ? b.created_at.getTime() : new Date(b.created_at as string).getTime();
    return bt - at;
  });
}

export interface DemoSubmitInput {
  text: string;
  original_text?: string;
  detected_language?: string;
  english_translation?: string;
  language?: string;
  category: string;
  urgency: number;
  summary_english?: string;
  district: string;
  state?: string;
  country?: string;
  lat: number;
  lng: number;
  photo_url?: string | null;
  classified_by?: 'gemini' | 'rule-based';
  confidence?: string;
  keywords?: string[];
  synthetic?: boolean;
}

export function demoAddSubmission(input: DemoSubmitInput): Submission {
  if (store.length >= MAX_ENTRIES) {
    // Evict oldest by created_at
    store.sort((a, b) => {
      const at = a.created_at instanceof Date ? a.created_at.getTime() : new Date(a.created_at as string).getTime();
      const bt = b.created_at instanceof Date ? b.created_at.getTime() : new Date(b.created_at as string).getTime();
      return at - bt;
    });
    store.splice(0, Math.max(1, store.length - MAX_ENTRIES + 1));
  }

  const id = `NV-${Date.now().toString().slice(-6)}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const now = new Date();

  const submission: Submission = {
    id,
    firestoreId: randomUUID(),
    text: input.text,
    original_text: input.original_text ?? input.text,
    detected_language: input.detected_language ?? input.language ?? 'English',
    english_translation: input.english_translation ?? input.summary_english ?? input.text,
    language: input.language ?? 'English',
    category: input.category as Submission['category'],
    urgency: (Math.max(1, Math.min(5, Math.round(input.urgency))) as 1 | 2 | 3 | 4 | 5),
    summary_english: input.summary_english ?? input.text.slice(0, 100),
    district: input.district,
    state: input.state ?? '',
    country: input.country ?? 'India',
    lat: input.lat,
    lng: input.lng,
    photo_url: input.photo_url ?? undefined,
    created_at: now,
    status: 'classified',
    status_history: [],
    upvotes: 0,
    synthetic: input.synthetic ?? true,
    classified_by: input.classified_by,
    confidence: (input.confidence as any) ?? 'medium',
  };

  store.push(submission);
  return submission;
}
