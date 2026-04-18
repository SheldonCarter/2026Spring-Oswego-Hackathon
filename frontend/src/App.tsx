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
  recyclable: {
    icon: Recycle,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-700',
    title: 'Recyclable',
  },
  compost: {
    icon: Leaf,
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    borderColor: 'border-green-500',
    textColor: 'text-green-700',
    title: 'Compost',
  },
  landfill: {
    icon: Trash2,
    color: 'bg-gray-500',
    lightColor: 'bg-gray-50',
    borderColor: 'border-gray-500',
    textColor: 'text-gray-700',
    title: 'Landfill',
  },
  hazardous: {
    icon: AlertCircle,
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    borderColor: 'border-red-500',
    textColor: 'text-red-700',
    title: 'Hazardous Waste',
  },
};

// Mock AI analysis function
const analyzeTresh = (): AnalysisResult => {
  const mockResults: AnalysisResult[] = [
    {
      category: 'recyclable',
      item: 'Plastic Water Bottle',
      confidence: 94,
      instructions: 'Remove cap and rinse before placing in recycling bin. Cap can be recycled separately.',
    },
    {
      category: 'compost',
      item: 'Banana Peel',
      confidence: 98,
      instructions: 'Place in compost bin. Great source of potassium for your compost.',
    },
    {
      category: 'recyclable',
      item: 'Aluminum Can',
      confidence: 96,
      instructions: 'Rinse and crush to save space. Place in recycling bin.',
    },
    {
      category: 'landfill',
      item: 'Chip Bag',
      confidence: 91,
      instructions: 'Most chip bags are not recyclable due to mixed materials. Dispose in landfill bin.',
    },
    {
      category: 'recyclable',
      item: 'Cardboard Box',
      confidence: 97,
      instructions: 'Flatten and remove any tape or labels. Place in cardboard recycling.',
    },
    {
      category: 'hazardous',
      item: 'Battery',
      confidence: 99,
      instructions: 'Take to designated battery recycling location. Do not dispose in regular trash.',
    },
    {
      category: 'compost',
      item: 'Coffee Grounds',
      confidence: 95,
      instructions: 'Excellent for compost. Paper filter can also be composted.',
    },
    {
      category: 'recyclable',
      item: 'Glass Bottle',
      confidence: 93,
      instructions: 'Rinse and remove cap. Place in glass recycling bin.',
    },
  ];

  return mockResults[Math.floor(Math.random() * mockResults.length)];
};

export default function App() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [useCameraMode, setUseCameraMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setCameraError(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      setUseCameraMode(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError(true);
      setUseCameraMode(false);
    }
  };

  const capturePhoto = () => {
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

        // Simulate AI analysis
        setIsAnalyzing(true);
        setTimeout(() => {
          setAnalysis(analyzeTresh());
          setIsAnalyzing(false);
        }, 1500);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);

        // Simulate AI analysis
        setIsAnalyzing(true);
        setTimeout(() => {
          setAnalysis(analyzeTresh());
          setIsAnalyzing(false);
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysis(null);
    setIsAnalyzing(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setUseCameraMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const config = analysis ? categoryConfig[analysis.category] : null;
  const Icon = config?.icon;

  return (
    <div className="size-full bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <Recycle className="w-8 h-8" />
            <h1 className="text-2xl">AI Trash Sorter</h1>
          </div>
          <p className="mt-2 opacity-90">Point your camera at trash to identify and sort correctly</p>
        </div>

        <div className="p-6">
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
            {!capturedImage && !useCameraMode ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center text-white p-8">
                  <Recycle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="opacity-75">Choose an option below to analyze trash</p>
                </div>
              </div>
            ) : !capturedImage && useCameraMode ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img src={capturedImage} alt="Captured trash" className="w-full h-full object-cover" />
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p>Analyzing...</p>
                </div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="mt-6 flex gap-3">
            {!capturedImage && !useCameraMode ? (
              <>
                <button
                  onClick={startCamera}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
                >
                  <Camera className="w-5 h-5" />
                  Use Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
                >
                  <Upload className="w-5 h-5" />
                  Upload Photo
                </button>
              </>
            ) : !capturedImage && useCameraMode ? (
              <>
                <button
                  onClick={capturePhoto}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
                >
                  <Camera className="w-5 h-5" />
                  Capture Photo
                </button>
                <button
                  onClick={reset}
                  className="bg-gray-600 text-white py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={reset}
                className="flex-1 bg-gray-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Analyze Another Item
              </button>
            )}
          </div>

          {cameraError && !capturedImage && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p>Camera access was denied or unavailable. You can still upload a photo using the Upload Photo button.</p>
              </div>
            </div>
          )}

          {analysis && config && Icon && (
            <div className={`mt-6 p-6 rounded-2xl border-2 ${config.borderColor} ${config.lightColor}`}>
              <div className="flex items-start gap-4">
                <div className={`${config.color} text-white p-3 rounded-xl`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className={`text-xl ${config.textColor}`}>{config.title}</h2>
                    <span className="text-sm bg-white px-3 py-1 rounded-full border border-gray-200">
                      {analysis.confidence}% confident
                    </span>
                  </div>
                  <p className="mb-3">{analysis.item}</p>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-sm">{analysis.instructions}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
