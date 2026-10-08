import React, { useState, useEffect } from 'react';
import type { PokemonCard, BallType, PlayerState, CardTier } from '../types/game';
import { BALL_INFO } from '../types/game';
import { BallToken } from './BallToken';
import { calculateCaptureCost, canEvolveToCard, canReserveCard, getPlayerBonuses } from '../utils/gameLogic';
import { getCardDisplayImage } from '../services/customImages';
import { Star, Bookmark, Check, ArrowUpRight, Palette } from 'lucide-react';

interface CardViewProps {
  card: PokemonCard;
  tier: CardTier;
  openIndex?: number;
  from: 'open' | 'reserved';
  currentPlayer?: PlayerState;
  isMyTurn?: boolean;
  hasEvolvedThisTurn?: boolean;
  onCapture?: (card: PokemonCard, from: 'open' | 'reserved', tier: CardTier, openIndex?: number) => void;
  onReserve?: (card: PokemonCard, tier: 1 | 2 | 3, openIndex?: number) => void;
  onEvolve?: (card: PokemonCard, from: 'open' | 'reserved', tier: 2 | 3, openIndex?: number) => void;
  onCardClick?: () => void;
  compact?: boolean;
}

// 하단 필요 비용(코스트) 볼 종류별 고유 테마 색상 (상단 공급처와 동일하게 색상 구분)
const COST_BALL_THEMES: Record<
  BallType,
  {
    badge: string;
    gem: string;
  }
> = {
  monster: {
    badge: 'bg-red-950/90 border-red-500/80 shadow-[0_1px_3px_rgba(239,68,68,0.35)]',
    gem: 'bg-gradient-to-b from-red-400 via-red-500 to-red-700 border-red-300',
  },
  super: {
    badge: 'bg-blue-950/90 border-blue-500/80 shadow-[0_1px_3px_rgba(59,130,246,0.35)]',
    gem: 'bg-gradient-to-b from-sky-400 via-blue-500 to-blue-700 border-sky-300',
  },
  hyper: {
    badge: 'bg-amber-950/90 border-amber-400/80 shadow-[0_1px_3px_rgba(251,191,36,0.35)]',
    gem: 'bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 border-yellow-200',
  },
  heal: {
    badge: 'bg-pink-950/90 border-pink-500/80 shadow-[0_1px_3px_rgba(236,72,153,0.35)]',
    gem: 'bg-gradient-to-b from-pink-300 via-pink-500 to-rose-600 border-pink-200',
  },
  quick: {
    badge: 'bg-cyan-950/90 border-cyan-400/80 shadow-[0_1px_3px_rgba(6,182,212,0.35)]',
    gem: 'bg-gradient-to-b from-cyan-300 via-teal-400 to-cyan-700 border-cyan-200',
  },
  master: {
    badge: 'bg-purple-950/90 border-purple-500/80 shadow-[0_1px_3px_rgba(168,85,247,0.35)]',
    gem: 'bg-gradient-to-b from-fuchsia-400 via-purple-600 to-purple-900 border-fuchsia-200',
  },
};

const CardViewComponent: React.FC<CardViewProps> = ({
  card,
  tier,
  openIndex,
  from,
  currentPlayer,
  isMyTurn = false,
  hasEvolvedThisTurn = false,
  onCapture,
  onReserve,
  onEvolve,
  onCardClick,
  compact = false,
}) => {
  const [imageInfo, setImageInfo] = useState(() => getCardDisplayImage(card));
  const [imageError, setImageError] = useState(false);

  // 커스텀 이미지 변경 이벤트 수신
  useEffect(() => {
    const handleUpdate = () => {
      setImageInfo(getCardDisplayImage(card));
      setImageError(false);
    };
    window.addEventListener('pokemon-custom-images-updated', handleUpdate);
    return () => window.removeEventListener('pokemon-custom-images-updated', handleUpdate);
  }, [card]);

  // 구매 가능 여부 계산
  const captureCheck = currentPlayer ? calculateCaptureCost(currentPlayer, card) : { canCapture: false };
  // 진화 가능 여부 계산
  const evolveCheck = currentPlayer && (card.tier === 2 || card.tier === 3)
    ? canEvolveToCard(currentPlayer, card, hasEvolvedThisTurn)
    : { canEvolve: false };
  // 보관 가능 여부 계산
  const reserveCheck = currentPlayer && typeof card.tier === 'number'
    ? canReserveCard(currentPlayer, card)
    : { valid: false };

  const bonuses = currentPlayer ? getPlayerBonuses(currentPlayer) : ({} as Record<BallType, number>);

  // 카드 테두리 및 3D 배경 그라디언트
  const getThemeStyle = () => {
    switch (card.bonus) {
      case 'monster':
        return {
          frame: 'border-red-500 bg-gradient-to-b from-red-950/90 via-slate-900 to-red-950',
          shadow: 'shadow-[0_10px_0_#450a0a]',
          innerGlow: 'from-red-500/35 to-transparent',
        };
      case 'super':
        return {
          frame: 'border-blue-500 bg-gradient-to-b from-blue-950/90 via-slate-900 to-blue-950',
          shadow: 'shadow-[0_10px_0_#172554]',
          innerGlow: 'from-blue-500/35 to-transparent',
        };
      case 'hyper':
        return {
          frame: 'border-amber-400 bg-gradient-to-b from-amber-950/90 via-slate-900 to-yellow-950',
          shadow: 'shadow-[0_10px_0_#451a03]',
          innerGlow: 'from-amber-500/35 to-transparent',
        };
      case 'heal':
        return {
          frame: 'border-pink-400 bg-gradient-to-b from-pink-950/90 via-slate-900 to-pink-950',
          shadow: 'shadow-[0_10px_0_#500724]',
          innerGlow: 'from-pink-500/35 to-transparent',
        };
      case 'quick':
        return {
          frame: 'border-cyan-400 bg-gradient-to-b from-cyan-950/90 via-slate-900 to-teal-950',
          shadow: 'shadow-[0_10px_0_#042f2e]',
          innerGlow: 'from-cyan-500/35 to-transparent',
        };
      case 'master':
        return {
          frame: 'border-purple-400 bg-gradient-to-b from-purple-950/95 via-slate-900 to-fuchsia-950',
          shadow: 'shadow-[0_10px_0_#3b0764]',
          innerGlow: 'from-purple-500/40 to-transparent',
        };
    }
  };

  const style = getThemeStyle();
  const isSpecial = card.tier === 'rare' || card.tier === 'legendary';
  const isAffordable = Boolean(captureCheck.canCapture);

  return (
    <div
      onClick={onCardClick}
      className={`card-spring relative rounded-2xl sm:rounded-3xl border-2 sm:border-3 flex flex-col justify-between overflow-hidden cursor-pointer select-none transition-all
        ${style.frame} ${style.shadow}
        ${isSpecial ? 'ring-4 ring-amber-300 shadow-amber-400/60' : ''}
        ${
          compact
            ? 'min-h-[130px] h-[135px] w-auto aspect-[5/7] shrink-0 p-1 rounded-xl' // 손에 보관한 미니 카드
            : 'min-h-[190px] sm:min-h-[210px] 2xl:min-h-[225px] h-[190px] sm:h-[210px] 2xl:h-[225px] w-auto aspect-[5/7] shrink-0 p-1.5 sm:p-2' // 마켓 50% 폭 최적화
        }
        ${isAffordable ? 'is-affordable' : ''}
        ${isMyTurn && captureCheck.canCapture ? 'ring-4 ring-emerald-400' : ''}
        ${isMyTurn && evolveCheck.canEvolve ? 'ring-4 ring-indigo-400 animate-pulse' : ''}
      `}
    >
      {/* 획득 가능한 보관 카드 안내 뱃지 */}
      {isAffordable && from === 'reserved' && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.6)] border border-white z-30 whitespace-nowrap animate-bounce-gentle">
          ✨ 포획 가능!
        </div>
      )}

      {/* 상단 빛 반사 하이라이트 */}
      <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-xl" />

      {/* 1. 상단 헤더: 승점 뱃지 & 보너스 볼 토큰 (여백 최소화) */}
      <div className={`flex items-center justify-between relative z-10 px-0.5 shrink-0 ${compact ? 'h-5' : 'h-7 sm:h-8'}`}>
        {/* 승점 3D 뱃지 */}
        <div>
          {card.points > 0 ? (
            <div className={`flex items-center gap-0.5 bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 text-slate-950 rounded-md font-black shadow-[0_1px_0_#78350f] border border-white whitespace-nowrap ${compact ? 'px-1 py-0.2 text-[10px]' : 'px-1.5 py-0.5 text-xs sm:text-sm'}`}>
              <Star className={`${compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} fill-slate-950 text-slate-950 shrink-0`} />
              <span className="leading-none">{card.points}</span>
            </div>
          ) : (
            <span className={`text-slate-400 font-black bg-slate-950/80 rounded-md border border-slate-700 whitespace-nowrap ${compact ? 'px-1 py-0.2 text-[9px]' : 'px-1.5 py-0.5 text-[10px] sm:text-xs'}`}>
              {card.pokedexNo ? `#${card.pokedexNo}` : ''}
            </span>
          )}
        </div>

        {/* 제공 보너스 보석 볼 */}
        <div className="flex items-center shrink-0">
          <BallToken
            type={card.bonus}
            size="sm"
            bonusCount={card.bonusCount}
            className={compact ? 'scale-75 origin-top-right -mr-1 -mt-1' : ''}
          />
        </div>
      </div>

      {/* 2. 중앙 메인: 포켓몬 그림 영역 */}
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center p-0.5 my-0.5 overflow-hidden">
        {/* 포켓몬 배경 원형 글로우 */}
        <div className={`absolute rounded-full bg-gradient-to-b ${style.innerGlow} blur-md pointer-events-none ${compact ? 'w-16 h-16' : 'w-28 h-28 sm:w-36 sm:h-36'}`} />

        {/* 일러스트 이미지 */}
        {imageInfo.url && !imageError ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={imageInfo.url}
              alt={card.name}
              decoding="async"
              loading="eager"
              onError={() => setImageError(true)}
              className="w-full h-full max-w-full max-h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] select-none transition-transform hover:scale-105 duration-200"
            />
            {/* 학생 그림 뱃지 */}
            {imageInfo.isCustom && !compact && (
              <div className="absolute bottom-0 right-0 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow border border-white flex items-center gap-0.5 z-20 whitespace-nowrap">
                <Palette className="w-2.5 h-2.5" />
                <span>{imageInfo.artist || '학생 그림'}</span>
              </div>
            )}
          </div>
        ) : (
          /* Fallback UI */
          <div className={`rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center shadow-inner relative ${compact ? 'w-10 h-10' : 'w-16 h-16 sm:w-20 sm:h-20'}`}>
            <span className={`${compact ? 'text-lg' : 'text-3xl'} drop-shadow`}>
              {isSpecial ? '🌟' : card.tier === 1 ? '▫️' : card.tier === 2 ? '◻️' : '◼️'}
            </span>
          </div>
        )}
      </div>

      {/* 3. 포켓몬 이름 & 진화 배지 */}
      <div className="shrink-0 flex-shrink-0 w-full flex flex-col items-center justify-center text-center my-0.5 z-10 px-0.5">
        <div className="w-full flex items-center justify-center gap-1 drop-shadow select-none">
          <span className={`font-black leading-tight text-white tracking-wide whitespace-nowrap truncate max-w-[95%] ${compact ? 'text-[11px]' : 'text-[13px] sm:text-[15px]'}`}>
            {card.name}
          </span>
          {card.tier === 'rare' && <span className="text-amber-300 text-xs shrink-0 leading-none">🌟</span>}
          {card.tier === 'legendary' && <span className="text-yellow-300 text-xs shrink-0 leading-none">✨</span>}
        </div>

        {/* 진화 전 포켓몬 안내 뱃지 */}
        {card.evolvesFrom && !compact && (
          <div className="text-[9px] sm:text-[10px] text-indigo-300 font-bold bg-indigo-950/90 border border-indigo-500/60 px-1.5 py-0.2 rounded-md shadow whitespace-nowrap mt-0.5">
            🧬 {card.evolvesFrom}에서 진화
          </div>
        )}
      </div>

      {/* 4. 하단: 자원 비용 토큰 & 액션 버튼 */}
      <div className="relative z-10 pt-0.5 border-t border-slate-800/90 shrink-0 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-center gap-1 mb-0.5">
          {Object.entries(card.cost).map(([ballType, count]) => {
            const b = ballType as BallType;
            if (!count || count <= 0) return null;
            const currentBonus = bonuses[b] || 0;
            const discountedCost = Math.max(0, count - currentBonus);
            const theme = COST_BALL_THEMES[b] || {
              badge: 'bg-slate-950/90 border-slate-700/80',
              gem: 'bg-slate-700 border-slate-500',
            };

            return (
              <div
                key={b}
                className={`flex items-center gap-1 rounded-md border ${theme.badge} shadow-sm transition-transform hover:scale-105 ${
                  compact ? 'px-1 py-0.2' : 'px-1.5 py-0.5'
                }`}
                title={`${BALL_INFO[b].name}: 필요 ${count}개 (할인 후 ${discountedCost}개)`}
              >
                {/* 볼 공급처 및 보너스 볼과 동일한 고유 색상을 입힌 미니 보석 원형 프레임 */}
                <div
                  className={`rounded-full ${theme.gem} border flex items-center justify-center shrink-0 overflow-hidden shadow-inner ${
                    compact ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5 sm:w-5 sm:h-5'
                  }`}
                >
                  {BALL_INFO[b].imageUrl ? (
                    <img
                      src={BALL_INFO[b].imageUrl}
                      alt={BALL_INFO[b].name}
                      decoding="async"
                      loading="lazy"
                      className="w-full h-full object-contain filter drop-shadow select-none scale-125"
                    />
                  ) : (
                    <span className={`${compact ? 'text-[9px]' : 'text-[11px]'} leading-none`}>
                      {BALL_INFO[b].emoji}
                    </span>
                  )}
                </div>

                <span
                  className={`font-black leading-none whitespace-nowrap ${
                    compact ? 'text-[11px]' : 'text-[13px] sm:text-[15px]'
                  } ${
                    discountedCost === 0 ? 'text-emerald-400 line-through' : 'text-white'
                  }`}
                  style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.9)' }}
                >
                  {discountedCost === 0 ? count : discountedCost}
                </span>
              </div>
            );
          })}
        </div>

        {/* 인터랙션 버튼 (내 차례일 때 활성화) */}
        {isMyTurn && (
          <div className="flex flex-col gap-0.5 mt-0.5">
            {/* 1. 포획(구매) 버튼 */}
            {captureCheck.canCapture && onCapture && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCapture(card, from, tier, openIndex);
                }}
                className={`w-full rounded bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 border border-emerald-300 text-white font-black flex items-center justify-center gap-0.5 shadow-[0_2px_0_#065f46] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer whitespace-nowrap ${compact ? 'py-0.5 px-1 text-[10px]' : 'py-1 px-1.5 text-xs sm:text-sm'}`}
              >
                <Check className={`${compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} stroke-[3]`} />
                <span>포획하기!</span>
              </button>
            )}

            {/* 2. 진화 버튼 (보너스로 무료 진화) */}
            {evolveCheck.canEvolve && onEvolve && (card.tier === 2 || card.tier === 3) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEvolve(card, from, card.tier as 2 | 3, openIndex);
                }}
                className={`w-full rounded bg-gradient-to-b from-indigo-500 via-purple-600 to-indigo-700 hover:from-indigo-400 hover:to-purple-500 border border-indigo-300 text-white font-black flex items-center justify-center gap-0.5 shadow-[0_2px_0_#3b0764] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer whitespace-nowrap animate-bounce-gentle ${compact ? 'py-0.5 px-1 text-[10px]' : 'py-1 px-1.5 text-xs sm:text-sm'}`}
              >
                <ArrowUpRight className={`${compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} stroke-[3]`} />
                <span>🧬 무료 진화!</span>
              </button>
            )}

            {/* 3. 보관(예약) 버튼 */}
            {from === 'open' && reserveCheck.valid && onReserve && typeof card.tier === 'number' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReserve(card, card.tier as 1 | 2 | 3, openIndex);
                }}
                className="w-full py-0.5 px-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-purple-300 font-black text-[10px] sm:text-[11px] flex items-center justify-center gap-0.5 shadow-[0_1px_0_#000] active:translate-y-0.5 transition cursor-pointer whitespace-nowrap"
              >
                <Bookmark className="w-3 h-3 text-purple-400" />
                <span>보관 (+마스터볼)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const CardView = React.memo(CardViewComponent);
