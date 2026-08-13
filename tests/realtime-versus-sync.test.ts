import { describe, it, expect } from 'vitest';
import { PlayerState, PeerMessage } from '../src/services/peerService.ts';
import { STATIC_QUESTION_BANK } from '../src/data/questions.ts';
import type { Question } from '../src/types/quiz.ts';

// Helper class simulating a peer network connection between Host and Guest
class SimulatedPeerNetwork {
  private hostCallbacks: { onConnect?: (count: number) => void; onMessage?: (msg: PeerMessage) => void } = {};
  private guestCallbacks: { onConnect?: (count: number) => void; onMessage?: (msg: PeerMessage) => void } = {};

  public registerHost(onConnect: (count: number) => void, onMessage: (msg: PeerMessage) => void) {
    this.hostCallbacks = { onConnect, onMessage };
  }

  public registerGuest(onConnect: (count: number) => void, onMessage: (msg: PeerMessage) => void) {
    this.guestCallbacks = { onConnect, onMessage };
  }

  public sendFromHost(msg: PeerMessage) {
    console.log(`📡 [NETWORK] Host (Adam) ➔ Guest (Ewa): TYPE=${msg.type}`, JSON.stringify(msg));
    if (this.guestCallbacks.onMessage) {
      setTimeout(() => this.guestCallbacks.onMessage!(msg), 10);
    }
  }

  public sendFromGuest(msg: PeerMessage) {
    console.log(`📡 [NETWORK] Guest (Ewa) ➔ Host (Adam): TYPE=${msg.type}`, JSON.stringify(msg));
    if (this.hostCallbacks.onMessage) {
      setTimeout(() => this.hostCallbacks.onMessage!(msg), 10);
    }
  }
}

describe('Real-Time Versus Synchronization Test (Host: Adam vs Guest: Ewa)', () => {
  it('should execute step-by-step duel synchronization over network', async () => {
    console.log('\n======================================================');
    console.log('🏁 START TESTU SYNCHRONIZACJI TRYBU WYŚCIG (2 GRACZY)');
    console.log('======================================================\n');

    const network = new SimulatedPeerNetwork();

    // Player 1 (Host: Adam) state
    let hostState = {
      name: 'Adam',
      connected: 1,
      opponent: null as PlayerState | null,
      questions: [] as Question[],
      userAnswers: [] as { isCorrect: boolean; timeMs: number }[],
      score: 0,
      pickIndex: 0,
      showPicker: false,
      isFinished: false,
    };

    // Player 2 (Guest: Ewa) state
    let guestState = {
      name: 'Ewa',
      connected: 1,
      opponent: null as PlayerState | null,
      questions: [] as Question[],
      userAnswers: [] as { isCorrect: boolean; timeMs: number }[],
      score: 0,
      pickIndex: 0,
      showPicker: false,
      isFinished: false,
    };

    // Setup Host Network Handlers
    network.registerHost(
      (count) => {
        hostState.connected = count;
        console.log(`🟢 [HOST: Adam] Połączono graczy w pokoju: ${count}`);
      },
      (msg) => {
        if (msg.type === 'HANDSHAKE') {
          console.log(`📥 [HOST: Adam] Otrzymano HANDSHAKE od ${msg.senderName}`);
          hostState.connected = 2;
          // Send handshake response back
          network.sendFromHost({
            type: 'PROGRESS_UPDATE',
            senderId: 'host',
            senderName: 'Adam',
            playerState: {
              id: 'host',
              name: 'Adam',
              score: 0,
              streak: 0,
              lives: 3,
              currentIndex: 0,
              isFinished: false,
              accuracy: 0,
              answers: [],
            },
          });
        } else if (msg.type === 'PROGRESS_UPDATE' && msg.playerState) {
          hostState.opponent = msg.playerState;
          console.log(`📊 [HOST: Adam] Zaktualizowano wynik przeciwnika (${msg.playerState.name}): ${msg.playerState.score} pkt, odpowiedzi: ${msg.playerState.answers.length}/12`);
        } else if (msg.type === 'CATEGORY_PICK' && msg.chosenCategory) {
          console.log(`🎯 [HOST: Adam] Otrzymano wybór kategorii od przeciwnika: ${msg.chosenCategory}`);
          const newQ = STATIC_QUESTION_BANK.filter((q) => q.category === msg.chosenCategory).slice(0, 3);
          hostState.questions = [...hostState.questions, ...newQ];
          hostState.pickIndex += 1;
        }
      }
    );

    // Setup Guest Network Handlers
    network.registerGuest(
      (count) => {
        guestState.connected = count;
        console.log(`🟢 [GUEST: Ewa] Połączono graczy w pokoju: ${count}`);
      },
      (msg) => {
        if (msg.type === 'PROGRESS_UPDATE' && msg.playerState) {
          guestState.opponent = msg.playerState;
          console.log(`📊 [GUEST: Ewa] Zaktualizowano wynik przeciwnika (${msg.playerState.name}): ${msg.playerState.score} pkt, odpowiedzi: ${msg.playerState.answers.length}/12`);
        } else if (msg.type === 'CATEGORY_PICK' && msg.chosenCategory) {
          console.log(`🎯 [GUEST: Ewa] Otrzymano wybór kategorii od Hosta: ${msg.chosenCategory}`);
          const newQ = STATIC_QUESTION_BANK.filter((q) => q.category === msg.chosenCategory).slice(0, 3);
          guestState.questions = [...guestState.questions, ...newQ];
          guestState.pickIndex += 1;
        }
      }
    );

    // KROK 1: Dołączenie Ewy do pokoju i Handshake
    console.log('\n--- KROK 1: INICJALIZACJA I POŁĄCZENIE (HANDSHAKE) ---');
    network.sendFromGuest({
      type: 'HANDSHAKE',
      senderId: 'guest_ewa',
      senderName: 'Ewa',
    });

    await new Promise((r) => setTimeout(r, 100));
    expect(hostState.connected).toBe(2);
    expect(guestState.opponent?.name).toBe('Adam');

    // KROK 2: Runda 1 - Adam wybiera kategorię "Computer Science"
    console.log('\n--- KROK 2: RUNDA 1 - ADAM WYBIERA KATEGORIĘ "Computer Science" ---');
    const r1Questions = STATIC_QUESTION_BANK.filter((q) => q.category === 'Computer Science').slice(0, 3);
    hostState.questions = [...r1Questions];
    hostState.pickIndex = 1;

    network.sendFromHost({
      type: 'CATEGORY_PICK',
      chosenCategory: 'Computer Science',
      pickIndex: 0,
      pickerName: 'Adam',
    });

    await new Promise((r) => setTimeout(r, 100));
    expect(guestState.questions.length).toBe(3);

    // KROK 3: Adam odpowiada na 3 pytania z Rundy 1
    console.log('\n--- KROK 3: ADAM ODPOWIADA NA 3 PYTANIA RUNDY 1 ---');
    for (let i = 1; i <= 3; i++) {
      hostState.userAnswers.push({ isCorrect: true, timeMs: 1500 });
      hostState.score += 250;
      
      network.sendFromHost({
        type: 'PROGRESS_UPDATE',
        playerState: {
          id: 'host',
          name: 'Adam',
          score: hostState.score,
          streak: i,
          lives: 3,
          currentIndex: i === 3 ? 3 : i - 1,
          isFinished: false,
          accuracy: 100,
          answers: [...hostState.userAnswers],
        },
      });
      await new Promise((r) => setTimeout(r, 50));
    }

    // Weryfikacja statusu Ewy po 3 pytaniach Adama
    const ewaCheckAnsCount = guestState.opponent?.answers?.length ?? 0;
    const isAdamStillAnswering = ewaCheckAnsCount < guestState.questions.length;
    console.log(`🔍 [WERYFIKACJA EWA] Czy Adam wciąż odpowiada? ${isAdamStillAnswering} (Odpowiedzi Adama: ${ewaCheckAnsCount}/3)`);
    expect(ewaCheckAnsCount).toBe(3);
    expect(isAdamStillAnswering).toBe(false);

    // KROK 4: Ewa odpowiada na 3 pytania z Rundy 1
    console.log('\n--- KROK 4: EWA ODPOWIADA NA 3 PYTANIA RUNDY 1 ---');
    for (let i = 1; i <= 3; i++) {
      guestState.userAnswers.push({ isCorrect: true, timeMs: 1800 });
      guestState.score += 220;

      network.sendFromGuest({
        type: 'PROGRESS_UPDATE',
        playerState: {
          id: 'guest_ewa',
          name: 'Ewa',
          score: guestState.score,
          streak: i,
          lives: 3,
          currentIndex: i === 3 ? 3 : i - 1,
          isFinished: false,
          accuracy: 100,
          answers: [...guestState.userAnswers],
        },
      });
      await new Promise((r) => setTimeout(r, 50));
    }

    // KROK 5: Runda 2 - Ewa wybiera kategorię "History"
    console.log('\n--- KROK 5: RUNDA 2 - EWA WYBIERA KATEGORIĘ "History" ---');
    const r2Questions = STATIC_QUESTION_BANK.filter((q) => q.category === 'History').slice(0, 3);
    guestState.questions = [...guestState.questions, ...r2Questions];
    guestState.pickIndex = 2;

    network.sendFromGuest({
      type: 'CATEGORY_PICK',
      chosenCategory: 'History',
      pickIndex: 1,
      pickerName: 'Ewa',
    });

    await new Promise((r) => setTimeout(r, 100));
    expect(hostState.questions.length).toBe(6);
    expect(guestState.questions.length).toBe(6);

    console.log('\n======================================================');
    console.log('✅ TEST SYNCHRONIZACJI ZAKOŃCZONY SUKCESEM 🟢');
    console.log(`Wynik końcowy rundy 1 i 2: Adam (${hostState.score} pkt) vs Ewa (${guestState.score} pkt)`);
    console.log('======================================================\n');
  });
});
