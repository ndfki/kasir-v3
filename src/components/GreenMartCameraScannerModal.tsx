import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Flashlight, 
  AlertCircle, 
  Sparkles, 
  Check, 
  RefreshCw, 
  Upload, 
  SwitchCamera, 
  Search,
  ScanLine
} from 'lucide-react';
import { GreenMartProduct } from '../types';
import { playBarcodeScannerBeep } from '../data/greenmartData';

interface GreenMartCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  products: GreenMartProduct[];
}

export const GreenMartCameraScannerModal: React.FC<GreenMartCameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  products
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraState, setCameraState] = useState<'loading' | 'streaming' | 'error'>('loading');
  const [cameraError, setCameraError] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  // Load available cameras when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    initCamerasAndStart();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const initCamerasAndStart = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCameraId) {
          // Prefer back/environment camera if available
          const backCam = videoDevices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
        }
      }
    } catch (e) {
      console.warn('enumerateDevices error:', e);
    }

    startCamera(selectedCameraId);
  };

  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setCameraState('loading');
    setCameraError('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('error');
      setCameraError('Browser ini tidak mengizinkan akses kamera langsung. Gunakan input barcode atau upload foto di bawah.');
      return;
    }

    // Try progressively broader constraints
    const constraintAttempts: MediaStreamConstraints[] = [
      // 1. Device ID specific
      ...(deviceId ? [{ video: { deviceId: { exact: deviceId } }, audio: false }] : []),
      // 2. Ideal environment
      { video: { facingMode: { ideal: 'environment' } }, audio: false },
      // 3. Simple facing mode
      { video: { facingMode: 'environment' }, audio: false },
      // 4. Any camera without strict constraints
      { video: true, audio: false }
    ];

    let stream: MediaStream | null = null;
    let lastErr: any = null;

    for (const constraints of constraintAttempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!stream) {
      setCameraState('error');
      setCameraError(
        'Kamera belum dapat dibuka (Izin ditolak atau tidak ada kamera aktif). Silakan aktifkan izin kamera browser atau gunakan opsi unggah foto/pilih produk di bawah.'
      );
      return;
    }

    mediaStreamRef.current = stream;
    setCameraState('streaming');

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.muted = true;
      try {
        await videoRef.current.play();
      } catch (e) {
        // play interrupted or user gesture required
      }
    }

    // Start Barcode Detection Loop
    startBarcodeDetectionLoop();
  };

  const startBarcodeDetectionLoop = () => {
    if (!('BarcodeDetector' in window)) return;

    try {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
      });

      const detectFrame = async () => {
        if (
          videoRef.current && 
          videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
          videoRef.current.videoWidth > 0
        ) {
          try {
            const detected = await barcodeDetector.detect(videoRef.current);
            if (detected && detected.length > 0) {
              const code = detected[0].rawValue;
              if (code) {
                handleFoundBarcode(code);
                return;
              }
            }
          } catch (e) {
            // Ignore detector frame error
          }
        }
        scanLoopRef.current = requestAnimationFrame(detectFrame);
      };

      scanLoopRef.current = requestAnimationFrame(detectFrame);
    } catch (e) {
      console.warn('BarcodeDetector error:', e);
    }
  };

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setTorchOn(false);
  };

  const handleCameraChange = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    startCamera(deviceId);
  };

  const toggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities = (track as any).getCapabilities?.() || {};
        if (capabilities.torch) {
          await (track as any).applyConstraints({
            advanced: [{ torch: !torchOn }]
          });
          setTorchOn(!torchOn);
        }
      } catch (e) {
        console.warn('Torch not supported:', e);
      }
    }
  };

  const handleFoundBarcode = (barcode: string) => {
    playBarcodeScannerBeep('success');
    stopCamera();
    onScanSuccess(barcode.trim());
    onClose();
  };

  // Image Upload Barcode Scanning
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if ('BarcodeDetector' in window) {
      try {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = async () => {
          try {
            const detector = new (window as any).BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
            });
            const barcodes = await detector.detect(img);
            if (barcodes.length > 0) {
              handleFoundBarcode(barcodes[0].rawValue);
            } else {
              setUploadFeedback('Tidak ada barcode yang terdeteksi dari foto. Coba pilih produk di bawah atau ketik nomor barcode.');
              setTimeout(() => setUploadFeedback(null), 4000);
            }
          } catch (err) {
            setUploadFeedback('Gagal mendeteksi barcode dari foto.');
            setTimeout(() => setUploadFeedback(null), 4000);
          }
        };
        return;
      } catch (e) {
        // Fallback
      }
    }

    setUploadFeedback('Foto barcode diunggah. Silakan klik atau ketik barcode produk di bawah.');
    setTimeout(() => setUploadFeedback(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-white">
        
        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight">Kamera Scan Barcode</h3>
              <p className="text-xs text-slate-400">Posisikan barcode di dalam kotak garis laser merah</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
          
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Target Reticle Viewfinder */}
          {cameraState === 'streaming' && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="relative w-64 sm:w-72 h-40 sm:h-48 border-2 border-emerald-400 rounded-2xl shadow-2xl shadow-emerald-500/30 overflow-hidden bg-emerald-500/5">
                {/* Scanning Laser Line */}
                <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse top-1/2 -translate-y-1/2" />
                
                {/* Target Corners */}
                <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-sm" />
                <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-sm" />
                <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-sm" />
                <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-sm" />

                <div className="absolute bottom-2 inset-x-0 text-center">
                  <span className="text-xs font-mono tracking-wider text-emerald-300 bg-slate-900/90 px-3 py-1 rounded-full uppercase">
                    Arahkan ke Barcode
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {cameraState === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 space-y-2.5">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-300 font-medium">Menghubungkan ke kamera...</p>
            </div>
          )}

          {/* Camera Error / Permission Notice */}
          {cameraState === 'error' && (
            <div className="absolute inset-4 flex flex-col items-center justify-center bg-slate-950/95 rounded-2xl p-5 text-center space-y-3 border border-slate-800">
              <AlertCircle className="w-9 h-9 text-amber-400" />
              <p className="text-xs sm:text-sm text-amber-200 font-medium leading-relaxed max-w-sm">
                {cameraError}
              </p>
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => startCamera(selectedCameraId)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Coba Lagi</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Unggah Foto</span>
                </button>
              </div>
            </div>
          )}

          {/* Top Camera Controls */}
          {cameraState === 'streaming' && (
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
              {availableCameras.length > 1 ? (
                <div className="relative">
                  <select
                    value={selectedCameraId}
                    onChange={(e) => handleCameraChange(e.target.value)}
                    className="text-xs font-semibold py-1.5 px-3 rounded-xl bg-slate-900/85 text-white border border-slate-700 backdrop-blur-xs focus:outline-none"
                  >
                    {availableCameras.map((c, i) => (
                      <option key={c.deviceId} value={c.deviceId}>
                        {c.label || `Kamera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
                  title="Unggah foto barcode"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleTorch}
                  className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-amber-400 border border-slate-700 transition cursor-pointer"
                  title="Nyalakan senter"
                >
                  <Flashlight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageUpload}
          />

        </div>

        {/* Quick Product Selection & Manual Code Input */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 space-y-3">
          
          {uploadFeedback && (
            <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-200 text-xs font-medium">
              {uploadFeedback}
            </div>
          )}

          {/* Manual Input Search inside Camera Modal */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualInput.trim()) {
                    handleFoundBarcode(manualInput.trim());
                  }
                }}
                placeholder="Ketik barcode atau nama barang..."
                className="w-full text-xs sm:text-sm font-mono font-medium pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 focus:outline-emerald-500"
              />
            </div>
            {manualInput.trim() && (
              <button
                type="button"
                onClick={() => handleFoundBarcode(manualInput.trim())}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm"
              >
                Scan
              </button>
            )}
          </div>

          {/* Quick Simulation Chips */}
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              Pilih Cepat Produk (Klik untuk langsung scan):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {products.slice(0, 10).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleFoundBarcode(p.barcode)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-700 border border-slate-800 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-base">{p.emoji || '📦'}</span>
                  <span className="truncate max-w-[130px]">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
