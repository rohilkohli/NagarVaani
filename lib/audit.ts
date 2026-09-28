export type WorkflowStatus =
  | 'pending'
  | 'classified'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'priority'
  | 'duplicate';

export interface StatusHistoryEntry {
  timestamp: string;
  previousStatus: WorkflowStatus | string;
  newStatus: WorkflowStatus | string;
  changedBy: 'admin' | 'supervisor' | 'operator' | 'auditor' | 'system' | 'automation';
  note?: string;
}

export function buildStatusHistoryEntry(
  previousStatus: WorkflowStatus | string,
  newStatus: WorkflowStatus | string,
  overrides: Partial<StatusHistoryEntry> = {}
): StatusHistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    previousStatus,
    newStatus,
    changedBy: 'admin',
    ...overrides,
  };
}

export function appendStatusHistory(
  currentHistory: StatusHistoryEntry[] | undefined,
  entry: StatusHistoryEntry,
  maxEntries = 20
): StatusHistoryEntry[] {
  const history = Array.isArray(currentHistory) ? [...currentHistory] : [];
  const next = [entry, ...history].slice(0, maxEntries);
  return next;
}

export function getLatestStatus(history: StatusHistoryEntry[] | undefined): WorkflowStatus | string | null {
  if (!Array.isArray(history) || history.length === 0) return null;
  return history[0]?.newStatus ?? null;
}
