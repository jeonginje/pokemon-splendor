export type BallType = 'monster' | 'super' | 'hyper' | 'heal' | 'quick' | 'master';

export interface BallInfo {
  type: BallType;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  emoji: string;
  imageUrl: string;
  isJoker?: boolean;
}

export const BALL_INFO: Record<BallType, BallInfo> = {
  monster: {
    type: 'monster',
    name: '몬스터볼',
    color: '#ef4444',
    bgColor: 'bg-red-600',
    borderColor: 'border-red-500',
    textColor: 'text-red-400',
    emoji: '🔴',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  },
  super: {
    type: 'super',
    name: '슈퍼볼',
    color: '#3b82f6',
    bgColor: 'bg-blue-600',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-400',
    emoji: '🔵',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
  },
  hyper: {
    type: 'hyper',
    name: '하이퍼볼',
    color: '#eab308',
    bgColor: 'bg-yellow-500',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-400',
    emoji: '⚫',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
  },
  heal: {
    type: 'heal',
    name: '힐볼',
    color: '#ec4899',
    bgColor: 'bg-pink-500',
    borderColor: 'border-pink-400',
    textColor: 'text-pink-400',
    emoji: '🌸',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/heal-ball.png',
  },
  quick: {
    type: 'quick',
    name: '퀵볼',
    color: '#06b6d4',
    bgColor: 'bg-cyan-500',
    borderColor: 'border-cyan-400',
    textColor: 'text-cyan-400',
    emoji: '🟡',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-ball.png',
  },
  master: {
    type: 'master',
    name: '마스터볼',
    color: '#a855f7',
    bgColor: 'bg-purple-600',
    borderColor: 'border-purple-400',
    textColor: 'text-purple-300',
    emoji: '🟣',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png',
    isJoker: true,
  },
};

export const NORMAL_BALL_TYPES: BallType[] = ['monster', 'super', 'hyper', 'heal', 'quick'];

export type CardTier = 1 | 2 | 3 | 'rare' | 'legendary';

export interface PokemonCard {
  id: string;
  pokedexNo?: number;
  name: string;
  tier: CardTier;
  bonus: BallType; // 포획 시 제공하는 영구 보너스 색상
  bonusCount: number; // 일반 1개, 희귀/전설은 2개
  points: number; // 승점 (0 ~ 5)
  cost: Partial<Record<BallType, number>>; // 포획에 필요한 볼 개수
  
  // 진화 관련 정보
  evolvesFrom?: string; // 진화 전 포켓몬 이름
  evolvesTo?: string; // 진화 후 포켓몬 이름
  evolveBonusCost?: Partial<Record<BallType, number>>; // 진화 시 필요한 내 보너스 조건 (토큰 소비 안 함)

  // 일러스트 이미지 (학생들이 그린 그림 파일명 또는 URL)
  imageUrl?: string;
  authorStudent?: string; // 그린 학생 이름
}

export interface TrainerTile {
  id: string;
  name: string;
  title: string;
  avatarEmoji: string;
  bgGradient: string;
  characterImage?: string;
}

export interface PlayerState {
  id: string;
  name: string;
  trainerId: string;
  balls: Record<BallType, number>;
  capturedCards: PokemonCard[]; // 내 앞에 공개된 잡은 포켓몬 카드들
  reservedCards: PokemonCard[]; // 손에 보관한 카드 (최대 3장)
  evolvedCards: PokemonCard[]; // 트레이너 타일 밑으로 들어간 진화 전 카드들 (점수/보너스 제외, 타이 브레이커용)
  score: number;
  isReady: boolean;
  isConnected: boolean;
}

export type GameStatus = 'waiting' | 'playing' | 'last_round' | 'finished';

export interface GameState {
  roomId: string;
  roomName: string;
  status: GameStatus;
  playerCount: number;
  players: PlayerState[];
  currentTurnPlayerIndex: number;
  startPlayerIndex: number;
  
  // 공급처의 볼 토큰
  supplyBalls: Record<BallType, number>;

  // 카드 더미 (덱)
  tier1Deck: PokemonCard[];
  tier2Deck: PokemonCard[];
  tier3Deck: PokemonCard[];
  rareDeck: PokemonCard[];
  legendaryDeck: PokemonCard[];

  // 바닥에 공개된 카드들
  tier1Open: (PokemonCard | null)[]; // 4장
  tier2Open: (PokemonCard | null)[]; // 4장
  tier3Open: (PokemonCard | null)[]; // 4장
  rareOpen: (PokemonCard | null)[]; // 1장
  legendaryOpen: (PokemonCard | null)[]; // 1장

  // 턴 진행 중 상태
  hasEvolvedThisTurn: boolean; // 이번 턴에 진화 완료 여부 (1턴에 1회 제한)
  actionTakenThisTurn: boolean; // 이번 턴 주 행동(토큰 획득/예약/포획) 수행 여부
  discardingPlayerIndex: number | null; // 10개 초과하여 토큰 버려야 할 플레이어
  turnTimeLimit: number; // 턴 시간 제한(초) (0: 무제한, 30: 30초, 60: 60초)
  turnStartTime: number; // 이번 턴 시작 시각(ms)

  logs: { id: string; timestamp: number; message: string; type?: 'info' | 'action' | 'evolution' | 'alert' }[];
  winnerId: string | null;
  winnerReason?: string;
  createdAt: number;
  updatedAt: number;
}
