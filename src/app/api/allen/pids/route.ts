import { NextResponse } from "next/server";

import { ensureLoaded, getPids, getPidsForSession, getSessions } from "@/server/allenData";

export const runtime = "nodejs";

export async function GET() {
  await ensureLoaded();

  const sessions = getSessions();
  const pidsBySession: Record<string, string[]> = {};
  for (const eid of sessions) {
    pidsBySession[eid] = getPidsForSession(eid);
  }

  return NextResponse.json(
    {
      pids: getPids(),
      sessions,
      pidsBySession,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    }
  );
}
