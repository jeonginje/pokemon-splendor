import React, { useState } from 'react';
import type { BallType, GameState } from '../types/game';
import { NORMAL_BALL_TYPES, BALL_INFO } from '../types/game';
import { BallToken } from './BallToken';
import { getPlayerTotalBalls } from '../utils/gameLogic';
import { AlertTriangle, Check } from 'lucide-react';

interface DiscardBallsModalProps {
  gameState: GameState;
  playerIndex: number;
  onConfirmDiscard: (discardBalls: Partial<Record<BallType, number>>) => void;
}

export const DiscardBallsModal: React.FC<DiscardBallsModalProps> = ({
  gameState,
  playerIndex,
  onConfirmDiscard,
}) => {
  const player = gameState.players[playerIndex];
  const totalBalls = getPlayerTotalBalls(player);
  const excessCount = Math.max(0, totalBalls - 10);

  const [discard, setDiscard] = useState<Record<BallType, number>>({
    monster: 0,
    super: 0,
    hyper: 0,
    heal: 0,
    quick: 0,
    master: 0,
  });

  const selectedDiscardCount = Object.values(discard).reduce((sum, n) => sum + n, 0);

  const handleIncrement = (ball: BallType) => {
    if (selectedDiscardCount >= excessCount) return;
    if (discard[ball] < player.balls[ball]) {
      setDiscard({ ...discard, [ball]: discard[ball] + 1 });
    }
  };

  const handleDecrement = (ball: BallType) => {
    if (discard[ball] > 0) {
      setDiscard({ ...discard, [ball]: discard[ball] - 1 });
    }
  };

  const allBallTypes: BallType[] = [...NORMAL_BALL_TYPES, 'master'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-red-500/80 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 text-red-400 mb-3">
          <AlertTriangle className="w-7 h-7 animate-pulse" />
          <h2 className="text-xl font-extrabold text-white">볼 토큰 한도 초과!</h2>
        </div>

        <p className="text-sm text-slate-300 mb-4">
          볼 토큰은 최대 10개까지만 소지할 수 있습니다.
          <br />
          <span className="font-bold text-amber-400">{player.name}</span>님은 현재 총{' '}
          <span className="font-black text-white">{totalBalls}개</span>를 가지고 있으므로,{' '}
          <span className="font-black text-red-400">{excessCount}개</span>의 볼을 공급처로 반환해야
          합니다.
        </p>

        {/* 선택 진행률 */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">반환할 볼 선택:</span>
          <span
            className={`font-black text-sm px-2 py-0.5 rounded ${
              selectedDiscardCount === excessCount
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500/20 text-red-300'
            }`}
          >
            {selectedDiscardCount} / {excessCount}개 선택됨
          </span>
        </div>

        {/* 볼 종류별 증감 버튼 */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {allBallTypes.map((b) => {
            const owned = player.balls[b];
            if (owned <= 0) return null;
            const discarded = discard[b];

            return (
              <div
                key={b}
                className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <BallToken type={b} size="sm" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200">{BALL_INFO[b].name}</span>
                    <span className="text-[10px] text-slate-400">보유: {owned}개</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDecrement(b)}
                    disabled={discarded === 0}
                    className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-black text-sm text-amber-300">
                    {discarded}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleIncrement(b)}
                    disabled={discarded >= owned || selectedDiscardCount >= excessCount}
                    className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 반환 확정 버튼 */}
        <button
          type="button"
          disabled={selectedDiscardCount !== excessCount}
          onClick={() => onConfirmDiscard(discard)}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>반환 완료하고 차례 진행하기</span>
        </button>
      </div>
    </div>
  );
};
