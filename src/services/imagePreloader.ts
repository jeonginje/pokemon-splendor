import { ALL_CARDS } from '../data/pokemonCards';
import { BALL_INFO } from '../types/game';
import { getCardDisplayImage } from './customImages';

export interface PreloadProgress {
  total: number;
  loaded: number;
  percentage: number;
  currentName: string;
}

let isAlreadyPreloaded = false;

export function isAssetsPreloaded(): boolean {
  return isAlreadyPreloaded;
}

/**
 * 게임에 사용되는 모든 포켓몬 카드 및 볼 토큰 이미지를 브라우저 메모리/디스크 캐시에 사전 다운로드합니다.
 */
export async function preloadGameAssets(
  onProgress?: (progress: PreloadProgress) => void
): Promise<void> {
  if (isAlreadyPreloaded) {
    if (onProgress) {
      onProgress({ total: 100, loaded: 100, percentage: 100, currentName: '준비 완료' });
    }
    return;
  }

  // 1. 프리로드 대상 목록 추출 (중복 제거)
  const itemsToLoad: { url: string; name: string }[] = [];
  const seenUrls = new Set<string>();

  // A. 볼 토큰 6종 이미지
  for (const key of Object.keys(BALL_INFO)) {
    const ball = BALL_INFO[key as keyof typeof BALL_INFO];
    if (ball.imageUrl && !seenUrls.has(ball.imageUrl)) {
      seenUrls.add(ball.imageUrl);
      itemsToLoad.push({ url: ball.imageUrl, name: ball.name });
    }
  }

  // B. 포켓몬 카드 이미지 (전체 덱)
  for (const card of ALL_CARDS) {
    const displayInfo = getCardDisplayImage(card);
    if (displayInfo.url && !seenUrls.has(displayInfo.url)) {
      seenUrls.add(displayInfo.url);
      itemsToLoad.push({ url: displayInfo.url, name: card.name });
    }
  }

  const total = itemsToLoad.length;
  let loaded = 0;

  const update = (name: string) => {
    loaded++;
    const percentage = Math.min(100, Math.round((loaded / total) * 100));
    if (onProgress) {
      onProgress({
        total,
        loaded,
        percentage,
        currentName: name,
      });
    }
  };

  // 단일 이미지 다운로드 (최대 4초 타임아웃)
  const loadImage = (item: { url: string; name: string }): Promise<void> => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      let finished = false;

      const done = () => {
        if (!finished) {
          finished = true;
          update(item.name);
          resolve();
        }
      };

      const timer = setTimeout(done, 4000); // 네트워크 지연 시 타임아웃

      img.onload = () => {
        clearTimeout(timer);
        done();
      };
      img.onerror = () => {
        clearTimeout(timer);
        done();
      };

      img.src = item.url;
    });
  };

  // 병렬 풀 (동시 8개씩 빠르게 로딩)
  const CONCURRENCY = 8;
  const queue = [...itemsToLoad];

  const workers = Array.from({ length: CONCURRENCY }).map(async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) {
        await loadImage(item);
      }
    }
  });

  await Promise.all(workers);
  isAlreadyPreloaded = true;
}
