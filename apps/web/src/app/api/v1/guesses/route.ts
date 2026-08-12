import { isGridCellKey } from "@/lib/grid-config";
import { verifyPlayerGuess } from "@/lib/player-data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  const { cellKey, playerId } = (body ?? {}) as { cellKey?: unknown; playerId?: unknown };
  if (!isGridCellKey(cellKey) || !Number.isSafeInteger(playerId) || Number(playerId) <= 0) {
    return Response.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  try {
    const player = await verifyPlayerGuess(cellKey, Number(playerId));
    return Response.json(player ? { correct: true, player } : { correct: false });
  } catch (error) {
    console.error("Tahmin kontrolü başarısız.", error);
    return Response.json(
      { code: "GUESS_UNAVAILABLE", message: "Tahmin şu anda kontrol edilemiyor." },
      { status: 503 },
    );
  }
}
