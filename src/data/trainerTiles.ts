import type { TrainerTile } from '../types/game';

export const TRAINER_TILES: TrainerTile[] = [
  {
    id: 'trainer-ash',
    name: '지우 (Ash)',
    title: '태초마을 출신 포켓몬 트레이너',
    avatarEmoji: '🧢',
    bgGradient: 'from-red-500 to-amber-500',
  },
  {
    id: 'trainer-misty',
    name: '이슬 (Misty)',
    title: '블루체육관 물 포켓몬 관장',
    avatarEmoji: '💧',
    bgGradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'trainer-brock',
    name: '웅 (Brock)',
    title: '회색체육관 든든한 포켓몬 브리더',
    avatarEmoji: '⛰️',
    bgGradient: 'from-amber-600 to-stone-600',
  },
  {
    id: 'trainer-oak',
    name: '오박사 (Prof. Oak)',
    title: '포켓몬 생태 연구의 권위자',
    avatarEmoji: '🔬',
    bgGradient: 'from-purple-600 to-indigo-600',
  },
];
