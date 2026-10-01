import { useState } from 'react';
import type { CardTier } from '../types/game';
import { ALL_CARDS } from '../data/pokemonCards';
import {
  getAllCustomCardImages,
  saveCustomCardImage,
  removeCustomCardImage,
  getCardDisplayImage,
} from '../services/customImages';
import {
  X,
  Palette,
  Upload,
  RotateCcw,
  Search,
  Check,
  Sparkles,
} from 'lucide-react';

interface AdminStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminStudioModal: React.FC<AdminStudioModalProps> = ({ isOpen, onClose }) => {
  const [selectedTier, setSelectedTier] = useState<CardTier | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customMap, setCustomMap] = useState(() => getAllCustomCardImages());
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [artistInput, setArtistInput] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const refreshMap = () => {
    setCustomMap(getAllCustomCardImages());
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (cardId: string, file: File, artist?: string) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        saveCustomCardImage(cardId, dataUrl, artist);
        refreshMap();
        setEditingCardId(null);
        showToast('그림이 성공적으로 교체되었습니다! ✨');
      }
    };
    reader.readAsDataURL(file);
  };

  // 기본 사진 복원
  const handleReset = (cardId: string) => {
    removeCustomCardImage(cardId);
    refreshMap();
    showToast('기본 공식 사진으로 복원되었습니다.');
  };

  // 필터링된 카드 목록
  const filteredCards = ALL_CARDS.filter((card) => {
    if (selectedTier !== 'all' && card.tier !== selectedTier) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = card.name.toLowerCase().includes(q);
      const matchNo = card.pokedexNo?.toString().includes(q);
      return matchName || matchNo;
    }
    return true;
  });

  const totalCustomCount = Object.keys(customMap).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="bg-slate-900 border-3 border-amber-400 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 알림 토스트 */}
        {successToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 animate-bounce">
            <Check className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* 헤더 */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 shadow">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">🎨 카드 사진 교체 관리자 모드</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40">
                  내가 그린 그림: {totalCustomCount}/90장
                </span>
              </div>
              <p className="text-xs text-slate-400">
                원하는 카드의 사진을 학생들이 직접 그린 그림 파일로 손쉽게 교체해보세요!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 컨트롤 필터 바 */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* 티어 탭 */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: '전체 (90)' },
              { id: 1, label: '▫️ 1단계 (35)' },
              { id: 2, label: '◻️ 2단계 (30)' },
              { id: 3, label: '◼️ 3단계 (15)' },
              { id: 'rare', label: '🌟 희귀 (5)' },
              { id: 'legendary', label: '✨ 전설 (5)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTier(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  selectedTier === tab.id
                    ? 'bg-amber-400 text-slate-950 shadow-[0_2px_0_#78350f]'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 검색창 */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="포켓몬 이름 또는 번호 검색..."
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 w-52 sm:w-64"
            />
          </div>
        </div>

        {/* 카드 그리드 목록 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map((card) => {
            const display = getCardDisplayImage(card);
            const isEditing = editingCardId === card.id;

            return (
              <div
                key={card.id}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  display.isCustom
                    ? 'bg-amber-950/20 border-amber-400/80 shadow-lg shadow-amber-400/10'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* 상단 정보 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-slate-500">
                      {card.pokedexNo ? `#${card.pokedexNo}` : ''}
                    </span>
                    <span className="font-black text-white text-sm">{card.name}</span>
                  </div>

                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-900 border border-slate-700 text-slate-300">
                    {card.tier === 'rare'
                      ? '🌟 희귀'
                      : card.tier === 'legendary'
                      ? '✨ 전설'
                      : `${card.tier}단계`}
                  </span>
                </div>

                {/* 중앙 이미지 미리보기 */}
                <div className="w-full h-32 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 mb-3 relative overflow-hidden group">
                  {display.url ? (
                    <img
                      src={display.url}
                      alt={card.name}
                      className="max-w-full max-h-full object-contain drop-shadow"
                    />
                  ) : (
                    <span className="text-2xl">🖼️</span>
                  )}

                  {display.isCustom && (
                    <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                      <Sparkles className="w-3 h-3 fill-slate-950" />
                      <span>{display.artist || '학생 그림'}</span>
                    </div>
                  )}
                </div>

                {/* 그림 교체 컨트롤 */}
                <div className="space-y-2">
                  {isEditing ? (
                    <div className="space-y-2 p-2 bg-slate-900 rounded-xl border border-slate-700">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          그린 사람 (학생 이름)
                        </label>
                        <input
                          type="text"
                          value={artistInput}
                          onChange={(e) => setArtistInput(e.target.value)}
                          placeholder="예: 3학년 김민수"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <label className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>내 PC에서 그림 선택하기</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(card.id, file, artistInput);
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setEditingCardId(null)}
                        className="w-full py-1 text-[11px] text-slate-400 hover:text-white"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCardId(card.id);
                          setArtistInput(display.artist || '');
                        }}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1 border border-slate-700 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>그림 바꾸기</span>
                      </button>

                      {display.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleReset(card.id)}
                          className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 rounded-xl transition cursor-pointer"
                          title="기본 공식 사진으로 되돌리기"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
