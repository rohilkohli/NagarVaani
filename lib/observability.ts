import { randomUUID } from 'node:crypto';

type MetricName = 'requests' | 'request_errors' | 'gemini_failures' | 'firestore_failures';

const counters: Record<MetricName, number> = {
  requests: 0,
  request_errors: 0,
  gemini_failures: 0,
  firestore_failures: 0,
};

export function incrementMetric(name: MetricName): void {
  counters[name] += 1;
}

export function getMetrics() {
  return { ...counters };
}

export function requestId(value?: string): string {
  return value?.trim() || randomUUID();
}

export function redactPii(value: string): string {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email redacted]')
    .replace(/\b(?:aadhaar|ssn|passport|national id)\s*[:#-]?\s*[A-Z0-9-]{4,}\b/gi, '[identity redacted]')
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[phone redacted]')
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[card redacted]');
}

export function logStructured(level: 'info' | 'warn' | 'error', event: string, fields: Record<string, unknown> = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  const serialized = JSON.stringify(entry);
  if (level === 'error') console.error(serialized);
  else if (level === 'warn') console.warn(serialized);
  else console.log(serialized);
}
