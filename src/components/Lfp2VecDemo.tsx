"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import OrthogonalBrainView from "./OrthogonalBrainView";  // Disabled: Using 3D BrainView only

/** ---------- Types ---------- */
type DatasetKey = "Allen" | "IBL" | "Neuronexus";

type Heatmap = number[][];
type Waveform = number[][];
type RegionProbs = number[][];

type DatasetDef = {
  sessions: string[];
  probes: string[];
};

type IblTrackPoint = {
  x: number;
  y: number;
  z: number;
  acronym: string;
};

type IblTrackResponse = {
  pid: string;
  eid: string;
  acronyms: string[];
  uniqueAcronyms: string[];
  downsampled: IblTrackPoint[];
};

type IblPidIndexResponse = {
  pids?: string[];
  sessions?: string[];
  pidsBySession?: Record<string, string[]>;
};

type AllenIndexResponse = {
  sessions: string[];
  pidsBySession: Record<string, string[]>;
  tracks: Record<string, {
    acronyms: string[];
    uniqueAcronyms: string[];
    downsampled: IblTrackPoint[];
  }>;
};

type ProbeVisuals = {
  pid: string;
  waveform: number[][];
  lfpPower: number[][];
  muaPower: number[][];
  csd: number[][] | null;
};

type Datasets = Record<DatasetKey, DatasetDef>;

type DropdownProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

type PanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

/** ---------- Constants ---------- */
const BRAIN_REGIONS = [
  "VISp",
  "VISl",
  "VISrl",
  "VISam",
  "VISpm",
  "CA1",
  "CA3",
  "DG",
  "LP",
  "LGd",
  "VPM",
  "POL",
] as const;

const IBL_REGIONS_FALLBACK = [
  "TH",
  "VISp",
  "VISl",
  "VISrl",
  "VISam",
  "VISpm",
  "CA1",
  "CA3",
  "DG",
  "LP",
  "LGd",
  "VPM",
  "POL",
] as const;

const REGIONS_BY_DATASET: Record<DatasetKey, readonly string[]> = {
  Allen: BRAIN_REGIONS,
  IBL: IBL_REGIONS_FALLBACK,
  Neuronexus: BRAIN_REGIONS,
};

const REGION_COLORS = [
  "#E74C3C",
  "#3498DB",
  "#2ECC71",
  "#F39C12",
  "#9B59B6",
  "#1ABC9C",
  "#E67E22",
  "#34495E",
  "#16A085",
  "#C0392B",
  "#2980B9",
  "#8E44AD",
] as const;

const DATASETS: Datasets = {
  Allen: {
    sessions: [],
    probes: [],
  },
  IBL: {
    sessions: [],
    probes: [],
  },
  Neuronexus: {
    sessions: ["subject1_day1", "subject1_day3", "subject2_day1", "subject3_day2"],
    probes: ["shank1", "shank2", "shank3", "shank4"],
  },
};

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSize({ width: cr.width, height: cr.height });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

/** ---------- Utils ---------- */
// Seeded random for reproducible "data"
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate synthetic LFP-like waveform
function generateWaveform(seed: number, nChannels: number, nSamples: number): Waveform {
  const rng = seededRandom(seed);
  const channels: Waveform = [];
  for (let ch = 0; ch < nChannels; ch++) {
    const data: number[] = [];
    const freq1 = 2 + rng() * 8;
    const freq2 = 15 + rng() * 30;
    const amp1 = 0.3 + rng() * 0.7;
    const amp2 = 0.1 + rng() * 0.3;
    const phase = rng() * Math.PI * 2;

    for (let i = 0; i < nSamples; i++) {
      const t = i / nSamples;
      data.push(
        amp1 * Math.sin(2 * Math.PI * freq1 * t + phase) +
          amp2 * Math.sin(2 * Math.PI * freq2 * t + phase * 1.3) +
          (rng() - 0.5) * 0.3
      );
    }
    channels.push(data);
  }
  return channels;
}

// Generate synthetic heatmap
function generateHeatmap(seed: number, rows: number, cols: number): Heatmap {
  const rng = seededRandom(seed);
  const data: Heatmap = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    const baseFreq = rng() * 3;
    for (let c = 0; c < cols; c++) {
      const t = c / cols;
      const depthFactor = Math.sin((r / rows) * Math.PI * (1.5 + baseFreq));
      row.push(0.5 + 0.3 * depthFactor * Math.cos(2 * Math.PI * 2 * t) + (rng() - 0.5) * 0.3);
    }
    data.push(row);
  }
  return data;
}

// Generate region probabilities (step-like)
function generateRegionProbs(seed: number, nChannels: number, regions: readonly string[]): RegionProbs {
  const rng = seededRandom(seed);
  const probs: RegionProbs = [];
  let currentRegion = Math.floor(rng() * regions.length);

  for (let ch = 0; ch < nChannels; ch++) {
    if (rng() < 0.15) {
      currentRegion = Math.min(
        regions.length - 1,
        Math.max(0, currentRegion + (rng() > 0.5 ? 1 : -1))
      );
    }

    const p: number[] = [];
    for (let r = 0; r < regions.length; r++) {
      p.push(r === currentRegion ? 0.5 + rng() * 0.4 : rng() * 0.15);
    }

    const sum = p.reduce((a, b) => a + b, 0);
    probs.push(p.map((v) => v / sum));
  }
  return probs;
}

/** ---------- Canvas Components ---------- */
function WaveformCanvas({ channels, height }: { channels: Waveform; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { ref: wrapRef, size } = useElementSize<HTMLDivElement>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = Math.max(1, Math.floor(size.width));
    if (width <= 1) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);

    const nCh = channels.length;
    const chHeight = height / nCh;

    channels.forEach((ch, idx) => {
      const yCenter = chHeight * idx + chHeight / 2;

      ctx.strokeStyle = "#363636";
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.8;

      ctx.beginPath();
      ch.forEach((v, i) => {
        const x = (i / ch.length) * width;
        const y = yCenter + v * (chHeight * 0.35);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.moveTo(0, chHeight * (idx + 1));
      ctx.lineTo(width, chHeight * (idx + 1));
      ctx.stroke();
    });

    ctx.globalAlpha = 1;
  }, [channels, height, size.width]);

  return (
    <div ref={wrapRef}>
      <canvas ref={canvasRef} style={{ width: "100%", height }} />
    </div>
  );
}

function HeatmapCanvas({
  data,
  height,
  colormap = "viridis",
}: {
  data: Heatmap;
  height: number;
  colormap?: "viridis" | "inferno" | "coolwarm";
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { ref: wrapRef, size } = useElementSize<HTMLDivElement>();

  const getColor = useCallback(
  (v: number) => {
    const t = Math.max(0, Math.min(1, v));

    if (colormap === "viridis") {
      // 5-stop viridis: dark purple → teal → green → yellow
      const stops: [number, number, number][] = [
        [68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37],
      ];
      const seg = t * (stops.length - 1);
      const i = Math.min(Math.floor(seg), stops.length - 2);
      const f = seg - i;
      const r = Math.round(stops[i][0] + f * (stops[i + 1][0] - stops[i][0]));
      const g = Math.round(stops[i][1] + f * (stops[i + 1][1] - stops[i][1]));
      const b = Math.round(stops[i][2] + f * (stops[i + 1][2] - stops[i][2]));
      return `rgb(${r},${g},${b})`;
    }

    if (colormap === "inferno") {
      // 5-stop inferno: black → purple → red → orange → yellow
      const stops: [number, number, number][] = [
        [0, 0, 4], [87, 16, 110], [188, 55, 84], [249, 142, 9], [252, 255, 164],
      ];
      const seg = t * (stops.length - 1);
      const i = Math.min(Math.floor(seg), stops.length - 2);
      const f = seg - i;
      const r = Math.round(stops[i][0] + f * (stops[i + 1][0] - stops[i][0]));
      const g = Math.round(stops[i][1] + f * (stops[i + 1][1] - stops[i][1]));
      const b = Math.round(stops[i][2] + f * (stops[i + 1][2] - stops[i][2]));
      return `rgb(${r},${g},${b})`;
    }

    // coolwarm: blue → white → red
    const stops: [number, number, number][] = [
      [59, 76, 192], [141, 176, 254], [245, 245, 245], [246, 153, 117], [180, 4, 38],
    ];
    const seg = t * (stops.length - 1);
    const i = Math.min(Math.floor(seg), stops.length - 2);
    const f = seg - i;
    const r = Math.round(stops[i][0] + f * (stops[i + 1][0] - stops[i][0]));
    const g = Math.round(stops[i][1] + f * (stops[i + 1][1] - stops[i][1]));
    const b = Math.round(stops[i][2] + f * (stops[i + 1][2] - stops[i][2]));
    return `rgb(${r},${g},${b})`;
  },
  [colormap]
);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const width = Math.max(1, Math.floor(size.width));
    if (width <= 1) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rows = data.length;
    const cols = data[0]?.length ?? 0;
    if (cols === 0) return;

    const cellW = width / cols;
    const cellH = height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = getColor(data[r][c]);
        ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1);
      }
    }
  }, [data, height, size.width, getColor]);

  return (
    <div ref={wrapRef}>
      <canvas ref={canvasRef} style={{ width: "100%", height }} />
    </div>
  );
}

function ColorbarLegend({
  colormap = "viridis",
  lowLabel = "Low",
  highLabel = "High",
}: {
  colormap?: "viridis" | "inferno" | "coolwarm";
  lowLabel?: string;
  highLabel?: string;
}) {
  const gradientMap: Record<string, string> = {
    viridis:
      "linear-gradient(to right, rgb(68,1,84), rgb(59,82,139), rgb(33,145,140), rgb(94,201,98), rgb(253,231,37))",
    inferno:
      "linear-gradient(to right, rgb(0,0,4), rgb(87,16,110), rgb(188,55,84), rgb(249,142,9), rgb(252,255,164))",
    coolwarm:
      "linear-gradient(to right, rgb(59,76,192), rgb(141,176,254), rgb(245,245,245), rgb(246,153,117), rgb(180,4,38))",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
      <span className="is-size-7 has-text-grey">{lowLabel}</span>
      <div
        style={{
          flex: 1,
          height: 10,
          borderRadius: 3,
          background: gradientMap[colormap] ?? gradientMap.viridis,
        }}
      />
      <span className="is-size-7 has-text-grey">{highLabel}</span>
    </div>
  );
}

function RegionProbChart({ probs, height }: { probs: RegionProbs; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { ref: wrapRef, size } = useElementSize<HTMLDivElement>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || probs.length === 0) return;

    const width = Math.max(1, Math.floor(size.width));
    if (width <= 1) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const nCh = probs.length;
    const nR = probs[0]?.length ?? 0;
    if (nR === 0) return;

    const barH = height / nCh;
    for (let ch = 0; ch < nCh; ch++) {
      let xOff = 0;
      for (let r = 0; r < nR; r++) {
        const w = probs[ch][r] * width;
        ctx.fillStyle = REGION_COLORS[r % REGION_COLORS.length];
        ctx.globalAlpha = 0.9;
        ctx.fillRect(xOff, ch * barH, w, barH);
        xOff += w;
      }
    }
    ctx.globalAlpha = 1;
  }, [probs, height, size.width]);

  return (
    <div ref={wrapRef}>
      <canvas ref={canvasRef} style={{ width: "100%", height }} />
    </div>
  );
}

function RegionLabelStrip({ probs, height }: { probs: RegionProbs; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { ref: wrapRef, size } = useElementSize<HTMLDivElement>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || probs.length === 0) return;

    const width = Math.max(1, Math.floor(size.width));
    if (width <= 1) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const nCh = probs.length;
    const barH = height / nCh;

    for (let ch = 0; ch < nCh; ch++) {
      const row = probs[ch];
      let maxIdx = 0;
      let maxVal = -Infinity;
      for (let i = 0; i < row.length; i++) {
        if (row[i] > maxVal) {
          maxVal = row[i];
          maxIdx = i;
        }
      }
      ctx.fillStyle = REGION_COLORS[maxIdx % REGION_COLORS.length];
      ctx.fillRect(0, ch * barH, width, barH);
    }
  }, [probs, height, size.width]);

  return (
    <div ref={wrapRef}>
      <canvas ref={canvasRef} style={{ width: "100%", height }} />
    </div>
  );
}

/** ---------- UI Primitives (Bulma-styled, no inline styles) ---------- */
function Dropdown({ label, value, options, onChange }: DropdownProps) {
  return (
    <div className="field">
      <label className="label is-small">{label}</label>
      <div className="control">
        <div className="select is-small">
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: PanelProps) {
  return (
    <div className="card">
      <header className="card-header">
        <p className="card-header-title is-size-7">
          {title}
          {subtitle ? <span className="ml-2 has-text-grey">— {subtitle}</span> : null}
        </p>
      </header>
      <div className="card-content">
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

/** ---------- Heatmap with Interactive Slider ---------- */
function HeatmapSliderCard({
  title,
  subtitle,
  data,
  colormap = "viridis",
  height = 280,
}: {
  title: string;
  subtitle?: string;
  data: Heatmap;
  colormap?: "viridis" | "inferno" | "coolwarm";
  height?: number;
}) {
  return (
    <div className="card">
      <header className="card-header">
        <p className="card-header-title is-size-7">
          {title}
          {subtitle ? <span className="ml-2 has-text-grey">— {subtitle}</span> : null}
        </p>
      </header>
      <div className="card-content">
        <div className="content">
          <div style={{ display: "flex", gap: 4 }}>
            {/* Y-axis label */}
            <div style={{ display: "flex", alignItems: "center", width: 18 }}>
              <span
                className="is-size-7 has-text-grey"
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  whiteSpace: "nowrap",
                }}
              >
                Channel (depth)
              </span>
            </div>
            {/* Heatmap */}
            <div style={{ flex: 1 }}>
              <HeatmapCanvas data={data} height={height} colormap={colormap} />
              {/* X-axis label */}
              <p className="is-size-7 has-text-grey has-text-centered" style={{ marginTop: 2 }}>
                Time
              </p>
            </div>
          </div>
          <ColorbarLegend colormap={colormap} lowLabel="Low" highLabel="High" />
        </div>
      </div>
    </div>
  );
}

/** ---------- IBL helpers ---------- */
function colorForRegion(name: string, palette: readonly string[]) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % palette.length;
  return palette[idx];
}

function oneHotRegionProbs(acronyms: string[], regionList: readonly string[]) {
  return acronyms.map((a) => {
    const vec = Array(regionList.length).fill(0);
    const idx = regionList.indexOf(a);
    if (idx >= 0) vec[idx] = 1;
    return vec;
  });
}

/** ---------- Main Component ---------- */
export default function Lfp2VecDemo() {
  const [dataset, setDataset] = useState<DatasetKey>("Allen");
  const [session, setSession] = useState<string>(DATASETS.Allen.sessions[0]);
  const [probe, setProbe] = useState<string>(DATASETS.Allen.probes[0]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const nChannels = 16;

  // IBL probe options come from /api/ibl/pids.
  const [iblPidOptions, setIblPidOptions] = useState<string[]>([]);
  const [iblSessionOptions, setIblSessionOptions] = useState<string[]>([]);
  const [iblPidsBySession, setIblPidsBySession] = useState<Record<string, string[]>>({});
  const [iblRegions, setIblRegions] = useState<string[]>([...REGIONS_BY_DATASET.IBL]);
  const [iblDownsampled, setIblDownsampled] = useState<IblTrackPoint[]>([]);

  // Allen probe options come from /api/allen/pids.
  const [allenPidOptions, setAllenPidOptions] = useState<string[]>([]);
  const [allenSessionOptions, setAllenSessionOptions] = useState<string[]>([]);
  const [allenPidsBySession, setAllenPidsBySession] = useState<Record<string, string[]>>({});
  const [allenRegions, setAllenRegions] = useState<string[]>([...REGIONS_BY_DATASET.Allen]);
  const [allenDownsampled, setAllenDownsampled] = useState<IblTrackPoint[]>([]);

  // Real probe visual data (waveform, heatmaps) for Allen probes.
  const [probeVisuals, setProbeVisuals] = useState<ProbeVisuals | null>(null);

  // Probe brain visualization image (PNG from batch script)
  const [probeVizImage, setProbeVizImage] = useState<string | null>(null);

  useEffect(() => {
    if (dataset === "IBL" || dataset === "Allen") {
      setSession("");
      setProbe("");
      return;
    }
    setSession(DATASETS[dataset].sessions[0]);
    setProbe(DATASETS[dataset].probes[0]);
  }, [dataset]);

  // Neuronexus keeps the original synthetic loading delay behavior.
  useEffect(() => {
    if (dataset === "IBL" || dataset === "Allen") return;
    setLoaded(false);
    const t = window.setTimeout(() => setLoaded(true), 250);
    return () => window.clearTimeout(t);
  }, [dataset, session, probe]);

  const seed = useMemo(() => {
    let h = 0;
    const str = dataset + session + probe;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }, [dataset, session, probe]);

  /** ---------- Signals: real for Allen (when available), synthetic otherwise ---------- */
  const syntheticWaveforms = useMemo(() => generateWaveform(seed, nChannels, 200), [seed]);
  const syntheticLfp = useMemo(() => generateHeatmap(seed + 1, nChannels, 40), [seed]);
  const syntheticMua = useMemo(() => generateHeatmap(seed + 2, nChannels, 40), [seed]);
  const syntheticCsd = useMemo(() => generateHeatmap(seed + 3, nChannels, 40), [seed]);

  const waveforms = probeVisuals?.waveform ?? syntheticWaveforms;
  const lfpPower = probeVisuals?.lfpPower ?? syntheticLfp;
  const muaPower = probeVisuals?.muaPower ?? syntheticMua;
  const csdProfile = probeVisuals?.csd ?? syntheticCsd;

  /**
   * Region probabilities:
   * - Allen / Neuronexus: synthetic generator
   * - IBL: one-hot from CSV acronyms (still fits your RegionProbChart + LabelStrip)
   */
  const [regionProbs, setRegionProbs] = useState<RegionProbs>(
    () => Array.from({ length: nChannels }, () => Array(BRAIN_REGIONS.length).fill(1 / BRAIN_REGIONS.length))
  );

  // For IBL only: load pid list from server-side cached CSV index.
  useEffect(() => {
    let cancelled = false;

    async function loadIblPids() {
      if (dataset !== "IBL") return;
      setLoaded(false);

      try {
        const res = await fetch("/api/ibl/pids");
        if (!res.ok) throw new Error(`Failed to fetch IBL pids (${res.status})`);

        const data = (await res.json()) as IblPidIndexResponse;
        const pids = Array.isArray(data.pids) ? data.pids : [];
        const sessions = Array.isArray(data.sessions) ? data.sessions : [];
        const bySession = data.pidsBySession ?? {};

        if (!cancelled) {
          setIblSessionOptions(sessions);
          setIblPidsBySession(bySession);
          setSession((prev) => (sessions.includes(prev) ? prev : (sessions[0] ?? "")));
          if (pids.length === 0 || sessions.length === 0) setLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load IBL pids", error);
        if (!cancelled) {
          setIblSessionOptions([]);
          setIblPidsBySession({});
          setIblPidOptions([]);
          setSession("");
          setProbe("");
          setLoaded(true);
        }
      }
    }

    loadIblPids().catch((e) => console.error(e));

    return () => {
      cancelled = true;
    };
  }, [dataset]);

  // Allen index: cached static JSON with sessions, pids, and track data.
  const [allenIndex, setAllenIndex] = useState<AllenIndexResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAllenIndex() {
      if (dataset !== "Allen") return;
      setLoaded(false);

      try {
        const res = await fetch("/data/allen/index.json");
        if (!res.ok) throw new Error(`Failed to fetch Allen index (${res.status})`);

        const data = (await res.json()) as AllenIndexResponse;

        if (!cancelled) {
          setAllenIndex(data);
          setAllenSessionOptions(data.sessions);
          setAllenPidsBySession(data.pidsBySession);
          setSession((prev) => (data.sessions.includes(prev) ? prev : (data.sessions[0] ?? "")));
          if (data.sessions.length === 0) setLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load Allen index", error);
        if (!cancelled) {
          setAllenIndex(null);
          setAllenSessionOptions([]);
          setAllenPidsBySession({});
          setAllenPidOptions([]);
          setSession("");
          setProbe("");
          setLoaded(true);
        }
      }
    }

    loadAllenIndex().catch((e) => console.error(e));

    return () => {
      cancelled = true;
    };
  }, [dataset]);

  // Keep Allen pid options synchronized to selected session.
  useEffect(() => {
    if (dataset !== "Allen") return;
    const pids = allenPidsBySession[session] ?? [];
    setAllenPidOptions(pids);
    setProbe((prev) => (pids.includes(prev) ? prev : (pids[0] ?? "")));
  }, [dataset, session, allenPidsBySession]);

  // Keep IBL pid options synchronized to selected eid session.
  useEffect(() => {
    if (dataset !== "IBL") return;
    const pids = iblPidsBySession[session] ?? [];
    setIblPidOptions(pids);
    setProbe((prev) => (pids.includes(prev) ? prev : (pids[0] ?? "")));
  }, [dataset, session, iblPidsBySession]);

  // Neuronexus region probabilities remain synthetic.
  useEffect(() => {
    let cancelled = false;

    function computeSyntheticRegions() {
      if (dataset === "IBL" || dataset === "Allen") return;
      const probs = generateRegionProbs(seed + 4, nChannels, BRAIN_REGIONS);
      if (!cancelled) {
        setRegionProbs(probs);
        setIblDownsampled([]);
        setAllenDownsampled([]);
      }
    }

    computeSyntheticRegions();
    return () => {
      cancelled = true;
    };
  }, [dataset, seed, nChannels]);

  // IBL region probabilities come from server-side downsampled track acronyms.
  useEffect(() => {
    let cancelled = false;

    async function loadIblTrack() {
      if (dataset !== "IBL") return;
      if (!iblSessionOptions.includes(session)) return;
      if (iblPidOptions.length === 0) return;
      if (!iblPidOptions.includes(probe)) return;
      if (!session) return;
      if (!probe) return;

      setLoaded(false);

      try {
        const res = await fetch(
          `/api/ibl/track?eid=${encodeURIComponent(session)}&pid=${encodeURIComponent(probe)}&n=${nChannels}`
        );
        if (!res.ok) throw new Error(`Failed to fetch IBL track (${res.status})`);

        const data = (await res.json()) as IblTrackResponse;
        const regions = data.uniqueAcronyms.length ? data.uniqueAcronyms : [...REGIONS_BY_DATASET.IBL];
        const probs = oneHotRegionProbs(data.acronyms, regions);

        if (!cancelled) {
          setIblRegions(regions);
          setRegionProbs(probs);
          setIblDownsampled(Array.isArray(data.downsampled) ? data.downsampled : []);
          setLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load IBL track", error);
        if (!cancelled) {
          const fallbackRegions = [...REGIONS_BY_DATASET.IBL];
          setIblRegions(fallbackRegions);
          setRegionProbs(
            Array.from({ length: nChannels }, () =>
              Array(fallbackRegions.length).fill(1 / fallbackRegions.length)
            )
          );
          setIblDownsampled([]);
          setLoaded(true);
        }
      }
    }

    loadIblTrack().catch((e) => console.error(e));

    return () => {
      cancelled = true;
    };
  }, [dataset, session, probe, nChannels, iblPidOptions, iblSessionOptions]);

  // Allen region probabilities come from the cached static index.
  useEffect(() => {
    if (dataset !== "Allen") return;
    if (!allenIndex) return;
    if (!probe) return;

    const trackData = allenIndex.tracks[probe];
    if (!trackData) {
      const fallbackRegions = [...REGIONS_BY_DATASET.Allen];
      setAllenRegions(fallbackRegions);
      setRegionProbs(
        Array.from({ length: nChannels }, () =>
          Array(fallbackRegions.length).fill(1 / fallbackRegions.length)
        )
      );
      setAllenDownsampled([]);
      setLoaded(true);
      return;
    }

    const regions = trackData.uniqueAcronyms.length ? trackData.uniqueAcronyms : [...REGIONS_BY_DATASET.Allen];
    const probs = oneHotRegionProbs(trackData.acronyms, regions);

    setAllenRegions(regions);
    setRegionProbs(probs);
    setAllenDownsampled(Array.isArray(trackData.downsampled) ? trackData.downsampled : []);
    setLoaded(true);
  }, [dataset, probe, nChannels, allenIndex]);

  // Fetch real probe visuals (waveform, heatmaps) for Allen probes.
  useEffect(() => {
    let cancelled = false;

    async function loadProbeVisuals() {
      if (dataset !== "Allen") {
        setProbeVisuals(null);
        return;
      }
      if (!probe) return;

      try {
        const res = await fetch(`/data/allen/${probe}.json`);
        if (!res.ok) {
          // No real data for this probe, fall back to synthetic
          if (!cancelled) setProbeVisuals(null);
          return;
        }
        const data = (await res.json()) as ProbeVisuals;
        if (!cancelled) setProbeVisuals(data);
      } catch {
        if (!cancelled) setProbeVisuals(null);
      }
    }

    loadProbeVisuals().catch(() => {});
    return () => { cancelled = true; };
  }, [dataset, probe]);

  // Load probe brain visualization PNG for Allen probes
  useEffect(() => {
    let cancelled = false;

    async function loadProbeVizImage() {
      if (dataset !== "Allen") {
        if (!cancelled) setProbeVizImage(null);
        return;
      }
      if (!probe || !session) {
        if (!cancelled) setProbeVizImage(null);
        return;
      }

      // Try to find the visualization in the probe_visualizations folder
      // The session in the path is the session ID (eid), not the probe session
      const vizPath = `/probe_visualizations/session_${session}/${probe}.png`;

      try {
        // Try to fetch the image to check if it exists
        const res = await fetch(vizPath);
        if (res.ok) {
          if (!cancelled) setProbeVizImage(vizPath);
          return;
        }
      } catch {
        // File doesn't exist
      }

      // No visualization found
      if (!cancelled) setProbeVizImage(null);
    }

    loadProbeVizImage().catch(() => {
      if (!cancelled) setProbeVizImage(null);
    });
    return () => { cancelled = true; };
  }, [dataset, session, probe]);

  /** ---------- Colors from regionProbs (works for synthetic + one-hot) ---------- */
  const estimatedColors = useMemo(() => {
    // For IBL, color directly from downsampled server track labels.
    if (dataset === "IBL" && iblDownsampled.length > 0) {
      return iblDownsampled.map((pt) => colorForRegion(pt.acronym || "UNK", REGION_COLORS));
    }

    // For Allen, color directly from downsampled server track labels.
    if (dataset === "Allen" && allenDownsampled.length > 0) {
      return allenDownsampled.map((pt) => colorForRegion(pt.acronym || "UNK", REGION_COLORS));
    }

    // Neuronexus colors from synthetic regionProbs
    return regionProbs.map((p) => {
      let maxIdx = 0;
      let maxVal = -Infinity;
      for (let i = 0; i < p.length; i++) {
        if (p[i] > maxVal) {
          maxVal = p[i];
          maxIdx = i;
        }
      }
      return REGION_COLORS[maxIdx % REGION_COLORS.length];
    });
  }, [dataset, regionProbs, iblDownsampled, allenDownsampled]);

  /** ---------- Active regions tags ---------- */
  const activeRegionIndices = useMemo(() => {
    const s = new Set<number>();
    regionProbs.forEach((p) => {
      let maxIdx = 0;
      let maxVal = -Infinity;
      for (let i = 0; i < p.length; i++) {
        if (p[i] > maxVal) {
          maxVal = p[i];
          maxIdx = i;
        }
      }
      s.add(maxIdx);
    });
    return [...s].sort((a, b) => a - b);
  }, [regionProbs]);

  const regionNamesForTags = dataset === "IBL" ? iblRegions : dataset === "Allen" ? allenRegions : BRAIN_REGIONS;

  /** ---------- Probe options ---------- */
  const probeOptions =
    dataset === "IBL" ? (iblPidOptions.length ? iblPidOptions : DATASETS.IBL.probes) :
    dataset === "Allen" ? (allenPidOptions.length ? allenPidOptions : DATASETS.Allen.probes) :
    DATASETS[dataset].probes;
  const sessionOptions =
    dataset === "IBL" ? (iblSessionOptions.length ? iblSessionOptions : DATASETS.IBL.sessions) :
    dataset === "Allen" ? (allenSessionOptions.length ? allenSessionOptions : DATASETS.Allen.sessions) :
    DATASETS[dataset].sessions;

  return (
    <div id="lfp2vec-demo">
      <div className="content">
        <h3 className="title is-4">Interactive Demo</h3>
        <p className="has-text-grey">
          {dataset === "IBL"
            ? "IBL region labels loaded from CSV; signals are synthetic/seeded for visualization."
            : dataset === "Allen"
            ? "Allen Brain Observatory region labels loaded from API; signals are synthetic/seeded for visualization."
            : "Synthetic visualization (seeded) to illustrate the signals and predicted region decoding structure."}
        </p>
      </div>

      <div className="box">
        <div className="columns is-multiline is-vcentered">
          <div className="column is-narrow">
            <Dropdown
              label="Dataset"
              value={dataset}
              options={Object.keys(DATASETS)}
              onChange={(v) => setDataset(v as DatasetKey)}
            />
          </div>

          <div className="column is-narrow">
            <Dropdown label="Session" value={session} options={sessionOptions} onChange={setSession} />
          </div>

          <div className="column is-narrow">
            <Dropdown label={dataset === "IBL" ? "Insertion (pid)" : dataset === "Allen" ? "Probe (pid)" : "Probe"} value={probe} options={probeOptions} onChange={setProbe} />
          </div>

          <div className="column">
            <div className="tags">
              {activeRegionIndices.slice(0, 6).map((idx) => (
                <span key={idx} className="tag is-light">
                  {regionNamesForTags[idx] ?? "UNK"}
                </span>
              ))}
              {!loaded ? (
                <span className="tag is-warning is-light">Loading…</span>
              ) : (
                <span className="tag is-success is-light">Ready</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Probe Brain Visualization */}
      {probeVizImage && (
        <div className="content">
          <h3 className="title is-5">Probe Insertion Visualization</h3>
        </div>
      )}

      {probeVizImage && (
        <div className="box">
          <figure className="image">
            <img src={probeVizImage} alt={`Probe ${probe} brain visualization`} />
          </figure>
          <p className="is-size-7 has-text-grey mt-3">
            Coronal (left), Sagittal (center), and Axial (right) views showing probe insertion through Allen Brain Atlas.
          </p>
        </div>
      )}

      {/* Compact Layout: Ground Truth and Predictions Side-by-Side */}
      <div className="content">
        <h3 className="title is-5">Ground Truth & Predictions</h3>
      </div>

      {/* Raw Signal and Labels Side-by-Side */}
      <div className="columns is-multiline">
        <div className="column is-6">
          <Panel title="Raw LFP Signal" subtitle={`${nChannels}ch × 500ms`}>
            <WaveformCanvas channels={waveforms} height={160} />
          </Panel>
        </div>

        <div className="column is-6">
          <Panel title="Predicted Labels" subtitle="argmax region per channel">
            <RegionLabelStrip probs={regionProbs} height={160} />
          </Panel>
        </div>
      </div>

      {/* Heatmaps: LFP, MUA, CSD Side-by-Side */}
      <div className="columns is-multiline">
        <div className="column is-4">
          <HeatmapSliderCard
            title="LFP Power"
            subtitle="1–300 Hz"
            data={lfpPower}
            colormap="viridis"
            height={180}
          />
        </div>

        <div className="column is-4">
          <HeatmapSliderCard
            title="MUA Power"
            subtitle="300–6000 Hz"
            data={muaPower}
            colormap="inferno"
            height={180}
          />
        </div>

        <div className="column is-4">
          <Panel title="CSD Profile" subtitle="Current Source Density">
            <HeatmapCanvas data={csdProfile} height={180} colormap="coolwarm" />
          </Panel>
        </div>
      </div>

      {/* Region Probability (Full Width, Compact) */}
      <div className="columns is-multiline">
        <div className="column is-12">
          <Panel title="Region Probability" subtitle="Per-channel posterior">
            <RegionProbChart probs={regionProbs} height={200} />
          </Panel>
        </div>
      </div>

      <div className="box mt-5">
        <div className="content">
          <h4 className="title is-6">Method (high-level)</h4>
          <p>
            LFP2Vec adapts an audio-pretrained wav2vec 2.0 transformer via continued self-supervised learning on
            unlabeled LFP data, then fine-tunes for anatomical region decoding. This demo uses real region labels
            from Allen Brain Observatory and IBL when available, and synthetic/seeded signals for illustration.
          </p>
        </div>
      </div>
    </div>
  );
}
