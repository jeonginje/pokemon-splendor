import React from 'react';
import { X, BookOpen, Dna, Trophy, CheckCircle2, AlertCircle } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5 text-amber-400">
            <BookOpen className="w-6 h-6 stroke-[2.5]" />
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              🎮 스플렌더: 포켓몬 공식 룰북
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 룰 본문 스크롤 영역 (1. 행간 line-height 1.7 & word-break: keep-all) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-slate-200 text-xs sm:text-sm leading-[1.7] break-keep select-text">
          {/* 1. 구성물 (2. 태그 Chip 형태 가로 정렬) */}
          <section className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 shadow-md">
            <h3 className="font-black text-amber-300 text-sm sm:text-base mb-2.5 flex items-center gap-1.5">
              <span>🧩 게임 구성물</span>
            </h3>
            
            <div className="space-y-3">
              {/* 볼 토큰 40개 태그 칩 */}
              <div>
                <span className="text-xs font-black text-slate-300 block mb-1.5">
                  • 볼 토큰 40개:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-black text-red-300 shadow-sm flex items-center gap-1">
                    🔴 몬스터볼 ×7
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-black text-blue-300 shadow-sm flex items-center gap-1">
                    🔵 슈퍼볼 ×7
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-black text-yellow-300 shadow-sm flex items-center gap-1">
                    ⚫ 하이퍼볼 ×7
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-black text-pink-300 shadow-sm flex items-center gap-1">
                    🌸 힐볼 ×7
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-black text-cyan-300 shadow-sm flex items-center gap-1">
                    🟡 퀵볼 ×7
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/50 text-xs font-black text-purple-200 shadow-sm flex items-center gap-1">
                    🟣 마스터볼 ×5 (황금 조커)
                  </span>
                </div>
              </div>

              {/* 카드 90장 태그 칩 */}
              <div>
                <span className="text-xs font-black text-slate-300 block mb-1.5">
                  • 포켓몬 카드 90장:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-slate-200">
                    ▫️ 1단계 ×35
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-slate-200">
                    ◻️ 2단계 ×30
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-slate-200">
                    ◼️ 3단계 ×15
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-xs font-black text-amber-300">
                    🌟 희귀 카드 ×5
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-xs font-black text-indigo-300">
                    ✨ 전설·환상 ×5
                  </span>
                </div>
              </div>

              {/* 트레이너 타일 */}
              <div>
                <span className="text-xs font-black text-slate-300 block mb-1.5">
                  • 트레이너 타일 4개:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-slate-200">
                    ⚡ 지우
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-slate-200">
                    💧 이슬
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-slate-200">
                    🪨 웅
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-slate-200">
                    🔬 오박사
                  </span>
                  <span className="text-slate-400 text-xs self-center">
                    (진화한 포켓몬 보관소 역할)
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. 게임 준비: 인원수별 볼 세팅 */}
          <section className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 shadow-md">
            <h3 className="font-black text-amber-300 text-sm sm:text-base mb-2 flex items-center gap-1.5">
              <span>🛠️ 인원수별 볼 세팅 (자동 준비됨)</span>
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-bold text-slate-300">
                • <strong className="text-white">4인 플레이:</strong> 색상별 7개 (마스터볼 5개)
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-bold text-slate-300">
                • <strong className="text-white">3인 플레이:</strong> 색상별 5개 (마스터볼 5개)
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-bold text-slate-300">
                • <strong className="text-white">2인 플레이:</strong> 색상별 4개 (마스터볼 5개)
              </span>
            </div>
          </section>

          {/* 3. 차례에 할 수 있는 행동 (3. 4가지 행동의 '카드화' & gap: 12px) */}
          <section className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 shadow-md">
            <h3 className="font-black text-amber-300 text-sm sm:text-base mb-3 flex items-center gap-1.5">
              <span>🔁 차례에 할 수 있는 행동 (4가지 중 딱 1가지만 선택!)</span>
            </h3>
            
            {/* 4장의 독립된 카드 그리드 (gap: 12px) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 행동 1 */}
              <div className="p-3.5 bg-slate-800/90 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-amber-400/50 rounded-2xl shadow-lg transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">1</span>
                    <span className="font-black text-white text-xs sm:text-sm">🎯 서로 다른 볼 3개 가져오기</span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    공급처에서 서로 다른 일반 볼 3개를 1개씩 가져옵니다. 단, 남은 종류가 2개 이하일 땐 남은 만큼만 가져옵니다.
                  </p>
                </div>
                <div className="mt-2 text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded-lg w-fit">
                  ❌ 마스터볼 선택 불가
                </div>
              </div>

              {/* 행동 2 */}
              <div className="p-3.5 bg-slate-800/90 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-amber-400/50 rounded-2xl shadow-lg transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">2</span>
                    <span className="font-black text-white text-xs sm:text-sm">🔁 같은 볼 2개 가져오기</span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    해당 색깔의 볼이 공급처에 <mark className="bg-yellow-300 text-slate-950 font-black px-1 rounded">4개 이상</mark> 남아있을 때만 2개를 한 번에 가져올 수 있습니다.
                  </p>
                </div>
                <div className="mt-2 text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded-lg w-fit">
                  ❌ 마스터볼 선택 불가
                </div>
              </div>

              {/* 행동 3 */}
              <div className="p-3.5 bg-slate-800/90 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-amber-400/50 rounded-2xl shadow-lg transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">3</span>
                    <span className="font-black text-white text-xs sm:text-sm">📥 카드 보관 + 마스터볼 획득</span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    마켓의 카드 1장을 내 손에 보관하고 보너스로 <span className="text-purple-300 font-black">마스터볼 1개</span>를 받습니다. (손에는 <mark className="bg-yellow-300 text-slate-950 font-black px-1 rounded">최대 3장</mark>까지 보관 가능)
                  </p>
                </div>
                <div className="mt-2 text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-lg w-fit">
                  ⚠️ 🌟희귀 / ✨전설 카드는 보관 불가
                </div>
              </div>

              {/* 행동 4 */}
              <div className="p-3.5 bg-slate-800/90 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-amber-400/50 rounded-2xl shadow-lg transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">4</span>
                    <span className="font-black text-white text-xs sm:text-sm">🐾 포켓몬 잡기 (카드 구매)</span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    요구 볼 토큰을 지불하고 카드를 포획합니다. 내가 이미 잡은 포켓몬들의 볼 아이콘은 영구 할인 보너스를 제공합니다.
                  </p>
                </div>
                <div className="mt-2 text-[11px] font-black text-purple-300 bg-purple-950/70 border border-purple-600/50 px-2 py-0.5 rounded-lg">
                  🌟희귀 / ✨전설은 <mark className="bg-purple-400 text-slate-950 font-black px-1 rounded">마스터볼 지불 필수!</mark>
                </div>
              </div>
            </div>
          </section>

          {/* 4. 🧬 진화 (4. 핵심 키워드 형광펜 효과: [한 차례에 한 번만]) */}
          <section className="bg-indigo-950/50 p-4 rounded-2xl border-2 border-indigo-500/50 shadow-md">
            <h3 className="font-black text-indigo-300 text-sm sm:text-base mb-2.5 flex items-center gap-1.5">
              <Dna className="w-5 h-5 text-indigo-400 stroke-[2.5]" />
              <span>🧬 진화 (차례 행동 완료 후 실행! 행동 횟수를 쓰지 않음)</span>
            </h3>
            <ul className="text-xs text-slate-200 space-y-2">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>행동 1회를 마친 후 진화 조건을 충족하면 마켓이나 손에 있는 다음 단계 카드로 즉시 진화할 수 있습니다.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">🔍 보너스만 확인:</strong> 진화 시에는 토큰을 일절 소비하지 않고 내가 보유한 영구 보너스만으로 진화합니다!
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">진화한 카드는 트레이너 타일 밑으로:</strong> 진화 전 포켓몬은 트레이너 타일 밑으로 들어가 점수/보너스에서 제외되지만 최종 동률 판정에서 가장 중요합니다!
                </span>
              </li>
              <li className="p-2.5 bg-indigo-900/60 rounded-xl border border-indigo-400/50 flex items-center gap-2 text-indigo-100 font-bold">
                <AlertCircle className="w-4 h-4 text-yellow-300 shrink-0" />
                <span>
                  진화는 <mark className="bg-yellow-300 text-slate-950 font-black px-2 py-0.5 rounded-md shadow-sm">한 차례에 한 번만</mark> 가능합니다. (🌟희귀/✨전설 카드는 진화 불가)
                </span>
              </li>
            </ul>
          </section>

          {/* 5. 토큰 제한 & 승리 조건 (4. 핵심 키워드 형광펜: [최대 10개], [18점 이상]) */}
          <section className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 shadow-md">
            <h3 className="font-black text-amber-300 text-sm sm:text-base mb-2.5 flex items-center gap-1.5">
              <Trophy className="w-5 h-5 text-amber-400 stroke-[2.5]" />
              <span>🏁 토큰 제한 및 승리 조건</span>
            </h3>
            
            <div className="space-y-3 text-xs text-slate-200">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/80">
                <span className="font-black text-white text-xs sm:text-sm block mb-1">
                  🧮 볼 토큰 보유 제한
                </span>
                <p className="text-slate-300">
                  마스터볼을 포함해 보유할 수 있는 볼은 <mark className="bg-red-500 text-white font-black px-2 py-0.5 rounded-md shadow-sm">최대 10개</mark> 입니다.
                  내 차례를 마칠 때 10개를 초과했다면 10개가 될 때까지 초과분을 공급처로 반환해야 합니다.
                </p>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/80">
                <span className="font-black text-white text-xs sm:text-sm block mb-1">
                  🏁 게임 종료 및 승리 선언
                </span>
                <p className="text-slate-300">
                  누군가 <mark className="bg-yellow-300 text-slate-950 font-black px-2 py-0.5 rounded-md shadow-sm">18점 이상</mark> 을 달성하면 마지막 라운드가 시작되며, 시작 플레이어 전 사람까지 모든 플레이어가 같은 수의 턴을 마친 뒤 게임이 종료됩니다.
                </p>
              </div>

              {/* 타이브레이커 */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="font-black text-amber-300 block mb-1.5">
                  🏆 최종 순위 결정 (동점 시 타이브레이커)
                </span>
                <ol className="list-decimal list-inside text-slate-300 space-y-1 pl-1 font-medium">
                  <li><strong className="text-white">1순위:</strong> 총 점수가 가장 높은 트레이너</li>
                  <li><strong className="text-white">2순위:</strong> 동점 시 ▶️ 트레이너 타일 밑에 보관된 <span className="text-indigo-300 font-bold">진화 카드가 많은 사람</span></li>
                  <li><strong className="text-white">3순위:</strong> 그래도 동점 시 ▶️ 필드에 보유한 <span className="text-amber-300 font-bold">포켓몬 카드가 많은 사람</span></li>
                </ol>
              </div>
            </div>
          </section>
        </div>

        {/* 닫기 버튼 */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-[0_3px_0_#78350f] active:translate-y-0.5 active:shadow-none transition cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
