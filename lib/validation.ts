export type ComplaintPayload = {
  text?: string;
  district?: string;
  country?: string;
  state?: string;
  summary_english?: string;
  category?: string;
  urgency?: number;
  language?: string;
  photo_url?: string;
};

const VALID_CATEGORIES = ['roads', 'water', 'electricity', 'sanitation', 'health', 'education', 'other'] as const;

export function sanitizeText(value: string | undefined | null): string {
  return String(value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function validateComplaintPayload(payload: ComplaintPayload) {
  const text = sanitizeText(payload.text);
  const district = sanitizeText(payload.district);
  const country = sanitizeText(payload.country);
  const summary = sanitizeText(payload.summary_english);
  const category = sanitizeText(payload.category)?.toLowerCase();
  const urgency = Number(payload.urgency ?? 3);

  const errors: string[] = [];

  if (!text || text.length < 12) {
    errors.push('Complaint description must be at least 12 characters long.');
  }

  if (!district) {
    errors.push('District or city is required.');
  }

  if (!country) {
    errors.push('Country is required.');
  }

  if (category && !VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    errors.push('Unsupported complaint category.');
  }

  if (!Number.isFinite(urgency) || urgency < 1 || urgency > 5) {
    errors.push('Urgency must be between 1 and 5.');
  }

  if (summary && summary.length > 220) {
    errors.push('Summary is too long. Please keep it under 220 characters.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalized: {
      text,
      district,
      country,
      summary,
      category: category && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number]) ? category : 'other',
      urgency: Math.min(5, Math.max(1, Math.round(urgency))),
      language: sanitizeText(payload.language) || 'Detected',
      photo_url: sanitizeText(payload.photo_url || '') || undefined,
      state: sanitizeText(payload.state) || '',
    },
  };
}
