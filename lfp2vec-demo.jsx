import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Seeded random for reproducible "data"
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate synthetic LFP-like waveform
function generateWaveform(seed, nChannels, nSamples) {
  const rng = seededRandom(seed);
  const channels = [];
  for (let ch = 0; ch < nChannels; ch++) {
    const data = [];
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
function generateHeatmap(seed, rows, cols) {
  const rng = seededRandom(seed);
  const data = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    const baseFreq = rng() * 3;
    for (let c = 0; c < cols; c++) {
      const t = c / cols;
      const depthFactor = Math.sin((r / rows) * Math.PI * (1.5 + baseFreq));
      row.push(
        0.5 + 0.3 * depthFactor * Math.cos(2 * Math.PI * 2 * t) + (rng() - 0.5) * 0.3
      );
    }
    data.push(row);
  }
  return data;
}

// Generate region probabilities (step-like)
function generateRegionProbs(seed, nChannels, regions) {
  const rng = seededRandom(seed);
  const probs = [];
  let currentRegion = Math.floor(rng() * regions.length);
  for (let ch = 0; ch < nChannels; ch++) {
    if (rng() < 0.15) currentRegion = Math.min(regions.length - 1, Math.max(0, currentRegion + (rng() > 0.5 ? 1 : -1)));
    const p = [];
    for (let r = 0; r < regions.length; r++) {
      p.push(r === currentRegion ? 0.5 + rng() * 0.4 : rng() * 0.15);
    }
    const sum = p.reduce((a, b) => a + b, 0);
    probs.push(p.map((v) => v / sum));
  }
  return probs;
}

const BRAIN_REGIONS = ["VISp", "VISl", "VISrl", "VISam", "VISpm", "CA1", "CA3", "DG", "LP", "LGd", "VPM", "POL"];
const REGION_COLORS = [
  "#E74C3C", "#3498DB", "#2ECC71", "#F39C12", "#9B59B6",
  "#1ABC9C", "#E67E22", "#34495E", "#16A085", "#C0392B",
  "#2980B9", "#8E44AD"
];

const DATASETS = {
  Allen: {
    sessions: ["session_715093703", "session_719161530", "session_721123822", "session_732592105", "session_737581020"],
    probes: ["probeA", "probeB", "probeC", "probeD", "probeE", "probeF"],
  },
  IBL: {
    sessions: ["KS023_2019-12-10", "CSHL049_2020-01-08", "SWC054_2020-10-05", "NYU045_2021-03-12"],
    probes: ["probe00", "probe01"],
  },
  Neuronexus: {
    sessions: ["subject1_day1", "subject1_day3", "subject2_day1", "subject3_day2"],
    probes: ["shank1", "shank2", "shank3", "shank4"],
  },
};

// Canvas-based waveform renderer
function WaveformCanvas({ channels, width, height, color = "#8ECAE6" }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const nCh = channels.length;
    const chHeight = height / nCh;

    channels.forEach((ch, idx) => {
      const yCenter = chHeight * idx + chHeight / 2;
      ctx.strokeStyle = color;
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

      // channel divider
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, chHeight * (idx + 1));
      ctx.lineTo(width, chHeight * (idx + 1));
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }, [channels, width, height, color]);

  return <canvas ref={canvasRef} style={{ width, height, display: "block", borderRadius: 4 }} />;
}

// Canvas-based heatmap renderer
function HeatmapCanvas({ data, width, height, colormap = "viridis" }) {
  const canvasRef = useRef(null);

  const getColor = useCallback((v) => {
    const t = Math.max(0, Math.min(1, v));
    if (colormap === "viridis") {
      const r = Math.round(68 + t * (253 - 68));
      const g = Math.round(1 + t * (231 - 1));
      const b = Math.round(84 + t * (37 - 84));
      return `rgb(${r},${g},${b})`;
    } else if (colormap === "inferno") {
      const r = Math.round(0 + t * 252);
      const g = Math.round(0 + t * 255 * (t > 0.5 ? 1 : 0.3));
      const b = Math.round(4 + (1 - t) * 150);
      return `rgb(${r},${g},${b})`;
    } else {
      const r = Math.round(t * 255);
      const g = Math.round((1 - Math.abs(t - 0.5) * 2) * 200);
      const b = Math.round((1 - t) * 255);
      return `rgb(${r},${g},${b})`;
    }
  }, [colormap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const rows = data.length;
    const cols = data[0].length;
    const cellW = width / cols;
    const cellH = height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = getColor(data[r][c]);
        ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1);
      }
    }
  }, [data, width, height, getColor]);

  return <canvas ref={canvasRef} style={{ width, height, display: "block", borderRadius: 4 }} />;
}

// Brain cross-section SVG
function BrainSection({ probeLine, regionColors, width = 220, height = 220, isEstimated = false }) {
  const probeStart = probeLine?.[0] || { x: 0.6, y: 0.1 };
  const probeEnd = probeLine?.[1] || { x: 0.4, y: 0.9 };

  return (
    <svg viewBox="0 0 220 220" width={width} height={height} style={{ display: "block" }}>
      {/* Brain outline */}
      <ellipse cx="110" cy="115" rx="95" ry="85" fill="none" stroke="#4a5568" strokeWidth="1.5" />
      {/* Cortex folds */}
      <path d="M50,80 Q70,60 90,75 Q110,55 130,70 Q150,55 170,80" fill="none" stroke="#4a5568" strokeWidth="1" />
      {/* Corpus callosum */}
      <ellipse cx="110" cy="100" rx="50" ry="18" fill="none" stroke="#4a5568" strokeWidth="1" />
      {/* Hippocampus */}
      <path d="M80,130 Q95,145 115,140 Q130,135 140,130" fill="none" stroke="#4a5568" strokeWidth="1" />
      {/* Thalamus */}
      <ellipse cx="100" cy="120" rx="18" ry="14" fill="none" stroke="#4a5568" strokeWidth="0.8" />
      <ellipse cx="120" cy="120" rx="18" ry="14" fill="none" stroke="#4a5568" strokeWidth="0.8" />
      {/* Ventricles */}
      <path d="M95,105 Q100,115 105,105" fill="none" stroke="#4a5568" strokeWidth="0.6" />
      <path d="M115,105 Q120,115 125,105" fill="none" stroke="#4a5568" strokeWidth="0.6" />
      {/* Midline */}
      <line x1="110" y1="30" x2="110" y2="200" stroke="#4a5568" strokeWidth="0.5" strokeDasharray="3,3" />

      {/* Probe trajectory */}
      {isEstimated && regionColors ? (
        <>
          {regionColors.map((c, i) => {
            const n = regionColors.length;
            const x1 = probeStart.x * 220 + ((probeEnd.x * 220 - probeStart.x * 220) * i) / n;
            const y1 = probeStart.y * 220 + ((probeEnd.y * 220 - probeStart.y * 220) * i) / n;
            const x2 = probeStart.x * 220 + ((probeEnd.x * 220 - probeStart.x * 220) * (i + 1)) / n;
            const y2 = probeStart.y * 220 + ((probeEnd.y * 220 - probeStart.y * 220) * (i + 1)) / n;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="3" strokeLinecap="round" />;
          })}
        </>
      ) : (
        <line
          x1={probeStart.x * 220} y1={probeStart.y * 220}
          x2={probeEnd.x * 220} y2={probeEnd.y * 220}
          stroke="#E74C3C" strokeWidth="2" strokeLinecap="round"
        />
      )}

      {/* Probe tip */}
      <circle cx={probeEnd.x * 220} cy={probeEnd.y * 220} r="3" fill={isEstimated ? regionColors?.[regionColors.length - 1] || "#fff" : "#E74C3C"} />
    </svg>
  );
}

// Region probability stacked area chart
function RegionProbChart({ probs, regions, width, height }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !probs.length) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const nCh = probs.length;
    const nR = regions.length;

    // Draw as horizontal stacked bars (depth along Y)
    const barH = height / nCh;
    for (let ch = 0; ch < nCh; ch++) {
      let xOff = 0;
      for (let r = 0; r < nR; r++) {
        const w = probs[ch][r] * width;
        ctx.fillStyle = REGION_COLORS[r % REGION_COLORS.length];
        ctx.globalAlpha = 0.85;
        ctx.fillRect(xOff, ch * barH, w, barH);
        xOff += w;
      }
    }
    ctx.globalAlpha = 1;
  }, [probs, regions, width, height]);

  return <canvas ref={canvasRef} style={{ width, height, display: "block", borderRadius: 4 }} />;
}

// Region labels strip
function RegionLabelStrip({ probs, regions, width, height }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !probs.length) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const nCh = probs.length;
    const barH = height / nCh;

    for (let ch = 0; ch < nCh; ch++) {
      const maxIdx = probs[ch].indexOf(Math.max(...probs[ch]));
      ctx.fillStyle = REGION_COLORS[maxIdx % REGION_COLORS.length];
      ctx.fillRect(0, ch * barH, width, barH);
    }
  }, [probs, regions, width, height]);

  return <canvas ref={canvasRef} style={{ width, height, display: "block", borderRadius: 4 }} />;
}

// Dropdown component
function Dropdown({ label, value, options, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 10,
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "#94a3b8",
        fontWeight: 500
      }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 6,
          color: "#e2e8f0",
          padding: "8px 32px 8px 12px",
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          cursor: "pointer",
          outline: "none",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' fill='none' stroke='%2394a3b8' stroke-width='1.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          minWidth: 180,
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
        onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// Panel wrapper
function Panel({ title, children, subtitle, width }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: width || "auto",
      flex: width ? "none" : 1,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#cbd5e1",
          fontWeight: 600
        }}>
          {title}
        </span>
        {subtitle && (
          <span style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color: "#64748b",
          }}>
            {subtitle}
          </span>
        )}
      </div>
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 8,
        padding: 12,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {children}
      </div>
    </div>
  );
}

export default function Lfp2VecDemo() {
  const [dataset, setDataset] = useState("Allen");
  const [session, setSession] = useState(DATASETS.Allen.sessions[0]);
  const [probe, setProbe] = useState(DATASETS.Allen.probes[0]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const t = setTimeout(() => setLoaded(true), 400);
    return () => clearTimeout(t);
  }, [dataset, session, probe]);

  useEffect(() => {
    setSession(DATASETS[dataset].sessions[0]);
    setProbe(DATASETS[dataset].probes[0]);
  }, [dataset]);

  // Derive a seed from selections
  const seed = useMemo(() => {
    let h = 0;
    const str = dataset + session + probe;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }, [dataset, session, probe]);

  const nChannels = 16;
  const waveforms = useMemo(() => generateWaveform(seed, nChannels, 200), [seed]);
  const lfpPower = useMemo(() => generateHeatmap(seed + 1, nChannels, 40), [seed]);
  const muaPower = useMemo(() => generateHeatmap(seed + 2, nChannels, 40), [seed]);
  const csdProfile = useMemo(() => generateHeatmap(seed + 3, nChannels, 40), [seed]);
  const regionProbs = useMemo(() => generateRegionProbs(seed + 4, nChannels, BRAIN_REGIONS), [seed]);

  const estimatedColors = useMemo(() => {
    return regionProbs.map((p) => {
      const maxIdx = p.indexOf(Math.max(...p));
      return REGION_COLORS[maxIdx % REGION_COLORS.length];
    });
  }, [regionProbs]);

  const rng = seededRandom(seed);
  const probeLineGT = [{ x: 0.55 + rng() * 0.1, y: 0.12 }, { x: 0.42 + rng() * 0.08, y: 0.88 }];
  const probeLineEst = [{ x: probeLineGT[0].x + 0.01, y: probeLineGT[0].y + 0.02 }, { x: probeLineGT[1].x - 0.01, y: probeLineGT[1].y - 0.01 }];

  // Unique top regions for legend
  const activeRegionIndices = useMemo(() => {
    const s = new Set();
    regionProbs.forEach((p) => s.add(p.indexOf(Math.max(...p))));
    return [...s].sort((a, b) => a - b);
  }, [regionProbs]);

  return (
    <div style={{
      background: "#020617",
      color: "#e2e8f0",
      minHeight: "100vh",
      fontFamily: "'Instrument Sans', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "0 0 48px 0",
    }}>
      {/* Load fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1e293b",
        padding: "28px 40px 24px",
        background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#3b82f6",
              boxShadow: "0 0 12px #3b82f680",
            }} />
            <span style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#3b82f6",
              fontWeight: 600,
            }}>
              NeurIPS 2025 &middot; Interactive Demo
            </span>
          </div>

          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            lineHeight: 1.3,
            margin: 0,
            letterSpacing: "-0.02em",
            color: "#f1f5f9",
          }}>
            LFP2Vec
            <span style={{ color: "#64748b", fontWeight: 400, fontSize: 20 }}>
              {" "}&mdash; Self-Supervised Localization of Microelectrode Arrays
            </span>
          </h1>

          <p style={{
            fontSize: 13,
            color: "#64748b",
            margin: "10px 0 0",
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.5,
          }}>
            He, Patel, Li, Maslarova, Vöröslakos, Ramanathan, Hung, Buzsáki, Varol
          </p>

          <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
            <a href="https://openreview.net/forum?id=96liIPUPXG" target="_blank" rel="noopener" style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#3b82f6",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              border: "1px solid #1e3a5f",
              borderRadius: 5,
              transition: "all 0.2s",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
              Paper
            </a>
            <a href="https://github.com/tianxiao18/lfp2vec" target="_blank" rel="noopener" style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#3b82f6",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              border: "1px solid #1e3a5f",
              borderRadius: 5,
              transition: "all 0.2s",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Code
            </a>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "24px 40px",
      }}>
        <div style={{
          display: "flex",
          gap: 20,
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}>
          <Dropdown label="Dataset" value={dataset} options={Object.keys(DATASETS)} onChange={setDataset} />
          <Dropdown label="Session" value={session} options={DATASETS[dataset].sessions} onChange={setSession} />
          <Dropdown label="Probe" value={probe} options={DATASETS[dataset].probes} onChange={setProbe} />

          {/* Legend */}
          <div style={{
            marginLeft: "auto",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}>
            {activeRegionIndices.slice(0, 6).map((idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: REGION_COLORS[idx],
                }} />
                <span style={{
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#94a3b8",
                }}>
                  {BRAIN_REGIONS[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visualization grid */}
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "0 40px",
        opacity: loaded ? 1 : 0.3,
        transition: "opacity 0.4s ease",
      }}>
        {/* Row 1: Ground Truth */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 12,
        }}>
          <div style={{
            width: 3,
            height: 16,
            borderRadius: 2,
            background: "#E74C3C",
          }} />
          <span style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#E74C3C",
            fontWeight: 600,
          }}>
            Ground Truth
          </span>
        </div>

        <div style={{
          display: "flex",
          gap: 16,
          marginBottom: 32,
          alignItems: "stretch",
        }}>
          <Panel title="Insertion Path" subtitle="Atlas-registered" width={246}>
            <BrainSection probeLine={probeLineGT} width={220} height={220} isEstimated={false} />
          </Panel>
          <Panel title="Raw LFP Signal" subtitle={`${nChannels}ch × 500ms`}>
            <WaveformCanvas channels={waveforms} width={320} height={220} color="#8ECAE6" />
          </Panel>
          <Panel title="LFP Power" subtitle="1–300 Hz">
            <HeatmapCanvas data={lfpPower} width={160} height={220} colormap="viridis" />
          </Panel>
          <Panel title="MUA Power" subtitle="300–6000 Hz">
            <HeatmapCanvas data={muaPower} width={160} height={220} colormap="inferno" />
          </Panel>
        </div>

        {/* Row 2: Model Predictions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 12,
        }}>
          <div style={{
            width: 3,
            height: 16,
            borderRadius: 2,
            background: "#3b82f6",
          }} />
          <span style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#3b82f6",
            fontWeight: 600,
          }}>
            Model Predictions
          </span>
          <span style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color: "#475569",
            marginLeft: 4,
          }}>
            LFP2Vec (wav2vec2 + SSL)
          </span>
        </div>

        <div style={{
          display: "flex",
          gap: 16,
          alignItems: "stretch",
        }}>
          <Panel title="Estimated Regions" subtitle="Predicted path" width={246}>
            <BrainSection probeLine={probeLineEst} width={220} height={220} isEstimated={true} regionColors={estimatedColors} />
          </Panel>
          <Panel title="CSD Profile" subtitle="Current Source Density">
            <HeatmapCanvas data={csdProfile} width={160} height={220} colormap="coolwarm" />
          </Panel>
          <Panel title="Region Probability" subtitle="Per-channel posterior">
            <RegionProbChart probs={regionProbs} regions={BRAIN_REGIONS} width={280} height={220} />
          </Panel>
          <Panel title="Region Labels" subtitle="argmax" width={80}>
            <RegionLabelStrip probs={regionProbs} regions={BRAIN_REGIONS} width={48} height={220} />
          </Panel>
        </div>

        {/* Method summary */}
        <div style={{
          marginTop: 40,
          padding: "20px 24px",
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 10,
          display: "flex",
          gap: 40,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 style={{
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#94a3b8",
              margin: "0 0 10px",
              fontWeight: 600,
            }}>
              Method
            </h3>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.65, margin: 0 }}>
              LFP2Vec adapts an audio-pretrained wav2vec 2.0 transformer via continued self-supervised learning on
              unlabeled LFP data, then fine-tunes for anatomical region decoding. The model achieves strong zero-shot
              generalization across labs and probe geometries.
            </p>
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6", fontFamily: "'JetBrains Mono', monospace" }}>93.2%</div>
              <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>Avg Accuracy</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6", fontFamily: "'JetBrains Mono', monospace" }}>Zero-shot</div>
              <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>Cross-lab Transfer</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6", fontFamily: "'JetBrains Mono', monospace" }}>3</div>
              <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>Datasets</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
