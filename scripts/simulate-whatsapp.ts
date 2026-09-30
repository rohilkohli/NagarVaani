import { createHmac, randomUUID } from "node:crypto";

const baseUrl = process.env.WHATSAPP_SIMULATOR_URL || `http://localhost:${process.env.PORT || 3000}`;
const secret = process.env.META_APP_SECRET || "demo-meta-secret";

async function send(type: string, message: Record<string, unknown>) {
  const payload = {
    object: "whatsapp_business_account",
    entry: [{ changes: [{ value: { messages: [{ id: randomUUID(), from: "15551234567", type, ...message }] } }] }],
  };
  const body = JSON.stringify(payload);
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const response = await fetch(`${baseUrl}/api/whatsapp/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-hub-signature-256": signature },
    body,
  });
  console.log(type, response.status);
}

await send("text", { text: { body: "There is a dangerous pothole near the market." } });
await send("image", { image: { id: process.env.WHATSAPP_SAMPLE_IMAGE_ID || "sample-image-id", caption: "Broken drain cover" } });
await send("audio", { audio: { id: process.env.WHATSAPP_SAMPLE_AUDIO_ID || "sample-audio-id", mime_type: "audio/ogg" } });
await send("location", { location: { latitude: 28.6139, longitude: 77.2090 } });