export type ComplaintCategory = 'roads' | 'water' | 'electricity' | 'sanitation' | 
                          'health' | 'education' | 'other';

export interface Submission {
  id?: string;
  firestoreId?: string;
  text: string;
  original_text?: string;
  detected_language?: string;
  english_translation?: string;
  language: string;
  category: ComplaintCategory;
  urgency: 1 | 2 | 3 | 4 | 5;
  summary_english: string;
  district: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  synthetic?: boolean;
  photo_url?: string;
  created_at: Date;
  status: 'pending' | 'classified' | 'classification_failed' | 'acknowledged' | 'in_progress' | 'resolved' | 'priority' | 'duplicate';
  classified_by?: 'gemini' | 'rule-based';
  confidence?: 'high' | 'medium' | 'low';
  upvotes?: number;
  source?: 'web' | 'whatsapp' | 'voice' | 'api' | string;
  whatsapp_from?: string;
  duplicate_of?: string;
  duplicate_confidence?: number;
  photo_description?: string;
  photo_severity?: 'low' | 'medium' | 'high' | 'critical';
  photo_safety_hazard?: boolean;
  ai_confidence?: number;
  department_id?: string;
  department_name?: string;
  sla_deadline?: string | Date;
  sla_status?: 'on_track' | 'at_risk' | 'breached' | string;
  status_history?: Array<{
    timestamp: string;
    previousStatus: string;
    newStatus: string;
    changedBy: 'admin' | 'system' | 'automation';
    note?: string;
  }>;
}

export interface PriorityRecommendation {
  rank: number;
  raw_rank?: number;
  rank_delta?: number;
  need_weighted_score?: number;
  complaints_per_100k?: number | null;
  deprivation_factor?: number;
  unresolved_age_factor?: number;
  project_title?: string;
  category: string;
  district: string;
  state?: string;
  country?: string;
  count: number;
  avg_urgency: number;
  population_2011?: number | null;
  literacy_rate_2011?: number | null;
  aspirational_district?: boolean | null;
  relevant_scheme?: string | null;
  owning_department?: string;
  estimated_beneficiaries?: number | null;
  estimated_population_affected: number;
  evidence?: string;
  confidence?: 'high' | 'medium' | 'low' | 'insufficient_data';
  engine?: 'gemini' | 'rule-based';
  ai_rationale: string;
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
