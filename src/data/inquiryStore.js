// 백엔드(API) 연동 문의(Inquiry)/문의 카테고리 스토어 — 전부 비동기입니다.
//
// 흐름 메모:
//  - 방문자(비회원)는 Contact 페이지에서 문의를 등록합니다.
//      1) POST /api/inquiryPost/  { name, gender, email, phone, categoryId, contactContent }
//         → 백엔드가 Visitor 를 먼저 만들고 InquiryPost 를 생성, { id } 를 돌려줍니다.
//      2) (첨부가 있으면) POST /api/inquiryPost/:id/file  (multipart, field 명 "files")
//  - 문의 "열람"은 운영자(로그인) 전용입니다. GET /api/inquiryPost/ 는 토큰이 필요합니다.
//  - 카테고리 목록(GET /api/inquiryCategory/)은 공개 폼의 선택지로 쓰이므로 인증 없이 조회됩니다.

import axiosInstance from '../lib/axios';

/* ───────────── 카테고리 색상(그라디언트) ───────────── */
// 문의 섹션은 게시글(보라)과 구분되도록 청록 계열 팔레트를 사용합니다.
const CATEGORY_GRADIENTS = [
  ['#22d3ee', '#3b82f6'], // cyan → blue
  ['#2dd4bf', '#06b6d4'], // teal → cyan
  ['#38bdf8', '#6366f1'], // sky → indigo
  ['#34d399', '#22d3ee'], // emerald → cyan
  ['#60a5fa', '#22d3ee'], // blue → cyan
  ['#5eead4', '#0ea5e9'], // teal → sky
  ['#818cf8', '#06b6d4'], // indigo → cyan
  ['#67e8f9', '#3b82f6'], // light cyan → blue
];

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
function formatDateTime(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd} ${hh}:${mi}`;
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic)$/i;

// 클라우드 업로드 키는 "files/<timestamp>-<rand><ext>" 형태라 원본 파일명은 없습니다.
// URL 의 마지막 경로 조각을 표시명으로 사용합니다.
function fileNameFromUrl(url) {
  try {
    const clean = String(url || '').split('?')[0];
    const last = clean.substring(clean.lastIndexOf('/') + 1);
    return decodeURIComponent(last) || '첨부파일';
  } catch {
    return '첨부파일';
  }
}

function normalizeFile(f) {
  const url = f.filePath ?? '';
  return {
    id: f.id,
    url,
    name: fileNameFromUrl(url),
    isImage: IMAGE_EXT.test(url.split('?')[0] || ''),
  };
}

/* ───────────── 카테고리 ───────────── */
// 목록: GET /api/inquiryCategory/ → { categoryList: [{ id, categoryName, ... }] }
export async function getInquiryCategories() {
  try {
    const res = await axiosInstance.get('/api/inquiryCategory/');
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

// 생성: POST /api/inquiryCategory/ { categoryName }  (운영자 로그인 필요)
export async function addInquiryCategory(name) {
  const res = await axiosInstance.post('/api/inquiryCategory/', {
    categoryName: name.trim(),
  });
  const c = res.data || {};
  return { id: c.id, name: c.categoryName ?? name.trim() };
}

// 삭제: DELETE /api/inquiryCategory/delete { id }  (body 로 보내야 하므로 { data })
export async function deleteInquiryCategory(id) {
  await axiosInstance.delete('/api/inquiryCategory/delete', { data: { id } });
}

/* ───────────── 문의글 ───────────── */
// 서버 inquiryPost → 화면용 객체
function normalizeInquiry(p) {
  const visitor = p.Visitor || {};
  const category = p.Category || p.InquiryCategory || {};
  const files = Array.isArray(p.Files) ? p.Files.map(normalizeFile) : [];
  return {
    id: p.id,
    serverId: p.id,
    categoryId: p.categoryId,
    category: category.categoryName ?? '미분류',
    content: p.contactContent ?? '',
    visitor: {
      id: visitor.id,
      name: visitor.name ?? '',
      gender: visitor.gender ?? '',
      email: visitor.email ?? '',
      phone: visitor.phone ?? '',
    },
    files,
    createdAt: p.createdAt ? new Date(p.createdAt).getTime() : 0,
    date: formatDateTime(p.createdAt),
    gradient: gradientForCategory(p.categoryId ?? category.categoryName),
  };
}

// 목록 (최신순) — 운영자 전용. 토큰은 axios 인터셉터가 자동 첨부.
export async function getInquiries() {
  const res = await axiosInstance.get('/api/inquiryPost/');
  const list = res.data?.inquiryPostList ?? [];
  return list.map(normalizeInquiry).sort((a, b) => b.createdAt - a.createdAt);
}

// 생성: POST /api/inquiryPost/ (JSON). 방문자 정보 + 카테고리 + 내용.
// 반환: { id, visitorId, categoryId, contactContent }
export async function createInquiry({ name, gender, email, phone, categoryId, contactContent }) {
  const res = await axiosInstance.post('/api/inquiryPost/', {
    name: (name || '').trim(),
    gender,
    email: (email || '').trim(),
    phone: (phone || '').trim(),
    categoryId,
    contactContent: contactContent ?? '',
  });
  const created = res.data || {};
  return { id: created.id, ...created };
}

// 첨부 업로드: File[] → POST /api/inquiryPost/:id/file (multipart, field "files", 최대 5개)
// Content-Type 은 axios 인터셉터가 FormData 를 감지해 자동 처리합니다.
export async function uploadInquiryFiles(inquiryPostId, files) {
  const list = Array.from(files || []);
  if (list.length === 0) return null;
  const fd = new FormData();
  list.forEach((f) => fd.append('files', f));
  const res = await axiosInstance.post(`/api/inquiryPost/${inquiryPostId}/file`, fd);
  return res.data;
}

// 삭제: DELETE /api/inquiryPost/delete { id }  (운영자 로그인 필요)
export async function deleteInquiry(serverId) {
  await axiosInstance.delete('/api/inquiryPost/delete', { data: { id: serverId } });
}
