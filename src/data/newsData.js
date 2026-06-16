// NEWS 피드용 데이터. 백엔드가 생기면 NEWS_ITEMS 를 axios 응답으로 교체하면 됩니다.

export const NEWS_CATEGORIES = ['ALL', 'CONTENTS', 'MUSIC', 'EVENT', 'GOODS', 'OTHERS'];

// 카테고리별 썸네일 그라데이션 (라이트 테마에 어울리는 톤)
export const GRADIENTS = {
  CONTENTS: ['#a78bfa', '#6366f1'],
  MUSIC: ['#f472b6', '#a855f7'],
  EVENT: ['#818cf8', '#4f46e5'],
  GOODS: ['#34d399', '#22d3ee'],
  OTHERS: ['#fbbf24', '#fb7185'],
};

// 글쓰기 폼에서 선택 가능한 카테고리 (ALL 은 전체 보기용이라 제외)
export const WRITABLE_CATEGORIES = NEWS_CATEGORIES.filter((c) => c !== 'ALL');

// 카테고리에 해당하는 썸네일 그라데이션 반환 (없으면 기본값)
export function getGradient(category) {
  return GRADIENTS[category] || ['#a78bfa', '#6366f1'];
}

const MEMBERS = ['스텔라', '루나', '솔라', '노바'];

// 카테고리별 제목 템플릿 ({member}, {n} 치환)
const TITLE_TEMPLATES = {
  CONTENTS: [
    '{member} 신규 비하인드 영상 공개',
    '오리지널 웹예능 [DAY:OVE TV] {n}화 업로드',
    '{member} 데일리 보컬 커버 영상 공개',
    '멤버 단체 화보 메이킹 필름 공개',
  ],
  MUSIC: [
    '디지털 싱글 [Starlight] 음원 발매',
    '{member} 솔로 데뷔곡 티저 공개',
    '신곡 [Orbit] 뮤직비디오 티저 공개',
    '정규 앨범 [BEYOND] 수록곡 미리듣기 오픈',
  ],
  EVENT: [
    '『{member} : OVT. FIRST SOLO CONCERT』 특별 게스트!',
    '<{member} : OVT. FIRST SOLO CONCERT> 일반 예매 오픈 선안내',
    '버추얼 팬미팅 [GLASS WORLD] 응모 안내',
    '{member} 생일 카페 이벤트 개최 안내',
  ],
  GOODS: [
    '{member} 공식 포토카드 세트 발매',
    '신규 MD [ORBIT COLLECTION] 출시',
    '아크릴 스탠드 & 키링 예약 판매 시작',
    '멤버십 한정 디지털 굿즈 업데이트',
  ],
  OTHERS: [
    '공식 팬클럽 {n}기 모집 안내',
    '서버 정기 점검 안내',
    '저작권 및 2차 창작 가이드라인 안내',
    '공식 커뮤니티 운영 정책 업데이트',
  ],
};

const pick = (arr, i) => arr[i % arr.length];

// 카테고리별 본문 도입부
const BODY_INTRO = {
  CONTENTS: '새로운 콘텐츠가 공개되었습니다. 멤버들의 새로운 모습을 지금 바로 만나보세요.',
  MUSIC: '새로운 음악으로 팬 여러분께 인사드립니다. 발매 및 공개 일정을 안내드립니다.',
  EVENT: '팬 여러분과 함께할 특별한 이벤트 소식을 전해드립니다.',
  GOODS: '공식 굿즈 관련 소식을 안내드립니다. 판매 일정과 구성품을 확인해 주세요.',
  OTHERS: '운영 및 서비스 관련 공지사항을 안내드립니다.',
};

// 상세 페이지 본문 생성
function makeContent(category, title, date) {
  return [
    '안녕하세요, DAY:OVE STAR 입니다.',
    BODY_INTRO[category],
    `■ 제목\n${title}`,
    `■ 일자\n${date}`,
    '■ 안내\n자세한 사항은 공식 홈페이지 및 SNS 채널 공지를 통해 확인하실 수 있습니다. 일정은 내부 사정에 따라 변경될 수 있으며, 변경 시 별도 공지로 안내드립니다.',
    '앞으로도 더 좋은 소식으로 찾아뵙겠습니다. 많은 관심과 사랑 부탁드립니다. 감사합니다.',
  ].join('\n\n');
}

// 2026-06-11 기준, 하루 3건씩 과거로 내려가는 날짜 생성
function makeDate(i) {
  const d = new Date('2026-06-11T00:00:00');
  d.setDate(d.getDate() - Math.floor(i / 3));
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

// 결정론적으로 total 개의 뉴스 아이템 생성 (무한 스크롤 안정성을 위해 랜덤 미사용)
export function generateNews(total = 327) {
  const cats = NEWS_CATEGORIES.filter((c) => c !== 'ALL');
  const items = [];
  for (let i = 0; i < total; i++) {
    const category = pick(cats, i);
    const template = pick(TITLE_TEMPLATES[category], Math.floor(i / cats.length));
    const title = template
      .replace('{member}', pick(MEMBERS, i))
      .replace('{n}', String(((i * 7) % 30) + 1));
    const date = makeDate(i);
    items.push({
      id: `news-${i + 1}`,
      category,
      title,
      date,
      gradient: GRADIENTS[category],
      content: makeContent(category, title, date),
    });
  }
  return items;
}

export const NEWS_ITEMS = generateNews(327);
