import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { getNewsById, getAllNews, isUserPostId, deleteUserPost } from '../data/postsStore';
import { resetNewsListCache } from '../data/newsListCache';
import { useAuth } from '../hooks/useAuth';

// 4각 반짝임 아이콘
function Sparkle({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2 Q13 10 22 12 Q13 14 12 22 Q11 14 2 12 Q11 10 12 2 Z" />
    </svg>
  );
}

// 본문(텍스트 + 이미지 마크다운 ![](url))을 "순서대로" 인라인 렌더
function ArticleBody({ content }) {
  const raw = content ?? '';
  const re = /!\[[^\]]*\]\(([^)]+)\)/g;
  const parts = [];
  let last = 0;
  let m;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: raw.slice(last, m.index) });
    parts.push({ type: 'image', url: m[1] });
    last = m.index + m[0].length;
  }
  if (last < raw.length) parts.push({ type: 'text', value: raw.slice(last) });

  return (
    <div className="min-h-40">
      {parts.map((p, i) => {
        if (p.type === 'image') {
          return (
            <img
              key={i}
              src={p.url}
              alt=""
              loading="lazy"
              className="my-5 w-full rounded-2xl border border-(--border)"
            />
          );
        }
        const text = p.value.trim();
        if (!text) return null;
        return (
          <div
            key={i}
            className="my-3 text-sm md:text-base text-(--text-muted) leading-relaxed whitespace-pre-wrap wrap-break-word"
          >
            {text}
          </div>
        );
      })}
    </div>
  );
}

export default function NewsDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // 데이터는 비동기로 불러옵니다 (서버 + 기본 뉴스).
  const [item, setItem] = useState(null);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getNewsById(id), getAllNews()])
      .then(([found, list]) => {
        if (!alive) return;
        setItem(found);
        setAll(list);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  // 로딩 중
  if (loading) {
    return (
      <div className="h-screen overflow-y-auto bg-(--bg)">
        <div className="max-w-3xl mx-auto px-5 pt-28 md:pt-32 pb-20 flex flex-col items-center text-center gap-3">
          <span className="h-6 w-6 rounded-full border-2 border-violet-300 border-t-violet-500 animate-spin" />
          <p className="text-sm text-(--text-soft)">불러오는 중…</p>
        </div>
      </div>
    );
  }

  // 존재하지 않는 글 처리
  if (!item) {
    return (
      <div className="h-screen overflow-y-auto bg-(--bg)">
        <div className="max-w-3xl mx-auto px-5 pt-28 md:pt-32 pb-20 flex flex-col items-center text-center gap-4">
          <p className="text-(--text-soft)">존재하지 않는 게시글입니다.</p>
          <Link
            to="/news"
            className="px-5 py-2.5 rounded-full bg-violet-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 목록에서 넘어온 카테고리 컨텍스트. 'ALL' 이면 전체 기준, 아니면 해당 글의 카테고리 안에서만 이동.
  const cat = searchParams.get('cat') === 'ALL' ? 'ALL' : item.category;
  const list = cat === 'ALL' ? all : all.filter((n) => n.category === cat);
  const index = list.findIndex((n) => n.id === item.id);
  const prev = index > 0 ? list[index - 1] : null; // 더 최신 글 (같은 카테고리)
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null; // 더 이전 글 (같은 카테고리)

  const canManage = isAdmin && isUserPostId(item.id);

  const handleDelete = async () => {
    if (!window.confirm(`'${item.title}' 게시글을 삭제할까요?`)) return;
    try {
      await deleteUserPost(item.serverId);
      resetNewsListCache();
      navigate('/news');
    } catch (err) {
      window.alert(err?.response?.data?.err || '삭제하지 못했어요. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-(--bg)">
      <div className="relative z-10 max-w-3xl mx-auto px-5 md:px-8 pt-28 md:pt-32 pb-20">
        {/* 뒤로 + (운영자) 삭제 */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/news"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-500 hover:text-violet-600 transition-colors"
          >
            <span aria-hidden="true">←</span> NEWS 목록
          </Link>
          {canManage && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/10 transition-colors"
            >
              게시글 삭제
            </button>
          )}
        </div>

        {/* 히어로: 카테고리 그라데이션 배너 (사진은 본문 안에 인라인으로 표시) */}
        <div
          className="relative w-full aspect-16/7 rounded-2xl overflow-hidden mt-4 shadow-[0_8px_30px_rgba(124,109,242,0.18)]"
          style={{ backgroundImage: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})` }}
        >
          <div
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{ backgroundImage: 'radial-gradient(circle at 28% 22%, #fff, transparent 60%)' }}
          />
          <span className="absolute left-5 top-4 text-white/85 font-black text-sm tracking-[0.2em]">DAY:OVE</span>
          <Sparkle className="absolute right-5 bottom-5 w-10 h-10 text-white/70" />
        </div>

        {/* 메타 + 제목 */}
        <div className="mt-7">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-500 text-white text-xs font-bold tracking-wide">
            <Sparkle className="w-3 h-3" />
            {item.category}
          </span>
          <h1 className="mt-4 text-2xl md:text-4xl font-black text-(--text) leading-snug wrap-break-word">
            {item.title}
          </h1>
          <p className="mt-3 text-sm text-(--text-muted) font-medium">{item.date}</p>
        </div>

        <hr className="my-7 border-(--border)" />

        {/* 본문 (텍스트 + 사진이 작성 순서대로 인라인 표시) */}
        <ArticleBody content={item.content} />

        {/* 이전 / 다음 글 */}
        <div className="mt-10 pt-6 border-t border-(--border) grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prev ? (
            <Link
              to={`/news/${prev.id}?cat=${cat}`}
              className="group p-4 rounded-xl bg-(--surface) border border-(--border) hover:border-(--border-strong) transition-colors"
            >
              <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">
                ← 이전 소식
              </span>
              <span className="block text-sm text-(--text) truncate group-hover:text-violet-400 transition-colors">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/news/${next.id}?cat=${cat}`}
              className="group p-4 rounded-xl bg-(--surface) border border-(--border) hover:border-(--border-strong) transition-colors sm:text-right"
            >
              <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">
                다음 소식 →
              </span>
              <span className="block text-sm text-(--text) truncate group-hover:text-violet-400 transition-colors">
                {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </div>

        {/* 목록으로 */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/news"
            className="px-6 py-2.5 rounded-full bg-violet-500 text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            목록으로
          </Link>
        </div>
      </div>
    </div>
  );
}
