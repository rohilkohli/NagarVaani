import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import rateLimit from "express-rate-limit";
import type { AddressInfo } from "net";

test("trust proxy 1 correctly isolates rate limit buckets by X-Forwarded-For client IP", async () => {
  const app = express();
  // Cloud Run terminates TLS and proxies to container; trust proxy 1 trusts the first hop
  app.set("trust proxy", 1);

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2, // 2 requests allowed per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests" },
  });

  app.get("/api/test-limit", limiter, (req, res) => {
    res.json({ success: true, ip: req.ip });
  });

  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const endpoint = `http://127.0.0.1:${port}/api/test-limit`;

  try {
    const clientA = "203.0.113.195";
    const clientB = "198.51.100.42";

    // Client A request 1 -> OK (200)
    const resA1 = await fetch(endpoint, {
      headers: { "X-Forwarded-For": clientA },
    });
    assert.equal(resA1.status, 200);
    const bodyA1 = await resA1.json();
    assert.equal(bodyA1.ip, clientA);

    // Client A request 2 -> OK (200)
    const resA2 = await fetch(endpoint, {
      headers: { "X-Forwarded-For": clientA },
    });
    assert.equal(resA2.status, 200);

    // Client A request 3 -> Rate limited (429)
    const resA3 = await fetch(endpoint, {
      headers: { "X-Forwarded-For": clientA },
    });
    assert.equal(resA3.status, 429);

    // Client B request 1 -> In a completely different bucket -> OK (200)
    const resB1 = await fetch(endpoint, {
      headers: { "X-Forwarded-For": clientB },
    });
    assert.equal(resB1.status, 200);
    const bodyB1 = await resB1.json();
    assert.equal(bodyB1.ip, clientB);

    // Client B request 2 -> OK (200)
    const resB2 = await fetch(endpoint, {
      headers: { "X-Forwarded-For": clientB },
    });
    assert.equal(resB2.status, 200);

    // Client B request 3 -> Rate limited (429)
    const resB3 = await fetch(endpoint, {
      headers: { "X-Forwarded-For": clientB },
    });
    assert.equal(resB3.status, 429);
  } finally {
    server.close();
  }
});
