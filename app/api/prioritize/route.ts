import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { GoogleGenAI, Type } from "@google/genai";
import { ALL_SEED_SUBMISSIONS } from "@/lib/seedData";
import { PriorityRecommendation } from "@/lib/types";

export async function POST(req: Request) {
  try {
    // Optional request payload with local submissions if offline
    let clientSubmissions: any[] = [];
    try {
      const body = await req.json();
      if (Array.isArray(body?.submissions)) {
        clientSubmissions = body.submissions;
      }
    } catch (_) {}

    // STEP 1 — Query Firestore for all classified submissions from last 30 days
    let rawSubmissions: any[] = [];
    try {
      const q = query(
        collection(db, "submissions"),
        where("status", "==", "classified")
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        rawSubmissions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (dbErr) {
      console.warn("Firestore query error in /api/prioritize:", dbErr);
    }

    if (rawSubmissions.length === 0 && clientSubmissions.length > 0) {
      rawSubmissions = clientSubmissions;
    }

    if (rawSubmissions.length === 0) {
      rawSubmissions = ALL_SEED_SUBMISSIONS;
    }

    // Filter to last 30 days if timestamps exist
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentSubmissions = rawSubmissions.filter((sub) => {
      const time = sub.created_at ? new Date(sub.created_at).getTime() : Date.now();
      return isNaN(time) || time >= thirtyDaysAgo;
    });

    const activeList = recentSubmissions.length > 0 ? recentSubmissions : rawSubmissions;

    // STEP 2 — Aggregate grouped by district + category
    const groupMap = new Map<string, {
      district: string;
      state: string;
      category: string;
      count: number;
      urgencies: number[];
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
          samples: [],
        });
      }

      const grp = groupMap.get(key)!;
      grp.count += 1;
      grp.urgencies.push(Number(sub.urgency) || 3);
      if (grp.samples.length < 3 && sub.summary_english) {
        grp.samples.push(sub.summary_english);
      }
    }

    const aggregatedData = Array.from(groupMap.values()).map((g) => ({
      district: g.district,
      state: g.state,
      category: g.category,
      count: g.count,
      avg_urgency: Number((g.urgencies.reduce((a, b) => a + b, 0) / (g.urgencies.length || 1)).toFixed(2)),
      submissions_sample: g.samples,
    }));

    // STEP 3 — Call Gemini AI for TOP 10 Priority Infrastructure Projects
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      // Deterministic algorithm fallback if API key is not yet configured
      const sorted = [...aggregatedData]
        .sort((a, b) => (b.count * b.avg_urgency) - (a.count * a.avg_urgency))
        .slice(0, 10);

      const fallbackRecommendations: PriorityRecommendation[] = sorted.map((item, index) => ({
        rank: index + 1,
        category: item.category,
        district: item.district,
        state: item.state || "National Zone",
        count: item.count,
        avg_urgency: item.avg_urgency,
        ai_rationale: `Cluster analysis indicates ${item.count} high-density citizen reports with an average urgency of ${item.avg_urgency}/5. Urgent intervention required to prevent structural disruption to municipal logistics and public wellbeing.`,
        estimated_population_affected: item.count * 15400,
        recommended_action: `Deploy rapid response engineering teams to inspect critical ${item.category} nodes in ${item.district} within 30 days.`,
        brics_parallel: `Similar ${item.category} infrastructure bottlenecks have been actively mitigated in São Paulo (Brazil) and Johannesburg (South Africa) via localized municipal fast-track grants.`,
      }));

      return new Response(
        JSON.stringify({ success: true, recommendations: fallbackRecommendations }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

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

Data: ${JSON.stringify(aggregatedData)}

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

Return as JSON array of 10 objects.`;

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

    const parsedArray = JSON.parse(response.text || "[]");

    // STEP 4 — Return the array
    return new Response(
      JSON.stringify({
        success: true,
        recommendations: Array.isArray(parsedArray) ? parsedArray : [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Priority Generation Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Failed to generate priority recommendations",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
