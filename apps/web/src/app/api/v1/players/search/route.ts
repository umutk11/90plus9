import { searchPlayers } from "@/lib/player-data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.slice(0, 80) ?? "";
  if (query.trim().length < 2) {
    return Response.json({ players: [] });
  }

  try {
    const players = await searchPlayers(query);
    return Response.json(players.length > 0 ? { players } : { players: [] });
  } catch (error) {
    console.error("Oyuncu araması başarısız.", error);
    return Response.json(
      { code: "SEARCH_UNAVAILABLE", message: "Oyuncu araması şu anda kullanılamıyor." },
      { status: 503 },
    );
  }
}
