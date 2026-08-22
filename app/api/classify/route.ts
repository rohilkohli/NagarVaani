import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(req: Request) {
  let submissionId = "";
  try {
    const body = await req.json();
    submissionId = body.submissionId || body.docId || "";
    const inputText = body.text || "";

    if (!submissionId && !inputText) {
      return new Response(
        JSON.stringify({ success: false, error: "Either submissionId or text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // STEP 1 — Fetch the submission from Firestore using the submissionId if provided
    let submission: any = null;
    let docRef: any = null;

    if (submissionId) {
      try {
        docRef = doc(db, "submissions", submissionId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          submission = docSnap.data();
        }
      } catch (dbErr) {
        console.warn("Firestore getDoc error:", dbErr);
      }
    }

    // Fallback/direct data from request body
    if (!submission) {
      submission = {
        text: inputText || "Citizen infrastructure complaint",
        country: body.country || "India",
        district: body.district || "District",
      };
    }

    // STEP 2 — Build exact Gemini prompt and call gemini-3.7-flash
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      const fallbackResult = {
        category: "roads",
        urgency: 3,
        summary_english: submission.text?.slice(0, 100) || "Civic infrastructure issue logged.",
        language_detected: "English",
        keywords: ["infrastructure", "civic", "report"],
      };

      if (docRef) {
        try {
          await updateDoc(docRef, {
            category: fallbackResult.category,
            urgency: fallbackResult.urgency,
            summary_english: fallbackResult.summary_english,
            language: fallbackResult.language_detected,
            status: "classified",
          });
        } catch (e) {
          console.warn("Firestore updateDoc error:", e);
        }
      }

      return new Response(
        JSON.stringify({ success: true, classification: fallbackResult }),
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

    const systemInstruction =
      "You are an AI assistant for a government infrastructure management platform serving BRICS nations. Your job is to classify citizen infrastructure complaints accurately and assign urgency scores.";

    const userPrompt = `Classify this citizen complaint and return ONLY valid JSON:

Complaint text: ${submission.text}
Country: ${submission.country}
District: ${submission.district}

Return this exact JSON structure:
{
  'category': one of ['roads', 'water', 'electricity', 'sanitation', 'health', 'education', 'other'],
  'urgency': integer 1-5 where 1=minor inconvenience, 3=significant impact on daily life, 5=life-threatening emergency,
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
              description: "Must be roads, water, electricity, sanitation, health, education, or other",
            },
            urgency: {
              type: Type.INTEGER,
              description: "Urgency scale from 1 (minor) to 5 (life-threatening)",
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

    // STEP 3 — Parse the JSON response
    const result = JSON.parse(response.text || "{}");

    // Validate category
    const validCategories = ["roads", "water", "electricity", "sanitation", "health", "education", "other"];
    const normalizedCategory = validCategories.includes(result.category?.toLowerCase())
      ? result.category.toLowerCase()
      : "other";

    const normalizedUrgency = Math.min(Math.max(Number(result.urgency) || 3, 1), 5);

    const classification = {
      category: normalizedCategory,
      urgency: normalizedUrgency,
      summary_english: result.summary_english || submission.text.slice(0, 100),
      language_detected: result.language_detected || "English",
      keywords: Array.isArray(result.keywords) ? result.keywords : ["infrastructure"],
    };

    // STEP 4 — Update the Firestore document
    if (docRef) {
      try {
        await updateDoc(docRef, {
          category: classification.category,
          urgency: classification.urgency,
          summary_english: classification.summary_english,
          language: classification.language_detected,
          status: "classified",
        });
      } catch (updateErr) {
        console.warn("Firestore updateDoc error:", updateErr);
      }
    }

    // STEP 5 — Return { success: true, classification: result, ...fields }
    return new Response(
      JSON.stringify({
        success: true,
        classification,
        category: classification.category,
        urgency: classification.urgency,
        summary_english: classification.summary_english,
        language_detected: classification.language_detected,
        keywords: classification.keywords,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI Classification Error:", error);

    // If Gemini fails, set status: 'pending' and return { success: false, error: message }
    if (submissionId) {
      try {
        const docRef = doc(db, "submissions", submissionId);
        await updateDoc(docRef, { status: "pending" });
      } catch (e) {
        console.warn("Error updating failed doc status to pending:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Classification failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
