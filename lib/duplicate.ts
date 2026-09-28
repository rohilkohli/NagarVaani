export type DuplicateCandidate = {
  text: string;
  category: string;
  district: string;
  lat: number;
  lng: number;
};

export type DuplicateRecord = DuplicateCandidate & {
  id: string;
  created_at: string;
  status?: string;
};

export function normalizeComplaintText(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

export function textSimilarity(left: string, right: string): number {
  const a = new Set(normalizeComplaintText(left).split(" ").filter(Boolean));
  const b = new Set(normalizeComplaintText(right).split(" ").filter(Boolean));
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / new Set([...a, ...b]).size;
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadius = 6371;
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function scoreDuplicate(candidate: DuplicateCandidate, record: DuplicateRecord, now = Date.now()) {
  const createdAt = new Date(record.created_at).getTime();
  if (!Number.isFinite(createdAt) || createdAt < now - 30 * 24 * 60 * 60 * 1000) return null;
  if (record.status === "duplicate" || record.district !== candidate.district || record.category !== candidate.category) {
    return null;
  }

  const distance = distanceKm(candidate.lat, candidate.lng, record.lat, record.lng);
  const similarity = textSimilarity(candidate.text, record.text);
  const score = similarity * 0.7 + (distance <= 0.5 ? 0.3 : distance <= 2 ? 0.15 : 0);
  return score >= 0.72
    ? { id: record.id, score, distance_km: Number(distance.toFixed(3)) }
    : null;
}
