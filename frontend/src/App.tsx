import { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, Trash2, Recycle, Leaf, AlertCircle, Upload, ScanLine } from 'lucide-react';

type TrashCategory = 'recyclable' | 'compost' | 'landfill' | 'hazardous';

interface AnalysisResult {
  category: TrashCategory;
  item: string;
  confidence: number;
  instructions: string;
}

const categoryConfig = {
  recyclable: {
    icon: Recycle,
    color: 'bg-sky-500',
    lightColor: 'bg-sky-950/40',
    borderColor: 'border-sky-500/40',
    textColor: 'text-sky-400',
    badgeColor: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    title: 'Recyclable',
  },
  compost: {
    icon: Leaf,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-950/40',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    title: 'Compost',
  },
  landfill: {
    icon: Trash2,
    color: 'bg-zinc-500',
    lightColor: 'bg-zinc-800/40',
    borderColor: 'border-zinc-500/40',
    textColor: 'text-zinc-400',
    badgeColor: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
    title: 'Landfill',
  },
  hazardous: {
    icon: AlertCircle,
    color: 'bg-rose-500',
    lightColor: 'bg-rose-950/40',
    borderColor: 'border-rose-500/40',
    textColor: 'text-rose-400',
    badgeColor: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    title: 'Hazardous',
  },
};

const BACKEND_URL = "http://localhost:8000";

const analyzeImage = async (file: File): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BACKEND_URL}/identify`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze image");
  }

  return response.json();
};

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

  useEffect(() => {
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, [stream]);

  const startCamera = async () => {
    try {
      setCameraError(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      setUseCameraMode(true);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError(true);
      setUseCameraMode(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        setIsAnalyzing(true);
        setApiError(null);

        // Convert canvas to blob and send to backend
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const file = new File([blob], "captured.jpg", { type: "image/jpeg" });
              const result = await analyzeImage(file);
              setAnalysis(result);
            } catch (error) {
              console.error('Error analyzing image:', error);
              setApiError('Failed to analyze image. Make sure the backend is running.');
            } finally {
              setIsAnalyzing(false);
            }
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        setCapturedImage(e.target?.result as string);
        setIsAnalyzing(true);
        setApiError(null);

        try {
          const result = await analyzeImage(file);
          setAnalysis(result);
        } catch (error) {
          console.error('Error analyzing image:', error);
          setApiError('Failed to analyze image. Make sure the backend is running.');
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysis(null);
    setIsAnalyzing(false);
    setApiError(null);
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setUseCameraMode(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const config = analysis ? categoryConfig[analysis.category] : null;
  const Icon = config?.icon;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Recycle className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TrashSort AI</h1>
          <p className="text-zinc-500 mt-1 text-sm">Snap an item to find out how to dispose of it correctly</p>
        </div>

        {/* Main Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">

          {/* Viewfinder */}
          <div className="relative bg-zinc-950 aspect-video overflow-hidden">
            {!capturedImage && !useCameraMode && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <ScanLine className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-600 text-sm">Ready to scan</p>
              </div>
            )}

            {!capturedImage && useCameraMode && (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            )}

            {capturedImage && (
              <img src={capturedImage} alt="Captured item" className="w-full h-full object-cover" />
            )}

            {/* Corner brackets */}
            {(useCameraMode || capturedImage) && !isAnalyzing && (
              <>
                <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-emerald-400/60 rounded-tl" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-emerald-400/60 rounded-tr" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-emerald-400/60 rounded-bl" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-emerald-400/60 rounded-br" />
              </>
            )}

            {/* Analyzing overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
                </div>
                <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">Identifying…</p>
              </div>
            )}
          </div>

          {/* Actions & Results */}
          <div className="p-5 space-y-4">

            {/* Buttons */}
            <div className="flex gap-3">
              {!capturedImage && !useCameraMode && (
                <>
                  <button
                    onClick={startCamera}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
                  >
                    <Camera className="w-4 h-4" /> Use Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 font-medium py-3 rounded-xl flex items-center justify-center gap-2 border border-zinc-700 transition-all text-sm"
                  >
                    <Upload className="w-4 h-4" /> Upload Photo
                  </button>
                </>
              )}

              {!capturedImage && useCameraMode && (
                <>
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
                  >
                    <Camera className="w-4 h-4" /> Capture Photo
                  </button>
                  <button
                    onClick={reset}
                    className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-400 py-3 px-4 rounded-xl border border-zinc-700 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}

              {capturedImage && !isAnalyzing && (
                <button
                  onClick={reset}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 font-medium py-3 rounded-xl flex items-center justify-center gap-2 border border-zinc-700 transition-all text-sm"
                >
                  <RotateCcw className="w-4 h-4" /> Scan Another Item
                </button>
              )}
            </div>

            {/* Camera error */}
            {cameraError && !capturedImage && (
              <div className="flex items-start gap-3 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-rose-400 text-xs leading-relaxed">Camera unavailable — use the Upload Photo button instead.</p>
              </div>
            )}

            {/* API error */}
            {apiError && (
              <div className="flex items-start gap-3 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-rose-400 text-xs leading-relaxed">{apiError}</p>
              </div>
            )}

            {/* Result card */}
            {analysis && config && Icon && (
              <div className={`rounded-2xl border ${config.borderColor} ${config.lightColor} overflow-hidden`}>
                <div className="p-4 flex items-center gap-3">
                  <div className={`${config.color} w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold uppercase tracking-widest ${config.textColor} mb-0.5`}>
                      {config.title}
                    </div>
                    <div className="text-white font-semibold text-base truncate">{analysis.item}</div>
                  </div>
                  <span className={`text-xs font-mono px-2.5 py-1 rounded-full flex-shrink-0 ${config.badgeColor}`}>
                    {analysis.confidence}%
                  </span>
                </div>
                <div className="px-4 pb-4">
                  <div className="h-px bg-white/5 mb-3" />
                  <p className="text-zinc-400 text-sm leading-relaxed">{analysis.instructions}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

      </div>
    </div>
  );
}