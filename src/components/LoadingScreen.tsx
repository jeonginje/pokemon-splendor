import React, { useState, useEffect } from 'react';
import { preloadGameAssets, isAssetsPreloaded } from '../services/imagePreloader';
import type { PreloadProgress } from '../services/imagePreloader';
import { Sparkles, FastForward } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<PreloadProgress>({
    total: 100,
    loaded: 0,
    percentage: 0,
    currentName: '리소스 확인 중...',
  });
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    // 이미 프리로드 완료된 상태라면 빠르게 넘김
    if (isAssetsPreloaded()) {
      onComplete();
      return;
    }

    let isMounted = true;

    preloadGameAssets((p) => {
      if (isMounted) {
        setProgress(p);
      }
    }).then(() => {
      if (isMounted) {
        setIsFinishing(true);
        setTimeout(() => {
          onComplete();
        }, 400);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsFinishing(true);
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none transition-opacity duration-500 ${
        isFinishing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 배경 장식 원형 글로우 */}
      <div className="absolute w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
        {/* 1. 몬스터볼 3D 회전 애니메이션 */}
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-slate-900 shadow-[0_0_40px_rgba(251,191,36,0.6)] flex items-center justify-center relative overflow-hidden animate-bounce-gentle">
            {/* 몬스터볼 상단 빨강 */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-red-500 to-red-600 border-b-4 border-slate-900" />
            {/* 몬스터볼 하단 흰색 */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-slate-100 to-slate-300" />
            {/* 몬스터볼 중앙 버튼 */}
            <div className="absolute w-8 h-8 rounded-full bg-white border-4 border-slate-900 z-10 shadow flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-700 animate-ping" />
            </div>
          </div>
          <div className="absolute -top-1 -right-1 text-2xl animate-spin" style={{ animationDuration: '6s' }}>
            ⚡
          </div>
        </div>

        {/* 2. 타이틀 & 설명 */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight neon-glow-gold whitespace-nowrap">
            스플렌더: 포켓몬
          </h1>
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>

        <p className="text-xs sm:text-sm text-slate-300 font-bold mb-6">
          전체 포켓몬 도감과 카드 사진을 고속 로딩 중입니다...
        </p>

        {/* 3. 프로그레스 바 컨테이너 */}
        <div className="w-full bg-slate-900/90 border-2 border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md mb-4">
          <div className="flex items-center justify-between text-xs font-black mb-2">
            <span className="text-amber-400 truncate max-w-[200px]">
              {progress.currentName ? `📦 ${progress.currentName}` : '도감 데이터 로딩 중'}
            </span>
            <span className="text-white font-mono text-sm">
              {progress.percentage}%
            </span>
          </div>

          {/* 게이지 바 */}
          <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 rounded-full transition-all duration-200 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mt-2.5">
            <span>다운로드 진행률</span>
            <span>{progress.loaded} / {progress.total}장 완료</span>
          </div>
        </div>

        {/* 4. 스킵 버튼 */}
        <button
          type="button"
          onClick={handleSkip}
          className="mt-3 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow active:scale-95"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>건너뛰고 바로 시작</span>
        </button>
      </div>
    </div>
  );
};
