import React from 'react';
import type { BallType } from '../types/game';
import { BALL_INFO } from '../types/game';

interface BallTokenProps {
  type: BallType;
  count?: number;
  bonusCount?: number; // 영구 보너스 표시용
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  showName?: boolean;
  className?: string;
}

export const BallToken: React.FC<BallTokenProps> = ({
  type,
  count,
  bonusCount,
  size = 'md',
  onClick,
  selected = false,
  disabled = false,
  showName = false,
  className = '',
}) => {
  const info = BALL_INFO[type];

  // 크기별 설정 (최소 35px 이상 보장, 사이즈, 이모지 크기, 그림자 깊이, 또렷한 원형 뱃지 크기)
  const sizeConfig = {
    xs: {
      btn: 'w-[36px] h-[36px] min-w-[36px] min-h-[36px] shrink-0',
      emoji: 'text-lg',
      badge: 'w-5 h-5 text-[11px] font-black',
      bonusBadge: 'w-5 h-5 text-[11px] font-black',
      shadow: selected ? 'shadow-[0_4px_0_#000]' : 'shadow-[0_2px_0_#000]',
    },
    sm: {
      btn: 'w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] min-w-[38px] min-h-[38px] shrink-0',
      emoji: 'text-xl sm:text-2xl',
      badge: 'w-5 h-5 sm:w-6 sm:h-6 text-[11px] sm:text-xs font-black',
      bonusBadge: 'w-5 h-5 sm:w-6 sm:h-6 text-[11px] sm:text-xs font-black',
      shadow: selected ? 'shadow-[0_5px_0_#000]' : 'shadow-[0_3px_0_#000]',
    },
    md: {
      btn: 'w-14 h-14 min-w-[56px] min-h-[56px] shrink-0',
      emoji: 'text-3xl',
      badge: 'w-7 h-7 text-sm font-black',
      bonusBadge: 'w-7 h-7 text-sm font-black',
      shadow: selected ? 'shadow-[0_6px_0_#000]' : 'shadow-[0_4px_0_#000]',
    },
    lg: {
      btn: 'w-18 h-18 min-w-[72px] min-h-[72px] shrink-0',
      emoji: 'text-4xl',
      badge: 'w-8 h-8 text-base font-black',
      bonusBadge: 'w-8 h-8 text-base font-black',
      shadow: selected ? 'shadow-[0_8px_0_#000]' : 'shadow-[0_5px_0_#000]',
    },
    xl: {
      btn: 'w-22 h-22 min-w-[88px] min-h-[88px] shrink-0',
      emoji: 'text-5xl',
      badge: 'w-9 h-9 text-lg font-black',
      bonusBadge: 'w-9 h-9 text-lg font-black',
      shadow: selected ? 'shadow-[0_10px_0_#000]' : 'shadow-[0_6px_0_#000]',
    },
  }[size];

  // 보석 테마별 3D 그라디언트 및 광채 스타일
  const getGemStyle = () => {
    switch (type) {
      case 'monster':
        return {
          bg: 'bg-gradient-to-b from-red-400 via-red-500 to-red-700',
          border: 'border-red-300',
          shadowColor: '#7f1d1d',
        };
      case 'super':
        return {
          bg: 'bg-gradient-to-b from-sky-400 via-blue-500 to-blue-700',
          border: 'border-sky-300',
          shadowColor: '#1e3a8a',
        };
      case 'hyper':
        return {
          bg: 'bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700',
          border: 'border-yellow-200',
          shadowColor: '#78350f',
        };
      case 'heal':
        return {
          bg: 'bg-gradient-to-b from-pink-300 via-pink-500 to-rose-600',
          border: 'border-pink-200',
          shadowColor: '#831843',
        };
      case 'quick':
        return {
          bg: 'bg-gradient-to-b from-cyan-300 via-teal-400 to-cyan-700',
          border: 'border-cyan-200',
          shadowColor: '#134e4a',
        };
      case 'master':
        return {
          bg: 'bg-gradient-to-b from-fuchsia-400 via-purple-600 to-purple-900',
          border: 'border-fuchsia-200',
          shadowColor: '#4a044e',
        };
    }
  };

  const gem = getGemStyle();

  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={`inline-flex flex-col items-center gap-1.5 flex-shrink-0 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        style={{
          boxShadow: selected
            ? `0 5px 0 ${gem.shadowColor}, 0 0 0 2px #fde047, 0 0 20px rgba(251, 191, 36, 0.95)`
            : `0 5px 0 ${gem.shadowColor}, 0 8px 14px rgba(0, 0, 0, 0.5)`,
        }}
        className={`relative ${sizeConfig.btn} rounded-2xl transition-all duration-150 select-none flex items-center justify-center p-0 border-3 ${gem.border} ${gem.bg}
          ${
            selected
              ? 'selected outline outline-2 outline-amber-300'
              : 'hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0.5'
          }
          ${disabled ? 'opacity-40 cursor-not-allowed filter grayscale' : 'cursor-pointer'}
        `}
        title={`${info.name}${count !== undefined ? `: ${count}개` : ''}`}
      >
        {/* 상단 타원형 유리알 광택 하이라이트 (Glossy reflection) */}
        <div className="absolute top-1 left-1.5 right-1.5 h-1/3 rounded-t-xl bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />

        {/* 입체 보석 테두리 내부 은은한 반사 */}
        <div className="absolute inset-0.5 rounded-xl border border-white/40 pointer-events-none shadow-inner" />

        {/* 중앙 실제 볼 사진 (또는 fallback 이모지) */}
        <div className="flex items-center justify-center w-full h-full p-1 leading-none z-10">
          {!imgError && info.imageUrl ? (
            <img
              src={info.imageUrl}
              alt={info.name}
              onError={() => setImgError(true)}
              className="w-4/5 h-4/5 object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] select-none pointer-events-none transition-transform hover:scale-110"
            />
          ) : (
            <span className={`${sizeConfig.emoji} drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] select-none`}>
              {info.emoji}
            </span>
          )}
        </div>

        {/* 볼 수량 뱃지 (가운데 정렬 정밀 교정: aspect-square, flex items-center justify-center) */}
        {count !== undefined && (
          <div
            className={`absolute ${size === 'xs' ? '-top-1.5 -right-1.5' : '-top-2 -right-2'} ${sizeConfig.badge} aspect-square rounded-full bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 border-2 border-slate-950 flex items-center justify-center text-center leading-none shadow-[0_2px_0_#78350f] z-20 overflow-hidden`}
          >
            <span
              className="translate-y-[0.5px] font-bold text-white"
              style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' }}
            >
              {count}
            </span>
          </div>
        )}

        {/* 영구 보너스 뱃지 (에메랄드 3D 뱃지) */}
        {bonusCount !== undefined && bonusCount > 0 && (
          <div
            className={`absolute ${size === 'xs' ? '-bottom-1.5 -right-1.5' : '-bottom-2 -right-2'} ${sizeConfig.bonusBadge} aspect-square rounded-xl bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 border-2 border-slate-950 flex items-center justify-center text-center leading-none shadow-[0_2px_0_#064e3b] z-20 overflow-hidden`}
          >
            <span
              className="translate-y-[0.5px] font-bold text-white"
              style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' }}
            >
              +{bonusCount}
            </span>
          </div>
        )}
      </button>

      {showName && (
        <span className={`text-xs sm:text-sm font-extrabold drop-shadow tracking-tight ${info.textColor} whitespace-nowrap`}>
          {info.name}
        </span>
      )}
    </div>
  );
};
