import { cookies } from "next/headers";

import {
  GameError,
  getDeviceCookieName,
  getSessionCookieName,
  loadDailyGame,
} from "@/lib/game-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const requestedDate = new URL(request.url).searchParams.get("date");
    const cookieStore = await cookies();
    const { deviceId, game, sessionId } = await loadDailyGame(
      cookieStore.get(getSessionCookieName())?.value,
      cookieStore.get(getDeviceCookieName())?.value,
      requestedDate,
    );
    cookieStore.set(getSessionCookieName(), sessionId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 45,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    cookieStore.set(getDeviceCookieName(), deviceId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return Response.json({ game }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof GameError && error.status === 404) {
      return Response.json({ code: "GRID_NOT_FOUND" }, { status: 404 });
    }
    console.error("Günün gridi yüklenemedi.", error);
    return Response.json(
      { code: "GRID_UNAVAILABLE", message: "Bugünün gridi şu anda kullanılamıyor." },
      { status: 503 },
    );
  }
}
