import { promises as fs } from "fs";
import path from "path";

export type AllenTrackRow = {
  pid: string;
  eid: string;
  acronym: string;
  x: number;
  y: number;
  z: number;
  rawInd: number | null;
  axial_um: number | null;
};

const CSV_PATH = path.join(process.cwd(), "data", "allen", "allen_probe_labels.csv");

let loaded = false;
let loadingPromise: Promise<void> | null = null;
const pidIndex = new Map<string, AllenTrackRow[]>();
const sessionPidIndex = new Map<string, string[]>();
const pidToSession = new Map<string, string>();
let pids: string[] = [];
let sessions: string[] = [];

function toNumberOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseHeaderIndex(headerLine: string): Record<string, number> {
  const headers = headerLine.split(",").map((h) => h.trim());
  const index: Record<string, number> = {};
  headers.forEach((name, i) => {
    index[name] = i;
  });
  return index;
}

function getValue(cols: string[], idx: Record<string, number>, key: string): string {
  const i = idx[key];
  if (i === undefined) return "";
  return (cols[i] ?? "").trim();
}

function orderingValue(row: AllenTrackRow): number {
  if (row.rawInd !== null) return row.rawInd;
  if (row.axial_um !== null) return row.axial_um;
  return Number.POSITIVE_INFINITY;
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length < 2) return;

  const idx = parseHeaderIndex(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");

    const pid = getValue(cols, idx, "pid");
    if (!pid) continue;
    const eid = getValue(cols, idx, "eid") || "-1";

    const row: AllenTrackRow = {
      pid,
      eid,
      acronym: getValue(cols, idx, "acronym"),
      x: toNumberOrNull(getValue(cols, idx, "x")) ?? 0,
      y: toNumberOrNull(getValue(cols, idx, "y")) ?? 0,
      z: toNumberOrNull(getValue(cols, idx, "z")) ?? 0,
      rawInd: toNumberOrNull(getValue(cols, idx, "rawInd")),
      axial_um: toNumberOrNull(getValue(cols, idx, "axial_um")),
    };

    const rows = pidIndex.get(pid);
    if (rows) rows.push(row);
    else pidIndex.set(pid, [row]);

    if (!pidToSession.has(pid)) pidToSession.set(pid, eid);
  }

  for (const rows of pidIndex.values()) {
    rows.sort((a, b) => orderingValue(a) - orderingValue(b));
  }

  pids = Array.from(pidIndex.keys()).sort();

  for (const [pid, eid] of pidToSession.entries()) {
    const list = sessionPidIndex.get(eid);
    if (list) list.push(pid);
    else sessionPidIndex.set(eid, [pid]);
  }

  for (const [eid, list] of sessionPidIndex.entries()) {
    sessionPidIndex.set(eid, list.sort());
  }
  sessions = Array.from(sessionPidIndex.keys()).sort();
}

export async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    let text: string;
    try {
      text = await fs.readFile(CSV_PATH, "utf8");
    } catch (error) {
      throw new Error(`Allen CSV not found at ${CSV_PATH}: ${(error as Error).message}`);
    }

    parseCsv(text);
    loaded = true;
  })();

  return loadingPromise;
}

export function getPids(): string[] {
  return pids;
}

export function getSessions(): string[] {
  return sessions;
}

export function getPidsForSession(eid: string): string[] {
  return sessionPidIndex.get(eid) ?? [];
}

export function getSessionForPid(pid: string): string | null {
  return pidToSession.get(pid) ?? null;
}

export function getTrack(pid: string): AllenTrackRow[] {
  return pidIndex.get(pid) ?? [];
}

export function downsampleTrack(rows: AllenTrackRow[], n: number): AllenTrackRow[] {
  if (rows.length === 0) return [];
  if (n <= 1) return [rows[0]];

  const out: AllenTrackRow[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i * (rows.length - 1)) / (n - 1));
    out.push(rows[idx]);
  }
  return out;
}
