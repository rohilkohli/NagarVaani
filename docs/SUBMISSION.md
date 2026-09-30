# NagarVaani: submission package

**Hackathon:** Build with AI: Code for Communities, Second Edition (Google Cloud x Hack2skill)
**Track:** 01, AI for Digital Public Infrastructure & Governance
**Live demo:** https://nagarvaani-636001394004.asia-south1.run.app
**Repository:** https://github.com/rohilkohli/NagarVaani
**Demo video:** _add link_ | **Deck:** [NagarVaani-pitch-deck.pptx](NagarVaani-pitch-deck.pptx) (real screenshots included on slides 7 to 9)

## Checklist (official requirements)

- [ ] Public GitHub repository (source code)
- [ ] Demo video, 3 to 5 minutes, working end to end
- [ ] Pitch deck, 10 to 12 slides
- [ ] Brief description, 2 to 3 lines
- [ ] Live deployed link (verified on a phone and on mobile data)

## Brief description (2 to 3 lines)

NagarVaani is a multilingual Digital Public Good that collects citizen complaints by voice, text, photo and WhatsApp,
uses Google Gemini to transcribe, translate, classify and score them, and joins them with Census, NITI Aayog and NFHS-5
district data to rank projects by need. Policymakers get a demand heatmap and evidence-backed recommendations, so
under-served districts are not drowned out by high-volume cities.

## Deck outline (12 slides)

Use `docs/brand/png/nagarvaani-logo-dark-tagline.png` on slide 1 and the icon on slide 12.

1. **Title.** NagarVaani: every citizen's voice, every city's priority. Track 01, team, live URL.
2. **Problem.** Citizen requests sit in fragmented systems; spending misaligns with need; citizens use voice and messaging in many languages.
3. **Solution.** Voice, text, photo and WhatsApp in; Gemini understanding; need-weighted priorities and recommendations out.
4. **How it works.** Architecture diagram (README mermaid): intake, PII redaction, Gemini, storage, data join, scoring, recommendations, dashboard.
5. **AI approach.** Gemini transcription (with user confirmation), classification with schema-validated JSON, translation, urgency 1 to 5, duplicate detection, recommendations grounded in the data table; fallbacks tagged `rule-based`.
6. **Data.** Census 2011, NITI Aayog aspirational flag, NFHS-5 household indicators; provenance in `data/SOURCES.md`; coverage stated honestly (NFHS-5 for 30 of 58 districts).
7. **Need-weighted ranking.** Screenshot of the Priority Interventions view plus the formula. State honestly that every demo cluster has one complaint, so raw rank is a tie-break.
8. **Product tour.** Screenshots: citizen report form, tracking reference, demand heatmap, department SLA centre.
9. **Reach across India.** 10 Indian languages plus English; state and district coverage; extensible to BRICS.
10. **Deployability and safety.** Cloud Run container, demo and live modes, CI, 39 unit tests plus Playwright smoke; PII redaction, signed WhatsApp webhook, roles, audit logs, rate limits.
11. **Impact and roadmap.** Pilot path with a ministry or state department; complete data coverage; live-mode pilot; DPDP Act review; real-complaint evaluation.
12. **Close.** Logo, live URL, QR code to the demo, thank you.

## Demo video script (about 4 minutes)

| Time | On screen | Say |
|---|---|---|
| 0:00 | Landing page with logo | "NagarVaani turns what citizens say into what governments prioritise." One sentence on the problem. |
| 0:20 | Citizen portal, record a Hindi voice complaint (water pipeline burst) | Voice input, transcript shown for confirmation, detected language. |
| 0:55 | Submit; result card | Gemini classifies, translates, scores urgency; tracking ID appears. |
| 1:15 | Submit a second complaint in another language (Tamil or Marathi) | Same flow, no language selection needed. |
| 1:35 | Near-duplicate complaint | Duplicate detection groups it instead of counting twice. |
| 1:55 | Track page with the tracking ID | Citizen sees status; optional read-aloud is behind a flag. |
| 2:15 | Policymaker dashboard, heatmap | Demand hotspots across states; category filter. |
| 2:50 | Priority rankings: raw rank versus need-weighted rank | Show a small aspirational district moving up. Explain the score in one sentence. |
| 3:20 | AI recommendation with evidence | Population, deprivation inputs, scheme only if relevant, confidence, "insufficient data" behaviour. |
| 3:45 | Architecture slide and repo | Cloud Run, Gemini, Firestore, CI; honest limits: demo data is synthetic. |
| 4:00 | Logo end card | URL and repository. |

Fallback if Gemini is slow: keep a pre-recorded 20-second clip of the classification step and cut to it. Rehearse once on the live URL first (first request after idle can take a few seconds).

## Judge Q&A cheat sheet

1. **Is this real data?** The complaints are synthetic and labelled as such. District figures come from Census 2011, NITI Aayog and NFHS-5 with sources in `data/SOURCES.md`; NFHS-5 coverage is 30 of 58 districts and empty values are never estimated.
2. **How accurate is the classifier?** On our 60-item synthetic multilingual set the rule-based fallback scores as reported in `docs/eval-results.md`; Gemini has not yet been evaluated on real complaints. We treat both as regression checks and name this as the next step.
3. **How do you prevent hallucinated recommendations?** Gemini receives an aggregated table, must return a strict schema, population and beneficiary figures are anchored to the data, unknown scheme names are rejected, and the model may answer "insufficient data". Failures fall back to a deterministic builder, tagged `rule-based`.
4. **What is the need-weighted score?** Complaints per 100k population x mean urgency x (1 + deprivation factor) x unresolved-age factor. Weights are constants in `lib/priority.ts`, visible in the UI.
5. **How are beneficiaries estimated?** As a configurable share of district population per category. They are estimates, not scheme records.
6. **Privacy?** PII patterns are redacted before Gemini calls, roles and audit logs protect staff actions, a retention job deletes old data, and consent and DPDP Act compliance are on the roadmap.
7. **What if Gemini is down or over quota?** The rule-based classifier takes over and the UI shows "Auto-sorted (offline mode)"; the public demo also has a daily call cap.
8. **Does WhatsApp work?** The webhook verifies signatures and handles text, image, audio and location; tested with signed simulated payloads and unit tests, not yet with a live Meta account.
9. **Can it scale?** Cloud Run scales the stateless server; the demo is deliberately single-instance because its sandbox is in memory. Live mode uses Firestore.
10. **Cost per complaint?** Not measured yet; each complaint is roughly one Gemini classification call, and the demo caps daily calls. Measure before quoting a number.
11. **Why not just a helpline?** Helplines do not aggregate, deduplicate or prioritise across districts, and voice IVR does not cover the long tail of languages.
12. **What is next after the hackathon?** Finish data coverage, run a live pilot with a state department, evaluate on real complaints, complete the privacy review.
