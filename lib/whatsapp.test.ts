import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  buildClassificationJobRequest,
  claimWhatsAppMessage,
  clearWhatsAppMessageClaims,
  canSkipWebhookSignature,
  downloadWhatsAppMedia,
  graphApiVersion,
  isAllowedMetaMediaUrl,
  runClassificationJob,
  verifyMetaSignature,
} from "./whatsapp.ts";

test("verifies Meta signatures with the raw request body", () => {
  const body = Buffer.from('{\n  "object": "whatsapp_business_account",\n  "entry": [{ "changes": [{ "value": { "messages": [{ "text": { "body": "नाली बंद है 🚰" } }] } }] }]\n}\n', "utf8");
  const secret = "meta-secret";
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

  assert.equal(verifyMetaSignature(body, signature, secret, false), true);
  assert.equal(verifyMetaSignature(Buffer.from(JSON.stringify(JSON.parse(body.toString("utf8")))), signature, secret, false), false);
  assert.equal(verifyMetaSignature(body, `${signature}0`, secret, false), false);
  assert.equal(verifyMetaSignature(body, undefined, secret, false), false);
  assert.equal(verifyMetaSignature(body, undefined, undefined, true), true);
});

test("live mode fails closed when META_APP_SECRET is missing", () => {
  assert.equal(canSkipWebhookSignature(undefined, "production", undefined), false);
  assert.equal(canSkipWebhookSignature(undefined, "development", "live"), false);
  assert.equal(verifyMetaSignature(Buffer.from("{}"), undefined, undefined, false), false);
});

test("media downloads enforce Meta hosts, MIME types, timeout signal, and size", async () => {
  assert.equal(isAllowedMetaMediaUrl("https://graph.facebook.com/v23.0/media-1"), true);
  assert.equal(isAllowedMetaMediaUrl("https://cdn.example.com/media-1"), false);
  let sawTimeoutSignal = false;
  const fetcher = async (url: string, init?: RequestInit) => {
    sawTimeoutSignal = Boolean(init?.signal);
    if (url.includes("graph.facebook.com")) {
      return new Response(JSON.stringify({ url: "https://media.fbsbx.com/file-1" }), { status: 200 });
    }
    return new Response(Uint8Array.from([1, 2, 3]), { status: 200, headers: { "content-type": "image/png" } });
  };
  const media = await downloadWhatsAppMedia("media-1", "token", "image", fetcher as typeof fetch);
  assert.equal(media.mimeType, "image/png");
  assert.equal(media.buffer.length, 3);
  assert.equal(sawTimeoutSignal, true);

  const oversizedFetcher = async (url: string) => {
    if (url.includes("graph.facebook.com")) return new Response(JSON.stringify({ url: "https://media.fbsbx.com/file-2" }));
    return new Response(new Uint8Array(0), { headers: { "content-type": "audio/ogg", "content-length": String(16 * 1024 * 1024 + 1) } });
  };
  await assert.rejects(() => downloadWhatsAppMedia("media-2", "token", "audio", oversizedFetcher as typeof fetch), /16 MB/);
});

test("claims a WhatsApp message only once and expires old claims", () => {
  clearWhatsAppMessageClaims();
  assert.equal(claimWhatsAppMessage("message-1", 1000), true);
  assert.equal(claimWhatsAppMessage("message-1", 1001), false);
  assert.equal(claimWhatsAppMessage("message-1", 1000 + 24 * 60 * 60 * 1000 + 1), true);
  clearWhatsAppMessageClaims();
  for (let index = 0; index < 10_000; index += 1) claimWhatsAppMessage(`message-${index}`);
  assert.equal(claimWhatsAppMessage("message-over-cap"), true);
  assert.equal(claimWhatsAppMessage("message-0"), true);
  clearWhatsAppMessageClaims();
});

test("classification hand-off includes the internal job key", () => {
  const request = buildClassificationJobRequest("submission-1", "job-secret");
  assert.equal(request.headers["x-internal-job-key"], "job-secret");
  assert.deepEqual(JSON.parse(request.body), { submissionId: "submission-1" });
});

test("classification failure is persisted after two failed hand-off attempts", async () => {
  let attempts = 0;
  let status = "pending";
  const result = await runClassificationJob(
    "http://localhost:3000/api/classify",
    "submission-1",
    "job-secret",
    async () => {
      attempts += 1;
      return { ok: false, status: 503 } as Response;
    },
    async () => {
      status = "classification_failed";
    },
  );
  assert.equal(result, false);
  assert.equal(attempts, 2);
  assert.equal(status, "classification_failed");
});