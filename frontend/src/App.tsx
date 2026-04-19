import { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, Trash2, Recycle, Leaf, AlertCircle, Upload } from 'lucide-react';

type TrashCategory = 'recyclable' | 'compost' | 'landfill' | 'hazardous';

interface AnalysisResult {
  category: TrashCategory;
  item: string;
  confidence: number;
  instructions: string;
}

const categoryConfig = {
  recyclable: { icon: Recycle,     label: 'Recyclable', accent: '#3a6b47', soft: '#e8f2ec' },
  compost:    { icon: Leaf,        label: 'Compost',    accent: '#7a5525', soft: '#f2ead8' },
  landfill:   { icon: Trash2,      label: 'Landfill',   accent: '#5c5449', soft: '#edebe6' },
  hazardous:  { icon: AlertCircle, label: 'Hazardous',  accent: '#a84020', soft: '#f5e8e2' },
};

const BACKEND_URL = 'http://localhost:8000';

const analyzeImage = async (file: File): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${BACKEND_URL}/identify`, { method: 'POST', body: formData });
  if (!response.ok) throw new Error('Failed');
  return response.json();
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,400&family=Nunito:wght@400;500;600&display=swap');

  .ts { min-height: 100vh; background: #ede8dc; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px 48px; }

  .ts-header { text-align: center; margin-bottom: 28px; }
  .ts-logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .ts-logo-leaf { color: #3a6b47; }
  .ts-title { font-family: 'Lora', Georgia, serif; font-size: 26px; font-weight: 600; color: #2a2720; letter-spacing: -0.2px; }
  .ts-tagline { font-family: 'Nunito', sans-serif; font-size: 13px; color: #8a806c; font-weight: 400; }

  .ts-card { width: 100%; max-width: 480px; background: #faf7f1; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(60,50,30,0.10), 0 1px 3px rgba(60,50,30,0.07); border: 1px solid #ddd6c6; }

  .ts-viewfinder { position: relative; width: 100%; aspect-ratio: 3/4; background: #cfc8b8; overflow: hidden; }
  .ts-viewfinder video, .ts-viewfinder img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .ts-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: #cfc8b8; }
  .ts-empty-ring { width: 64px; height: 64px; border-radius: 50%; border: 1.5px dashed #a09080; display: flex; align-items: center; justify-content: center; color: #a09080; }
  .ts-empty-text { font-family: 'Nunito', sans-serif; font-size: 13px; color: #9a8e7c; }

  .ts-overlay { position: absolute; inset: 0; background: rgba(35,30,20,0.55); backdrop-filter: blur(2px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
  .ts-spinner { width: 32px; height: 32px; border: 2px solid rgba(210,200,180,0.3); border-top-color: #c8bfaa; border-radius: 50%; animation: ts-spin 0.9s linear infinite; }
  @keyframes ts-spin { to { transform: rotate(360deg); } }
  .ts-overlay-text { font-family: 'Nunito', sans-serif; font-size: 12px; color: #d2c8b4; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500; }

  .ts-body { padding: 18px 20px 22px; display: flex; flex-direction: column; gap: 14px; }

  .ts-btns { display: flex; gap: 10px; }

  .ts-btn-main { flex: 1; background: #3a6b47; color: #f5f2ea; border: none; border-radius: 10px; padding: 12px 16px; font-family: 'Nunito', sans-serif; font-size: 13.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: background 0.15s, transform 0.1s; }
  .ts-btn-main:hover { background: #2f5a3b; }
  .ts-btn-main:active { transform: scale(0.98); }

  .ts-btn-ghost { flex: 1; background: transparent; color: #5c5449; border: 1.5px solid #ccc4b0; border-radius: 10px; padding: 12px 16px; font-family: 'Nunito', sans-serif; font-size: 13.5px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: background 0.15s, border-color 0.15s, transform 0.1s; }
  .ts-btn-ghost:hover { background: #ece6d6; border-color: #b8b0a0; }
  .ts-btn-ghost:active { transform: scale(0.98); }

  .ts-btn-sq { background: transparent; color: #5c5449; border: 1.5px solid #ccc4b0; border-radius: 10px; padding: 12px 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
  .ts-btn-sq:hover { background: #ece6d6; }

  .ts-error { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; background: #f5ebe6; border-radius: 8px; border-left: 3px solid #a84020; }
  .ts-error-text { font-family: 'Nunito', sans-serif; font-size: 12.5px; color: #8a3318; line-height: 1.5; }

  .ts-divider { border: none; border-top: 1px solid #ddd6c6; margin: 0 -20px; }

  .ts-result { display: flex; flex-direction: column; gap: 12px; padding-top: 2px; }

  .ts-result-top { display: flex; align-items: center; gap: 13px; }

  .ts-cat-chip { display: flex; align-items: center; gap: 6px; padding: 6px 11px 6px 8px; border-radius: 8px; flex-shrink: 0; }
  .ts-cat-chip-label { font-family: 'Nunito', sans-serif; font-size: 11.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }

  .ts-item-name { font-family: 'Lora', Georgia, serif; font-size: 21px; font-weight: 600; color: #2a2720; line-height: 1.2; }

  .ts-conf-row { display: flex; align-items: center; gap: 10px; }
  .ts-conf-track { flex: 1; height: 4px; background: #ddd6c6; border-radius: 2px; overflow: hidden; }
  .ts-conf-fill { height: 100%; border-radius: 2px; transition: width 0.7s cubic-bezier(0.25, 1, 0.5, 1); }
  .ts-conf-pct { font-family: 'Nunito', sans-serif; font-size: 12px; color: #9a8e7c; white-space: nowrap; font-weight: 500; }

  .ts-instructions { font-family: 'Nunito', sans-serif; font-size: 13.5px; color: #5a5040; line-height: 1.7; font-weight: 400; }

  .ts-footer { margin-top: 20px; font-family: 'Nunito', sans-serif; font-size: 12px; color: #a09078; }
`;

export default function App() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [useCameraMode, setUseCameraMode] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { return () => { stream?.getTracks().forEach(t => t.stop()); }; }, [stream]);
  useEffect(() => {
    if (stream && videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
  }, [stream, useCameraMode]);

  const startCamera = async () => {
    try {
      setCameraError(false);
      const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
      setStream(ms); setUseCameraMode(true);
    } catch { setCameraError(true); setUseCameraMode(false); }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    setCapturedImage(c.toDataURL('image/jpeg'));
    setIsAnalyzing(true); setApiError(null);
    c.toBlob(async (blob) => {
      if (!blob) return;
      try { setAnalysis(await analyzeImage(new File([blob], 'cap.jpg', { type: 'image/jpeg' }))); }
      catch { setApiError('Could not reach the backend. Is it running?'); }
      finally { setIsAnalyzing(false); }
    }, 'image/jpeg');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setCapturedImage(ev.target?.result as string);
      setIsAnalyzing(true); setApiError(null);
      try { setAnalysis(await analyzeImage(file)); }
      catch { setApiError('Could not reach the backend. Is it running?'); }
      finally { setIsAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setCapturedImage(null); setAnalysis(null); setIsAnalyzing(false); setApiError(null);
    stream?.getTracks().forEach(t => t.stop()); setStream(null); setUseCameraMode(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cfg = analysis ? categoryConfig[analysis.category] : null;
  const Icon = cfg?.icon;

  return (
    <>
      <style>{css}</style>
      <div className="ts">

        <div className="ts-header">
          <div className="ts-logo">
            <Leaf size={20} className="ts-logo-leaf" />
            <span className="ts-title">TrashSort</span>
          </div>
          <p className="ts-tagline">Snap anything — we'll tell you where it goes</p>
        </div>

        <div className="ts-card">
          {/* Viewfinder */}
          <div className="ts-viewfinder">
            {!capturedImage && !useCameraMode && (
              <div className="ts-empty">
                <div className="ts-empty-ring"><Upload size={22} /></div>
                <span className="ts-empty-text">Ready to scan</span>
              </div>
            )}
            {!capturedImage && useCameraMode && <video ref={videoRef} autoPlay playsInline />}
            {capturedImage && <img src={capturedImage} alt="Captured" />}
            {isAnalyzing && (
              <div className="ts-overlay">
                <div className="ts-spinner" />
                <span className="ts-overlay-text">Identifying…</span>
              </div>
            )}
          </div>

          <div className="ts-body">
            {/* Buttons */}
            <div className="ts-btns">
              {!capturedImage && !useCameraMode && (<>
                <button className="ts-btn-main" onClick={startCamera}><Camera size={15} /> Use Camera</button>
                <button className="ts-btn-ghost" onClick={() => fileInputRef.current?.click()}><Upload size={15} /> Upload</button>
              </>)}
              {!capturedImage && useCameraMode && (<>
                <button className="ts-btn-main" onClick={capturePhoto}><Camera size={15} /> Capture</button>
                <button className="ts-btn-sq" onClick={reset}><RotateCcw size={15} /></button>
              </>)}
              {capturedImage && !isAnalyzing && (
                <button className="ts-btn-ghost" onClick={reset} style={{ flex: 1 }}><RotateCcw size={15} /> Scan another</button>
              )}
            </div>

            {cameraError && !capturedImage && (
              <div className="ts-error">
                <AlertCircle size={14} style={{ color: '#a84020', flexShrink: 0, marginTop: 1 }} />
                <span className="ts-error-text">Camera unavailable — try uploading a photo instead.</span>
              </div>
            )}
            {apiError && (
              <div className="ts-error">
                <AlertCircle size={14} style={{ color: '#a84020', flexShrink: 0, marginTop: 1 }} />
                <span className="ts-error-text">{apiError}</span>
              </div>
            )}

            {/* Result */}
            {analysis && cfg && Icon && (<>
              <hr className="ts-divider" />
              <div className="ts-result">
                <div className="ts-result-top">
                  <div className="ts-cat-chip" style={{ background: cfg.soft }}>
                    <Icon size={15} style={{ color: cfg.accent }} />
                    <span className="ts-cat-chip-label" style={{ color: cfg.accent }}>{cfg.label}</span>
                  </div>
                  <span className="ts-item-name">{analysis.item}</span>
                </div>

                <div className="ts-conf-row">
                  <div className="ts-conf-track">
                    <div className="ts-conf-fill" style={{ width: `${analysis.confidence}%`, background: cfg.accent }} />
                  </div>
                  <span className="ts-conf-pct">{analysis.confidence}% match</span>
                </div>

                <p className="ts-instructions">{analysis.instructions}</p>
              </div>
            </>)}
          </div>
        </div>

      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
    </>
  );
}