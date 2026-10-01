import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { GameState } from '../types/game';
import { TRAINER_TILES } from '../data/trainerTiles';
import { Trophy, Dna, RotateCcw, CheckCircle2 } from 'lucide-react';
import { sendScoreToClassPlatform, getStudentInfoFromUrl } from '../utils/studentPlatform';

interface WinnerModalProps {
  gameState: GameState;
  myPlayerId?: string;
  isOnline?: boolean;
  onRestart: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  gameState,
  myPlayerId,
  isOnline,
  onRestart,
}) => {
  const [platformSent, setPlatformSent] = useState(false);
  const hasSentRef = useRef(false);

  // 순위 정렬
  const rankedPlayers = [...gameState.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.evolvedCards.length !== a.evolvedCards.length) {
      return b.evolvedCards.length - a.evolvedCards.length;
    }
    return b.capturedCards.length - a.capturedCards.length;
  });

  const winner = rankedPlayers[0];
  const winnerTrainer = TRAINER_TILES.find((t) => t.id === winner.trainerId) || TRAINER_TILES[0];

  // 내 플레이어 정보 및 순위 계산
  const myPlayer = isOnline
    ? gameState.players.find((p) => p.id === myPlayerId) || gameState.players[0]
    : gameState.players[0];
  const myRankIndex = rankedPlayers.findIndex((p) => p.id === myPlayer.id);
  const isWinner = myRankIndex === 0;

  useEffect(() => {
    // 화려한 축하 폭죽 연출
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // 부모 창(학급 플랫폼 iframe)으로 결과(승률) 전송
    if (!hasSentRef.current) {
      hasSentRef.current = true;
      const studentInfo = getStudentInfoFromUrl();
      const displayName = studentInfo.studentName || myPlayer.name;
      const winRate = isWinner ? 100 : 0;
      const message = isWinner
        ? `${displayName} 학생이 포켓몬 스플랜더 게임에서 승리했습니다! (최종 점수: ${myPlayer.score}점, 진화: ${myPlayer.evolvedCards.length}장)`
        : `${displayName} 학생이 포켓몬 스플랜더 게임을 완주했습니다. (순위: ${myRankIndex + 1}위, 점수: ${myPlayer.score}점, 진화: ${myPlayer.evolvedCards.length}장)`;

      const sent = sendScoreToClassPlatform(winRate, message, {
        studentName: displayName,
      });
      if (sent) {
        setPlatformSent(true);
      }
    }
  }, [isWinner, myPlayer, myRankIndex]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* 상단 트로피 아이콘 */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30 border border-white/20">
          <Trophy className="w-10 h-10 text-slate-950 fill-slate-950" />
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight mb-1">포켓몬 챔피언 탄생!</h2>
        <p className="text-amber-300 text-sm font-semibold mb-6">
          치열한 승부 끝에 최고의 트레이너가 결정되었습니다!
        </p>

        {/* 1위 우승자 하이라이트 카드 */}
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-2 border-amber-400/60 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-left">
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${winnerTrainer.bgGradient} flex items-center justify-center text-3xl shadow`}
            >
              {winnerTrainer.avatarEmoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full font-black bg-amber-400 text-slate-950">
                  우승 🥇
                </span>
                <span className="font-black text-xl text-white">{winner.name}</span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">{gameState.winnerReason}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-amber-300">{winner.score}점</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
              <Dna className="w-3 h-3 text-indigo-400" />
              <span>진화 {winner.evolvedCards.length}장</span>
            </div>
          </div>
        </div>

        {/* 전체 순위표 */}
        <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 mb-6">
          <div className="text-xs font-bold text-slate-400 mb-2 px-2 text-left">최종 순위</div>
          <div className="flex flex-col gap-1.5">
            {rankedPlayers.map((player, idx) => {
              const trainer =
                TRAINER_TILES.find((t) => t.id === player.trainerId) || TRAINER_TILES[0];
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold ${
                    idx === 0
                      ? 'bg-amber-400/10 text-amber-200 border border-amber-400/30'
                      : 'bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold w-4 text-center">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </span>
                    <span className="text-sm">{trainer.avatarEmoji}</span>
                    <span className="font-bold text-white">{player.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-indigo-300 text-[11px]">
                      진화: {player.evolvedCards.length}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      포켓몬: {player.capturedCards.length}
                    </span>
                    <span className="font-black text-sm text-amber-300 w-10 text-right">
                      {player.score}점
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 학급 플랫폼 결과 전송 상태 안내 배지 */}
        {platformSent && (
          <div className="mb-4 py-2 px-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>학급 플랫폼으로 게임 결과(승률) 전송 완료</span>
          </div>
        )}

        {/* 새 게임 버튼 */}
        <button
          type="button"
          onClick={onRestart}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>새 게임 시작하기</span>
        </button>
      </div>
    </div>
  );
};
