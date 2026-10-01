import React, { useState } from 'react';
import { TRAINER_TILES } from '../data/trainerTiles';
import type { GameState } from '../types/game';
import { createInitialGameState } from '../utils/gameLogic';
import { getStudentInfoFromUrl, updateStoredStudentName } from '../utils/studentPlatform';
import {
  createOnlineRoom,
  joinOnlineRoom,
  leaveOnlineRoom,
  subscribeToOnlineRoom,
  getStoredFirebaseConfig,
  updateOnlineRoom,
} from '../services/firebase';
import {
  Users,
  Play,
  Globe,
  Settings,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Palette,
  LogOut,
} from 'lucide-react';

interface LobbyProps {
  onStartGame: (state: GameState, isOnline: boolean, myPlayerId: string) => void;
  onOpenFirebaseConfig: () => void;
  onOpenRules: () => void;
  onOpenAdmin: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onStartGame,
  onOpenFirebaseConfig,
  onOpenRules,
  onOpenAdmin,
}) => {
  const [studentInfo] = useState(() => getStudentInfoFromUrl());
  const [playerName, setPlayerName] = useState<string>(() => studentInfo.studentName || '학생');
  const [selectedTrainerId, setSelectedTrainerId] = useState(TRAINER_TILES[0].id);
  const [localPlayerCount, setLocalPlayerCount] = useState<number>(3); // 기본 3인 추천
  const [turnTimeLimit, setTurnTimeLimit] = useState<number>(0); // 0: 무제한, 30: 30초, 60: 60초

  // 온라인 멀티 상태
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [onlineLobbyState, setOnlineLobbyState] = useState<GameState | null>(null);
  const [isHosting, setIsHosting] = useState(false);
  const [myOnlineId, setMyOnlineId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const unsubscribeRef = React.useRef<(() => void) | null>(null);

  const hasFirebase = !!getStoredFirebaseConfig()?.apiKey;

  // 1. 로컬 패스 & 플레이 시작
  const handleStartLocalGame = () => {
    const players = Array.from({ length: localPlayerCount }).map((_, i) => ({
      id: `local-p-${i + 1}`,
      name: i === 0 ? playerName || '트레이너 1' : `트레이너 ${i + 1}`,
      trainerId:
        i === 0
          ? selectedTrainerId
          : TRAINER_TILES[(i) % TRAINER_TILES.length].id,
    }));

    const initialState = createInitialGameState('local-room', '로컬 대전', players, turnTimeLimit);
    onStartGame(initialState, false, players[0].id);
  };

  // 2. 새 온라인 방 만들기 (6자리 랜덤 숫자 코드)
  const handleCreateOnlineRoom = async () => {
    if (!hasFirebase) {
      setErrorMsg('Firebase Realtime DB 설정이 필요합니다. 우측 상단 설정을 클릭하세요.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      // 6자리 랜덤 숫자 생성
      const roomId = Math.floor(100000 + Math.random() * 900000).toString();
      const myId = `user-${Date.now()}`;
      setMyOnlineId(myId);

      const hostPlayer = {
        id: myId,
        name: playerName || '방장 트레이너',
        trainerId: selectedTrainerId,
        balls: { monster: 0, super: 0, hyper: 0, heal: 0, quick: 0, master: 0 },
        capturedCards: [],
        reservedCards: [],
        evolvedCards: [],
        score: 0,
        isReady: true,
        isConnected: true,
      };

      const state: GameState = {
        ...createInitialGameState(roomId, `${playerName || '트레이너'}의 방`, [hostPlayer], turnTimeLimit),
        status: 'waiting',
        playerCount: 1,
      };

      await createOnlineRoom(state);
      setIsHosting(true);
      setOnlineLobbyState(state);

      // 기존 구독 해제 후 실시간 onValue 리스너 등록
      if (unsubscribeRef.current) unsubscribeRef.current();
      unsubscribeRef.current = subscribeToOnlineRoom(roomId, (updated) => {
        setOnlineLobbyState(updated);
        if (updated.status === 'playing') {
          onStartGame(updated, true, myId);
        }
      });
    } catch (err: any) {
      setErrorMsg(err.message || '온라인 방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 3. 온라인 방 참가하기 (검증 및 최대 4인 제한)
  const handleJoinOnlineRoom = async () => {
    if (!hasFirebase) {
      setErrorMsg('Firebase Realtime DB 설정이 필요합니다.');
      return;
    }
    const cleanCode = joinRoomCode.trim();
    if (!cleanCode) {
      setErrorMsg('6자리 방 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const myId = `user-${Date.now()}`;
      setMyOnlineId(myId);

      const newPlayer = {
        id: myId,
        name: playerName || '참가 트레이너',
        trainerId: selectedTrainerId,
        balls: { monster: 0, super: 0, hyper: 0, heal: 0, quick: 0, master: 0 },
        capturedCards: [],
        reservedCards: [],
        evolvedCards: [],
        score: 0,
        isReady: true,
        isConnected: true,
      };

      const result = await joinOnlineRoom(cleanCode, newPlayer);

      if (!result.success || !result.room) {
        setErrorMsg(result.error || '방 참가에 실패했습니다.');
        setLoading(false);
        return;
      }

      setIsHosting(false);
      setOnlineLobbyState(result.room);

      // 기존 구독 해제 후 실시간 onValue 리스너 등록
      if (unsubscribeRef.current) unsubscribeRef.current();
      unsubscribeRef.current = subscribeToOnlineRoom(cleanCode, (updated) => {
        setOnlineLobbyState(updated);
        if (updated.status === 'playing') {
          onStartGame(updated, true, myId);
        }
      });
    } catch (err: any) {
      setErrorMsg(err.message || '방 참가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 대기실 퇴장 (방 나가기)
  const handleLeaveLobby = async () => {
    if (onlineLobbyState && myOnlineId) {
      await leaveOnlineRoom(onlineLobbyState.roomId, myOnlineId);
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setOnlineLobbyState(null);
    setIsHosting(false);
  };

  // 온라인 방 게임 시작 (호스트 전용)
  const handleStartOnlineGame = async () => {
    if (!onlineLobbyState || !isHosting) return;
    if (onlineLobbyState.players.length < 2) {
      setErrorMsg('최소 2명 이상의 플레이어가 필요합니다.');
      return;
    }

    const fullGameState = createInitialGameState(
      onlineLobbyState.roomId,
      onlineLobbyState.roomName,
      onlineLobbyState.players.map((p) => ({
        id: p.id,
        name: p.name,
        trainerId: p.trainerId,
      })),
      onlineLobbyState.turnTimeLimit ?? turnTimeLimit
    );

    await updateOnlineRoom(onlineLobbyState.roomId, fullGameState);
  };

  // 대기실 화면
  if (onlineLobbyState) {
    return (
      <div className="max-w-xl mx-auto p-6 sm:p-8 bg-slate-900/85 border-2 border-slate-700/70 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            온라인 대기실 (실시간 연결됨)
          </span>
          <button
            type="button"
            onClick={handleLeaveLobby}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>방 나가기</span>
          </button>
        </div>

        <div className="text-center mb-6 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-bold mb-1">참가 코드 (6자리 숫자)</div>
          <h2 className="text-4xl font-black text-amber-300 tracking-wider font-mono neon-glow-gold">
            {onlineLobbyState.roomId}
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-2">
            친구들에게 위 6자리 방 코드를 알려주세요! (현재 <span className="text-amber-300 font-black">{onlineLobbyState.players.length}</span>/4인)
          </p>
        </div>

        {/* 플레이어 목록 */}
        <div className="space-y-3 mb-6">
          {onlineLobbyState.players.map((p, idx) => {
            const trainer =
              TRAINER_TILES.find((t) => t.id === p.trainerId) || TRAINER_TILES[0];
            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-slate-700/80 shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${trainer.bgGradient} flex items-center justify-center text-2xl shadow`}
                  >
                    {trainer.avatarEmoji}
                  </div>
                  <div>
                    <div className="font-extrabold text-white text-base flex items-center gap-1.5 whitespace-nowrap">
                      <span>{p.name}</span>
                      {idx === 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                          방장 👑
                        </span>
                      )}
                      {p.id === myOnlineId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500 text-white font-bold">
                          나
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-semibold whitespace-nowrap">{trainer.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 whitespace-nowrap">
                  <ShieldCheck className="w-4 h-4" />
                  <span>준비완료</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 버튼 */}
        {isHosting ? (
          <button
            type="button"
            disabled={onlineLobbyState.players.length < 2}
            onClick={handleStartOnlineGame}
            className="w-full py-4 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-lg rounded-2xl shadow-[0_5px_0_#78350f,0_10px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_0_#78350f] active:translate-y-1 active:shadow-[0_1px_0_#78350f] border border-amber-200/50 transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span className="whitespace-nowrap">게임 시작하기 ({onlineLobbyState.players.length}인)</span>
          </button>
        ) : (
          <div className="text-center py-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-sm text-slate-400">
            방장이 게임을 시작하기를 기다리고 있습니다...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8 bg-slate-900/85 border-2 border-slate-700/70 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
      {/* 타이틀 및 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-5 border-b border-slate-700/80">
        <div className="flex items-center gap-3.5 flex-shrink-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-red-500 to-indigo-600 flex items-center justify-center text-2xl sm:text-3xl shadow-[0_0_20px_rgba(245,158,11,0.4)] border-2 border-amber-300/50 animate-bounce-gentle flex-shrink-0">
            ⚡
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-300 tracking-tight neon-glow-gold whitespace-nowrap flex items-center gap-2">
              <span>스플렌더: 포켓몬</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-bold mt-1 tracking-wide whitespace-nowrap">
              Splendor: Pokémon Edition • 보드게임 웹 버전
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onOpenAdmin}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_3px_0_#78350f] active:translate-y-0.5 active:shadow-[0_1px_0_#78350f] transition cursor-pointer whitespace-nowrap flex-shrink-0"
            title="카드 사진 관리자 모드"
          >
            <Palette className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">🎨 그림 교체</span>
          </button>
          <button
            type="button"
            onClick={onOpenRules}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-[0_3px_0_#000] active:translate-y-0.5 transition cursor-pointer whitespace-nowrap flex-shrink-0"
            title="게임 룰 요약보기"
          >
            <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="whitespace-nowrap">룰 요약</span>
          </button>
          <button
            type="button"
            onClick={onOpenFirebaseConfig}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border text-xs sm:text-sm font-black flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap flex-shrink-0 ${
              hasFirebase
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-[0_3px_0_#000] active:translate-y-0.5'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
            }`}
            title="Firebase 설정"
          >
            <Settings className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="whitespace-nowrap">{hasFirebase ? 'Firebase' : '연동 필요'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-2xl bg-red-500/20 border-2 border-red-500/50 text-red-200 text-xs font-black text-center shadow-lg">
          {errorMsg}
        </div>
      )}

      {/* 1. 프로필 설정 (닉네임 & 트레이너 타일 선택) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
            내 닉네임
          </label>
          {studentInfo.studentUid && (
            <span className="text-[10px] sm:text-[11px] font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30 whitespace-nowrap">
              학급 플랫폼 연동됨 ({studentInfo.studentName})
            </span>
          )}
        </div>
        <input
          type="text"
          value={playerName}
          onChange={(e) => {
            setPlayerName(e.target.value);
            updateStoredStudentName(e.target.value);
          }}
          placeholder="트레이너 이름을 입력하세요"
          className="w-full bg-slate-950/80 border-2 border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white font-extrabold focus:outline-none focus:border-amber-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] mb-5 transition"
        />

        <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2.5">
          트레이너 타일 선택 (1개)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {TRAINER_TILES.map((t) => {
            const isSelected = selectedTrainerId === t.id;
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setSelectedTrainerId(t.id)}
                className={`group p-3 sm:p-3.5 rounded-2xl border-2 sm:border-[3px] transition-all duration-200 flex flex-col items-center text-center cursor-pointer select-none active:scale-95 ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_25px_rgba(251,191,36,0.6),inset_0_1px_2px_rgba(255,255,255,0.4)] -translate-y-2 ring-2 ring-amber-300/80'
                    : 'border-slate-700/80 bg-slate-950/70 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)] hover:-translate-y-1.5 hover:border-cyan-400 hover:shadow-[0_0_22px_rgba(6,182,212,0.6)] hover:bg-slate-900/90'
                }`}
              >
                <div
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${t.bgGradient} flex items-center justify-center text-2xl sm:text-3xl shadow-lg mb-2 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0`}
                >
                  {t.avatarEmoji}
                </div>
                <div className={`font-black text-sm whitespace-nowrap ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                  {t.name}
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-300/90 break-keep leading-snug mt-1 min-h-[32px] flex items-center justify-center text-center px-1">
                  {t.title}
                </div>
                {isSelected && (
                  <span className="mt-1.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow whitespace-nowrap flex-shrink-0">
                    선택됨 ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 턴 시간 제한 설정 */}
      <div className="mb-8 bg-slate-950/70 border-2 border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏱️</span>
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider">
              턴 시간 제한 (초시계)
            </label>
          </div>
          <span className="text-xs text-amber-300 font-black px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40">
            {turnTimeLimit === 0 ? '무제한' : `${turnTimeLimit}초 타이머`}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {[
            { val: 0, label: '무제한', desc: '여유로운 플레이 (기본)' },
            { val: 30, label: '30초', desc: '짜릿한 스피드전' },
            { val: 60, label: '60초', desc: '적당한 생각 시간' },
          ].map((opt) => (
            <button
              type="button"
              key={opt.val}
              onClick={() => setTurnTimeLimit(opt.val)}
              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer select-none active:scale-95 ${
                turnTimeLimit === opt.val
                  ? 'border-amber-400 bg-amber-400/20 text-white shadow-[0_0_16px_rgba(251,191,36,0.5)] scale-102 font-black ring-2 ring-amber-300/60'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700 font-bold'
              }`}
            >
              <span className="text-xs sm:text-sm font-black whitespace-nowrap">{opt.label}</span>
              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. 플레이 모드 선택 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 모드 1: 로컬 패스 & 플레이 */}
        <div className="bg-slate-950/75 border-2 border-slate-700/70 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.12),inset_0_-2px_6px_rgba(0,0,0,0.5)] transition hover:border-emerald-500/50">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-base mb-1">
              <Users className="w-5 h-5 flex-shrink-0" />
              <span className="text-base font-black whitespace-nowrap">로컬 패스 & 플레이</span>
            </div>
            <p className="text-xs text-slate-300 font-medium mb-4 leading-relaxed break-keep">
              한 대의 화면(교실 전자칠판, 모니터)에서 학생들이 차례로 턴을 넘겨가며 플레이합니다.
            </p>

            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <span className="text-xs font-black text-slate-300 whitespace-nowrap">인원 수 선택:</span>
              <div className="flex gap-2">
                {[2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setLocalPlayerCount(num)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                      localPlayerCount === num
                        ? 'bg-amber-400 text-slate-950 shadow-[0_2px_8px_rgba(251,191,36,0.5)] scale-105'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {num}인{num === 3 ? ' (추천)' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartLocalGame}
            className="animate-pulse-green w-full py-3.5 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-base rounded-2xl shadow-[0_5px_0_#065f46,0_10px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_0_#065f46,0_8px_16px_rgba(16,185,129,0.4)] active:translate-y-1 active:shadow-[0_1px_0_#065f46] border border-emerald-300/40 flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
          >
            <Play className="w-5 h-5 fill-white flex-shrink-0" />
            <span className="whitespace-nowrap">로컬 게임 바로 시작</span>
          </button>
        </div>

        {/* 모드 2: 실시간 온라인 멀티 (Firebase) */}
        <div className="bg-slate-950/75 border-2 border-slate-700/70 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.12),inset_0_-2px_6px_rgba(0,0,0,0.5)] transition hover:border-indigo-500/50">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-base mb-1">
              <Globe className="w-5 h-5 flex-shrink-0" />
              <span className="text-base font-black whitespace-nowrap">실시간 온라인 대전</span>
            </div>
            <p className="text-xs text-slate-300 font-medium mb-4 leading-relaxed break-keep">
              각자의 스마트폰/태블릿/노트북에서 방 코드로 접속하여 실시간으로 대전합니다.
            </p>

            {/* 방 참가 입력 */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                maxLength={6}
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                placeholder="6자리 방 코드"
                className="flex-1 bg-slate-900 border-2 border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
              />
              <button
                type="button"
                disabled={loading}
                onClick={handleJoinOnlineRoom}
                className="px-4 py-2 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-[0_3px_0_#312e81] active:translate-y-0.5 active:shadow-[0_1px_0_#312e81] border border-indigo-300/30 transition cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                참가
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleCreateOnlineRoom}
            className="animate-pulse-purple w-full py-3.5 bg-gradient-to-b from-indigo-500 via-purple-600 to-purple-700 hover:from-indigo-400 hover:to-purple-600 disabled:opacity-50 text-white font-black text-base rounded-2xl shadow-[0_5px_0_#4c1d95,0_10px_20px_rgba(147,51,234,0.35)] hover:shadow-[0_4px_0_#4c1d95,0_8px_16px_rgba(147,51,234,0.45)] active:translate-y-1 active:shadow-[0_1px_0_#4c1d95] border border-purple-300/40 flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <span className="whitespace-nowrap">새 온라인 방 만들기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
