import React, { useEffect, useState } from 'react';
import { peerService } from '../services/peerService.ts';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';

interface VersusLobbyModalProps {
  onStartDuel: () => void;
  onClose: () => void;
}

export const VersusLobbyModal: React.FC<VersusLobbyModalProps> = ({ onStartDuel, onClose }) => {
  const { lang, category, difficulty, customPrompt } = useQuizStore();
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setIsConnecting(true);
    try {
      const code = await peerService.createRoom(
        undefined,
        (connected) => setIsConnected(connected),
        (msg) => {
          if (msg.type === 'START_GAME' && msg.questions) {
            quizStore.startQuizWithQuestions(msg.questions);
          }
        }
      );
      setRoomCode(code);
    } catch (err: any) {
      setErrorMsg('Nie udało się utworzyć pokoju. Spróbuj ponownie.');
    } finally {
      setIsConnecting(false);
    }
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
        (connected) => setIsConnected(connected),
        (msg) => {
          if (msg.type === 'START_GAME' && msg.questions) {
            quizStore.startQuizWithQuestions(msg.questions);
          }
        }
      );
      setRoomCode(targetCode);
      setIsConnected(true);
    } catch (err: any) {
      setErrorMsg('Nie odnaleziono pokoju o podanym kodzie. Upewnij się, że Host stworzył pokój.');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md p-6 glass-panel rounded-2xl border border-[var(--border)] shadow-2xl relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚔️</span>
            <h2 className="text-lg font-bold tracking-tight">{t.versusLobbyTitle}</h2>
          </div>
          <button
            onClick={() => {
              peerService.destroy();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-dim)]"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-[var(--border)]">
          <button
            onClick={() => {
              setActiveTab('create');
              handleCreateRoom();
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
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
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
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
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: CREATE ROOM (HOST) */}
        {activeTab === 'create' && (
          <div className="space-y-5 text-center">
            <div className="p-4 rounded-xl bg-black/40 border border-[var(--border)] space-y-2">
              <span className="text-xs uppercase font-semibold text-[var(--text-dim)]">
                {t.roomCodeLabel}
              </span>
              <div className="text-3xl font-mono font-extrabold tracking-widest text-emerald-400">
                {roomCode || '....'}
              </div>
            </div>

            {/* Share Link Button */}
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--border)] text-xs font-semibold text-[var(--text)] transition-all flex items-center justify-center gap-2"
            >
              {copied ? '✅ ' + t.linkCopied : t.shareLink}
            </button>

            {/* Connection Status */}
            <div className="p-3 rounded-xl bg-white/5 text-xs font-semibold flex items-center justify-center gap-2">
              {isConnected ? (
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t.partnerConnected}
                </span>
              ) : (
                <span className="text-[var(--text-dim)] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  {t.waitingForPartner}
                </span>
              )}
            </div>

            {/* Start Duel Action Button */}
            <button
              onClick={handleStartDuelClick}
              disabled={!isConnected}
              className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all shadow-lg ${
                isConnected
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.02]'
                  : 'bg-white/10 text-[var(--text-dim)] cursor-not-allowed'
              }`}
            >
              {t.startDuel}
            </button>
          </div>
        )}

        {/* TAB 2: JOIN ROOM (GUEST) */}
        {activeTab === 'join' && (
          <div className="space-y-5 text-center">
            <div className="space-y-2">
              <label className="block text-xs uppercase font-semibold text-[var(--text-dim)]">
                {t.enterRoomCode}
              </label>
              <input
                type="text"
                maxLength={5}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="np. K9X2"
                className="w-full text-center text-2xl font-mono tracking-widest py-3 rounded-xl bg-black/40 border border-[var(--border)] text-emerald-400 uppercase font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => handleJoinRoom()}
              disabled={isConnecting || inputCode.length < 4}
              className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all shadow-lg ${
                inputCode.length >= 4 && !isConnecting
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : 'bg-white/10 text-[var(--text-dim)] cursor-not-allowed'
              }`}
            >
              {isConnecting ? t.joiningRoom : t.joinRoom}
            </button>

            {/* Connection Status */}
            {isConnected && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                🟢 Połączono z pokojem! Oczekiwanie aż Host rozpocznie grę...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
