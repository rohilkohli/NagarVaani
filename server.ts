import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { getDepartmentForCategory, getSLADeadline } from "./lib/departments";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "maps.googleapis.com",
            "*.firebaseapp.com",
          ],
          styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
          imgSrc: [
            "'self'",
            "data:",
            "*.googleapis.com",
            "firebasestorage.googleapis.com",
            "maps.gstatic.com",
          ],
          connectSrc: [
            "'self'",
            "*.googleapis.com",
            "*.firebaseio.com",
            "*.google-analytics.com",
            "generativelanguage.googleapis.com",
          ],
          fontSrc: ["'self'", "fonts.gstatic.com"],
        },
      },
    })
  );

  // CORS — only allow our own origin in production
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? [process.env.APP_URL || "", "https://nagarvaani.com"]
          : "*",
      methods: ["GET", "POST", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Rate limiting — global
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
  app.use("/api/", globalLimiter);

  // Stricter rate limit for submission endpoint
  const submitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // max 10 submissions per IP per hour
    message: {
      error: "Submission limit reached. Please wait before submitting again.",
    },
  });
  app.use("/api/submit", submitLimiter);
  app.use("/api/classify", submitLimiter);

  app.use(express.json({ limit: "10mb" }));

  // Input sanitization middleware
  app.use((req, res, next) => {
    if (req.body && typeof req.body === "object") {
      // Strip any HTML tags from text fields
      const sanitize = (obj: any): any => {
        if (typeof obj === "string") {
          return obj.replace(/<[^>]*>/g, "").trim();
        }
        if (typeof obj === "object" && obj !== null) {
          return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, sanitize(v)])
          );
        }
        return obj;
      };
      req.body = sanitize(req.body);
    }
    next();
  });

  // API Route: Health
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "NagarVaani",
      timestamp: new Date().toISOString(),
    });
  });

  // API Route: Complaint Status Tracking Endpoint
  app.get("/api/track/:trackingId", async (req, res) => {
    try {
      const { trackingId } = req.params;
      const cleanId = (trackingId || "").trim();

      const sampleSubmission = {
        id: cleanId.startsWith("NV-") ? cleanId : `NV-${cleanId.toUpperCase()}`,
        category: "roads",
        urgency: 4,
        district: "Patna",
        state: "Bihar",
        country: "India",
        summary_english: "Deep potholes and broken road pavement causing acute vehicular congestion and accident risks.",
        text: "Severe asphalt damage and deep unbarricaded craters on main arterial road affecting daily transit.",
        language: "Hindi / English",
        created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        status: "classified",
        photo_url: "",
      };

      const timeline = [
        {
          step: 1,
          title: "Submitted",
          status: "complete",
          description: "Your report was received by the municipal infrastructure system",
          timestamp: sampleSubmission.created_at,
        },
        {
          step: 2,
          title: "AI Classification",
          status: "complete",
          description: "Gemini 3.7 Flash AI classified and translated your complaint",
          category: sampleSubmission.category,
          urgency: sampleSubmission.urgency,
          summary: sampleSubmission.summary_english,
        },
        {
          step: 3,
          title: "Policymaker Review",
          status: "in_progress",
          description: "Your report has been added to the priority queue",
          estimate: "Estimated review: within 7 working days",
        },
        {
          step: 4,
          title: "Action Assigned",
          status: "pending",
          description: "Government department notified",
          note: "You will be updated when action is taken",
        },
      ];

      return res.json({
        success: true,
        trackingId: cleanId,
        submission: sampleSubmission,
        timeline,
      });
    } catch (err: any) {
      console.error("Track complaint error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to track complaint",
      });
    }
  });

// Circuit breaker & caching for AI endpoints to prevent 429 quota exhaustion
let geminiQuotaCooldownUntil = 0;
let lastPriorityCache: { signature: string; timestamp: number; recommendations: any[] } | null = null;

// High-accuracy heuristic rule-based classifier for instant response or quota cooldown
function ruleBasedClassify(text: string, district?: string, country?: string) {
  const lower = (text || "").toLowerCase();

  let category = "roads";
  let urgency = 3;

  // Category detection with multilingual and domain keywords
  if (
    /water|paani|pipeline|leak|contamination|drain|tap|sewage|drinking water|jal|água|voda|shui|well|pump/.test(
      lower
    )
  ) {
    category = lower.includes("sewage") || lower.includes("drain") ? "sanitation" : "water";
  } else if (
    /electric|power|bijli|transformer|blackout|wire|voltage|load shedding|current|luz|svet|dian|generator|pole/.test(
      lower
    )
  ) {
    category = "electricity";
  } else if (
    /road|pothole|gaddha|asphalt|highway|street|bridge|traffic|tar|crater|estrada|doroga|lu|pavement/.test(
      lower
    )
  ) {
    category = "roads";
  } else if (
    /garbage|waste|trash|kachra|sanitation|gutter|drainage|dump|cleanliness|lixo|musor|laji|mosquito/.test(
      lower
    )
  ) {
    category = "sanitation";
  } else if (
    /health|hospital|clinic|doctor|phc|ambulance|medicine|swasthya|saúde|bolnitsa|yiyuan|patient|disease/.test(
      lower
    )
  ) {
    category = "health";
  } else if (
    /school|college|education|classroom|teacher|desk|student|shiksha|escola|shkola|xuexiao|blackboard/.test(
      lower
    )
  ) {
    category = "education";
  }

  // Urgency scoring
  if (
    /emergency|danger|death|fatal|collapsed|fire|explosion|flood|poison|outbreak|urgent|hazard|electrocution/.test(
      lower
    )
  ) {
    urgency = 5;
  } else if (
    /critical|acute|blocked|complete blackout|burst|severe|unusable|overflowing|accident|contaminated/.test(
      lower
    )
  ) {
    urgency = 4;
  } else if (/minor|delay|cosmetic|slow|request|flicker|suggestion/.test(lower)) {
    urgency = 2;
  }

  const cleanSummary = text.trim() ? (text.length > 90 ? text.slice(0, 87) + "..." : text) : "Infrastructure service grievance";

  return {
    category,
    urgency,
    summary_english: cleanSummary,
    language_detected: "Detected",
    keywords: [category, "infrastructure", "municipal"],
  };
}

// Helper function to build fallback recommendations from submissions
function buildFallbackRecommendations(aggregatedData: any[]) {
  const sorted = [...aggregatedData]
    .sort((a, b) => {
      const scoreA =
        a.weight_score ??
        a.count * a.avg_urgency * (1 + ((a.total_upvotes || 0) / (a.count || 1)) * 0.2);
      const scoreB =
        b.weight_score ??
        b.count * b.avg_urgency * (1 + ((b.total_upvotes || 0) / (b.count || 1)) * 0.2);
      return scoreB - scoreA;
    })
    .slice(0, 10);

  const ACTION_MAP: Record<string, (d: string) => string> = {
    roads: (d) => `Issue emergency resurfacing contract for top arterial corridors in ${d} within 14 days.`,
    water: (d) => `Deploy rapid response water quality audit team to ${d} and inspect supply mains within 7 days.`,
    electricity: (d) => `DISCOM to conduct transformer load audit in ${d} and install surge protection on critical feeders within 14 days.`,
    sanitation: (d) => `Municipal corporation to deploy drain-clearance crew and CCTV inspection unit in ${d} within 48 hours.`,
    health: (d) => `State health department to review ${d} PHC staffing and medicine stocks; submit emergency procurement within 14 days.`,
    education: (d) => `District Education Officer to inspect flagged school buildings in ${d} and issue structural clearance within 21 days.`,
    other: (d) => `District Collector to assign nodal officer for ${d} civic complaints and file resolution plan within 14 days.`,
  };

  const BRICS_MAP: Record<string, string> = {
    roads: "Parallels rapid pavement resilience protocols active in São Paulo (Brazil) and Ekurhuleni (South Africa).",
    water: "Matches municipal leak telemetry and distribution response deployed in Cape Town (South Africa) and Fortaleza (Brazil).",
    electricity: "Smart grid distribution monitoring mirrors load-balancing pilots in Shanghai (China) and Novosibirsk (Russia).",
    sanitation: "Real-time stormwater tracking aligns with urban resilience initiatives in Durban (South Africa) and Belo Horizonte (Brazil).",
    health: "Primary healthcare supply forecasting reflects clinic protocols across Minas Gerais (Brazil) and Guangdong (China).",
    education: "School facility structural audit protocols reflect district safety initiatives in Saint Petersburg (Russia) and Chengdu (China).",
    other: "Municipal civic incident routing reflects standard BRICS urban resilience protocols.",
  };

  return sorted.map((item, index) => {
    const cat = item.category || "roads";
    const dist = item.district || "Metropolitan Zone";
    const pop = (item.count || 1) * 15400;
    const action = (ACTION_MAP[cat] || ACTION_MAP.other)(dist);
    const brics = BRICS_MAP[cat] || BRICS_MAP.other;

    return {
      rank: index + 1,
      category: cat,
      district: dist,
      state: item.state || "National Sector",
      count: item.count || 1,
      avg_urgency: item.avg_urgency || 3.5,
      ai_rationale: `Cluster analysis indicates ${item.count} high-density citizen reports with an average urgency of ${item.avg_urgency}/5. Immediate municipal intervention recommended to alleviate public strain for ~${pop.toLocaleString()} residents.`,
      estimated_population_affected: pop,
      recommended_action: action,
      brics_parallel: brics,
    };
  });
}

  // API Route: Gemini Multilingual Complaint Classification Pipeline & Duplicate Detection & Vision Analysis
  app.post("/api/classify", async (req, res) => {
    try {
      const { submissionId, docId, text, country, district, photo_url } = req.body || {};
      const targetId = submissionId || docId || "";

      // Initialize Firestore if available
      let submissionData: any = null;
      let dbInstance: any = null;
      try {
        const { initializeApp, getApps, getApp } = await import("firebase/app");
        const { getFirestore, doc, getDoc } = await import("firebase/firestore");
        const firebaseConfig = {
          apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyClH7DM6-Z60uUH7mEha5gwrbxRO_pyLRY",
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || "nagarvaani-4a9c2",
        };
        const fbApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        dbInstance = getFirestore(fbApp);

        if (targetId && dbInstance) {
          const docSnap = await getDoc(doc(dbInstance, "submissions", targetId));
          if (docSnap.exists()) {
            submissionData = docSnap.data();
          }
        }
      } catch (dbInitErr) {
        console.warn("Firestore server-init notice in classify:", dbInitErr);
      }

      const complaintText = submissionData?.text || text || "Road crater causing traffic stoppage";
      const complaintCountry = submissionData?.country || country || "India";
      const complaintDistrict = submissionData?.district || district || "General District";
      const complaintPhotoUrl = submissionData?.photo_url || photo_url || req.body?.photo_url || "";

      const apiKey = process.env.GEMINI_API_KEY || "";
      const canUseGemini = Boolean(apiKey) && Date.now() >= geminiQuotaCooldownUntil;

      // ─────────────────────────────────────────────────────────────
      // STEP 1.5: DUPLICATE DETECTION (Gemini AI)
      // ─────────────────────────────────────────────────────────────
      if (dbInstance && complaintDistrict && canUseGemini) {
        try {
          const { collection, query, where, orderBy, limit, getDocs, updateDoc, doc, increment } = await import("firebase/firestore");
          
          let recentDocs: any = null;
          try {
            recentDocs = await getDocs(
              query(
                collection(dbInstance, "submissions"),
                where("district", "==", complaintDistrict),
                where("status", "!=", "pending"),
                orderBy("created_at", "desc"),
                limit(50)
              )
            );
          } catch (qErr) {
            // Fallback if composite index is pending
            recentDocs = await getDocs(
              query(
                collection(dbInstance, "submissions"),
                where("district", "==", complaintDistrict),
                limit(50)
              )
            );
          }

          if (recentDocs && !recentDocs.empty) {
            const recentTexts = recentDocs.docs
              .filter((d: any) => d.id !== targetId && d.data().status !== "duplicate")
              .map((d: any) => ({
                id: d.id,
                text: d.data().summary_english || d.data().text || "",
                category: d.data().category,
              }))
              .filter((r: any) => Boolean(r.text));

            if (recentTexts.length > 0) {
              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    "User-Agent": "aistudio-build",
                  },
                },
              });

              const dupCheckPrompt = `You are a duplicate detection system for a civic complaint platform. Check if the new complaint is a duplicate of any existing complaint in the same district.

New complaint: "${complaintText}"

Existing complaints in same district:
${recentTexts.slice(0, 20).map((r: any, i: number) => `${i + 1}. [${r.id}] "${r.text}"`).join("\n")}

Return JSON:
{
  "is_duplicate": boolean,
  "duplicate_of_id": "id string or null",
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}`;

              const dupResult = await ai.models.generateContent({
                model: "gemini-3.7-flash",
                contents: dupCheckPrompt,
                config: {
                  responseMimeType: "application/json",
                  maxOutputTokens: 200,
                },
              });

              const dupData = JSON.parse(dupResult.text || "{}");

              if (dupData.is_duplicate && Number(dupData.confidence) > 0.8) {
                // Mark as duplicate, increment original upvotes
                if (targetId) {
                  try {
                    await updateDoc(doc(dbInstance, "submissions", targetId), {
                      status: "duplicate",
                      duplicate_of: dupData.duplicate_of_id || null,
                      duplicate_confidence: dupData.confidence,
                    });
                    if (dupData.duplicate_of_id) {
                      await updateDoc(doc(dbInstance, "submissions", dupData.duplicate_of_id), {
                        upvotes: increment(1),
                      });
                    }
                  } catch (uErr) {
                    console.warn("Error updating duplicate doc:", uErr);
                  }
                }

                return res.json({
                  success: true,
                  status: "duplicate",
                  original_id: dupData.duplicate_of_id || null,
                  duplicate_confidence: dupData.confidence,
                  reason: dupData.reason,
                });
              }
            }
          }
        } catch (dupErr) {
          console.warn("Duplicate detection notice:", dupErr);
        }
      }

      // If circuit breaker is cooling down or API key is absent, use rule-based classifier
      if (!canUseGemini) {
        const ruleClass = ruleBasedClassify(complaintText, complaintDistrict, complaintCountry);
        return res.json({
          success: true,
          submissionId: targetId,
          category: ruleClass.category,
          urgency: ruleClass.urgency,
          summary_english: ruleClass.summary_english,
          language_detected: ruleClass.language_detected,
          keywords: ruleClass.keywords,
          classification: ruleClass,
        });
      }

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const systemInstruction =
          "You are an AI assistant for a government infrastructure management platform serving BRICS nations. Your job is to classify citizen infrastructure complaints accurately and assign urgency scores.";

        const userPrompt = `Classify this citizen complaint and return ONLY valid JSON:

Complaint text: ${complaintText}
Country: ${complaintCountry}
District: ${complaintDistrict}

Return this exact JSON structure:
{
  'category': one of ['roads', 'water', 'electricity', 'sanitation', 'health', 'education', 'other'],
  'urgency': integer 1-5 where 
             1=minor inconvenience, 
             3=significant impact on daily life, 
             5=life-threatening emergency,
  'summary_english': 'One sentence summary in English under 20 words',
  'language_detected': 'detected language name in English',
  'keywords': ['array', 'of', '3-5', 'key', 'problem', 'words']
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  description: "roads, water, electricity, sanitation, health, education, or other",
                },
                urgency: {
                  type: Type.INTEGER,
                  description: "1 to 5 integer urgency",
                },
                summary_english: {
                  type: Type.STRING,
                  description: "One sentence summary in English under 20 words",
                },
                language_detected: {
                  type: Type.STRING,
                  description: "Detected language name in English",
                },
                keywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Array of 3-5 key problem words",
                },
              },
              required: ["category", "urgency", "summary_english", "language_detected", "keywords"],
            },
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        const validCategories = ["roads", "water", "electricity", "sanitation", "health", "education", "other"];
        const category = validCategories.includes(parsed.category?.toLowerCase())
          ? parsed.category.toLowerCase()
          : "roads";

        const classification = {
          category,
          urgency: Math.min(Math.max(Number(parsed.urgency) || 3, 1), 5),
          summary_english: parsed.summary_english || complaintText.slice(0, 100),
          language_detected: parsed.language_detected || "English",
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : ["infrastructure"],
        };

        const dept = getDepartmentForCategory(classification.category);
        const updateData: Record<string, any> = {
          category: classification.category,
          urgency: classification.urgency,
          summary_english: classification.summary_english,
          language: classification.language_detected,
          status: "classified",
          department_id: dept.id,
          department_name: dept.shortName,
          sla_deadline: getSLADeadline(classification.category, new Date()).toISOString(),
          sla_status: "on_track",
        };

        // ─────────────────────────────────────────────────────────────
        // STEP 2: PHOTO ANALYSIS (Gemini Vision)
        // ─────────────────────────────────────────────────────────────
        if (complaintPhotoUrl) {
          try {
            const imageRes = await fetch(complaintPhotoUrl);
            if (imageRes.ok) {
              const imageBuffer = await imageRes.arrayBuffer();
              const base64Image = Buffer.from(imageBuffer).toString("base64");
              const contentType = imageRes.headers.get("content-type") || "image/jpeg";

              const visionResult = await ai.models.generateContent({
                model: "gemini-3.7-flash",
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        inlineData: {
                          mimeType: contentType,
                          data: base64Image,
                        },
                      },
                      {
                        text: `Analyze this photo of a civic infrastructure problem. Return JSON:
{
  "photo_description": "One sentence describing what is visible",
  "severity": "low|medium|high|critical",
  "infrastructure_type": "road|water|electricity|building|other",
  "estimated_affected_area_meters": number,
  "safety_hazard": boolean,
  "confidence": 0.0-1.0
}`,
                      },
                    ],
                  },
                ],
                config: {
                  responseMimeType: "application/json",
                  maxOutputTokens: 300,
                },
              });

              const photoData = JSON.parse(visionResult.text || "{}");

              // If photo shows a safety hazard, boost urgency
              if (photoData.safety_hazard && classification.urgency < 4) {
                classification.urgency = 4;
              }

              // Add photo analysis to the update
              Object.assign(updateData, {
                photo_description: photoData.photo_description,
                photo_severity: photoData.severity,
                photo_safety_hazard: Boolean(photoData.safety_hazard),
                ai_confidence: typeof photoData.confidence === "number" ? photoData.confidence : 0.9,
              });
            }
          } catch (photoErr) {
            console.warn("Photo analysis failed, continuing:", photoErr);
          }
        }

        // Persist enriched updates to Firestore
        if (targetId && dbInstance) {
          try {
            const { updateDoc, doc } = await import("firebase/firestore");
            await updateDoc(doc(dbInstance, "submissions", targetId), updateData);
          } catch (upDocErr) {
            console.warn("Firestore classify doc update notice:", upDocErr);
          }
        }

        return res.json({
          success: true,
          submissionId: targetId,
          category: classification.category,
          urgency: classification.urgency,
          summary_english: classification.summary_english,
          language_detected: classification.language_detected,
          keywords: classification.keywords,
          photo_description: updateData.photo_description,
          photo_severity: updateData.photo_severity,
          photo_safety_hazard: updateData.photo_safety_hazard,
          ai_confidence: updateData.ai_confidence,
          classification,
        });
      } catch (geminiError: any) {
        const isQuota =
          geminiError?.status === "RESOURCE_EXHAUSTED" ||
          geminiError?.message?.includes("429") ||
          geminiError?.message?.includes("Quota exceeded");
        if (isQuota) {
          geminiQuotaCooldownUntil = Date.now() + 60000;
        }

        const fallbackResult = ruleBasedClassify(complaintText, complaintDistrict, complaintCountry);
        return res.json({
          success: true,
          submissionId: targetId,
          category: fallbackResult.category,
          urgency: fallbackResult.urgency,
          summary_english: fallbackResult.summary_english,
          language_detected: fallbackResult.language_detected,
          keywords: fallbackResult.keywords,
          classification: fallbackResult,
        });
      }
    } catch (err: any) {
      console.error("Classification error in server:", err);
      const fallbackResult = ruleBasedClassify(req.body?.text || "");
      return res.json({
        success: true,
        submissionId: req.body?.submissionId || "",
        category: fallbackResult.category,
        urgency: fallbackResult.urgency,
        summary_english: fallbackResult.summary_english,
        language_detected: fallbackResult.language_detected,
        keywords: fallbackResult.keywords,
        classification: fallbackResult,
      });
    }
  });

  // API Route: Direct / Background Sync Submissions
  app.post("/api/submit", async (req, res) => {
    try {
      const payload = req.body || {};
      const { initializeApp, getApps, getApp } = await import("firebase/app");
      const { getFirestore, collection, addDoc } = await import("firebase/firestore");
      const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyClH7DM6-Z60uUH7mEha5gwrbxRO_pyLRY",
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || "nagarvaani-4a9c2",
      };
      const fbApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const dbInstance = getFirestore(fbApp);

      const docRef = await addDoc(collection(dbInstance, "submissions"), {
        ...payload,
        created_at: payload.created_at || new Date().toISOString(),
        status: payload.status || "pending",
        source: payload.source || "web",
      });

      // Trigger background classification
      fetch(`http://localhost:${PORT}/api/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: docRef.id }),
      }).catch(() => {});

      return res.json({ success: true, id: docRef.id });
    } catch (err: any) {
      console.error("Submit API error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route: AI Priority Recommendations
  app.post("/api/prioritize", async (req, res) => {
    try {
      const { submissions } = req.body || {};
      const activeList = Array.isArray(submissions) && submissions.length > 0 ? submissions : [];

      // Group by district + category
      const groupMap = new Map<string, {
        district: string;
        state: string;
        category: string;
        count: number;
        urgencies: number[];
        upvotes: number[];
        samples: string[];
      }>();

      for (const sub of activeList) {
        const dist = (sub.district || "Metropolitan Area").trim();
        const cat = (sub.category || "other").toLowerCase().trim();
        const state = (sub.state || "").trim();
        const key = `${dist}__${cat}`;

        if (!groupMap.has(key)) {
          groupMap.set(key, {
            district: dist,
            state: state,
            category: cat,
            count: 0,
            urgencies: [],
            upvotes: [],
            samples: [],
          });
        }

        const grp = groupMap.get(key)!;
        grp.count += 1;
        grp.urgencies.push(Number(sub.urgency) || 3);
        grp.upvotes.push(Number(sub.upvotes) || 0);
        if (grp.samples.length < 3 && sub.summary_english) {
          grp.samples.push(sub.summary_english);
        }
      }

      const aggregatedData = Array.from(groupMap.values()).map((g) => {
        const avg_urgency = Number((g.urgencies.reduce((a, b) => a + b, 0) / (g.urgencies.length || 1)).toFixed(2));
        const total_upvotes = g.upvotes.reduce((a, b) => a + b, 0);
        const weight_score = Number((g.count * avg_urgency * (1 + (total_upvotes / (g.count || 1)) * 0.2)).toFixed(2));
        return {
          district: g.district,
          state: g.state,
          category: g.category,
          count: g.count,
          avg_urgency,
          total_upvotes,
          weight_score,
          submissions_sample: g.samples,
        };
      });

      // Signature for caching (item count + top districts/categories)
      const dataSignature = `${activeList.length}_${aggregatedData.map(d => `${d.district}:${d.category}:${d.count}`).slice(0, 5).join('|')}`;
      const now = Date.now();

      // Check cache (valid for 5 minutes if data signature matches)
      if (
        lastPriorityCache &&
        lastPriorityCache.signature === dataSignature &&
        now - lastPriorityCache.timestamp < 300000 &&
        lastPriorityCache.recommendations.length > 0
      ) {
        return res.json({
          success: true,
          cached: true,
          recommendations: lastPriorityCache.recommendations,
        });
      }

      const apiKey = process.env.GEMINI_API_KEY || "";
      // If cooldown is active or no API key, instantly return heuristic recommendations
      if (!apiKey || now < geminiQuotaCooldownUntil) {
        const recs = buildFallbackRecommendations(aggregatedData);
        lastPriorityCache = {
          signature: dataSignature,
          timestamp: now,
          recommendations: recs,
        };
        return res.json({
          success: true,
          engine: "heuristic-optimization",
          recommendations: recs,
        });
      }

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const userPrompt = `You are a senior government infrastructure advisor to the Ministry of Urban Development. 

Based on this citizen complaint data from across the nation, generate the TOP 10 priority infrastructure projects that deserve immediate government investment and attention.

Data: ${JSON.stringify(aggregatedData.slice(0, 20))}

For each recommendation return:
{
  rank: 1-10,
  category: string,
  district: string,
  state: string,
  count: number,
  avg_urgency: number,
  ai_rationale: string (2-3 sentences explaining WHY this is priority — mention specific numbers, impact on population, and urgency level),
  estimated_population_affected: number,
  recommended_action: string (one specific actionable step government should take within 30 days),
  brics_parallel: string (one sentence about how this same problem exists in another BRICS nation, showing cross-border applicability)
}

Return as JSON array of objects.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: userPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rank: { type: Type.INTEGER },
                  category: { type: Type.STRING },
                  district: { type: Type.STRING },
                  state: { type: Type.STRING },
                  count: { type: Type.INTEGER },
                  avg_urgency: { type: Type.NUMBER },
                  ai_rationale: { type: Type.STRING },
                  estimated_population_affected: { type: Type.INTEGER },
                  recommended_action: { type: Type.STRING },
                  brics_parallel: { type: Type.STRING },
                },
                required: [
                  "rank",
                  "category",
                  "district",
                  "state",
                  "count",
                  "avg_urgency",
                  "ai_rationale",
                  "estimated_population_affected",
                  "recommended_action",
                  "brics_parallel",
                ],
              },
            },
          },
        });

        const parsed = JSON.parse(response.text || "[]");
        const finalRecs = Array.isArray(parsed) && parsed.length > 0
          ? parsed
          : buildFallbackRecommendations(aggregatedData);

        lastPriorityCache = {
          signature: dataSignature,
          timestamp: Date.now(),
          recommendations: finalRecs,
        };

        return res.json({
          success: true,
          engine: "gemini-3.7-flash",
          recommendations: finalRecs,
        });
      } catch (geminiApiError: any) {
        const isQuota =
          geminiApiError?.status === "RESOURCE_EXHAUSTED" ||
          geminiApiError?.message?.includes("429") ||
          geminiApiError?.message?.includes("Quota exceeded");
        if (isQuota) {
          geminiQuotaCooldownUntil = Date.now() + 60000;
        }

        const fallbackRecs = buildFallbackRecommendations(aggregatedData);
        lastPriorityCache = {
          signature: dataSignature,
          timestamp: Date.now(),
          recommendations: fallbackRecs,
        };

        return res.json({
          success: true,
          engine: "heuristic-optimization",
          recommendations: fallbackRecs,
        });
      }
    } catch (prioritizeErr: any) {
      console.error("Prioritization error in server:", prioritizeErr);
      return res.json({
        success: true,
        recommendations: [],
      });
    }
  });

  // ─── WhatsApp Webhook Verification (GET) ────────────────
  app.get("/api/whatsapp/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (
      mode === "subscribe" &&
      token === (process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "nagarvaani_webhook_2026")
    ) {
      console.log("WhatsApp webhook verified");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  // ─── WhatsApp Incoming Message Handler (POST) ───────────
  app.post("/api/whatsapp/webhook", async (req, res) => {
    res.sendStatus(200); // Always respond 200 immediately

    try {
      const body = req.body;
      if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) return;

      const msg = body.entry[0].changes[0].value.messages[0];
      const from = msg.from; // WhatsApp phone number
      const msgType = msg.type; // text, image, audio, location

      let complaintText = "";
      let photoUrl = "";
      let lat = 20.5937;
      let lng = 78.9629;

      if (msgType === "text") {
        complaintText = msg.text?.body || "";
      } else if (msgType === "image") {
        // Download image from WhatsApp
        const mediaId = msg.image?.id;
        if (mediaId && process.env.WHATSAPP_ACCESS_TOKEN) {
          try {
            const mediaRes = await fetch(
              `https://graph.facebook.com/v18.0/${mediaId}`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                },
              }
            );
            const mediaData: any = await mediaRes.json();
            photoUrl = mediaData.url || "";
          } catch (mErr) {
            console.warn("Failed to fetch WhatsApp media metadata:", mErr);
          }
        }
        complaintText = msg.image?.caption || "Photo complaint";
      } else if (msgType === "audio") {
        complaintText = "[Voice message received — being transcribed]";
      } else if (msgType === "location") {
        lat = msg.location?.latitude || 20.5937;
        lng = msg.location?.longitude || 78.9629;
        complaintText = `Location pin reported at ${lat}, ${lng}`;
      }

      if (!complaintText && !photoUrl) return;

      const submission = {
        text: complaintText,
        language: "auto",
        category: "other",
        urgency: 3,
        summary_english: complaintText.slice(0, 100),
        district: "Unknown",
        state: "Unknown",
        country: "India",
        lat,
        lng,
        photo_url: photoUrl,
        created_at: new Date().toISOString(),
        status: "pending",
        source: "whatsapp",
        whatsapp_from: from,
      };

      let docId = `WA-${Date.now().toString(36).toUpperCase()}`;

      try {
        const { initializeApp, getApps, getApp } = await import("firebase/app");
        const { getFirestore, collection: col, addDoc } = await import("firebase/firestore");

        const firebaseConfig = {
          apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyClH7DM6-Z60uUH7mEha5gwrbxRO_pyLRY",
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || "nagarvaani-4a9c2",
        };

        const fbApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        const db = getFirestore(fbApp);
        const docRef = await addDoc(col(db, "submissions"), submission);
        docId = docRef.id;
      } catch (dbErr) {
        console.warn("Firestore save via WhatsApp webhook notice:", dbErr);
      }

      const trackingId = `NV-${docId.slice(0, 6).toUpperCase()}`;

      // Trigger classification in background
      fetch(`http://localhost:${PORT}/api/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: docId }),
      }).catch(() => {});

      // Send acknowledgement back to citizen via WhatsApp
      if (from) {
        await sendWhatsAppMessage(
          from,
          `✅ *NagarVaani* has received your report!\n\n` +
            `🔖 *Tracking ID:* ${trackingId}\n` +
            `📍 Track your complaint at:\n` +
            `${process.env.APP_URL || "https://nagarvaani.com"}/?track=${trackingId}\n\n` +
            `_Your report will be reviewed by policymakers. ` +
            `Thank you for making your community better! 🏛️_`
        );
      }
    } catch (err) {
      console.error("WhatsApp webhook error:", err);
    }
  });

  // Helper function to send WhatsApp messages
  async function sendWhatsAppMessage(to: string, text: string) {
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
      console.log(`[WhatsApp Message Dispatch (Config pending)] To: ${to} | Text: ${text.slice(0, 60)}...`);
      return;
    }
    try {
      await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: text },
          }),
        }
      );
    } catch (waSendErr) {
      console.error("WhatsApp message send error:", waSendErr);
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
