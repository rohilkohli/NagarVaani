import { createHmac, timingSafeEqual } from "node:crypto";

const processedMessages = new Map<string, number>();
const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_PROCESSED_MESSAGES = 10_000;
const MAX_MEDIA_BYTES = 16 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "audio/ogg", "audio/mpeg", "audio/mp4"]);

export function isLiveEnvironment(nodeEnv = process.env.NODE_ENV, appMode = process.env.APP_MODE || process.env.VITE_APP_MODE): boolean {
  return nodeEnv === "production" || String(appMode || "").toLowerCase() === "live";
}

export function canSkipWebhookSignature(secret: string | undefined, nodeEnv = process.env.NODE_ENV, appMode = process.env.APP_MODE || process.env.VITE_APP_MODE): boolean {
  return !secret && !isLiveEnvironment(nodeEnv, appMode) && (nodeEnv === "development" || String(appMode || "").toLowerCase() === "demo");
}

export function verifyMetaSignature(rawBody: Buffer, signature: string | undefined, secret: string | undefined, allowUnsigned: boolean): boolean {
  if (!secret) return allowUnsigned;
  if (!signature?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`);
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function claimWhatsAppMessage(messageId: string, now = Date.now()): boolean {
  for (const [id, timestamp] of processedMessages) {
    if (now - timestamp > MESSAGE_TTL_MS) processedMessages.delete(id);
  }
  if (!messageId || processedMessages.has(messageId)) return false;
  if (processedMessages.size >= MAX_PROCESSED_MESSAGES) {
    const oldest = processedMessages.keys().next().value;
    if (oldest) processedMessages.delete(oldest);
  }
  processedMessages.set(messageId, now);
  return true;
}

export function isAllowedMetaMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:" && (
      hostname === "graph.facebook.com" || hostname.endsWith(".fbsbx.com") || hostname.endsWith(".whatsapp.net")
    );
  } catch {
    return false;
  }
}

export function graphApiVersion(value = process.env.GRAPH_API_VERSION): string {
  return /^v\d+\.\d+$/.test(String(value || "")) ? String(value) : "v23.0";
}

async function fetchWithTimeout(fetcher: typeof fetch, input: string, init: RequestInit, timeoutMs = 15_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readLimitedBody(response: Response, maxBytes: number): Promise<Buffer> {
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > maxBytes) throw new Error("WhatsApp media exceeds the 16 MB limit.");
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("media too large");
        throw new Error("WhatsApp media exceeds the 16 MB limit.");
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

export async function downloadWhatsAppMedia(
  mediaId: string,
  accessToken: string,
  expectedKind: "audio" | "image",
  fetcher: typeof fetch = fetch,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const metadataUrl = `https://graph.facebook.com/${graphApiVersion()}/${encodeURIComponent(mediaId)}`;
  const metadataResponse = await fetchWithTimeout(fetcher, metadataUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!metadataResponse.ok) throw new Error(`Meta media metadata returned HTTP ${metadataResponse.status}.`);
  const metadata = await metadataResponse.json() as { url?: string; mime_type?: string };
  if (!metadata.url || !isAllowedMetaMediaUrl(metadata.url)) throw new Error("Meta returned a disallowed media URL.");

  const mediaResponse = await fetchWithTimeout(fetcher, metadata.url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!mediaResponse.ok) throw new Error(`Meta media download returned HTTP ${mediaResponse.status}.`);
  const mimeType = String(mediaResponse.headers.get("content-type") || "").split(";", 1)[0].toLowerCase();
  const kindMatches = expectedKind === "image" ? mimeType.startsWith("image/") : mimeType.startsWith("audio/");
  if (!kindMatches || !ALLOWED_MEDIA_TYPES.has(mimeType)) throw new Error(`Unsupported WhatsApp media type: ${mimeType || "missing"}.`);
  return { buffer: await readLimitedBody(mediaResponse, MAX_MEDIA_BYTES), mimeType };
}

export function clearWhatsAppMessageClaims(): void {
  processedMessages.clear();
}

export function detectedLanguageReply(language: string, english: string, hindi: string): string {
  const normalized = language.toLowerCase();
  if (normalized.includes("hindi")) return hindi;
  if (normalized.includes("tamil")) return "உங்கள் புகார் பெறப்பட்டது. கண்காணிப்பு ID:";
  if (normalized.includes("marathi")) return "तुमची तक्रार नोंदवली आहे. ट्रॅकिंग ID:";
  return english;
}

export function buildClassificationJobRequest(submissionId: string, internalJobKey?: string) {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(internalJobKey ? { "x-internal-job-key": internalJobKey } : {}),
    },
    body: JSON.stringify({ submissionId }),
  };
}

export async function runClassificationJob(
  url: string,
  submissionId: string,
  internalJobKey: string | undefined,
  fetcher: typeof fetch = fetch,
  markFailed: () => Promise<void> = async () => {},
): Promise<boolean> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetcher(url, buildClassificationJobRequest(submissionId, internalJobKey));
      if (response.ok) return true;
    } catch {
      // Retry once; callers log the final failure with request context.
    }
  }
  await markFailed();
  return false;
}
