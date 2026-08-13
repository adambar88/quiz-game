import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

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
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play();
        }
        requestAnimationFrame(tick);
      } catch (err) {
        if (isSubscribed) {
          setErrorMsg('Brak dostępu do kamery. Upewnij się, że przyznano uprawnienia.');
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
            // Check if code data is a full URL containing ?room=CODE
            try {
              if (extractedCode.includes('http') || extractedCode.includes('room=')) {
                const urlObj = new URL(extractedCode, window.location.origin);
                const roomParam = urlObj.searchParams.get('room');
                if (roomParam) {
                  extractedCode = roomParam;
                }
              }
            } catch {
              // Ignore URL parse error if raw string
            }

            if (extractedCode) {
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
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm p-5 glass-panel rounded-2xl border border-[var(--border)] shadow-2xl space-y-4 flex flex-col items-center text-center relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <h3 className="text-base font-extrabold tracking-tight text-emerald-400">
          📷 Skaner Kodu QR Pokoju
        </h3>
        <p className="text-xs text-[var(--text-dim)]">
          Skieruj aparat na kod QR drugiego gracza, aby dołączyć do Wyścigu.
        </p>

        {errorMsg ? (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs my-4">
            {errorMsg}
          </div>
        ) : (
          <div className="relative w-full aspect-square max-w-[260px] rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Viewfinder Overlay Box */}
            <div className="absolute inset-0 border-2 border-emerald-400/80 rounded-xl m-6 pointer-events-none animate-pulse flex items-center justify-center">
              <div className="w-full h-0.5 bg-emerald-500/60 animate-ping"></div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
};
