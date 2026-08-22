export type ComplaintCategory = 'roads' | 'water' | 'electricity' | 'sanitation' | 
                          'health' | 'education' | 'other';

export interface Submission {
  id?: string;
  firestoreId?: string;
  text: string;
  language: string;
  category: ComplaintCategory;
  urgency: 1 | 2 | 3 | 4 | 5;
  summary_english: string;
  district: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  photo_url?: string;
  created_at: Date;
  status: 'pending' | 'classified' | 'acknowledged' | 'in_progress' | 'resolved' | 'priority';
  upvotes?: number;
}

export interface PriorityRecommendation {
  rank: number;
  category: string;
  district: string;
  state?: string;
  count: number;
  avg_urgency: number;
  ai_rationale: string;
  estimated_population_affected: number;
  recommended_action?: string;
  brics_parallel?: string;
}

export interface BRICSCountry {
  code: string;
  name: string;
  flag: string;
  defaultCoords: { lat: number; lng: number };
  sampleDistricts: { state: string; districts: string[] }[];
}
