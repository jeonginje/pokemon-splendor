import React, { useState } from 'react';
import type { PlayerState, GameState, PokemonCard } from '../types/game';
import { NORMAL_BALL_TYPES } from '../types/game';
import { TRAINER_TILES } from '../data/trainerTiles';
import { BallToken } from './BallToken';
import { CardView } from './CardView';
import { getPlayerBonuses, getPlayerTotalBalls } from '../utils/gameLogic';
import { Trophy, Dna, ChevronDown, ChevronUp } from 'lucide-react';

interface PlayerPanelProps {
  player: PlayerState;
  isCurrentTurn: boolean;
  isMe: boolean;
  gameState: GameState;
  onCaptureReserved?: (card: PokemonCard) => void;
  onEvolveReserved?: (card: PokemonCard) => void;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  player,
  isCurrentTurn,
  isMe,
  gameState,
  onCaptureReserved,
  onEvolveReserved,
}) => {
  if (!player) return null;

  // '손에 보관' 창은 게임 시작부터 항상 열려있도록 기본값 true
  const [showReservedDetail, setShowReservedDetail] = useState(true);
  const trainer = TRAINER_TILES.find((t) => t.id === player.trainerId) || TRAINER_TILES[0];
  const bonuses = getPlayerBonuses(player);
  const totalBalls = getPlayerTotalBalls(player);

  return (
    <div
      className={`h-full min-h-0 flex flex-col justify-between rounded-2xl p-2.5 sm:p-3 transition-all duration-300 relative border-2 backdrop-blur-md overflow-y-auto
        ${
          isCurrentTurn
            ? 'bg-slate-900/95 border-amber-300 animate-turn-gold ring-4 ring-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.9)] scale-[1.01] z-10'
            : 'bg-slate-900/80 border-slate-700/80 shadow-md'
        }
        ${isMe && !isCurrentTurn ? 'ring-2 ring-indigo-400/60' : ''}
      `}
    >
      {/* ========================================================
          층 1: [트레이너 정보 & 승점 영역]
          ======================================================== */}
      <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-white/10 shrink-0">
        {/* 트레이너 정보 */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${trainer.bgGradient} flex items-center justify-center text-lg sm:text-xl shadow-md border border-white/30 shrink-0`}
          >
            {trainer.avatarEmoji}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="font-black text-white text-xs sm:text-sm tracking-wide truncate max-w-[80px] sm:max-w-[105px]">
                {player.name}
              </span>
              {isMe && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-500 text-white shadow-sm shrink-0 whitespace-nowrap">
                  나
                </span>
              )}
              {isCurrentTurn && (
                <span className={`px-1.5 py-0.2 rounded-full font-black shadow-sm shrink-0 whitespace-nowrap ${
                  isMe
                    ? 'text-[9px] sm:text-[10px] bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-950 animate-bounce ring-1 ring-white/50'
                    : 'text-[9px] sm:text-[10px] bg-amber-400 text-slate-950 animate-pulse'
                }`}>
                  {isMe ? '⚡ 내 차례!' : '차례'}
                </span>
              )}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold whitespace-nowrap truncate">
              {trainer.name}
            </div>
          </div>
        </div>

        {/* 승점 & 목표 프로그레스 바 */}
        <div className="flex flex-col items-end shrink-0 whitespace-nowrap">
          <div className="flex items-center gap-1 bg-gradient-to-b from-amber-400/20 to-yellow-500/10 border border-amber-400/60 px-1.5 py-0.5 rounded-xl shadow-sm whitespace-nowrap">
            <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
            <span className="text-base sm:text-lg font-black text-amber-300 whitespace-nowrap">
              {player.score}
            </span>
            <span className="text-[9px] sm:text-[10px] text-amber-400/80 font-black whitespace-nowrap">
              / 18점
            </span>
          </div>
          <div className="w-18 sm:w-22 h-1.5 bg-slate-950 rounded-full mt-1 overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500"
              style={{ width: `${Math.min(100, (player.score / 18) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          층 2: [보유 볼 토큰 & 영구 보너스 할인 - 위아래 세로 배치 (가로 100% 온전히 사용)]
          ======================================================== */}
      <div className="flex flex-col gap-2 py-1.5 border-b border-white/10 shrink-0 w-full">
        {/* 2-A. 보유 볼 토큰 6종 (가로 100% 활용, flex-wrap: wrap, gap: 8px) */}
        <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 flex flex-col gap-1.5 w-full">
          <div className="flex items-center justify-between text-[11px] font-black whitespace-nowrap">
            <span className="text-slate-300">보유 볼 토큰</span>
            <span
              className={`font-black px-1.5 py-0.2 rounded text-[10px] whitespace-nowrap ${
                totalBalls > 10
                  ? 'bg-red-500 text-white animate-bounce shadow-md'
                  : 'bg-slate-950 border border-slate-700 text-slate-200'
              }`}
            >
              {totalBalls} / 10개
            </span>
          </div>

          {/* 6개 볼 토큰 가로 정렬 (줄바꿈 허용, gap: 8px) */}
          <div className="flex items-center flex-wrap gap-2 pt-0.5">
            {NORMAL_BALL_TYPES.map((b) => (
              <BallToken key={b} type={b} count={player.balls?.[b] || 0} size="sm" />
            ))}
            <div className="h-6 w-px bg-slate-700 mx-0.5 shrink-0" />
            <BallToken type="master" count={player.balls?.master || 0} size="sm" />
          </div>
        </div>

        {/* 2-B. 영구 보너스 할인 5종 + 진화 (가로 100% 활용, flex-wrap: wrap, gap: 8px) */}
        <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 flex flex-col gap-1.5 w-full">
          <div className="flex items-center justify-between text-[11px] font-black whitespace-nowrap">
            <span className="text-slate-300">보너스 (영구 할인)</span>
            {player.evolvedCards.length > 0 && (
              <div
                className="flex items-center gap-1 text-[10px] text-indigo-300 bg-indigo-950/90 px-1.5 py-0.2 rounded border border-indigo-500/50 shadow-sm whitespace-nowrap"
                title="진화하여 트레이너 타일 밑으로 들어간 포켓몬"
              >
                <Dna className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>진화 {player.evolvedCards.length}장</span>
              </div>
            )}
          </div>

          {/* 5가지 색상 영구 보너스 현황 (줄바꿈 허용, gap: 8px) */}
          <div className="flex items-center flex-wrap gap-2 pt-0.5">
            {NORMAL_BALL_TYPES.map((b) => (
              <div key={b} className="flex flex-col items-center">
                <BallToken type={b} bonusCount={bonuses[b]} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          층 3: [손에 보관한 포켓몬 & 획득 카드] (충분한 높이로 스크롤 없이 시원하게 표시)
          ======================================================== */}
      <div className="pt-1.5 flex flex-col gap-1.5 flex-1 min-h-0 justify-between">
        {/* 손에 보관한 포켓몬 카드 (기본 항상 열림 & 50% 폭 덕분에 3장 시원하게 표시) */}
        <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/90 flex flex-col shrink-0">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-300 whitespace-nowrap pb-1 border-b border-white/5">
            <span className="flex items-center gap-1">
              <span>📥 손에 보관한 카드</span>
              <span className={player.reservedCards.length > 0 ? 'text-amber-300 font-black' : 'text-slate-500'}>
                ({player.reservedCards.length}/3장)
              </span>
            </span>

            <button
              type="button"
              onClick={() => setShowReservedDetail(!showReservedDetail)}
              className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] hover:bg-amber-400/30 transition cursor-pointer"
            >
              <span>{showReservedDetail ? '접기' : '펼치기'}</span>
              {showReservedDetail ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
          </div>

          {/* 항상 열려있는 보관 카드 뷰 */}
          {showReservedDetail && (
            <div className="pt-1">
              {player.reservedCards.length === 0 ? (
                <div className="text-center py-2 text-[10px] text-slate-500 font-bold whitespace-nowrap">
                  보관 중인 카드가 없습니다 (최대 3장)
                </div>
              ) : (
                <div className="flex flex-row items-center gap-2 overflow-x-auto py-0.5 pr-1">
                  {player.reservedCards.map((card) => (
                    <div key={card.id} className="shrink-0">
                      <CardView
                        card={card}
                        tier={card.tier}
                        from="reserved"
                        compact
                        currentPlayer={isMe ? player : (isCurrentTurn ? player : undefined)}
                        isMyTurn={isCurrentTurn && isMe}
                        hasEvolvedThisTurn={gameState.hasEvolvedThisTurn}
                        onCapture={() => onCaptureReserved && onCaptureReserved(card)}
                        onEvolve={() => onEvolveReserved && onEvolveReserved(card)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 포획한 포켓몬 태그 칩 */}
        {player.capturedCards.length > 0 && (
          <div className="flex flex-wrap gap-1 max-h-11 overflow-y-auto pr-0.5 shrink-0">
            <span className="text-[9px] text-slate-400 font-bold self-center">
              🎴 총 {player.capturedCards.length}마리:
            </span>
            {player.capturedCards.map((card) => (
              <span
                key={card.id}
                className="text-[9px] font-black px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-0.5 shadow-sm whitespace-nowrap"
              >
                <span>{card.name}</span>
                {card.points > 0 && <span className="text-amber-400">★{card.points}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
