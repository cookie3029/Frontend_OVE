// 여러 개의 HEX 색상 정지점(stop) 사이를 보간하여
// 글자 인덱스에 해당하는 색을 만들어 주는 유틸리티입니다.
// (글자별 애니메이션 + 그라데이션을 동시에 안정적으로 구현하기 위해 사용)

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/**
 * stops 배열을 따라 t(0~1) 위치의 색상을 rgb() 문자열로 반환합니다.
 * @param {string[]} stops - 예: ['#22d3ee', '#818cf8', '#c084fc']
 * @param {number} t - 0 ~ 1 사이의 위치값
 */
export function sampleGradient(stops, t) {
  if (!stops || stops.length === 0) return undefined;
  if (stops.length === 1) return stops[0];

  const clamped = Math.min(Math.max(t, 0), 1);
  const scaled = clamped * (stops.length - 1);
  const index = Math.floor(scaled);

  if (index >= stops.length - 1) return `rgb(${hexToRgb(stops[stops.length - 1]).join(', ')})`;

  const frac = scaled - index;
  const [r1, g1, b1] = hexToRgb(stops[index]);
  const [r2, g2, b2] = hexToRgb(stops[index + 1]);

  const r = Math.round(r1 + (r2 - r1) * frac);
  const g = Math.round(g1 + (g2 - g1) * frac);
  const b = Math.round(b1 + (b2 - b1) * frac);

  return `rgb(${r}, ${g}, ${b})`;
}

// 프로젝트 공통 브랜드 그라데이션 (cyan-400 → indigo-400 → purple-400)
export const BRAND_GRADIENT = ['#22d3ee', '#818cf8', '#c084fc'];
