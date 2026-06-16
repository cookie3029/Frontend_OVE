// NEWS 목록의 필터/검색어/로드 개수/스크롤 위치를 상세 페이지 왕복 간 유지하기 위한 모듈 캐시.
// 운영자가 글을 새로 쓰거나 삭제하면 reset 해서 목록을 처음부터 다시 보여줍니다.

export const BATCH = 8; // 무한 스크롤에서 한 번에 불러오는 개수

export const listCache = {
  category: 'ALL',
  query: '',
  visible: BATCH,
  scrollTop: 0,
};

export function resetNewsListCache() {
  listCache.category = 'ALL';
  listCache.query = '';
  listCache.visible = BATCH;
  listCache.scrollTop = 0;
}
