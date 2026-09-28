export function getRetentionCutoff(retentionDays: number, now = Date.now()): Date {
  const days = Number.isFinite(retentionDays) && retentionDays > 0 ? Math.floor(retentionDays) : 365;
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

export function isOlderThanRetention(createdAt: string | Date | undefined, cutoff: Date): boolean {
  if (!createdAt) return false;
  const timestamp = createdAt instanceof Date ? createdAt.getTime() : Date.parse(createdAt);
  return Number.isFinite(timestamp) && timestamp < cutoff.getTime();
}
