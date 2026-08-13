import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { peerService } from '../services/peerService.ts';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';
import { storageService } from '../services/storageService.ts';
import { QRCodeScannerModal } from './QRCodeScannerModal.tsx';

interface VersusLobbyModalProps {
  onStartDuel: () => void;
  onClose: () => void;
}

export const VersusLobbyModal: React.FC<VersusLobbyModalProps> = ({ onStartDuel, onClose }) => {
  const { lang, versusPlayerName } = useQuizStore();
  const t = translations[lang] || translations.pl;

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [playerNameInput, setPlayerNameInput] = useState<string>(
    versusPlayerName || storageService.getPlayerName() || ''
  );
  const [connectedCount, setConnectedCount] = useState<number>(1);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showScanner, setShowScanner] = useState<boolean>(false);

  // Generate QR code when roomCode changes
  useEffect(() => {
    if (roomCode) {
      const shareableUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
      QRCode.toDataURL(shareableUrl, {
        width: 220,
        margin: 1.5,
        color: { dark: '#000000ff', light: '#ffffff' },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [roomCode]);

  // Auto-detect room code from URL params ?room=CODE
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setActiveTab('join');
      setInputCode(roomParam.toUpperCase());
      handleJoinRoom(roomParam.toUpperCase());
    } else {
      handleCreateRoom();
    }
  }, []);

  const handleCreateRoom = async () => {
    setErrorMsg(null);
    setIsConnecting(false);
    const code = peerService.generateRoomCode();
    setRoomCode(code);
    await peerService.createRoom(
      code,
      (count) => setConnectedCount(count),
      (msg) => {
        if (msg.type === 'INIT_VERSUS') {
          quizStore.startVersusDuel();
        } else if ((msg.type === 'START_GAME' || msg.type === 'ROUND_QUESTIONS') && msg.questions) {
          quizStore.startQuizWithQuestions(msg.questions);
        } else if (msg.type === 'CATEGORY_PICK') {
          quizStore.showVersusGeneratingState(msg.chosenCategory);
        }
      }
    );
  };

  const handleJoinRoom = async (codeToJoin?: string) => {
    const targetCode = (codeToJoin || inputCode).toUpperCase().trim();
    if (!targetCode || targetCode.length < 4) {
      setErrorMsg('Wpisz poprawny 4-cyfrowy kod pokoju.');
      return;
    }

    setErrorMsg(null);
    setIsConnecting(true);

    try {
      await peerService.joinRoom(
        targetCode,
        (count) => setConnectedCount(count),
        (msg) => {
          if (msg.type === 'INIT_VERSUS') {
            quizStore.startVersusDuel();
          } else if ((msg.type === 'START_GAME' || msg.type === 'ROUND_QUESTIONS') && msg.questions) {
            quizStore.startQuizWithQuestions(msg.questions);
          } else if (msg.type === 'CATEGORY_PICK') {
            quizStore.showVersusGeneratingState(msg.chosenCategory);
          }
        }
      );
      setRoomCode(targetCode);
      setConnectedCount(2);
    } catch (err: any) {
      setErrorMsg('Nie odnaleziono pokoju o podanym kodzie. Upewnij się, że Host stworzył pokój.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleNameChange = (name: string) => {
    setPlayerNameInput(name);
    quizStore.setVersusPlayerName(name);
  };

  const handleCopyLink = () => {
    const shareableUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleStartDuelClick = () => {
    quizStore.startVersusDuel();
  };

  const handleScanSuccess = (scannedCode: string) => {
    setShowScanner(false);
    setInputCode(scannedCode.toUpperCase());
    handleJoinRoom(scannedCode.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md p-4 sm:p-6 glass-panel rounded-2xl border border-[var(--border)] shadow-2xl relative space-y-4 max-h-[95vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏁</span>
            <h2 className="text-lg font-extrabold tracking-tight">Wyścig</h2>
          </div>
          <button
            onClick={() => {
              peerService.destroy();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-dim)] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Player Name Input Field */}
        <div className="space-y-1">
          <label className="block text-[11px] uppercase font-semibold text-[var(--text-dim)]">
            👤 Twoje Imię / Nick
          </label>
          <input
            type="text"
            maxLength={16}
            value={playerNameInput}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="np. Adam, Ania..."
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-[var(--border)] text-xs sm:text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 rounded-xl border border-[var(--border)]">
          <button
            onClick={() => {
              setActiveTab('create');
              handleCreateRoom();
            }}
            className={`py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-[var(--text-dim)] hover:text-white'
            }`}
          >
            👑 {t.createRoom}
          </button>
          <button
            onClick={() => {
              setActiveTab('join');
            }}
            className={`py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'join'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-[var(--text-dim)] hover:text-white'
            }`}
          >
            📲 {t.joinRoom}
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: CREATE ROOM (HOST) */}
        {activeTab === 'create' && (
          <div className="space-y-3.5 text-center">
            {/* Room Code & QR Display Container */}
            <div className="p-3 rounded-2xl bg-black/40 border border-[var(--border)] space-y-2 flex flex-col items-center justify-center">
              <span className="text-[11px] uppercase font-semibold text-[var(--text-dim)]">
                Kod Pokoju Wyścigu
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold tracking-widest text-emerald-400">
                {roomCode || '....'}
              </div>

              {/* QR Code Canvas/Image */}
              {qrDataUrl && (
                <div className="p-2 bg-white rounded-xl shadow-lg my-1">
                  <img
                    src={qrDataUrl}
                    alt="Kod QR Pokoju"
                    className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded"
                  />
                  <span className="block text-[9px] font-mono text-black font-bold mt-0.5">
                    Zeskanuj aparatami
                  </span>
                </div>
              )}
            </div>

            {/* Share Link Button */}
            <button
              onClick={handleCopyLink}
              disabled={!roomCode}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--border)] text-xs font-semibold text-[var(--text)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {copied ? '✅ ' + t.linkCopied : '📋 Skopiuj Link Pokoju'}
            </button>

            {/* Connected Players Status */}
            <div className="p-2.5 rounded-xl bg-white/5 text-xs font-semibold flex items-center justify-between">
              <span className="text-[var(--text-dim)]">Gracze w Wyścigu:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {connectedCount} / 4
              </span>
            </div>

            {/* Start Duel Action Button */}
            <button
              onClick={handleStartDuelClick}
              disabled={connectedCount < 2}
              className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all shadow-lg ${
                connectedCount >= 2
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.02]'
                  : 'bg-white/10 text-[var(--text-dim)] cursor-not-allowed'
              }`}
            >
              🚀 Rozpocznij Wyścig ({connectedCount} Graczy)
            </button>
          </div>
        )}

        {/* TAB 2: JOIN ROOM (GUEST) */}
        {activeTab === 'join' && (
          <div className="space-y-4 text-center">
            <div className="space-y-3">
              {/* Camera Scanner Button - Full Width */}
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-extrabold transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md"
              >
                <span className="text-base">📷</span>
                <span>Skanuj Kod QR Aparatem</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-white/10 w-full"></div>
                <span className="bg-[#121214] px-2 text-[10px] uppercase font-mono text-[var(--text-dim)] absolute">lub wpisz kod</span>
              </div>

              {/* Code Input Box */}
              <div>
                <label className="block text-[11px] uppercase font-semibold text-[var(--text-dim)] mb-1">
                  {t.enterRoomCode}
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="np. K9X2"
                  className="w-full text-center text-xl font-mono tracking-widest py-3 rounded-xl bg-black/40 border border-[var(--border)] text-emerald-400 uppercase font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={() => handleJoinRoom()}
              disabled={isConnecting || inputCode.length < 4}
              className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 ${
                inputCode.length >= 4 && !isConnecting
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : 'bg-white/10 text-[var(--text-dim)] cursor-not-allowed'
              }`}
            >
              {isConnecting && <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />}
              {isConnecting ? t.joiningRoom : '🏁 Dołącz do Wyścigu'}
            </button>

            {/* Connection Status */}
            {connectedCount >= 2 && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                🟢 Połączono z pokojem Wyścigu! Oczekiwanie na rozpoczęcie...
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Code Camera Scanner Modal */}
      {showScanner && (
        <QRCodeScannerModal
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </div>
  );
};
