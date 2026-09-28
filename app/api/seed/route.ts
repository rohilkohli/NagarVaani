import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { ALL_SEED_SUBMISSIONS } from "@/lib/seedData";
import { authenticateFirebaseUser, verifyAdminSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const authorization = String(req.headers.get("authorization") || "");
    const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    let user: { uid: string; role: string };
    const session = verifyAdminSessionToken(idToken);
    if (session.valid && session.payload) {
      user = { uid: session.payload.sub, role: session.payload.role };
    } else {
      const authenticated = await authenticateFirebaseUser(idToken);
      user = { uid: authenticated.uid, role: authenticated.role };
    }
    if (!["admin", "supervisor"].includes(user.role)) {
      return new Response(JSON.stringify({ success: false, error: "A supervisor role is required to seed data." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const firestore = getAdminFirestore();
    const batch = firestore.batch();
    for (const item of ALL_SEED_SUBMISSIONS.slice(0, 50)) {
      const ref = firestore.collection("submissions").doc();
      batch.set(ref, { ...item, created_at: item.created_at.toISOString(), source: "seed", seeded_by: user.uid });
    }
    await batch.commit();

    return new Response(
      JSON.stringify({
        success: true,
        count: Math.min(50, ALL_SEED_SUBMISSIONS.length),
        message: "Database successfully populated with realistic BRICS infrastructure submissions.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Seed API Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Failed to seed database",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
