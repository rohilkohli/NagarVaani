import { db } from "@/lib/firebase";
import { seedDatabase } from "@/lib/seedData";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    // Protect with secret query param: ?secret=nagarvaani_seed_2026
    if (secret !== "nagarvaani_seed_2026") {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or missing secret parameter" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await seedDatabase(db);

    return new Response(
      JSON.stringify({
        success: true,
        count: result.count || 50,
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
