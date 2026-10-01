import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  off,
  update,
} from 'firebase/database';
import type { Database } from 'firebase/database';
import type { GameState, PlayerState } from '../types/game';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL?: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY = 'pokemon_splendor_firebase_config';

// 1. 설정 로드: index.html 전역 객체 -> localStorage -> 환경 변수 순서로 탐색
export function getStoredFirebaseConfig(): FirebaseConfig | null {
  // A. index.html의 window.firebaseConfig 확인
  if (typeof window !== 'undefined' && (window as any).firebaseConfig) {
    const htmlConfig = (window as any).firebaseConfig;
    if (htmlConfig.apiKey && (htmlConfig.projectId || htmlConfig.databaseURL)) {
      return {
        apiKey: htmlConfig.apiKey,
        authDomain: htmlConfig.authDomain || `${htmlConfig.projectId}.firebaseapp.com`,
        databaseURL:
          htmlConfig.databaseURL ||
          (htmlConfig.projectId ? `https://${htmlConfig.projectId}-default-rtdb.firebaseio.com` : ''),
        projectId: htmlConfig.projectId || '',
        storageBucket: htmlConfig.storageBucket || '',
        messagingSenderId: htmlConfig.messagingSenderId || '',
        appId: htmlConfig.appId || '',
      };
    }
  }

  // B. localStorage 확인
  if (typeof window !== 'undefined') {
    const localStored = localStorage.getItem(STORAGE_KEY);
    if (localStored) {
      try {
        const parsed = JSON.parse(localStored);
        if (parsed.apiKey && (parsed.projectId || parsed.databaseURL)) {
          return parsed;
        }
      } catch {
        // ignore
      }
    }
  }

  // C. Vite .env 환경변수 확인
  const envConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };

  if (envConfig.apiKey && (envConfig.projectId || envConfig.databaseURL)) {
    if (!envConfig.databaseURL && envConfig.projectId) {
      envConfig.databaseURL = `https://${envConfig.projectId}-default-rtdb.firebaseio.com`;
    }
    return envConfig;
  }

  return null;
}

export function saveStoredFirebaseConfig(config: FirebaseConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

let app: FirebaseApp | null = null;
let db: Database | null = null;

/**
 * Firebase Realtime Database 초기화
 */
export function initFirebase(customConfig?: FirebaseConfig): Database | null {
  const config = customConfig || getStoredFirebaseConfig();
  if (!config || !config.apiKey) {
    return null;
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }

    // databaseURL이 지정된 경우 해당 URL로 Realtime Database 인스턴스 획득
    if (config.databaseURL) {
      db = getDatabase(app, config.databaseURL);
    } else {
      db = getDatabase(app);
    }

    console.log('[Firebase RTDB] Initialized with config:', config.projectId || config.databaseURL);
    return db;
  } catch (error) {
    console.error('[Firebase RTDB] Initialization error:', error);
    return null;
  }
}

/**
 * Firebase Realtime Database에서 불러온 방 데이터를 안전하게 정규화
 */
export function sanitizeGameState(raw: any): GameState {
  if (!raw) return raw;

  // 1. 마켓 데이터 복원 (rooms/[방코드]/market 지원)
  const market = raw.market || {};
  const supplyBalls = market.supplyBalls || raw.supplyBalls || {
    monster: 7,
    super: 7,
    hyper: 7,
    heal: 7,
    quick: 7,
    master: 5,
  };

  // 슬롯 카드 정규화 (배열 또는 객체 대응, null 패딩)
  const normalizeOpenCards = (cards: any, count: number) => {
    let arr = Array.isArray(cards) ? cards : cards ? Object.values(cards) : [];
    const res: any[] = [];
    for (let i = 0; i < count; i++) {
      res.push(arr[i] || null);
    }
    return res;
  };

  const tier1Open = normalizeOpenCards(market.tier1Open || raw.tier1Open, 4);
  const tier2Open = normalizeOpenCards(market.tier2Open || raw.tier2Open, 4);
  const tier3Open = normalizeOpenCards(market.tier3Open || raw.tier3Open, 4);
  const rareOpen = normalizeOpenCards(market.rareOpen || raw.rareOpen, 1);
  const legendaryOpen = normalizeOpenCards(market.legendaryOpen || raw.legendaryOpen, 1);

  // 2. 턴 정보 정규화 (rooms/[방코드]/currentTurnIndex 지원)
  const currentTurnIndex =
    typeof raw.currentTurnIndex === 'number'
      ? raw.currentTurnIndex
      : typeof raw.currentTurnPlayerIndex === 'number'
      ? raw.currentTurnPlayerIndex
      : 0;

  // 3. 플레이어 목록 정규화 (rooms/[방코드]/players 지원)
  let rawPlayers = raw.players || [];
  if (!Array.isArray(rawPlayers) && typeof rawPlayers === 'object') {
    rawPlayers = Object.values(rawPlayers);
  }

  const players: PlayerState[] = rawPlayers.map((p: any, idx: number) => ({
    id: p.id || `p-${idx}`,
    name: p.name || `트레이너 ${idx + 1}`,
    trainerId: p.trainerId || 'trainer-ash',
    balls: p.balls || { monster: 0, super: 0, hyper: 0, heal: 0, quick: 0, master: 0 },
    capturedCards: Array.isArray(p.capturedCards) ? p.capturedCards : p.capturedCards ? Object.values(p.capturedCards) : [],
    reservedCards: Array.isArray(p.reservedCards) ? p.reservedCards : p.reservedCards ? Object.values(p.reservedCards) : [],
    evolvedCards: Array.isArray(p.evolvedCards) ? p.evolvedCards : p.evolvedCards ? Object.values(p.evolvedCards) : [],
    score: typeof p.score === 'number' ? p.score : 0,
    isReady: p.isReady ?? true,
    isConnected: p.isConnected ?? true,
  }));

  return {
    ...raw,
    supplyBalls,
    tier1Open,
    tier2Open,
    tier3Open,
    rareOpen,
    legendaryOpen,
    currentTurnPlayerIndex: currentTurnIndex,
    startPlayerIndex: raw.startPlayerIndex ?? 0,
    playerCount: players.length,
    players,
    tier1Deck: Array.isArray(raw.tier1Deck) ? raw.tier1Deck : [],
    tier2Deck: Array.isArray(raw.tier2Deck) ? raw.tier2Deck : [],
    tier3Deck: Array.isArray(raw.tier3Deck) ? raw.tier3Deck : [],
    rareDeck: Array.isArray(raw.rareDeck) ? raw.rareDeck : [],
    legendaryDeck: Array.isArray(raw.legendaryDeck) ? raw.legendaryDeck : [],
    logs: Array.isArray(raw.logs) ? raw.logs : raw.logs ? Object.values(raw.logs) : [],
  };
}

/**
 * 1. 새 온라인 방 만들기 (rooms/[방코드] 및 하위 market, players, currentTurnIndex 생성)
 */
export async function createOnlineRoom(state: GameState): Promise<boolean> {
  const rtdb = db || initFirebase();
  if (!rtdb) {
    throw new Error('Firebase Realtime Database 연결 설정이 필요합니다.');
  }

  try {
    const roomRef = ref(rtdb, `rooms/${state.roomId}`);

    const market = {
      supplyBalls: state.supplyBalls,
      tier1Open: state.tier1Open || [],
      tier2Open: state.tier2Open || [],
      tier3Open: state.tier3Open || [],
      rareOpen: state.rareOpen || [],
      legendaryOpen: state.legendaryOpen || [],
    };

    const payload = {
      ...state,
      market,
      currentTurnIndex: state.currentTurnPlayerIndex,
      currentTurnPlayerIndex: state.currentTurnPlayerIndex,
      players: state.players || [],
      updatedAt: Date.now(),
    };

    await set(roomRef, payload);
    console.log(`[Firebase RTDB] Room created successfully: rooms/${state.roomId}`);
    return true;
  } catch (err: any) {
    console.error(`[Firebase RTDB] Error creating room:`, err);
    throw err;
  }
}

/**
 * 2. 온라인 방 상태 조회 (단발 get)
 */
export async function getOnlineRoom(roomId: string): Promise<GameState | null> {
  const rtdb = db || initFirebase();
  if (!rtdb) return null;

  try {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snap = await get(roomRef);
    if (snap.exists()) {
      return sanitizeGameState(snap.val());
    }
    return null;
  } catch (err) {
    console.error(`[Firebase RTDB] Error getting room ${roomId}:`, err);
    return null;
  }
}

/**
 * 3. 방 참가하기 (검증 후 players 배열에 추가)
 */
export async function joinOnlineRoom(
  roomId: string,
  player: PlayerState
): Promise<{ success: boolean; error?: string; room?: GameState }> {
  const rtdb = db || initFirebase();
  if (!rtdb) {
    return { success: false, error: 'Firebase 연동 설정이 필요합니다.' };
  }

  try {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snap = await get(roomRef);

    if (!snap.exists()) {
      return { success: false, error: '존재하지 않는 방 코드입니다.' };
    }

    const roomData = sanitizeGameState(snap.val());

    if (roomData.status !== 'waiting') {
      return { success: false, error: '이미 게임이 진행 중인 방입니다.' };
    }

    const currentPlayers = roomData.players || [];

    // 이미 참가 중인 플레이어인 경우 재접속 허용
    const existingIndex = currentPlayers.findIndex((p) => p.id === player.id);
    if (existingIndex !== -1) {
      return { success: true, room: roomData };
    }

    // 4명 정원 초과 차단
    if (currentPlayers.length >= 4) {
      return { success: false, error: '방이 이미 꽉 찼습니다. (최대 4인)' };
    }

    const updatedPlayers = [...currentPlayers, player];
    const updates = {
      players: updatedPlayers,
      playerCount: updatedPlayers.length,
      updatedAt: Date.now(),
    };

    await update(roomRef, updates);

    const updatedRoom: GameState = {
      ...roomData,
      ...updates,
    };

    console.log(`[Firebase RTDB] Player joined room: rooms/${roomId}`, player.name);
    return { success: true, room: updatedRoom };
  } catch (err: any) {
    console.error(`[Firebase RTDB] Error joining room ${roomId}:`, err);
    return { success: false, error: err.message || '방 참가에 실패했습니다.' };
  }
}

/**
 * 4. 실시간 게임 룸 구독 (onValue 리스너)
 */
export function subscribeToOnlineRoom(
  roomId: string,
  onUpdate: (state: GameState) => void,
  onError?: (err: Error) => void
): () => void {
  const rtdb = db || initFirebase();
  if (!rtdb) {
    return () => {};
  }

  const roomRef = ref(rtdb, `rooms/${roomId}`);

  const unsubscribe = onValue(
    roomRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const sanitized = sanitizeGameState(val);
        onUpdate(sanitized);
      }
    },
    (err) => {
      console.error(`[Firebase RTDB] Room subscription error for ${roomId}:`, err);
      if (onError) onError(err);
    }
  );

  // 구독 해제 함수 반환
  return () => {
    try {
      off(roomRef);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    } catch (e) {
      // ignore
    }
  };
}

/**
 * 5. 실시간 게임 룸 상태 업데이트 (마켓, 턴, 플레이어 전체 동기화)
 */
export async function updateOnlineRoom(roomId: string, state: GameState): Promise<boolean> {
  const rtdb = db || initFirebase();
  if (!rtdb) return false;

  try {
    const roomRef = ref(rtdb, `rooms/${roomId}`);

    const market = {
      supplyBalls: state.supplyBalls,
      tier1Open: state.tier1Open || [],
      tier2Open: state.tier2Open || [],
      tier3Open: state.tier3Open || [],
      rareOpen: state.rareOpen || [],
      legendaryOpen: state.legendaryOpen || [],
    };

    const payload = {
      ...state,
      market,
      currentTurnIndex: state.currentTurnPlayerIndex,
      currentTurnPlayerIndex: state.currentTurnPlayerIndex,
      players: state.players || [],
      updatedAt: Date.now(),
    };

    await set(roomRef, payload);
    return true;
  } catch (err) {
    console.error(`[Firebase RTDB] Error updating room ${roomId}:`, err);
    return false;
  }
}

/**
 * 6. 방 나가기 (대기실 취소 또는 퇴장)
 */
export async function leaveOnlineRoom(roomId: string, playerId: string): Promise<void> {
  const rtdb = db || initFirebase();
  if (!rtdb) return;

  try {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snap = await get(roomRef);
    if (!snap.exists()) return;

    const room = snap.val() as GameState;
    const currentPlayers = room.players || [];

    // 방장이 나가고 방에 아무도 없으면 방 삭제
    if (currentPlayers.length <= 1) {
      await set(roomRef, null);
      return;
    }

    const filtered = currentPlayers.filter((p) => p.id !== playerId);
    await update(roomRef, {
      players: filtered,
      playerCount: filtered.length,
    });
  } catch (err) {
    console.error(`[Firebase RTDB] Error leaving room ${roomId}:`, err);
  }
}
