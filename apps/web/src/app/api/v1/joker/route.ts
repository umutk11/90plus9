import { cookies } from "next/headers";

import { claimDailyJoker, GameError, getSessionCookieName } from "@/lib/game-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  const { cellKey } = (body ?? {}) as { cellKey?: unknown };

  try {
    const cookieStore = await cookies();
    const result = await claimDailyJoker({
      cellKey,
      sessionId: cookieStore.get(getSessionCookieName())?.value ?? null,
    });
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof GameError) {
      return Response.json({ code: error.code }, { status: error.status });
    }
    console.error("Joker kullanılamadı.", error);
    return Response.json(
      { code: "JOKER_UNAVAILABLE", message: "Joker şu anda kullanılamıyor." },
      { status: 503 },
    );
  }
}
