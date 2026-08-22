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
  status: 'pending' | 'classified' | 'acknowledged' | 'in_progress' | 'resolved' | 'priority' | 'duplicate';
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
