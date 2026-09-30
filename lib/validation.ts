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

export function validateClassifyPayload(payload: Record<string, unknown>) {
  const errors: string[] = [];
  const submissionId = String(payload.submissionId || payload.docId || '').trim();
  const text = sanitizeText(String(payload.text || ''));
  const photoUrl = sanitizeText(String(payload.photo_url || ''));
  if (!submissionId && !text) errors.push('submissionId or text is required.');
  if (text.length > 1000) errors.push('Complaint text must be 1000 characters or fewer.');
  if (photoUrl && (!photoUrl.startsWith('https://') || photoUrl.length > 2048)) errors.push('photo_url must be a valid HTTPS URL under 2048 characters.');
  return { isValid: errors.length === 0, errors };
}

export function validatePrioritizePayload(payload: Record<string, unknown>) {
  const errors: string[] = [];
  const submissions = payload.submissions;
  if (submissions !== undefined && (!Array.isArray(submissions) || submissions.length > 500)) {
    errors.push('submissions must be an array of at most 500 records.');
  }
  if (Array.isArray(submissions)) {
    for (const submission of submissions) {
      if (!submission || typeof submission !== 'object' || sanitizeText(String((submission as Record<string, unknown>).text || '')).length > 1000) {
        errors.push('Each submission must be an object with text of at most 1000 characters.');
        break;
      }
    }
  }
  return { isValid: errors.length === 0, errors };
}
