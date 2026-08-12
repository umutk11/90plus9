import { getGridAnswerCounts } from "@/lib/player-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    const answerCounts = await getGridAnswerCounts();
    return Response.json({ answerCounts }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Günün gridi yüklenemedi.", error);
    return Response.json(
      { code: "GRID_UNAVAILABLE", message: "Bugünün gridi şu anda kullanılamıyor." },
      { status: 503 },
    );
  }
}
