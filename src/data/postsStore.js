// 백엔드(API) 연동 게시글/카테고리 스토어 — 전부 비동기입니다.
//
// 백엔드 메모:
//  - Article 에 title 컬럼이 추가되어, 제목/본문을 각각의 필드로 주고받습니다.
//  - 인증은 axios 인터셉터가 accesstoken/refreshtoken 헤더로 자동 전송합니다.
//  - 정렬은 createdAt 기준, 식별자는 'user-<서버PK>' 로 만들어 기존 코드와 호환.

import axiosInstance from '../lib/axios';

/* ───────────── 카테고리 색상(그라디언트) ───────────── */
// 카테고리마다 자동으로 색을 배정합니다. 카테고리 id 로 결정되므로
// 같은 카테고리는 항상 같은 색이고(새로고침해도 동일), 서로는 다른 색을 받습니다.
const CATEGORY_GRADIENTS = [
  ['#a78bfa', '#6366f1'], // violet → indigo
  ['#f472b6', '#a855f7'], // pink → purple
  ['#818cf8', '#4f46e5'], // indigo
  ['#34d399', '#22d3ee'], // emerald → cyan
  ['#fbbf24', '#fb7185'], // amber → rose
  ['#60a5fa', '#a78bfa'], // blue → violet
  ['#f87171', '#fb923c'], // red → orange
  ['#2dd4bf', '#3b82f6'], // teal → blue
  ['#c084fc', '#ec4899'], // purple → pink
  ['#38bdf8', '#818cf8'], // sky → indigo
];

// 숫자를 잘 흩뿌려서 순차 id 도 팔레트 전체에 골고루 퍼지게 (보기엔 랜덤)
function hashNum(n) {
  let x = (Number(n) ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

function gradientForCategory(key) {
  const seed =
    typeof key === 'number' && !isNaN(key)
      ? key
      : String(key ?? '')
          .split('')
          .reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);
  return CATEGORY_GRADIENTS[hashNum(seed) % CATEGORY_GRADIENTS.length];
}

/* ───────────── 유틸 ───────────── */
function formatDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

// 본문(마크다운)에서 이미지 URL 추출 / 이미지 마크다운 제거(검색·미리보기용 순수 텍스트)
const IMAGE_MD = '!\\[[^\\]]*\\]\\(([^)]+)\\)';

function extractImages(md) {
  const urls = [];
  const re = new RegExp(IMAGE_MD, 'g');
  let m;
  while ((m = re.exec(md || '')) !== null) urls.push(m[1]);
  return urls;
}

function stripImages(md) {
  return (md || '')
    .replace(new RegExp(IMAGE_MD, 'g'), ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ───────────── 카테고리 ───────────── */
// 목록: GET /articleCategory/ → { categoryList: [{ id, categoryName, ... }] }
export async function getCategories() {
  try {
    const res = await axiosInstance.get('/api/articleCategory/');
    const list = res.data?.categoryList ?? [];
    return list.map((c) => ({
      id: c.id,
      name: c.categoryName,
      gradient: gradientForCategory(c.id),
    }));
  } catch {
    return [];
  }
}

// 생성: POST /articleCategory/ { categoryName }  (로그인 필요)
export async function addCategory(name) {
  const res = await axiosInstance.post('/api/articleCategory/', {
    categoryName: name.trim(),
  });
  const c = res.data || {};
  return { id: c.id, name: c.categoryName ?? name.trim() };
}

// 삭제: DELETE /articleCategory/delete { id }  (body 에 담아야 하므로 { data })
export async function deleteCategory(id) {
  await axiosInstance.delete('/api/articleCategory/delete', { data: { id } });
}

/* ───────────── 게시글 ───────────── */
// 서버 article → 화면용 객체. content 는 텍스트 + 이미지 마크다운(![](url))이 섞인 문자열.
function normalize(a) {
  const category = a.ArticleCategory?.categoryName ?? '';
  const raw = a.content ?? '';
  const images = extractImages(raw); // 본문에서 이미지 URL 추출
  return {
    id: `user-${a.id}`, // 기존 코드가 'user-' 접두사로 운영자 글을 구분 → 유지
    serverId: a.id, // 실제 수정/삭제 API 에 쓰는 서버 PK
    categoryId: a.categoryId,
    category,
    title: a.title ?? '',
    content: raw, // 상세 페이지에서 인라인 렌더할 원본
    text: stripImages(raw), // 이미지 제거한 순수 텍스트 (검색·미리보기)
    image: images[0] ?? null, // 목록 썸네일 = 첫 이미지
    images,
    isUserPost: true,
    createdAt: a.createdAt ? new Date(a.createdAt).getTime() : Date.now(),
    date: formatDate(a.createdAt),
    gradient: gradientForCategory(a.categoryId ?? category),
  };
}

// 목록 (최신순)
export async function getUserPosts() {
  try {
    const res = await axiosInstance.get('/api/article/');
    const list = res.data?.articleList ?? [];
    return list.map(normalize).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

// 이미지 업로드 전용: File[] → POST /article/image (multipart) → URL 배열.
// 에디터에서 이미지를 고르는 즉시 호출해 URL 을 받아 본문에 ![](url) 로 삽입합니다.
export async function uploadImages(files) {
  const list = Array.from(files || []);
  if (list.length === 0) return [];
  const fd = new FormData();
  list.forEach((f) => fd.append('images', f));
  // Content-Type 은 axios 인터셉터가 FormData 를 감지해 자동 처리(multipart 경계 설정).
  const res = await axiosInstance.post('/api/article/image', fd);
  return res.data?.urls ?? [];
}

// 생성: POST /article/ (JSON). content 는 텍스트 + 이미지 마크다운 문자열.
export async function addUserPost({ title, categoryId, content }) {
  const res = await axiosInstance.post('/api/article/', {
    categoryId,
    title: (title || '').trim(),
    content: content ?? '',
  });
  const created = res.data || {}; // { id, title, content }
  return { id: `user-${created.id}`, serverId: created.id, title: created.title ?? title };
}

// 수정: PUT /article/updateArticle (JSON) — 제목/본문만. (카테고리는 변경 불가)
export async function updateUserPost(serverId, { title, content }) {
  const res = await axiosInstance.put('/api/article/updateArticle', {
    id: serverId,
    title: (title || '').trim(),
    content: content ?? '',
  });
  return res.data;
}

// 삭제: DELETE /article/delete { id }
export async function deleteUserPost(serverId) {
  await axiosInstance.delete('/api/article/delete', { data: { id: serverId } });
}

/* ───────────── 합친 피드 ───────────── */
// 이제 서버 글만 보여줍니다. (데모용 가짜 데이터 NEWS_ITEMS 제거)
export async function getAllNews() {
  return await getUserPosts();
}

export async function getNewsById(id) {
  const all = await getAllNews();
  return all.find((n) => String(n.id) === String(id)) || null;
}

export function isUserPostId(id) {
  return typeof id === 'string' && id.startsWith('user-');
}
