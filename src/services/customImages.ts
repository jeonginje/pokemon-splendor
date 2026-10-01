// 커스텀 학생 그림 저장 및 관리 서비스

export interface CustomImageEntry {
  url: string;
  artist?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'pokemon_splendor_custom_images';

// PokeAPI 공식 일러스트 기본 URL 헬퍼
export function getDefaultPokemonImageUrl(pokedexNo?: number): string {
  if (!pokedexNo) return '';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokedexNo}.png`;
}

// 로컬스토리지에서 모든 커스텀 이미지 맵 로드
export function getAllCustomCardImages(): Record<string, CustomImageEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse custom images:', err);
    return {};
  }
}

// 특정 카드의 커스텀 이미지 가져오기
export function getCustomCardImage(cardId: string): CustomImageEntry | null {
  const map = getAllCustomCardImages();
  return map[cardId] || null;
}

// 커스텀 이미지 저장 (Base64 DataURL 또는 이미지 URL)
export function saveCustomCardImage(cardId: string, url: string, artist?: string): void {
  const map = getAllCustomCardImages();
  map[cardId] = {
    url,
    artist: artist?.trim() || undefined,
    updatedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  // 변경 이벤트 발행
  window.dispatchEvent(new Event('pokemon-custom-images-updated'));
}

// 커스텀 이미지 삭제 (기본 공식 사진으로 복원)
export function removeCustomCardImage(cardId: string): void {
  const map = getAllCustomCardImages();
  if (map[cardId]) {
    delete map[cardId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event('pokemon-custom-images-updated'));
  }
}

// 카드의 최종 표시 이미지 URL 및 작가명 반환
export function getCardDisplayImage(card: { id: string; pokedexNo?: number; imageUrl?: string }): {
  url: string;
  isCustom: boolean;
  artist?: string;
} {
  const custom = getCustomCardImage(card.id);
  if (custom && custom.url) {
    return {
      url: custom.url,
      isCustom: true,
      artist: custom.artist,
    };
  }

  // 기본 공식 아트워크
  const defaultUrl = getDefaultPokemonImageUrl(card.pokedexNo);
  return {
    url: defaultUrl || card.imageUrl || '',
    isCustom: false,
  };
}
