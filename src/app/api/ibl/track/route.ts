import { NextRequest, NextResponse } from "next/server";

import { downsampleTrack, ensureLoaded, getSessionForPid, getTrack } from "@/server/iblData";

export const runtime = "nodejs";

function toPositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

export async function GET(request: NextRequest) {
  await ensureLoaded();

  const pid = request.nextUrl.searchParams.get("pid")?.trim() ?? "";
  const eid = request.nextUrl.searchParams.get("eid")?.trim() ?? "";
  const n = toPositiveInt(request.nextUrl.searchParams.get("n"), 16);

  if (!pid) {
    return NextResponse.json({ error: "Missing required query param: pid" }, { status: 400 });
  }
  if (!eid) {
    return NextResponse.json({ error: "Missing required query param: eid" }, { status: 400 });
  }

  const track = getTrack(pid);
  if (track.length === 0) {
    return NextResponse.json({ error: `Unknown pid: ${pid}` }, { status: 404 });
  }
  const pidEid = getSessionForPid(pid);
  if (pidEid !== eid) {
    return NextResponse.json({ error: `pid ${pid} does not belong to eid ${eid}` }, { status: 404 });
  }

  const sampled = downsampleTrack(track, n);
  const acronyms = sampled.map((row) => row.acronym || "UNK");
  const uniqueAcronyms = Array.from(new Set(acronyms));

  return NextResponse.json(
    {
      pid,
      eid,
      acronyms,
      uniqueAcronyms,
      downsampled: sampled.map((row) => ({
        x: row.x,
        y: row.y,
        z: row.z,
        acronym: row.acronym || "UNK",
      })),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    }
  );
}
