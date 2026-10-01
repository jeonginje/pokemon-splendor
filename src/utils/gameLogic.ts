import type {
  BallType,
  CardTier,
  GameState,
  PlayerState,
  PokemonCard,
} from '../types/game';
import { NORMAL_BALL_TYPES } from '../types/game';
import {
  LEGENDARY_CARDS,
  RARE_CARDS,
  TIER_1_CARDS,
  TIER_2_CARDS,
  TIER_3_CARDS,
} from '../data/pokemonCards';
import { TRAINER_TILES } from '../data/trainerTiles';

// Fisher-Yates 셔플
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 플레이어 수에 따른 초기 공급처 볼 토큰 수 계산
// 4인: 각 7개, 마스터볼 5개
// 3인: 각 5개 (2개 제거), 마스터볼 5개
// 2인: 각 4개 (3개 제거), 마스터볼 5개
export function getInitialSupplyBalls(playerCount: number): Record<BallType, number> {
  let normalCount = 7;
  if (playerCount === 3) normalCount = 5;
  if (playerCount === 2) normalCount = 4;

  return {
    monster: normalCount,
    super: normalCount,
    hyper: normalCount,
    heal: normalCount,
    quick: normalCount,
    master: 5, // 마스터볼은 인원수 상관없이 5개
  };
}

// 플레이어의 영구 보너스 볼 수 계산 (트레이너 타일 밑으로 간 진화 카드는 제외)
export function getPlayerBonuses(player: PlayerState): Record<BallType, number> {
  const bonuses: Record<BallType, number> = {
    monster: 0,
    super: 0,
    hyper: 0,
    heal: 0,
    quick: 0,
    master: 0,
  };

  for (const card of player.capturedCards) {
    if (card.bonus) {
      bonuses[card.bonus] += card.bonusCount || 1;
    }
  }

  return bonuses;
}

// 플레이어의 총 볼 토큰 개수
export function getPlayerTotalBalls(player?: PlayerState | null): number {
  if (!player || !player.balls) return 0;
  return Object.values(player.balls).reduce((sum, count) => sum + count, 0);
}

// 플레이어 승점 재계산
export function calculatePlayerScore(player: PlayerState): number {
  return player.capturedCards.reduce((sum, card) => sum + (card.points || 0), 0);
}

// 초기 게임 상태 생성
export function createInitialGameState(
  roomId: string,
  roomName: string,
  playersInfo: { id: string; name: string; trainerId?: string }[],
  turnTimeLimit: number = 0
): GameState {
  const playerCount = playersInfo.length;
  const supplyBalls = getInitialSupplyBalls(playerCount);

  // 덱 셔플
  const tier1Deck = shuffleArray(TIER_1_CARDS);
  const tier2Deck = shuffleArray(TIER_2_CARDS);
  const tier3Deck = shuffleArray(TIER_3_CARDS);
  const rareDeck = shuffleArray(RARE_CARDS);
  const legendaryDeck = shuffleArray(LEGENDARY_CARDS);

  // 바닥에 오픈 (1~3단계 4장, 희귀 1장, 전설 1장)
  const tier1Open = [tier1Deck.pop() || null, tier1Deck.pop() || null, tier1Deck.pop() || null, tier1Deck.pop() || null];
  const tier2Open = [tier2Deck.pop() || null, tier2Deck.pop() || null, tier2Deck.pop() || null, tier2Deck.pop() || null];
  const tier3Open = [tier3Deck.pop() || null, tier3Deck.pop() || null, tier3Deck.pop() || null, tier3Deck.pop() || null];
  const rareOpen = [rareDeck.pop() || null];
  const legendaryOpen = [legendaryDeck.pop() || null];

  // 트레이너 배정 (선택 안했으면 순서대로)
  const players: PlayerState[] = playersInfo.map((p, idx) => {
    const trainerId = p.trainerId || TRAINER_TILES[idx % TRAINER_TILES.length].id;
    return {
      id: p.id,
      name: p.name,
      trainerId,
      balls: {
        monster: 0,
        super: 0,
        hyper: 0,
        heal: 0,
        quick: 0,
        master: 0,
      },
      capturedCards: [],
      reservedCards: [],
      evolvedCards: [],
      score: 0,
      isReady: true,
      isConnected: true,
    };
  });

  const startPlayerIndex = 0;
  const now = Date.now();

  return {
    roomId,
    roomName,
    status: 'playing',
    playerCount,
    players,
    currentTurnPlayerIndex: startPlayerIndex,
    startPlayerIndex,
    supplyBalls,
    tier1Deck,
    tier2Deck,
    tier3Deck,
    rareDeck,
    legendaryDeck,
    tier1Open,
    tier2Open,
    tier3Open,
    rareOpen,
    legendaryOpen,
    hasEvolvedThisTurn: false,
    actionTakenThisTurn: false,
    discardingPlayerIndex: null,
    turnTimeLimit,
    turnStartTime: now,
    logs: [
      {
        id: `log-${now}-init`,
        timestamp: now,
        message: `🎮 게임이 시작되었습니다! ${players[startPlayerIndex].name}님의 차례입니다.`,
        type: 'info',
      },
    ],
    winnerId: null,
    createdAt: now,
    updatedAt: now,
  };
}

// ----------------------------------------------------
// 1. 서로 다른 볼 3개 가져오기 검증 및 실행
// ----------------------------------------------------
export function canTakeDifferentBalls(
  supplyBalls: Record<BallType, number>,
  chosenBalls: BallType[]
): { valid: boolean; reason?: string } {
  // 마스터볼은 못 가져옴
  if (chosenBalls.includes('master')) {
    return { valid: false, reason: '마스터볼은 볼 가져오기로 획득할 수 없습니다.' };
  }

  // 중복된 볼이 있는지 확인
  const uniqueBalls = new Set(chosenBalls);
  if (uniqueBalls.size !== chosenBalls.length) {
    return { valid: false, reason: '서로 다른 종류의 볼을 선택해야 합니다.' };
  }

  // 공급처에 1개 이상 남아있는 일반 볼 종류 수
  const availableTypes = NORMAL_BALL_TYPES.filter((type) => supplyBalls[type] > 0);

  if (availableTypes.length >= 3) {
    if (chosenBalls.length !== 3) {
      return { valid: false, reason: '서로 다른 볼 3개를 선택해야 합니다.' };
    }
  } else {
    // 남은 종류 <= 2개일 땐 남은 만큼만(2개 또는 1개)
    if (chosenBalls.length !== availableTypes.length) {
      return {
        valid: false,
        reason: `공급처에 남은 볼 종류가 ${availableTypes.length}개뿐이므로 ${availableTypes.length}개를 가져와야 합니다.`,
      };
    }
  }

  // 선택한 볼이 공급처에 충분한지 확인
  for (const b of chosenBalls) {
    if (supplyBalls[b] < 1) {
      return { valid: false, reason: `공급처에 해당 볼이 부족합니다.` };
    }
  }

  return { valid: true };
}

export function takeDifferentBalls(
  state: GameState,
  playerIndex: number,
  chosenBalls: BallType[]
): GameState {
  const check = canTakeDifferentBalls(state.supplyBalls, chosenBalls);
  if (!check.valid) throw new Error(check.reason);

  const nextState = structuredClone(state);
  const player = nextState.players[playerIndex];

  chosenBalls.forEach((b) => {
    nextState.supplyBalls[b] -= 1;
    player.balls[b] += 1;
  });

  nextState.actionTakenThisTurn = true;
  nextState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: Date.now(),
    message: `${player.name}님이 서로 다른 볼(${chosenBalls.length}개)을 가져왔습니다.`,
    type: 'action',
  });

  return checkTokenLimitAndAdvance(nextState, playerIndex);
}

// ----------------------------------------------------
// 2. 같은 볼 2개 가져오기 검증 및 실행
// ----------------------------------------------------
export function canTakeTwoSameBalls(
  supplyBalls: Record<BallType, number>,
  ballType: BallType
): { valid: boolean; reason?: string } {
  if (ballType === 'master') {
    return { valid: false, reason: '마스터볼은 볼 가져오기로 획득할 수 없습니다.' };
  }

  // 해당 색이 4개 이상 있어야 가능
  if (supplyBalls[ballType] < 4) {
    return { valid: false, reason: '해당 색 볼이 공급처에 4개 이상 있어야 2개를 가져올 수 있습니다.' };
  }

  return { valid: true };
}

export function takeTwoSameBalls(
  state: GameState,
  playerIndex: number,
  ballType: BallType
): GameState {
  const check = canTakeTwoSameBalls(state.supplyBalls, ballType);
  if (!check.valid) throw new Error(check.reason);

  const nextState = structuredClone(state);
  const player = nextState.players[playerIndex];

  nextState.supplyBalls[ballType] -= 2;
  player.balls[ballType] += 2;

  nextState.actionTakenThisTurn = true;
  nextState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: Date.now(),
    message: `${player.name}님이 같은 볼 2개를 가져왔습니다.`,
    type: 'action',
  });

  return checkTokenLimitAndAdvance(nextState, playerIndex);
}

// ----------------------------------------------------
// 3. 카드 손에 보관(예약) + 마스터볼 획득 검증 및 실행
// ----------------------------------------------------
export function canReserveCard(
  player: PlayerState,
  card: PokemonCard
): { valid: boolean; reason?: string } {
  if (player.reservedCards.length >= 3) {
    return { valid: false, reason: '손에는 최대 3장까지만 보관할 수 있습니다.' };
  }

  // 희귀 / 전설·환상 카드는 손에 못 듦
  if (card.tier === 'rare' || card.tier === 'legendary') {
    return { valid: false, reason: '🌟희귀 / ✨전설·환상 카드는 손에 보관할 수 없습니다.' };
  }

  return { valid: true };
}

export function reserveCard(
  state: GameState,
  playerIndex: number,
  card: PokemonCard,
  tier: 1 | 2 | 3,
  openIndex?: number
): GameState {
  const player = state.players[playerIndex];
  const check = canReserveCard(player, card);
  if (!check.valid) throw new Error(check.reason);

  const nextState = structuredClone(state);
  const nextPlayer = nextState.players[playerIndex];

  // 바닥에서 가져오는 경우
  if (openIndex !== undefined) {
    const openDeck = getOpenCardsArray(nextState, tier);
    const drawDeck = getDrawDeck(nextState, tier);
    openDeck[openIndex] = drawDeck.pop() || null;
  }

  nextPlayer.reservedCards.push(card);

  // 마스터볼 공급처에 1개 이상 있으면 1개 획득
  let gotMasterBall = false;
  if (nextState.supplyBalls.master > 0) {
    nextState.supplyBalls.master -= 1;
    nextPlayer.balls.master += 1;
    gotMasterBall = true;
  }

  nextState.actionTakenThisTurn = true;
  nextState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: Date.now(),
    message: `${nextPlayer.name}님이 [${card.name}] 카드를 손에 보관했습니다.${
      gotMasterBall ? ' (마스터볼 획득)' : ''
    }`,
    type: 'action',
  });

  return checkTokenLimitAndAdvance(nextState, playerIndex);
}

// ----------------------------------------------------
// 4. 포켓몬 잡기 (카드 구매) 검증 및 실행
// ----------------------------------------------------
export interface CaptureCalculation {
  canCapture: boolean;
  reason?: string;
  tokensToPay: Partial<Record<BallType, number>>;
  masterBallsToPay: number;
}

export function calculateCaptureCost(
  player: PlayerState,
  card: PokemonCard
): CaptureCalculation {
  const bonuses = getPlayerBonuses(player);
  const tokensToPay: Partial<Record<BallType, number>> = {};
  let masterBallsNeeded = 0;

  // 희귀/전설 카드는 마스터볼 지불이 필수!
  const isSpecial = card.tier === 'rare' || card.tier === 'legendary';

  // 각 색상별로 필요한 토큰 계산 (카드 비용 - 플레이어 보너스)
  for (const b of NORMAL_BALL_TYPES) {
    const rawCost = card.cost[b] || 0;
    const effectiveCost = Math.max(0, rawCost - bonuses[b]);

    if (effectiveCost > 0) {
      const playerToken = player.balls[b];
      if (playerToken >= effectiveCost) {
        tokensToPay[b] = effectiveCost;
      } else {
        tokensToPay[b] = playerToken;
        masterBallsNeeded += effectiveCost - playerToken;
      }
    }
  }

  // 카드 비용 자체에 마스터볼이 요구되는 경우 (희귀/전설 등)
  const explicitMasterCost = card.cost.master || 0;
  masterBallsNeeded += explicitMasterCost;

  // 희귀/전설 카드는 최소 1개 이상의 마스터볼 지불 필수 규칙
  if (isSpecial && masterBallsNeeded === 0) {
    masterBallsNeeded = 1;
  }

  if (player.balls.master < masterBallsNeeded) {
    return {
      canCapture: false,
      reason: `마스터볼 토큰이 부족합니다. (필요: ${masterBallsNeeded}개, 보유: ${player.balls.master}개)`,
      tokensToPay,
      masterBallsToPay: masterBallsNeeded,
    };
  }

  return {
    canCapture: true,
    tokensToPay,
    masterBallsToPay: masterBallsNeeded,
  };
}

export function captureCard(
  state: GameState,
  playerIndex: number,
  card: PokemonCard,
  from: 'open' | 'reserved',
  tier?: CardTier,
  openIndex?: number
): GameState {
  const player = state.players[playerIndex];
  const calc = calculateCaptureCost(player, card);

  if (!calc.canCapture) {
    throw new Error(calc.reason || '포획 비용이 부족합니다.');
  }

  const nextState = structuredClone(state);
  const nextPlayer = nextState.players[playerIndex];

  // 볼 토큰 지불 -> 공급처로 반환
  for (const [ballType, count] of Object.entries(calc.tokensToPay)) {
    const b = ballType as BallType;
    nextPlayer.balls[b] -= count || 0;
    nextState.supplyBalls[b] += count || 0;
  }

  if (calc.masterBallsToPay > 0) {
    nextPlayer.balls.master -= calc.masterBallsToPay;
    nextState.supplyBalls.master += calc.masterBallsToPay;
  }

  // 카드 이동
  if (from === 'open' && tier && openIndex !== undefined) {
    const openDeck = getOpenCardsArray(nextState, tier);
    const drawDeck = getDrawDeck(nextState, tier);
    openDeck[openIndex] = drawDeck.pop() || null;
  } else if (from === 'reserved') {
    nextPlayer.reservedCards = nextPlayer.reservedCards.filter((c) => c.id !== card.id);
  }

  nextPlayer.capturedCards.push(card);
  nextPlayer.score = calculatePlayerScore(nextPlayer);

  nextState.actionTakenThisTurn = true;
  nextState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: Date.now(),
    message: `${nextPlayer.name}님이 포켓몬 [${card.name}]을(를) 잡았습니다! (+${card.points}점)`,
    type: 'action',
  });

  return checkTokenLimitAndAdvance(nextState, playerIndex);
}

// ----------------------------------------------------
// 5. 🧬 진화 검증 및 실행 (차례 마무리 후 부가 기회, 토큰 사용 안 함)
// ----------------------------------------------------
export function canEvolveToCard(
  player: PlayerState,
  targetCard: PokemonCard,
  hasEvolvedThisTurn: boolean
): { canEvolve: boolean; reason?: string; baseCard?: PokemonCard } {
  if (hasEvolvedThisTurn) {
    return { canEvolve: false, reason: '진화는 한 차례에 한 번만 가능합니다.' };
  }

  // 희귀 / 전설은 진화 불가
  if (targetCard.tier === 'rare' || targetCard.tier === 'legendary') {
    return { canEvolve: false, reason: '희귀/전설 카드는 진화할 수 없습니다.' };
  }

  if (!targetCard.evolvesFrom) {
    return { canEvolve: false, reason: '진화 대상 카드가 아닙니다.' };
  }

  // 플레이어가 진화 전 포켓몬을 잡았는지 확인
  const baseCard = player.capturedCards.find((c) => c.name === targetCard.evolvesFrom);
  if (!baseCard) {
    return {
      canEvolve: false,
      reason: `진화 전 포켓몬인 [${targetCard.evolvesFrom}]을(를) 보유하고 있지 않습니다.`,
    };
  }

  // 진화 조건: 토큰은 사용하지 않고 보너스만 확인!
  const bonuses = getPlayerBonuses(player);
  const requiredBonuses = targetCard.evolveBonusCost || targetCard.cost;

  for (const [ball, count] of Object.entries(requiredBonuses)) {
    const b = ball as BallType;
    if (b === 'master') continue;
    if ((bonuses[b] || 0) < (count || 0)) {
      return {
        canEvolve: false,
        reason: `진화에 필요한 보너스가 부족합니다.`,
      };
    }
  }

  return { canEvolve: true, baseCard };
}

export function evolvePokemon(
  state: GameState,
  playerIndex: number,
  targetCard: PokemonCard,
  from: 'open' | 'reserved',
  tier: 2 | 3,
  openIndex?: number
): GameState {
  const player = state.players[playerIndex];
  const check = canEvolveToCard(player, targetCard, state.hasEvolvedThisTurn);

  if (!check.canEvolve || !check.baseCard) {
    throw new Error(check.reason || '진화 조건을 만족하지 못했습니다.');
  }

  const nextState = structuredClone(state);
  const nextPlayer = nextState.players[playerIndex];
  const baseCard = check.baseCard;

  // 진화 전 카드를 capturedCards에서 제거하여 evolvedCards(트레이너 타일 밑)로 이동
  nextPlayer.capturedCards = nextPlayer.capturedCards.filter((c) => c.id !== baseCard.id);
  nextPlayer.evolvedCards.push(baseCard);

  // 대상 카드를 capturedCards로 추가
  if (from === 'open' && openIndex !== undefined) {
    const openDeck = getOpenCardsArray(nextState, tier);
    const drawDeck = getDrawDeck(nextState, tier);
    openDeck[openIndex] = drawDeck.pop() || null;
  } else if (from === 'reserved') {
    nextPlayer.reservedCards = nextPlayer.reservedCards.filter((c) => c.id !== targetCard.id);
  }

  nextPlayer.capturedCards.push(targetCard);
  nextPlayer.score = calculatePlayerScore(nextPlayer);
  nextState.hasEvolvedThisTurn = true;

  nextState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: Date.now(),
    message: `🧬 [진화!] ${nextPlayer.name}님의 [${baseCard.name}]이(가) [${targetCard.name}](으)로 진화했습니다!`,
    type: 'evolution',
  });

  return checkTokenLimitAndAdvance(nextState, playerIndex);
}

// ----------------------------------------------------
// 6. 10개 초과 토큰 반환
// ----------------------------------------------------
export function discardExcessBalls(
  state: GameState,
  playerIndex: number,
  discardBalls: Partial<Record<BallType, number>>
): GameState {
  const nextState = structuredClone(state);
  const player = nextState.players[playerIndex];

  const totalDiscard = Object.values(discardBalls).reduce((sum, n) => sum + (n || 0), 0);
  const currentTotal = getPlayerTotalBalls(player);
  const excess = currentTotal - 10;

  if (excess > 0 && totalDiscard !== excess) {
    throw new Error(`정확히 ${excess}개의 볼을 반환해야 합니다.`);
  }

  for (const [ballType, count] of Object.entries(discardBalls)) {
    const b = ballType as BallType;
    const c = count || 0;
    if (player.balls[b] < c) {
      throw new Error('보유한 볼보다 많이 반환할 수 없습니다.');
    }
    player.balls[b] -= c;
    nextState.supplyBalls[b] += c;
  }

  nextState.discardingPlayerIndex = null;
  nextState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: Date.now(),
    message: `${player.name}님이 초과된 볼 ${totalDiscard}개를 반환했습니다.`,
    type: 'action',
  });

  return finishTurnAndAdvance(nextState);
}

// ----------------------------------------------------
// 턴 관리 및 라운드 종료 / 승리 판정
// ----------------------------------------------------
function checkTokenLimitAndAdvance(state: GameState, playerIndex: number): GameState {
  const player = state.players[playerIndex];
  const totalBalls = getPlayerTotalBalls(player);

  if (totalBalls > 10) {
    // 10개 초과 시 버리기 모달을 활성화 (버리기 완료 시 discardExcessBalls에서 finishTurnAndAdvance 호출)
    state.discardingPlayerIndex = playerIndex;
    return state;
  }

  // 1턴 1액션 강제 종료: 행동(카드 포획/보관/토큰 가져오기/진화) 완료 즉시 차례 전환!
  return finishTurnAndAdvance(state);
}

export function passOrEndTurn(state: GameState): GameState {
  const nextState = structuredClone(state);
  const currentPlayer = nextState.players[nextState.currentTurnPlayerIndex];

  // 10개 초과 토큰 체크
  if (getPlayerTotalBalls(currentPlayer) > 10) {
    nextState.discardingPlayerIndex = nextState.currentTurnPlayerIndex;
    return nextState;
  }

  return finishTurnAndAdvance(nextState);
}

function finishTurnAndAdvance(state: GameState): GameState {
  // 18점 도달 플레이어가 있는지 체크
  const hasReached18 = state.players.some((p) => p.score >= 18);
  if (hasReached18 && state.status === 'playing') {
    state.status = 'last_round';
    state.logs.unshift({
      id: `log-${Date.now()}-18pts`,
      timestamp: Date.now(),
      message: `🏁 누군가 18점에 도달했습니다! 이번 라운드가 마지막 라운드입니다.`,
      type: 'alert',
    });
  }

  // 다음 플레이어 인덱스
  const nextPlayerIndex = (state.currentTurnPlayerIndex + 1) % state.playerCount;

  // 만약 마지막 라운드이고, 다음 플레이어가 시작 플레이어라면 게임 완전 종료!
  if (state.status === 'last_round' && nextPlayerIndex === state.startPlayerIndex) {
    state.status = 'finished';
    const winner = determineWinner(state.players);
    state.winnerId = winner.id;
    state.winnerReason = winner.reason;
    state.logs.unshift({
      id: `log-${Date.now()}-win`,
      timestamp: Date.now(),
      message: `🏆 게임 종료! 우승자: ${winner.name} (${winner.reason})`,
      type: 'alert',
    });
    state.currentTurnPlayerIndex = nextPlayerIndex;
    state.updatedAt = Date.now();
    return state;
  }

  const now = Date.now();
  state.currentTurnPlayerIndex = nextPlayerIndex;
  state.hasEvolvedThisTurn = false;
  state.actionTakenThisTurn = false;
  state.discardingPlayerIndex = null;
  state.turnStartTime = now;
  state.updatedAt = now;

  state.logs.unshift({
    id: `log-${now}-turn`,
    timestamp: now,
    message: `👉 ${state.players[nextPlayerIndex].name}님의 차례입니다.`,
    type: 'info',
  });

  return state;
}

// 승자 결정 룰:
// 1) 총 점수 가장 높은 플레이어
// 2) 동률 시: 진화 카드 많은 사람 (evolvedCards.length)
// 3) 그래도 동률 시: 앞에 포켓몬 많은 사람 승 (capturedCards.length)
export function determineWinner(players: PlayerState[]): {
  id: string;
  name: string;
  reason: string;
} {
  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.evolvedCards.length !== a.evolvedCards.length) {
      return b.evolvedCards.length - a.evolvedCards.length;
    }
    return b.capturedCards.length - a.capturedCards.length;
  });

  const best = sorted[0];
  let reason = `최고 점수 ${best.score}점`;

  if (sorted.length > 1 && sorted[1].score === best.score) {
    if (best.evolvedCards.length > sorted[1].evolvedCards.length) {
      reason += ` (동률 타이브레이커: 진화 카드 ${best.evolvedCards.length}장으로 승리)`;
    } else if (best.capturedCards.length > sorted[1].capturedCards.length) {
      reason += ` (동률 타이브레이커: 포켓몬 ${best.capturedCards.length}마리로 승리)`;
    }
  }

  return {
    id: best.id,
    name: best.name,
    reason,
  };
}

// 헬퍼: 각 티어별 오픈 카드 및 덱 배열 가져오기
function getOpenCardsArray(state: GameState, tier: CardTier): (PokemonCard | null)[] {
  switch (tier) {
    case 1:
      return state.tier1Open;
    case 2:
      return state.tier2Open;
    case 3:
      return state.tier3Open;
    case 'rare':
      return state.rareOpen;
    case 'legendary':
      return state.legendaryOpen;
  }
}

function getDrawDeck(state: GameState, tier: CardTier): PokemonCard[] {
  switch (tier) {
    case 1:
      return state.tier1Deck;
    case 2:
      return state.tier2Deck;
    case 3:
      return state.tier3Deck;
    case 'rare':
      return state.rareDeck;
    case 'legendary':
      return state.legendaryDeck;
  }
}
