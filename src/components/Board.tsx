import React, { useState } from 'react';
import type {
  BallType,
  CardTier,
  GameState,
  PokemonCard,
} from '../types/game';
import { CardView } from './CardView';
import { SupplyBoard } from './SupplyBoard';
import { PlayerPanel } from './PlayerPanel';
import { DiscardBallsModal } from './DiscardBallsModal';
import { WinnerModal } from './WinnerModal';
import {
  takeDifferentBalls,
  takeTwoSameBalls,
  reserveCard,
  captureCard,
  evolvePokemon,
  discardExcessBalls,
  passOrEndTurn,
} from '../utils/gameLogic';
import {
  updateOnlineRoom,
} from '../services/firebase';
import {
  History,
  BookOpen,
  LogOut,
  AlertTriangle,
  Palette,
  Clock,
  Lock,
} from 'lucide-react';

interface BoardProps {
  gameState: GameState;
  isOnline: boolean;
  myPlayerId: string;
  onExit: () => void;
  onOpenRules: () => void;
  onOpenAdmin: () => void;
}

export const Board: React.FC<BoardProps> = ({
  gameState: initialGameState,
  isOnline,
  myPlayerId,
  onExit,
  onOpenRules,
  onOpenAdmin,
}) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [showLogs, setShowLogs] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // 1. 내 차례 알림 팝업 및 타이머 상태
  const [showTurnAlert, setShowTurnAlert] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(initialGameState.turnTimeLimit || 0);
  const prevTurnIndexRef = React.useRef(initialGameState.currentTurnPlayerIndex);
  const hasTimedOutRef = React.useRef(false);

  // 로컬 상태 동기화 (부모에서 prop 업데이트 시)
  React.useEffect(() => {
    setGameState(initialGameState);
  }, [initialGameState]);

  const showToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 3000);
  };

  // 게임 상태 갱신 함수 (온라인이면 Firebase Firestore에도 sync)
  const commitGameState = async (nextState: GameState) => {
    setGameState(nextState);
    if (isOnline) {
      try {
        await updateOnlineRoom(nextState.roomId, nextState);
      } catch (err: any) {
        console.error('Failed to sync to firebase:', err);
        showToast('실시간 동기화 오류: ' + (err.message || ''));
      }
    }
  };

  const currentPlayerIndex = gameState.currentTurnPlayerIndex;
  const currentPlayer = gameState.players[currentPlayerIndex];

  // 내 차례 여부 판별 (로컬 모드면 항상 현재 턴 플레이어, 온라인 모드면 myPlayerId 기준)
  const isMyTurn = isOnline ? currentPlayer.id === myPlayerId : true;

  // 턴 변경 시 1.5초 팝업 트리거
  React.useEffect(() => {
    if (prevTurnIndexRef.current !== gameState.currentTurnPlayerIndex) {
      prevTurnIndexRef.current = gameState.currentTurnPlayerIndex;
      hasTimedOutRef.current = false;
      if (isMyTurn) {
        setShowTurnAlert(true);
        const timer = setTimeout(() => setShowTurnAlert(false), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState.currentTurnPlayerIndex, isMyTurn]);

  // 마운트 시 최초 내 차례 팝업
  React.useEffect(() => {
    if (isMyTurn) {
      setShowTurnAlert(true);
      const timer = setTimeout(() => setShowTurnAlert(false), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // 턴 시간 제한 타이머 (300ms 간격 갱신 & 0초 시 강제 턴 종료)
  React.useEffect(() => {
    if (!gameState.turnTimeLimit || gameState.turnTimeLimit <= 0 || gameState.status === 'finished') {
      return;
    }

    const interval = setInterval(() => {
      const startTime = gameState.turnStartTime || gameState.createdAt || Date.now();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, gameState.turnTimeLimit - elapsed);
      setTimeLeft(remaining);

      // 0초 도달 시 자동 턴 종료
      if (remaining <= 0 && !hasTimedOutRef.current) {
        hasTimedOutRef.current = true;
        // 온라인이면 내 턴이거나 방장일 때 턴 종료 실행
        if (!isOnline || isMyTurn || gameState.players[0].id === myPlayerId) {
          try {
            const next = passOrEndTurn(gameState);
            commitGameState(next);
          } catch (e) {
            console.error('Auto turn timeout error:', e);
          }
        }
      }
    }, 300);

    return () => clearInterval(interval);
  }, [gameState.currentTurnPlayerIndex, gameState.turnStartTime, gameState.turnTimeLimit, isMyTurn, isOnline]);

  // 액션 중복 실행 및 연타 방지 락
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  // 1. 서로 다른 볼 3개 가져오기
  const handleTakeDifferentBalls = async (balls: BallType[]) => {
    if (isActionProcessing) return;
    if (isOnline && !isMyTurn) {
      showToast('내 차례가 아닙니다.');
      return;
    }
    setIsActionProcessing(true);
    try {
      const next = takeDifferentBalls(gameState, currentPlayerIndex, balls);
      await commitGameState(next);
    } catch (err: any) {
      showToast(err.message || '볼을 가져올 수 없습니다.');
    } finally {
      setTimeout(() => setIsActionProcessing(false), 350);
    }
  };

  // 2. 같은 볼 2개 가져오기
  const handleTakeTwoSameBalls = async (ball: BallType) => {
    if (isActionProcessing) return;
    if (isOnline && !isMyTurn) {
      showToast('내 차례가 아닙니다.');
      return;
    }
    setIsActionProcessing(true);
    try {
      const next = takeTwoSameBalls(gameState, currentPlayerIndex, ball);
      await commitGameState(next);
    } catch (err: any) {
      showToast(err.message || '볼을 가져올 수 없습니다.');
    } finally {
      setTimeout(() => setIsActionProcessing(false), 350);
    }
  };

  // 3. 카드 손에 보관 (예약)
  const handleReserveCard = async (card: PokemonCard, tier: 1 | 2 | 3, openIndex?: number) => {
    if (isActionProcessing) return;
    if (isOnline && !isMyTurn) {
      showToast('내 차례가 아닙니다.');
      return;
    }
    setIsActionProcessing(true);
    try {
      const next = reserveCard(gameState, currentPlayerIndex, card, tier, openIndex);
      await commitGameState(next);
    } catch (err: any) {
      showToast(err.message || '카드를 보관할 수 없습니다.');
    } finally {
      setTimeout(() => setIsActionProcessing(false), 350);
    }
  };

  // 4. 포켓몬 잡기 (카드 구매)
  const handleCaptureCard = async (
    card: PokemonCard,
    from: 'open' | 'reserved',
    tier: CardTier,
    openIndex?: number
  ) => {
    if (isActionProcessing) return;
    if (isOnline && !isMyTurn) {
      showToast('내 차례가 아닙니다.');
      return;
    }
    setIsActionProcessing(true);
    try {
      const next = captureCard(gameState, currentPlayerIndex, card, from, tier, openIndex);
      await commitGameState(next);
    } catch (err: any) {
      showToast(err.message || '포켓몬을 잡을 수 없습니다.');
    } finally {
      setTimeout(() => setIsActionProcessing(false), 350);
    }
  };

  // 5. 🧬 진화하기
  const handleEvolveCard = async (
    card: PokemonCard,
    from: 'open' | 'reserved',
    tier: 2 | 3,
    openIndex?: number
  ) => {
    if (isActionProcessing) return;
    if (isOnline && !isMyTurn) {
      showToast('내 차례가 아닙니다.');
      return;
    }
    setIsActionProcessing(true);
    try {
      const next = evolvePokemon(gameState, currentPlayerIndex, card, from, tier, openIndex);
      await commitGameState(next);
    } catch (err: any) {
      showToast(err.message || '진화 조건을 만족하지 못했습니다.');
    } finally {
      setTimeout(() => setIsActionProcessing(false), 350);
    }
  };

  // 6. 10개 초과 토큰 반환
  const handleConfirmDiscard = async (discardBalls: Partial<Record<BallType, number>>) => {
    if (gameState.discardingPlayerIndex === null || isActionProcessing) return;
    if (isOnline) {
      const discardingPlayer = gameState.players[gameState.discardingPlayerIndex];
      if (discardingPlayer?.id !== myPlayerId) {
        showToast('토큰 반환 차례가 아닙니다.');
        return;
      }
    }
    setIsActionProcessing(true);
    try {
      const next = discardExcessBalls(
        gameState,
        gameState.discardingPlayerIndex,
        discardBalls
      );
      await commitGameState(next);
    } catch (err: any) {
      showToast(err.message || '토큰 반환 오류');
    } finally {
      setTimeout(() => setIsActionProcessing(false), 350);
    }
  };

  // 7. 차례 마치기
  const handleEndTurn = async () => {
    if (isActionProcessing) return;
    if (isOnline && !isMyTurn) {
      showToast('내 차례가 아닙니다.');
      return;
    }
    setIsActionProcessing(true);
    try {
      const next = passOrEndTurn(gameState);
      await commitGameState(next);
    } catch (err: any) {
      showToast(err.message || '차례를 마칠 수 없습니다.');
    } finally {
      setTimeout(() => setIsActionProcessing(false), 350);
    }
  };

  // 카드 렌더링 헬퍼
  const renderCardRow = (
    cards: (PokemonCard | null)[],
    tier: CardTier,
    title: string,
    deckCount: number,
    icon: string
  ) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-amber-300 drop-shadow shrink-0 whitespace-nowrap mb-0.5">
          <span className="text-sm sm:text-base">{icon}</span>
          <span className="whitespace-nowrap">{title}</span>
          <span className="text-slate-400 font-bold text-[11px] sm:text-xs whitespace-nowrap">(남은 덱: {deckCount}장)</span>
        </div>
        <div className="flex items-center justify-start gap-2 sm:gap-2.5 overflow-x-auto py-1">
          {cards.map((card, idx) => {
            if (!card) {
              return (
                <div
                  key={`empty-${tier}-${idx}`}
                  className="min-h-[190px] sm:min-h-[210px] 2xl:min-h-[225px] h-[190px] sm:h-[210px] 2xl:h-[225px] w-auto aspect-[5/7] shrink-0 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 flex items-center justify-center text-sm text-slate-500 font-black shadow-inner"
                >
                  카드 소진
                </div>
              );
            }
            return (
              <CardView
                key={card.id}
                card={card}
                tier={tier}
                openIndex={idx}
                from="open"
                currentPlayer={isMyTurn && !isActionProcessing ? currentPlayer : undefined}
                isMyTurn={isMyTurn && !isActionProcessing}
                hasEvolvedThisTurn={gameState.hasEvolvedThisTurn}
                onCapture={isMyTurn && !isActionProcessing ? handleCaptureCard : undefined}
                onReserve={isMyTurn && !isActionProcessing ? handleReserveCard : undefined}
                onEvolve={isMyTurn && !isActionProcessing ? handleEvolveCard : undefined}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col p-2 sm:p-3 select-none relative">
      {/* 0. 행동 처리 중 다중 클릭 / 연타 방지 전체 화면 오버레이 */}
      {isActionProcessing && (
        <div className="fixed inset-0 z-50 bg-black/15 cursor-wait pointer-events-auto select-none" />
      )}

      {/* 1. 내 차례 알림 1.5초 중앙 대형 팝업 */}
      {showTurnAlert && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="px-8 sm:px-12 py-6 sm:py-7 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-3xl border-4 border-white shadow-[0_0_60px_rgba(251,191,36,0.9),0_20px_40px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center text-center animate-turn-alert">
            <span className="text-4xl sm:text-5xl drop-shadow mb-1 animate-bounce">⚡ 🎮 ⚡</span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight whitespace-nowrap drop-shadow">
              {isOnline ? '당신의 차례입니다!' : `${currentPlayer.name}님의 차례입니다!`}
            </h2>
            <p className="text-xs sm:text-base font-black text-slate-900 mt-1.5 whitespace-nowrap">
              볼을 가져오거나 카드를 포획·보관하세요!
            </p>
          </div>
        </div>
      )}

      {/* 에러 토스트 */}
      {errorToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-600 text-white font-black text-xs rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* 10개 초과 토큰 반환 모달 */}
      {gameState.discardingPlayerIndex !== null && (
        <DiscardBallsModal
          gameState={gameState}
          playerIndex={gameState.discardingPlayerIndex}
          onConfirmDiscard={handleConfirmDiscard}
        />
      )}

      {/* 게임 종료 우승자 모달 */}
      {gameState.status === 'finished' && (
        <WinnerModal
          gameState={gameState}
          myPlayerId={myPlayerId}
          isOnline={isOnline}
          onRestart={onExit}
        />
      )}

      {/* 상단 네비게이션 헤더 (컴팩트 고정) */}
      <header className="flex flex-wrap items-center justify-between gap-2 mb-2 bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-2xl backdrop-blur-md shadow-md shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">⚡</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white whitespace-nowrap">{gameState.roomName}</h1>
              {isOnline ? (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 whitespace-nowrap">
                  온라인 방: {gameState.roomId}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 whitespace-nowrap">
                  로컬 {gameState.playerCount}인
                </span>
              )}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
              <span>현재 차례:</span>
              <span className="font-extrabold text-amber-400">{currentPlayer.name}</span>
              {gameState.status === 'last_round' && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse whitespace-nowrap">
                  🏁 마지막 라운드!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. 턴 시간 제한 타이머 배지 & 프로그레스 바 */}
        {gameState.turnTimeLimit > 0 && (
          <div className="flex flex-col items-center justify-center shrink-0 min-w-[100px] sm:min-w-[120px]">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-black transition-all ${
                timeLeft <= 10
                  ? 'bg-red-500/25 text-red-300 border-red-500 animate-pulse ring-2 ring-red-400'
                  : 'bg-amber-400/20 text-amber-300 border-amber-400/40'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${timeLeft <= 10 ? 'text-red-400 animate-spin' : 'text-amber-400'}`} />
              <span className="font-mono text-sm sm:text-base font-black whitespace-nowrap">
                {timeLeft}초
              </span>
            </div>
            {/* 게이지 바 */}
            <div className="w-full h-1.5 bg-slate-950 rounded-full mt-1 overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-300 ${
                  timeLeft <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-400 to-yellow-300'
                }`}
                style={{ width: `${Math.min(100, (timeLeft / gameState.turnTimeLimit) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenAdmin}
            className="px-2.5 py-1 rounded-xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-[0_2px_0_#78350f] active:translate-y-0.5 active:shadow-none transition cursor-pointer whitespace-nowrap"
            title="카드 사진 관리자 모드"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">그림 교체</span>
          </button>
          <button
            type="button"
            onClick={onOpenRules}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black flex items-center gap-1 border border-slate-700 shadow-[0_1px_0_#000] active:translate-y-0.5 transition cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">룰북</span>
          </button>
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black flex items-center gap-1 border border-slate-700 shadow-[0_1px_0_#000] active:translate-y-0.5 transition cursor-pointer whitespace-nowrap"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">기록</span>
          </button>
          <button
            type="button"
            onClick={onExit}
            className="p-1.5 rounded-xl hover:bg-red-500/20 text-slate-400 hover:text-red-400 shadow-[0_1px_0_#000] active:translate-y-0.5 transition cursor-pointer"
            title="나가기"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 온라인 모드 실시간 턴 안내 및 잠금 배너 */}
      {isOnline && (
        <div
          className={`mb-2 px-3.5 py-1.5 rounded-xl border flex items-center justify-between text-xs font-black transition-all shadow-md shrink-0 backdrop-blur-md ${
            isMyTurn
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-200 animate-pulse'
          }`}
        >
          <div className="flex items-center gap-2">
            {isMyTurn ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span>내 차례입니다! 볼을 가져오거나 카드를 포획·보관하세요.</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  상대방(<strong className="text-white underline">{currentPlayer.name}</strong>) 차례입니다. 현재 모든 조작이 잠겨 있습니다.
                </span>
              </>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 whitespace-nowrap ml-2">
            {isMyTurn ? '내 턴 진행 중 🟢' : '상대 차례 대기 중 🔒'}
          </span>
        </div>
      )}

      {/* ========================================================
          전체 화면 좌우 50:50 완벽 분할 (좌측 마켓 50% : 우측 대시보드 50%)
          ======================================================== */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-3 overflow-hidden">
        {/* ========================================================
            1. 좌측 구역 (50%): 볼 공급처 + 카드 마켓 (세로 배열)
            ======================================================== */}
        <div className="h-full min-h-0 flex flex-col gap-2.5 overflow-hidden">
          {/* 1-A. 좌측 상단: 볼 공급처 (왼쪽 정렬) */}
          <div className="shrink-0">
            <SupplyBoard
              gameState={gameState}
              isMyTurn={isMyTurn && !isActionProcessing}
              onTakeDifferentBalls={handleTakeDifferentBalls}
              onTakeTwoSameBalls={handleTakeTwoSameBalls}
              onEndTurn={handleEndTurn}
            />
          </div>

          {/* 1-B. 좌측 하단: 포켓몬 카드 마켓 (남은 높이 flex-1 min-h-0) */}
          <div
            className={`flex-1 min-h-0 flex flex-col bg-white/[0.06] border-2 border-white/15 rounded-3xl p-2.5 sm:p-3.5 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 relative ${
              !isMyTurn ? 'opacity-50 pointer-events-none filter grayscale-[25%]' : ''
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">🏪</span>
                <h2 className="text-xs sm:text-sm font-black text-amber-300 tracking-wide whitespace-nowrap">
                  포켓몬 카드 마켓 (상점 구역)
                </h2>
                {!isMyTurn && (
                  <span className="text-[10px] sm:text-xs font-black text-amber-300/90 bg-amber-400/15 border border-amber-400/30 px-2 py-0.2 rounded-full animate-pulse whitespace-nowrap">
                    ⏳ 상대방 차례...
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-bold hidden sm:inline whitespace-nowrap">
                ↕ 마켓 내부 스크롤 가능 | 카드를 터치하면 포획 / 보관
              </span>
            </div>

            {/* 왼쪽 마켓 영역 독립 스크롤 (overflow-y: auto) */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-3">
              {/* 🌟 희귀 카드 & ✨ 전설·환상 카드 행 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5 bg-black/30 p-2 sm:p-2.5 rounded-2xl border border-white/10 shadow-inner">
                <div>
                  {renderCardRow(
                    gameState.rareOpen,
                    'rare',
                    '🌟 희귀 카드 (마스터볼 필수)',
                    gameState.rareDeck.length,
                    '🌟'
                  )}
                </div>
                <div>
                  {renderCardRow(
                    gameState.legendaryOpen,
                    'legendary',
                    '✨ 전설·환상 카드 (마스터볼 필수)',
                    gameState.legendaryDeck.length,
                    '✨'
                  )}
                </div>
              </div>

              {/* ◼️ 3단계 카드 행 */}
              <div className="bg-black/25 p-2 sm:p-2.5 rounded-2xl border border-white/10 shadow-inner">
                {renderCardRow(
                  gameState.tier3Open,
                  3,
                  '◼️ 3단계 포켓몬',
                  gameState.tier3Deck.length,
                  '◼️'
                )}
              </div>

              {/* ◻️ 2단계 카드 행 */}
              <div className="bg-black/25 p-2 sm:p-2.5 rounded-2xl border border-white/10 shadow-inner">
                {renderCardRow(
                  gameState.tier2Open,
                  2,
                  '◻️ 2단계 포켓몬',
                  gameState.tier2Deck.length,
                  '◻️'
                )}
              </div>

              {/* ▫️ 1단계 카드 행 */}
              <div className="bg-black/25 p-2 sm:p-2.5 rounded-2xl border border-white/10 shadow-inner">
                {renderCardRow(
                  gameState.tier1Open,
                  1,
                  '▫️ 1단계 포켓몬',
                  gameState.tier1Deck.length,
                  '▫️'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. 우측 구역 (50%): 플레이어 대시보드 2x2 (화면 맨 꼭대기부터 바닥까지 꽉 채움!)
            ======================================================== */}
        <div className="h-full min-h-0 flex flex-col bg-white/[0.06] border-2 border-white/15 rounded-3xl p-2.5 sm:p-3.5 shadow-2xl backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10 px-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg">👥</span>
              <span className="text-sm sm:text-base font-black text-amber-300 whitespace-nowrap">
                플레이어 대시보드 (2x2 현황)
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-400 font-black bg-amber-400/15 border border-amber-400/30 px-2 py-0.2 rounded-full whitespace-nowrap">
              🏆 18점 선착승
            </span>
          </div>

          {/* 4인 플레이어 2x2 그리드 컨테이너 */}
          <div
            className="flex-1 min-h-0"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
              gap: '10px',
            }}
          >
            {gameState.players.map((p, idx) => {
              const isPanelMe = isOnline ? p.id === myPlayerId : idx === currentPlayerIndex;
              const canInteract = isMyTurn && isPanelMe && !isActionProcessing;

              return (
                <PlayerPanel
                  key={p.id}
                  player={p}
                  isCurrentTurn={idx === currentPlayerIndex}
                  isMe={p.id === myPlayerId}
                  gameState={gameState}
                  onCaptureReserved={
                    canInteract
                      ? (card) => handleCaptureCard(card, 'reserved', card.tier)
                      : undefined
                  }
                  onEvolveReserved={
                    canInteract
                      ? (card) =>
                          card.tier === 2 || card.tier === 3
                            ? handleEvolveCard(card, 'reserved', card.tier)
                            : undefined
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 게임 진행 로그 드로어 */}
      {showLogs && (
        <div className="fixed bottom-0 right-0 max-w-sm w-full bg-slate-900/95 border-t border-l border-slate-700 p-4 rounded-tl-2xl shadow-2xl z-40 max-h-80 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <span className="text-xs font-black text-slate-300">게임 진행 기록</span>
            <button
              type="button"
              onClick={() => setShowLogs(false)}
              className="text-xs text-slate-500 hover:text-white"
            >
              닫기
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 text-[11px]">
            {gameState.logs.map((log) => (
              <div
                key={log.id}
                className={`p-1.5 rounded-lg border leading-tight ${
                  log.type === 'evolution'
                    ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200'
                    : log.type === 'alert'
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
