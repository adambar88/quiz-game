import React, { useEffect, useState } from 'react';
import { peerService } from '../services/peerService.ts';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';

interface VersusLobbyModalProps {
  onStartDuel: () => void;
  onClose: () => void;
}

export const VersusLobbyModal: React.FC<VersusLobbyModalProps> = ({ onStartDuel, onClose }) => {
  const { lang, versusPlayerName } = useQuizStore();
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [playerNameInput, setPlayerNameInput] = useState<string>(versusPlayerName || '');
  const [connectedCount, setConnectedCount] = useState<number>(1);
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
    const code = peerService.generateRoomCode();
    setRoomCode(code);
    try {
      await peerService.createRoom(
        code,
        (count) => setConnectedCount(count),
        (msg) => {
          if (msg.type === 'START_GAME' && msg.questions) {
            quizStore.startQuizWithQuestions(msg.questions);
          }
        }
      );
    } catch (err: any) {
      console.warn('[VersusLobby] Room creation warning:', err);
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
        (count) => setConnectedCount(count),
        (msg) => {
          if (msg.type === 'START_GAME' && msg.questions) {
            quizStore.startQuizWithQuestions(msg.questions);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md p-6 glass-panel rounded-2xl border border-[var(--border)] shadow-2xl relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏎️</span>
            <h2 className="text-lg font-bold tracking-tight">Pojedynek Wieloosobowy (2-4 Graczy)</h2>
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

        {/* Player Name Input Field */}
        <div className="space-y-1.5">
          <label className="block text-xs uppercase font-semibold text-[var(--text-dim)]">
            👤 Twoje Imię / Nick
          </label>
          <input
            type="text"
            maxLength={16}
            value={playerNameInput}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="np. Adam, Ania, Kasia..."
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-[var(--border)] text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
          />
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

            {/* Connected Players Status */}
            <div className="p-3 rounded-xl bg-white/5 text-xs font-semibold flex items-center justify-between">
              <span className="text-[var(--text-dim)]">Gracze w pokoju:</span>
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
              {t.startDuel} ({connectedCount} Graczy)
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
            {connectedCount >= 2 && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                🟢 Połączono z pokojem! Oczekiwanie na start Hosta...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
