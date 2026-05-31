"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { CodeBlock } from "./components/CodeBlock";

interface AnalysisResult {
  hasQuestion: boolean;
  question: string;
  answer: string;
  language?: string;
}

const LANG_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  python:     { bg: "rgba(55,118,171,0.2)",  color: "#4b9cd3", label: "🐍 Python" },
  javascript: { bg: "rgba(240,219,79,0.2)",  color: "#f0db4f", label: "⚡ JavaScript" },
  typescript: { bg: "rgba(49,120,198,0.2)",  color: "#3178c6", label: "🔷 TypeScript" },
  java:       { bg: "rgba(234,88,12,0.2)",   color: "#ea580c", label: "☕ Java" },
  cpp:        { bg: "rgba(0,89,156,0.2)",    color: "#00599c", label: "⚙️ C++" },
  c:          { bg: "rgba(90,90,90,0.2)",    color: "#aaaaaa", label: "🔧 C" },
  csharp:     { bg: "rgba(104,33,122,0.2)",  color: "#68217a", label: "🟣 C#" },
  php:        { bg: "rgba(119,123,180,0.2)", color: "#777bb4", label: "🐘 PHP" },
  ruby:       { bg: "rgba(204,52,45,0.2)",   color: "#cc341d", label: "💎 Ruby" },
  go:         { bg: "rgba(0,173,216,0.2)",   color: "#00add8", label: "🐹 Go" },
  rust:       { bg: "rgba(222,165,132,0.2)", color: "#dea584", label: "🦀 Rust" },
  swift:      { bg: "rgba(240,81,56,0.2)",   color: "#f05138", label: "🍎 Swift" },
  kotlin:     { bg: "rgba(127,82,255,0.2)",  color: "#7f52ff", label: "🎯 Kotlin" },
  sql:        { bg: "rgba(0,150,136,0.2)",   color: "#009688", label: "🗄️ SQL" },
  bash:       { bg: "rgba(35,35,35,0.4)",    color: "#aaaaaa", label: "💻 Bash" },
  none:       { bg: "rgba(107,107,133,0.2)", color: "#6b6b85", label: "" },
};

// Syntax highlight tokens per language
function highlightCode(code: string, lang: string): React.ReactNode[] {
  const lines = code.split("\n");

  const pythonKeywords = /\b(def|return|if|else|elif|for|while|in|not|and|or|import|from|class|try|except|with|as|pass|break|continue|True|False|None|lambda|yield|raise|del|global|nonlocal|assert|is)\b/g;
  const jsKeywords = /\b(const|let|var|function|return|if|else|for|while|in|of|import|export|from|class|try|catch|finally|new|this|typeof|instanceof|true|false|null|undefined|async|await|=>)\b/g;
  const strings = /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const comments = /(#.*$|\/\/.*$)/gm;
  const builtins = /\b(print|input|len|range|int|str|float|list|dict|set|bool|type|sum|min|max|map|filter|enumerate|zip|open|console|document|window|Math|JSON|Array|Object|String|Number|Boolean|Promise)\b/g;

  return lines.map((line, i) => {
    // Tokenize line into colored spans
    type Token = { text: string; color: string };
    const tokens: Token[] = [];
    let remaining = line;

    // Check for comment first (whole line)
    const commentMatch = remaining.match(/^(\s*)(#.*|\/\/.*)$/);
    if (commentMatch) {
      return (
        <div key={i} style={{ minHeight: "1.6em" }}>
          {commentMatch[1] && <span>{commentMatch[1]}</span>}
          <span style={{ color: "#6b6b85", fontStyle: "italic" }}>{commentMatch[2]}</span>
        </div>
      );
    }

    // Simple token approach: split into segments
    const kwRegex = ["python", "py"].includes(lang) ? pythonKeywords : jsKeywords;
    const segments: { text: string; type: string }[] = [];
    let pos = 0;
    const fullLine = line;

    // Find all matches of strings, numbers, keywords, builtins
    const allMatches: { start: number; end: number; text: string; type: string }[] = [];

    // Strings
    let m: RegExpExecArray | null;
    const strRe = /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g;
    while ((m = strRe.exec(fullLine)) !== null) {
      allMatches.push({ start: m.index, end: m.index + m[0].length, text: m[0], type: "string" });
    }

    // Sort by start position, remove overlaps
    allMatches.sort((a, b) => a.start - b.start);
    const noOverlap: typeof allMatches = [];
    let lastEnd = 0;
    for (const match of allMatches) {
      if (match.start >= lastEnd) {
        noOverlap.push(match);
        lastEnd = match.end;
      }
    }

    // Build final segments
    pos = 0;
    for (const match of noOverlap) {
      if (pos < match.start) {
        segments.push({ text: fullLine.slice(pos, match.start), type: "code" });
      }
      segments.push({ text: match.text, type: match.type });
      pos = match.end;
    }
    if (pos < fullLine.length) {
      segments.push({ text: fullLine.slice(pos), type: "code" });
    }

    return (
      <div key={i} style={{ minHeight: "1.6em" }}>
        {segments.map((seg, j) => {
          if (seg.type === "string") {
            return <span key={j} style={{ color: "#f59e0b" }}>{seg.text}</span>;
          }
          // Within code segments, highlight keywords and builtins
          const parts = seg.text.split(kwRegex);
          const bParts: React.ReactNode[] = [];
          parts.forEach((p, k) => {
            const kws = ["python","py"].includes(lang)
              ? ["def","return","if","else","elif","for","while","in","not","and","or","import","from","class","try","except","with","as","pass","break","continue","True","False","None","lambda","yield","raise","del","global","nonlocal","assert","is"]
              : ["const","let","var","function","return","if","else","for","while","in","of","import","export","from","class","try","catch","finally","new","this","typeof","instanceof","true","false","null","undefined","async","await"];
            const builtinList = ["print","input","len","range","int","str","float","list","dict","set","bool","type","sum","min","max","map","filter","enumerate","zip","open","console","document","window","Math","JSON","Array","Object","String","Number","Boolean","Promise"];
            if (kws.includes(p)) {
              bParts.push(<span key={k} style={{ color: "#c084fc" }}>{p}</span>);
            } else if (builtinList.includes(p)) {
              bParts.push(<span key={k} style={{ color: "#38bdf8" }}>{p}</span>);
            } else {
              // Numbers
              const numSplit = p.split(/(\b\d+\.?\d*\b)/g);
              numSplit.forEach((n, l) => {
                if (/^\d+\.?\d*$/.test(n)) {
                  bParts.push(<span key={k+"-"+l} style={{ color: "#fb923c" }}>{n}</span>);
                } else {
                  bParts.push(<span key={k+"-"+l}>{n}</span>);
                }
              });
            }
          });
          return <span key={j}>{bParts}</span>;
        })}
      </div>
    );
  });
}

// Renders answer text with proper code block and inline formatting
function renderAnswer(text: string) {
  // Normalize escaped newlines from JSON
  const normalized = text.replace(/\\n/g, "\n");

  const parts = normalized.split(/(```[\w]*\n[\s\S]*?```)/g);
  return parts.map((part, i) => {
    const codeMatch = part.match(/^```([\w]*)\n([\s\S]*?)```$/);
    if (codeMatch) {
      return <CodeBlock key={i} language={codeMatch[1] || "python"} code={codeMatch[2]} />;
    }

    // Render normal text with inline code and bold
    const lines = part.split("\n");
    return (
      <span key={i}>
        {lines.map((line, li) => {
          const inlineParts = line.split(/(`[^`]+`)/g);
          return (
            <span key={li}>
              {inlineParts.map((p, j) => {
                if (p.startsWith("`") && p.endsWith("`")) {
                  return <code key={j} style={{ background: "rgba(124,58,237,0.2)", color: "#06d6a0", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 12 }}>{p.slice(1, -1)}</code>;
                }
                const boldParts = p.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <span key={j}>
                    {boldParts.map((b, k) => {
                      if (b.startsWith("**") && b.endsWith("**")) {
                        return <strong key={k} style={{ color: "#e8e8f0" }}>{b.slice(2, -2)}</strong>;
                      }
                      return <span key={k}>{b}</span>;
                    })}
                  </span>
                );
              })}
              {li < lines.length - 1 && <br />}
            </span>
          );
        })}
      </span>
    );
  });
}

type ScanStatus = "idle" | "scanning" | "detected" | "cooldown" | "error";

const MOTION_THRESHOLD = 30; // pixel diff threshold (0-255)
const MOTION_PERCENT = 0.04; // 4% of pixels must change
const COOLDOWN_SECONDS = 15;

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerPanelRef = useRef<HTMLDivElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [scanInterval, setScanInterval] = useState(4);
  const [frameCount, setFrameCount] = useState(0);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [autoScan, setAutoScan] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "info" | "error" | "success" } | null>(null);

  // Detect orientation
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  const showToast = useCallback((msg: string, type: "info" | "error" | "success" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const startCooldown = useCallback(() => {
    setStatus("cooldown");
    setCooldownLeft(COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          setStatus("scanning");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const detectMotion = useCallback((canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (!prevFrameRef.current || prevFrameRef.current.width !== current.width) {
      prevFrameRef.current = current;
      return true; // first frame, allow
    }
    const prev = prevFrameRef.current;
    let changedPixels = 0;
    const totalPixels = current.width * current.height;
    for (let i = 0; i < current.data.length; i += 16) { // sample every 4th pixel
      const diff = Math.abs(current.data[i] - prev.data[i])
        + Math.abs(current.data[i + 1] - prev.data[i + 1])
        + Math.abs(current.data[i + 2] - prev.data[i + 2]);
      if (diff > MOTION_THRESHOLD) changedPixels++;
    }
    prevFrameRef.current = current;
    const ratio = changedPixels / (totalPixels / 4);
    return ratio > MOTION_PERCENT;
  }, []);

  const captureAndAnalyze = useCallback(async (manual = false) => {
    if (!videoRef.current || !canvasRef.current) return;
    if (status === "cooldown") {
      if (manual) showToast(`⏳ Cooldown — wait ${cooldownLeft}s`, "info");
      return;
    }
    if (isAnalyzing) {
      if (manual) showToast("⏳ Already scanning, please wait...", "info");
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < 2) {
      if (manual) showToast("📷 Camera not ready yet", "error");
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    if (!manual) {
      const hasMotion = detectMotion(canvas);
      setMotionDetected(hasMotion);
      if (!hasMotion) { setStatus("scanning"); return; }
    } else {
      detectMotion(canvas);
      setMotionDetected(true);
    }

    const imageData = canvas.toDataURL("image/jpeg", 0.75);
    setFrameCount((c) => c + 1);
    setIsAnalyzing(true);
    setStatus("scanning");
    if (manual) showToast("🔍 Analyzing frame...", "info");

    try {
      setApiCallCount((c) => c + 1);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });
      const data = await res.json();

      if (res.status === 401) {
        setStatus("error");
        setError("Invalid API key.");
        showToast("❌ Invalid API key", "error");
        return;
      }

      if (data.hasQuestion) {
        setStatus("detected");
        setResult(data);
        showToast("✅ Question detected!", "success");
        setHistory((prev) => {
          const exists = prev.find((h) => h.question === data.question);
          if (exists) return prev;
          return [data, ...prev].slice(0, 20);
        });
        startCooldown();
      } else {
        setStatus("scanning");
        if (manual) showToast("🤷 No question detected in frame", "info");
      }
    } catch {
      setStatus("scanning");
      if (manual) showToast("❌ Network error — check connection", "error");
    } finally {
      setIsAnalyzing(false);
    }
  }, [status, cooldownLeft, isAnalyzing, detectMotion, startCooldown, showToast]);

  // Auto-scan interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (cameraActive && autoScan) {
      intervalRef.current = setInterval(captureAndAnalyze, scanInterval * 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [cameraActive, autoScan, scanInterval, captureAndAnalyze]);

  const startCamera = useCallback(async (mode?: "environment" | "user") => {
    try {
      setError("");
      prevFrameRef.current = null;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode ?? facingMode, width: { ideal: 1920 }, height: { ideal: 1080 }, aspectRatio: { ideal: 16/9 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setStatus("scanning");
      }
    } catch {
      setError("Camera access denied.");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setCameraActive(false);
    setStatus("idle");
    setCooldownLeft(0);
    prevFrameRef.current = null;
  }, []);

  const flipCamera = useCallback(() => {
    stopCamera();
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    setTimeout(() => startCamera(newMode), 300);
  }, [stopCamera, startCamera, facingMode]);

  const handleManualScan = useCallback(() => {
    captureAndAnalyze(true);
  }, [captureAndAnalyze]);

  const statusConfig: Record<ScanStatus, { label: string; color: string; dot: string }> = {
    idle: { label: "READY", color: "#6b6b85", dot: "#6b6b85" },
    scanning: { label: autoScan ? "AUTO SCANNING" : "READY TO SCAN", color: "#06d6a0", dot: "#06d6a0" },
    detected: { label: "QUESTION DETECTED", color: "#f72585", dot: "#f72585" },
    cooldown: { label: `COOLDOWN ${cooldownLeft}s`, color: "#f59e0b", dot: "#f59e0b" },
    error: { label: "ERROR", color: "#ef4444", dot: "#ef4444" },
  };
  const sc = statusConfig[status];

  const toastColors = {
    info: { bg: "rgba(124,58,237,0.15)", border: "rgba(124,58,237,0.4)", color: "#a78bfa" },
    error: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", color: "#ef4444" },
    success: { bg: "rgba(6,214,160,0.15)", border: "rgba(6,214,160,0.4)", color: "#06d6a0" },
  };

  // ── LANDSCAPE LAYOUT ──────────────────────────────────────────────
  if (isLandscape) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#0a0a0f", overflow: "hidden" }}>
        {/* LEFT: Camera */}
        <div style={{ flex: "0 0 58%", position: "relative", background: "#12121a", borderRight: "1px solid rgba(124,58,237,0.2)" }}>
          <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "contain", display: cameraActive ? "block" : "none", background: "#000" }} playsInline muted />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Corners */}
          {cameraActive && (
            <>
              <div style={{ position: "absolute", top: 10, left: 10, width: 22, height: 22, borderTop: "2px solid #06d6a0", borderLeft: "2px solid #06d6a0" }} />
              <div style={{ position: "absolute", top: 10, right: 10, width: 22, height: 22, borderTop: "2px solid #06d6a0", borderRight: "2px solid #06d6a0" }} />
              <div style={{ position: "absolute", bottom: 10, left: 10, width: 22, height: 22, borderBottom: "2px solid #06d6a0", borderLeft: "2px solid #06d6a0" }} />
              <div style={{ position: "absolute", bottom: 10, right: 10, width: 22, height: 22, borderBottom: "2px solid #06d6a0", borderRight: "2px solid #06d6a0" }} />
              {/* Motion indicator */}
              <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", background: motionDetected ? "rgba(6,214,160,0.2)" : "rgba(107,107,133,0.2)", border: `1px solid ${motionDetected ? "#06d6a0" : "#6b6b85"}`, borderRadius: 20, padding: "3px 10px", fontSize: 9, color: motionDetected ? "#06d6a0" : "#6b6b85", fontFamily: "monospace", letterSpacing: 1 }}>
                {motionDetected ? "● MOTION" : "◌ STILL"}
              </div>
              <div style={{ position: "absolute", bottom: 10, left: 12, fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>F:{frameCount} API:{apiCallCount}</div>
            </>
          )}

          {!cameraActive && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ fontSize: 48 }}>📷</div>
              <p style={{ color: "#6b6b85", fontSize: 13, margin: 0 }}>Tap START to activate camera</p>
              <button onClick={() => startCamera()} style={{ marginTop: 8, padding: "10px 24px", background: "linear-gradient(135deg, #7c3aed, #9333ea)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>▶ START</button>
            </div>
          )}

          {/* Bottom controls bar */}
          {cameraActive && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(10,10,15,0.85)", backdropFilter: "blur(8px)", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid rgba(124,58,237,0.2)" }}>
              <button onClick={stopCamera} style={{ padding: "6px 12px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⏹ STOP</button>
              <button onClick={flipCamera} style={{ padding: "6px 10px", background: "#1a1a26", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8, color: "#e8e8f0", fontSize: 14, cursor: "pointer" }}>🔄</button>
              {/* Auto-scan toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                <span style={{ fontSize: 10, color: "#6b6b85", fontFamily: "monospace" }}>AUTO</span>
                <div onClick={() => setAutoScan(a => !a)} style={{ width: 36, height: 20, borderRadius: 10, background: autoScan ? "#7c3aed" : "#1a1a26", border: `1px solid ${autoScan ? "#7c3aed" : "rgba(124,58,237,0.3)"}`, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: 2, left: autoScan ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                </div>
                {autoScan && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {[2, 4, 6].map(s => (
                      <button key={s} onClick={() => setScanInterval(s)} style={{ padding: "2px 6px", borderRadius: 6, border: `1px solid ${scanInterval === s ? "#06d6a0" : "rgba(124,58,237,0.2)"}`, background: scanInterval === s ? "rgba(6,214,160,0.1)" : "transparent", color: scanInterval === s ? "#06d6a0" : "#6b6b85", fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>{s}s</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Floating SCAN button */}
          {cameraActive && (
            <button
              onClick={handleManualScan}
              disabled={isAnalyzing || status === "cooldown"}
              style={{
                position: "absolute", bottom: 56, right: 16,
                width: 60, height: 60, borderRadius: "50%",
                background: isAnalyzing ? "linear-gradient(135deg, #7c3aed, #f72585)" : status === "cooldown" ? "#1a1a26" : "linear-gradient(135deg, #7c3aed, #f72585)",
                border: `2px solid ${status === "cooldown" ? "#6b6b85" : "rgba(255,255,255,0.2)"}`,
                color: "white", fontSize: isAnalyzing ? 20 : 11, fontWeight: 700,
                cursor: (isAnalyzing || status === "cooldown") ? "not-allowed" : "pointer",
                fontFamily: "monospace", letterSpacing: 1,
                boxShadow: status === "cooldown" ? "none" : "0 0 20px rgba(124,58,237,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: isAnalyzing ? "spin 1s linear infinite" : "none",
                opacity: isAnalyzing ? 0.85 : 1,
              }}
            >
              {isAnalyzing ? "⟳" : status === "cooldown" ? cooldownLeft : "SCAN"}
            </button>
          )}
        </div>

        {/* RIGHT: Response panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(124,58,237,0.2)", background: "#12121a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #7c3aed, #f72585)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>👁️</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, fontFamily: "monospace", color: "#e8e8f0" }}>VISIONQ</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0a0a0f", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(124,58,237,0.2)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, boxShadow: `0 0 5px ${sc.dot}` }} />
              <span style={{ fontSize: 9, color: sc.color, letterSpacing: 1, fontFamily: "monospace" }}>{sc.label}</span>
            </div>
          </div>

          {/* Answer area */}
          <div ref={answerPanelRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#ef4444" }}>⚠️ {error}</div>}

            {result?.hasQuestion ? (
              <div style={{ background: "#12121a", border: "1px solid rgba(6,214,160,0.3)", borderRadius: 14, padding: 14, boxShadow: "0 0 20px rgba(6,214,160,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f72585" }} />
                    <span style={{ fontSize: 9, color: "#f72585", letterSpacing: 1, fontFamily: "monospace" }}>DETECTED</span>
                  </div>
                  {result.language && result.language !== "none" && LANG_COLORS[result.language] && (
                    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace", padding: "2px 8px", borderRadius: 20, background: LANG_COLORS[result.language].bg, color: LANG_COLORS[result.language].color, border: `1px solid ${LANG_COLORS[result.language].color}40` }}>
                      {LANG_COLORS[result.language].label}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg, #7c3aed, #f72585)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>✦</div>
                  <div style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: "#e8e8f0", minWidth: 0, overflow: "hidden" }}>{renderAnswer(result.answer)}</div>
                </div>
                <div style={{ height: 1, background: "rgba(124,58,237,0.2)", margin: "8px 0" }} />
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "#6b6b85", fontStyle: "italic", lineHeight: 1.5 }}>&ldquo;{result.question}&rdquo;</p>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0.4 }}>
                <div style={{ fontSize: 32 }}>🔍</div>
                <p style={{ color: "#6b6b85", fontSize: 12, margin: 0, textAlign: "center" }}>Point camera at a question<br />and tap SCAN</p>
              </div>
            )}

            {/* History */}
            {history.length > 1 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "#6b6b85", fontFamily: "monospace" }}>HISTORY</span>
                  <button onClick={() => setHistory([])} style={{ background: "none", border: "none", color: "#6b6b85", fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>CLEAR</button>
                </div>
                {history.slice(1).map((item, i) => (
                  <div key={i} onClick={() => setResult(item)} style={{ background: "#12121a", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 10, padding: "8px 10px", marginBottom: 6, cursor: "pointer" }}>
                    <p style={{ margin: "0 0 3px", fontSize: 11, color: "#6b6b85", fontStyle: "italic" }}>Q: {item.question.slice(0, 60)}…</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#e8e8f0" }}>{item.answer.slice(0, 80)}…</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid rgba(124,58,237,0.15)", padding: "8px 14px", background: "#12121a", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 9, color: "#6b6b85", fontFamily: "monospace", letterSpacing: 1 }}>
              DEVELOPED BY <span style={{ color: "#7c3aed", fontWeight: 700 }}>JOHN CARLO V. DIZON</span>
            </p>
          </div>
        </div>

        {/* Toast notification */}
        {toast && (
          <div style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: toastColors[toast.type].bg,
            border: `1px solid ${toastColors[toast.type].border}`,
            color: toastColors[toast.type].color,
            padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600,
            zIndex: 999, backdropFilter: "blur(10px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            whiteSpace: "nowrap", fontFamily: "monospace",
            animation: "fade-in-up 0.3s ease-out",
          }}>
            {toast.msg}
          </div>
        )}
      </div>
    );
  }

  // ── PORTRAIT LAYOUT ───────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: "1px solid rgba(124,58,237,0.2)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#12121a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #f72585)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👁️</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, fontFamily: "monospace", color: "#e8e8f0" }}>VISIONQ</div>
            <div style={{ fontSize: 10, color: "#6b6b85", letterSpacing: 1 }}>AI QUESTION DETECTOR</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1a1a26", padding: "6px 12px", borderRadius: 20, border: "1px solid rgba(124,58,237,0.2)" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot, boxShadow: `0 0 6px ${sc.dot}` }} />
          <span style={{ fontSize: 10, color: sc.color, letterSpacing: 1, fontFamily: "monospace" }}>{sc.label}</span>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 12, gap: 12 }}>
        {/* Camera */}
        <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#12121a", border: `1px solid ${cameraActive ? "rgba(6,214,160,0.4)" : "rgba(124,58,237,0.2)"}`, aspectRatio: "16/9", minHeight: 180, boxShadow: cameraActive ? "0 0 30px rgba(124,58,237,0.2)" : "none" }}>
          <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "contain", display: cameraActive ? "block" : "none", background: "#000" }} playsInline muted />
          {cameraActive && (
            <>
              <div style={{ position: "absolute", top: 8, left: 8, width: 20, height: 20, borderTop: "2px solid #06d6a0", borderLeft: "2px solid #06d6a0" }} />
              <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderTop: "2px solid #06d6a0", borderRight: "2px solid #06d6a0" }} />
              <div style={{ position: "absolute", bottom: 8, left: 8, width: 20, height: 20, borderBottom: "2px solid #06d6a0", borderLeft: "2px solid #06d6a0" }} />
              <div style={{ position: "absolute", bottom: 8, right: 8, width: 20, height: 20, borderBottom: "2px solid #06d6a0", borderRight: "2px solid #06d6a0" }} />
              {/* Motion indicator */}
              <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", background: motionDetected ? "rgba(6,214,160,0.15)" : "rgba(107,107,133,0.15)", border: `1px solid ${motionDetected ? "#06d6a0" : "#6b6b85"}`, borderRadius: 20, padding: "2px 8px", fontSize: 9, color: motionDetected ? "#06d6a0" : "#6b6b85", fontFamily: "monospace", letterSpacing: 1 }}>
                {motionDetected ? "● MOTION" : "◌ STILL"}
              </div>
              <div style={{ position: "absolute", bottom: 8, left: 12, fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>F:{frameCount} API:{apiCallCount}</div>
            </>
          )}
          {!cameraActive && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ fontSize: 40 }}>📷</div>
              <p style={{ color: "#6b6b85", fontSize: 13, textAlign: "center", margin: 0, maxWidth: 200 }}>Tap start to activate the camera scanner</p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Controls row */}
        <div style={{ display: "flex", gap: 8 }}>
          {!cameraActive ? (
            <button onClick={() => startCamera()} style={{ flex: 1, padding: 12, background: "linear-gradient(135deg, #7c3aed, #9333ea)", border: "none", borderRadius: 12, color: "white", fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>▶ START SCANNING</button>
          ) : (
            <>
              {/* Manual SCAN button */}
              <button onClick={handleManualScan} disabled={isAnalyzing || status === "cooldown"} style={{ flex: 1, padding: 12, background: isAnalyzing ? "rgba(124,58,237,0.3)" : status === "cooldown" ? "rgba(107,107,133,0.1)" : "linear-gradient(135deg, #7c3aed, #f72585)", border: (isAnalyzing || status === "cooldown") ? "1px solid #6b6b85" : "none", borderRadius: 12, color: (isAnalyzing || status === "cooldown") ? "#6b6b85" : "white", fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, cursor: (isAnalyzing || status === "cooldown") ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {isAnalyzing ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> ANALYZING...</> : status === "cooldown" ? `⏳ COOLDOWN ${cooldownLeft}s` : "🔍 SCAN NOW"}
              </button>
              <button onClick={flipCamera} style={{ padding: "12px 14px", background: "#1a1a26", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, color: "#e8e8f0", fontSize: 16, cursor: "pointer" }}>🔄</button>
              <button onClick={stopCamera} style={{ padding: "12px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 12, color: "#ef4444", fontSize: 16, cursor: "pointer" }}>⏹</button>
            </>
          )}
        </div>

        {/* Auto-scan toggle + interval */}
        {cameraActive && (
          <div style={{ background: "#12121a", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#6b6b85", letterSpacing: 1, fontFamily: "monospace" }}>AUTO SCAN</span>
            <div onClick={() => setAutoScan(a => !a)} style={{ width: 40, height: 22, borderRadius: 11, background: autoScan ? "#7c3aed" : "#1a1a26", border: `1px solid ${autoScan ? "#7c3aed" : "rgba(124,58,237,0.3)"}`, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 3, left: autoScan ? 20 : 3, width: 14, height: 14, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
            </div>
            {autoScan && (
              <>
                <span style={{ fontSize: 11, color: "#6b6b85", fontFamily: "monospace" }}>EVERY</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {[2, 4, 6, 10].map((s) => (
                    <button key={s} onClick={() => setScanInterval(s)} style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${scanInterval === s ? "#06d6a0" : "rgba(124,58,237,0.2)"}`, background: scanInterval === s ? "rgba(6,214,160,0.1)" : "transparent", color: scanInterval === s ? "#06d6a0" : "#6b6b85", fontSize: 12, cursor: "pointer", fontFamily: "monospace", fontWeight: 700 }}>{s}s</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>⚠️ {error}</div>}

        {/* Current Answer */}
        {result?.hasQuestion && (
          <div id="answer-card" style={{ background: "#12121a", border: "1px solid rgba(6,214,160,0.3)", borderRadius: 16, padding: 16, boxShadow: "0 0 30px rgba(6,214,160,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f72585", boxShadow: "0 0 6px #f72585" }} />
                <span style={{ fontSize: 10, color: "#f72585", letterSpacing: 1, fontFamily: "monospace" }}>DETECTED QUESTION</span>
              </div>
              {result.language && result.language !== "none" && LANG_COLORS[result.language] && (
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", padding: "2px 10px", borderRadius: 20, background: LANG_COLORS[result.language].bg, color: LANG_COLORS[result.language].color, border: `1px solid ${LANG_COLORS[result.language].color}40` }}>
                  {LANG_COLORS[result.language].label}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #7c3aed, #f72585)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, marginTop: 2 }}>✦</div>
              <div style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: "#e8e8f0", minWidth: 0, overflow: "hidden" }}>{renderAnswer(result.answer)}</div>
            </div>
            <div style={{ height: 1, background: "rgba(124,58,237,0.2)", margin: "8px 0" }} />
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6b6b85", fontStyle: "italic", lineHeight: 1.5 }}>&ldquo;{result.question}&rdquo;</p>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#6b6b85", letterSpacing: 1, fontFamily: "monospace" }}>HISTORY ({history.length - 1})</span>
              <button onClick={() => setHistory([])} style={{ background: "none", border: "none", color: "#6b6b85", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>CLEAR</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.slice(1).map((item, i) => (
                <div key={i} style={{ background: "#12121a", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: "12px 14px", cursor: "pointer" }} onClick={() => setResult(item)}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "#6b6b85", fontStyle: "italic" }}>Q: {item.question.slice(0, 80)}{item.question.length > 80 ? "…" : ""}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#e8e8f0" }}>{item.answer.slice(0, 100)}{item.answer.length > 100 ? "…" : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating SCAN button (portrait) */}
      {cameraActive && (
        <button
          onClick={handleManualScan}
          disabled={isAnalyzing || status === "cooldown"}
          style={{
            position: "fixed", bottom: 24, right: 20,
            width: 60, height: 60, borderRadius: "50%",
            background: status === "cooldown" ? "#1a1a26" : "linear-gradient(135deg, #7c3aed, #f72585)",
            border: `2px solid ${status === "cooldown" ? "#6b6b85" : "rgba(255,255,255,0.2)"}`,
            color: "white", fontSize: isAnalyzing ? 22 : 10, fontWeight: 700,
            cursor: (isAnalyzing || status === "cooldown") ? "not-allowed" : "pointer",
            fontFamily: "monospace", letterSpacing: 1,
            boxShadow: status === "cooldown" ? "none" : "0 0 24px rgba(124,58,237,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100,
            animation: isAnalyzing ? "spin 1s linear infinite" : "none",
          }}
        >
          {isAnalyzing ? "⟳" : status === "cooldown" ? cooldownLeft : "SCAN"}
        </button>
      )}

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(124,58,237,0.15)", padding: "12px 16px", textAlign: "center", background: "#12121a" }}>
        <p style={{ margin: 0, fontSize: 11, color: "#6b6b85", fontFamily: "monospace", letterSpacing: 1 }}>
          DEVELOPED BY{" "}
          <span style={{ color: "#7c3aed", fontWeight: 700 }}>JOHN CARLO V. DIZON</span>
        </p>
      </footer>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}