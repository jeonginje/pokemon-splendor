import React, { useState } from 'react';
import type { BallType, GameState } from '../types/game';
import { NORMAL_BALL_TYPES, BALL_INFO } from '../types/game';
import { BallToken } from './BallToken';
import { canTakeDifferentBalls, canTakeTwoSameBalls } from '../utils/gameLogic';
import { Check, X, ArrowRight } from 'lucide-react';

interface SupplyBoardProps {
  gameState: GameState;
  isMyTurn: boolean;
  onTakeDifferentBalls: (balls: BallType[]) => void;
  onTakeTwoSameBalls: (ball: BallType) => void;
  onEndTurn: () => void;
  onNotMyTurn?: () => void;
}

const SupplyBoardComponent: React.FC<SupplyBoardProps> = ({
  gameState,
  isMyTurn,
  onTakeDifferentBalls,
  onTakeTwoSameBalls,
  onEndTurn,
  onNotMyTurn,
}) => {
  const [selectedBalls, setSelectedBalls] = useState<BallType[]>([]);
  const [selectedTwoBall, setSelectedTwoBall] = useState<BallType | null>(null);

  // 공급처에 남은 일반 볼 종류
  const availableTypes = NORMAL_BALL_TYPES.filter((t) => gameState.supplyBalls[t] > 0);
  const targetDifferentCount = Math.min(3, availableTypes.length);

  const toggleSelectBall = (ball: BallType) => {
    if (ball === 'master') return;
    if (!isMyTurn) {
      if (onNotMyTurn) onNotMyTurn();
      return;
    }

    // 2개 선택 모드였다면 2개 선택을 해제하고 해당 볼 1개 선택으로 시작
    if (selectedTwoBall) {
      setSelectedTwoBall(null);
      setSelectedBalls([ball]);
      return;
    }

    if (selectedBalls.includes(ball)) {
      setSelectedBalls(selectedBalls.filter((b) => b !== ball));
    } else {
      if (selectedBalls.length < targetDifferentCount) {
        setSelectedBalls([...selectedBalls, ball]);
      }
    }
  };

  const handleSelectTwo = (ball: BallType) => {
    if (!isMyTurn) {
      if (onNotMyTurn) onNotMyTurn();
      return;
    }
    // 기존 서로 다른 볼 선택 초기화하고 2개 선택 모드로 활성화 -> 우측 버튼에 불 들어옴
    setSelectedBalls([]);
    setSelectedTwoBall(ball);
  };

  const handleConfirmDifferent = () => {
    if (!isMyTurn) {
      if (onNotMyTurn) onNotMyTurn();
      return;
    }
    onTakeDifferentBalls(selectedBalls);
    setSelectedBalls([]);
    setSelectedTwoBall(null);
  };

  const handleConfirmTwo = () => {
    if (!isMyTurn) {
      if (onNotMyTurn) onNotMyTurn();
      return;
    }
    if (selectedTwoBall) {
      onTakeTwoSameBalls(selectedTwoBall);
      setSelectedBalls([]);
      setSelectedTwoBall(null);
    }
  };

  const handleClearSelection = () => {
    setSelectedBalls([]);
    setSelectedTwoBall(null);
  };

  const checkDiff = canTakeDifferentBalls(gameState.supplyBalls, selectedBalls);

  return (
    <div
      className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-2 shadow-xl backdrop-blur-md transition-all duration-300 flex items-center justify-between gap-3 overflow-x-auto"
    >
      {/* 1. 타이틀 & 가이드 (너비 고정 min-w-[150px]) */}
      <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-white/10 min-w-[150px]">
        <span className="text-xl sm:text-2xl drop-shadow">⚪</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-black text-amber-300 whitespace-nowrap">
              볼 공급처
            </span>
            {isMyTurn ? (
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full whitespace-nowrap animate-pulse">
                내 차례
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-1.5 py-0.2 rounded-full whitespace-nowrap">
                상대 차례
              </span>
            )}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap">
            {selectedTwoBall ? (
              <span className="text-amber-300 font-bold">
                선택: {BALL_INFO[selectedTwoBall].name} 2개
              </span>
            ) : selectedBalls.length > 0 ? (
              <span className="text-amber-300 font-bold">
                선택: {selectedBalls.length}/{targetDifferentCount}개
              </span>
            ) : (
              <span>서로 다른 볼 3개 또는 같은 볼 2개</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. 볼 6종 그리드 컨테이너 (고정된 6열 Grid - display: grid) */}
      <div
        className="shrink-0"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 68px)',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        {NORMAL_BALL_TYPES.map((b) => {
          const count = gameState.supplyBalls[b];
          const isSelected = selectedBalls.includes(b) || selectedTwoBall === b;
          const isTwoSelected = selectedTwoBall === b;
          const canTwo = isMyTurn && canTakeTwoSameBalls(gameState.supplyBalls, b).valid;
          // 하나씩 가져올 때도 4개 이상 남아있으면 '2개' 버튼 항상 노출!
          const showTwoButton = canTwo;

          return (
            <div
              key={b}
              className={`w-[68px] h-[92px] flex flex-col items-center justify-between p-1.5 rounded-xl border border-slate-800 transition-colors shrink-0 ${
                isSelected ? 'selected bg-amber-400/20' : 'bg-slate-950/60 hover:border-slate-700'
              }`}
              style={{
                boxShadow: isSelected ? '0 0 0 2px #fbbf24, 0 0 14px rgba(251, 191, 36, 0.55)' : undefined,
                borderColor: isSelected ? '#fbbf24' : undefined,
              }}
            >
              <BallToken
                type={b}
                count={count}
                size="sm"
                selected={isSelected}
                disabled={count === 0}
                onClick={() => toggleSelectBall(b)}
                showName
              />

              {/* 하단 고정 높이(h-6) 영역: 2개 버튼 */}
              <div className="h-6 flex items-center justify-center w-full mt-1">
                {showTwoButton ? (
                  <button
                    type="button"
                    onClick={() => handleSelectTwo(b)}
                    className={`w-full px-1.5 py-0.5 rounded font-black text-[10px] transition-all cursor-pointer whitespace-nowrap text-center ${
                      isTwoSelected
                        ? 'bg-amber-300 text-slate-950 ring-2 ring-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] scale-102'
                        : 'bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-[0_2px_0_#78350f] active:translate-y-0.5 active:shadow-none'
                    }`}
                    title={`${BALL_INFO[b].name} 2개 선택하기`}
                  >
                    2개
                  </button>
                ) : (
                  <div className="invisible h-4 text-[9px] pointer-events-none select-none">
                    -
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 6번째: 마스터볼 (고정 크기 셀) */}
        <div className="w-[68px] h-[92px] flex flex-col items-center justify-between p-1.5 rounded-xl bg-purple-950/30 border border-purple-900/50 shrink-0">
          <BallToken
            type="master"
            count={gameState.supplyBalls.master}
            size="sm"
            disabled
            showName
          />
          <div className="h-6 flex items-center justify-center w-full mt-1">
            <span className="text-[9px] text-purple-300 font-bold bg-purple-950/80 border border-purple-500/30 px-1 py-0.2 rounded whitespace-nowrap">
              보관 획득
            </span>
          </div>
        </div>
      </div>

      {/* 3. 조작 버튼 영역 (너비 고정 min-w-[160px] 및 우측 정렬) */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 pl-2 border-l border-white/10 min-w-[160px]">
        {/* A. 2개 선택 시: '볼 2개 가져오기' 버튼에 불 들어옴 */}
        {selectedTwoBall ? (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-pulse-gentle">
            <button
              type="button"
              onClick={handleConfirmTwo}
              className="px-2.5 py-1.5 bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500 hover:from-yellow-200 hover:to-amber-400 text-slate-950 text-xs font-black rounded-lg flex items-center justify-center gap-1 shadow-[0_2px_0_#9a3412] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>볼 2개 가져오기</span>
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              title="선택 취소"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        ) : selectedBalls.length > 0 ? (
          /* B. 서로 다른 볼 1~3개 선택 시 */
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-amber-400 shadow-lg">
            <button
              type="button"
              disabled={!checkDiff.valid}
              onClick={handleConfirmDifferent}
              className="px-2.5 py-1.5 bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500 hover:from-yellow-200 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-black rounded-lg flex items-center justify-center gap-1 shadow-[0_2px_0_#9a3412] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>볼 {selectedBalls.length}개 가져오기</span>
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              title="선택 취소"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        ) : isMyTurn ? (
          /* C. 선택 없을 때 내 차례: 차례 마치기 */
          <button
            type="button"
            onClick={onEndTurn}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-[0_2px_0_#78350f] active:translate-y-0.5 transition cursor-pointer whitespace-nowrap"
            title="차례 마치기"
          >
            <span>차례 마치기</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        ) : (
          /* D. 상대 차례 */
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-black flex items-center gap-1.5 select-none whitespace-nowrap opacity-75">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>상대 턴 진행 중</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const SupplyBoard = React.memo(SupplyBoardComponent);
