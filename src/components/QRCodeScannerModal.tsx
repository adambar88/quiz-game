import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { soundEngine } from '../services/soundEngine.ts';
import { haptics } from '../services/haptics.ts';

interface QRCodeScannerModalProps {
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    async function startCamera() {
      // Stop previous tracks if switching facingMode
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Check torch capabilities
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities() as any;
          if (capabilities && capabilities.torch) {
            setTorchSupported(true);
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        requestAnimationFrame(tick);
      } catch (err) {
        if (isSubscribed) {
          setErrorMsg('Brak dostępu do aparatu. Upewnij się, że zezwolono na dostęp do kamery w przeglądarce.');
        }
      }
    }

    function tick() {
      if (!isSubscribed) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            let extractedCode = code.data.trim();
            // Parse URL parameters if QR code contains a link
            try {
              if (extractedCode.includes('http') || extractedCode.includes('room=')) {
                const urlObj = new URL(extractedCode, window.location.origin);
                const roomParam = urlObj.searchParams.get('room');
                if (roomParam) {
                  extractedCode = roomParam;
                }
              }
            } catch {
              // Raw text string fallback
            }

            if (extractedCode) {
              soundEngine.playCorrectChime();
              haptics.vibrateSuccess();
              onScanSuccess(extractedCode);
              return;
            }
          }
        }
      }
      animFrameIdRef.current = requestAnimationFrame(tick);
    }

    startCamera();

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, onScanSuccess]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (err) {
        console.warn('Torch toggle not supported on this track.', err);
      }
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-black rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col relative h-[85vh] max-h-[640px]">
        {/* Top Camera App Bar */}
        <div className="p-4 pt-[max(1rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-20 absolute top-0 left-0 right-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Aparat • Skaner Wyścigu
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Flash / Torch Toggle */}
            {torchSupported && (
              <button
                onClick={toggleTorch}
                className={`p-2.5 rounded-full text-xs transition-colors ${
                  torchOn ? 'bg-amber-400 text-black font-bold' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title="Włącz/Wyłącz latarkę"
              >
                ⚡
              </button>
            )}

            {/* Switch Camera */}
            <button
              onClick={toggleFacingMode}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
              title="Przełącz aparat"
            >
              🔄
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Camera Viewfinder Stream */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center text-red-400 text-sm space-y-3 z-10">
              <span className="text-3xl block">⚠️</span>
              <p>{errorMsg}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Frame & Laser Scan Line */}
              <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                <div className="w-64 h-64 border-2 border-emerald-400 rounded-3xl relative shadow-[0_0_30px_rgba(52,211,153,0.3)] flex flex-col justify-between overflow-hidden">
                  {/* Corner Target Accents */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl"></div>

                  {/* Animated Laser Line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-[bounce_2s_infinite]"></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Instruction Bar */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/90 via-black/60 to-transparent text-center space-y-2 z-20">
          <p className="text-xs text-white/90 font-medium">
            Nakieruj obiektyw aparatu na kod QR pokoju drugiego gracza
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors"
          >
            Zamknij Skaner
          </button>
        </div>
      </div>
    </div>
  );
};
