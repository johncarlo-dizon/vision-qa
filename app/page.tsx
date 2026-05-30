"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface AnalysisResult {
  hasQuestion: boolean;
  question: string;
  answer: string;
}

type ScanStatus = "idle" | "scanning" | "detected" | "error";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [scanInterval, setScanInterval] = useState(4);
  const [frameCount, setFrameCount] = useState(0);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const startCamera = useCallback(async (mode?: "environment" | "user") => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode ?? facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setStatus("scanning");
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions.");
      console.error(err);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCameraActive(false);
    setStatus("idle");
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < 2) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setFrameCount((c) => c + 1);
    setStatus("scanning");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });
      if (!res.ok) throw new Error("API error");
      const data: AnalysisResult = await res.json();
      if (data.hasQuestion) {
        setStatus("detected");
        setResult(data);
        setHistory((prev) => {
          const exists = prev.find((h) => h.question === data.question);
          if (exists) return prev;
          return [data, ...prev].slice(0, 10);
        });
      } else {
        setStatus("scanning");
      }
    } catch {
      setStatus("error");
      setError("Failed to analyze frame. Check your API key.");
    }
  }, []);

  useEffect(() => {
    if (cameraActive) {
      intervalRef.current = setInterval(captureAndAnalyze, scanInterval * 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [cameraActive, scanInterval, captureAndAnalyze]);

  const flipCamera = useCallback(async () => {
    stopCamera();
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    setTimeout(() => startCamera(newMode), 300);
  }, [stopCamera, startCamera, facingMode]);

  const statusConfig = {
    idle: { label: "READY", color: "#6b6b85", dot: "#6b6b85" },
    scanning: { label: "SCANNING", color: "#06d6a0", dot: "#06d6a0" },
    detected: { label: "QUESTION DETECTED", color: "#f72585", dot: "#f72585" },
    error: { label: "ERROR", color: "#ef4444", dot: "#ef4444" },
  };
  const sc = statusConfig[status];

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
        <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#12121a", border: `1px solid ${cameraActive ? "rgba(6,214,160,0.4)" : "rgba(124,58,237,0.2)"}`, aspectRatio: "16/9", boxShadow: cameraActive ? "0 0 30px rgba(124,58,237,0.2)" : "none" }}>
          <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", display: cameraActive ? "block" : "none" }} playsInline muted />
          {cameraActive && (
            <>
              <div style={{ position: "absolute", top: 8, left: 8, width: 20, height: 20, borderTop: "2px solid #06d6a0", borderLeft: "2px solid #06d6a0" }} />
              <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderTop: "2px solid #06d6a0", borderRight: "2px solid #06d6a0" }} />
              <div style={{ position: "absolute", bottom: 8, left: 8, width: 20, height: 20, borderBottom: "2px solid #06d6a0", borderLeft: "2px solid #06d6a0" }} />
              <div style={{ position: "absolute", bottom: 8, right: 8, width: 20, height: 20, borderBottom: "2px solid #06d6a0", borderRight: "2px solid #06d6a0" }} />
              <div style={{ position: "absolute", bottom: 8, left: 12, fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", letterSpacing: 1 }}>FRAMES: {frameCount}</div>
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

        {/* Controls */}
        <div style={{ display: "flex", gap: 8 }}>
          {!cameraActive ? (
            <button onClick={() => startCamera()} style={{ flex: 1, padding: 12, background: "linear-gradient(135deg, #7c3aed, #9333ea)", border: "none", borderRadius: 12, color: "white", fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>▶ START SCANNING</button>
          ) : (
            <>
              <button onClick={stopCamera} style={{ flex: 1, padding: 12, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 12, color: "#ef4444", fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>⏹ STOP</button>
              <button onClick={flipCamera} style={{ padding: "12px 16px", background: "#1a1a26", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, color: "#e8e8f0", fontSize: 18, cursor: "pointer" }}>🔄</button>
            </>
          )}
        </div>

        {/* Interval */}
        <div style={{ background: "#12121a", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#6b6b85", letterSpacing: 1, fontFamily: "monospace" }}>SCAN EVERY</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {[2, 4, 6, 10].map((s) => (
              <button key={s} onClick={() => setScanInterval(s)} style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${scanInterval === s ? "#06d6a0" : "rgba(124,58,237,0.2)"}`, background: scanInterval === s ? "rgba(6,214,160,0.1)" : "transparent", color: scanInterval === s ? "#06d6a0" : "#6b6b85", fontSize: 12, cursor: "pointer", fontFamily: "monospace", fontWeight: 700 }}>{s}s</button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>⚠️ {error}</div>}

        {/* Current Answer */}
        {result?.hasQuestion && (
          <div style={{ background: "#12121a", border: "1px solid rgba(6,214,160,0.3)", borderRadius: 16, padding: 16, boxShadow: "0 0 30px rgba(6,214,160,0.08)", animation: "fade-in-up 0.4s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f72585", boxShadow: "0 0 6px #f72585" }} />
              <span style={{ fontSize: 10, color: "#f72585", letterSpacing: 1, fontFamily: "monospace" }}>DETECTED QUESTION</span>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b6b85", fontStyle: "italic", lineHeight: 1.5 }}>&ldquo;{result.question}&rdquo;</p>
            <div style={{ height: 1, background: "rgba(124,58,237,0.2)", margin: "8px 0" }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #7c3aed, #f72585)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, marginTop: 2 }}>✦</div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#e8e8f0" }}>{result.answer}</p>
            </div>
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

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
