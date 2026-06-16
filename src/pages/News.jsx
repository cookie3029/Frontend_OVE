import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedText from '../components/AnimatedText';
import { getAllNews, getCategories } from '../data/postsStore';
import { BATCH, listCache } from '../data/newsListCache';
import { useAuth } from '../hooks/useAuth';

// 4각 반짝임 아이콘
function Sparkle({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2 Q13 10 22 12 Q13 14 12 22 Q11 14 2 12 Q11 10 12 2 Z" />
    </svg>
  );
}

// NEWS 타이틀 위의 궤도+반짝임 장식
function OrbitSparkle({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="newsSpark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <ellipse
        cx="24"
        cy="26"
        rx="19"
        ry="6.5"
        transform="rotate(-22 24 26)"
        fill="none"
        stroke="url(#newsSpark)"
        strokeWidth="1.6"
        opacity="0.7"
      />
      <path d="M24 5 Q26.5 21.5 43 24 Q26.5 26.5 24 43 Q21.5 26.5 5 24 Q21.5 21.5 24 5 Z" fill="url(#newsSpark)" />
      <circle cx="40" cy="12" r="1.8" fill="#c4b5fd" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function NewsCard({ item }) {
  return (
    <div className="flex items-center gap-4 md:gap-6 bg-(--surface) rounded-2xl border border-(--border) shadow-[0_2px_12px_rgba(124,109,242,0.06)] hover:shadow-[0_6px_20px_rgba(124,109,242,0.14)] transition-shadow p-3 md:p-4">
      {/* 썸네일: 사진이 있으면 사진, 없으면 카테고리 그라데이션 */}
      <div
        className="relative shrink-0 w-32 h-24 md:w-60 md:h-36 rounded-xl overflow-hidden"
        style={item.image ? undefined : { backgroundImage: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})` }}
      >
        {item.image ? (
          <>
            <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {/* 좌상단 라벨 가독성을 위한 옅은 스크림 */}
            <div className="absolute inset-x-0 top-0 h-12 bg-linear-to-b from-black/45 to-transparent" />
          </>
        ) : (
          <div
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 25%, #fff, transparent 60%)' }}
          />
        )}
        <span className="absolute left-3 top-2 text-white/85 font-black text-[10px] md:text-xs tracking-[0.2em]">
          DAY:OVE
        </span>
        {item.images && item.images.length > 1 && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/55 text-white text-[10px] font-bold backdrop-blur">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            {item.images.length}
          </span>
        )}
        <Sparkle className="absolute right-2.5 bottom-2.5 w-5 h-5 md:w-7 md:h-7 text-white/70" />
      </div>

      {/* 본문 */}
      <div className="min-w-0 flex-1 space-y-2 md:space-y-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-500 text-white text-[10px] md:text-xs font-bold tracking-wide">
          <Sparkle className="w-3 h-3" />
          {item.category}
        </span>
        <h3 className="text-sm md:text-xl font-bold text-(--text) leading-snug line-clamp-2">{item.title}</h3>
        <p className="text-xs md:text-sm text-(--text-muted) font-medium">{item.date}</p>
      </div>
    </div>
  );
}

export default function News() {
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);
  const { isAdmin } = useAuth();

  // 운영자 게시글 + 기본 뉴스 를 마운트 시 한 번 읽어옵니다 (새 글이 반영되도록).
  const [allNews, setAllNews] = useState(() => []);

  useEffect(() => {
    let alive = true;
    getAllNews().then((list) => { if (alive) setAllNews(list); });
    return () => { alive = false; };
  }, []);

  // 카테고리 필터바도 백엔드 카테고리로 동기화 ('ALL' + 실제 카테고리)
  const [categories, setCategories] = useState(['ALL']);

  useEffect(() => {
    let alive = true;
    getCategories().then((cats) => {
      if (alive) setCategories(['ALL', ...cats.map((c) => c.name)]);
    });
    return () => { alive = false; };
  }, []);

  const [category, setCategory] = useState(listCache.category);
  const [query, setQuery] = useState(listCache.query);
  const [visible, setVisible] = useState(listCache.visible);

  const trimmedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = category === 'ALL' ? allNews : allNews.filter((n) => n.category === category);
    if (trimmedQuery) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(trimmedQuery) ||
          n.category.toLowerCase().includes(trimmedQuery) ||
          (n.text && n.text.toLowerCase().includes(trimmedQuery))
      );
    }
    return list;
  }, [category, trimmedQuery, allNews]);

  const filteredRef = useRef(filtered);
  filteredRef.current = filtered;

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const isSearching = trimmedQuery.length > 0;
  const listVisible = filtered.length > 0;

  // 로드 개수 캐시 갱신
  useEffect(() => {
    listCache.visible = visible;
  }, [visible]);

  // 복귀 시 스크롤 위치 복원 (visible 만큼 카드가 렌더된 뒤 적용)
  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = listCache.scrollTop;
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) listCache.scrollTop = scrollRef.current.scrollTop;
  };

  // 무한 스크롤: 스크롤 컨테이너를 root 로 하는 IntersectionObserver.
  // 검색 결과가 0건이 되면 센티넬이 사라지므로, 목록 표시 여부가 바뀔 때
  // 옵저버를 다시 구독해 (새로 생성된) 센티넬을 관찰하도록 합니다.
  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(v + BATCH, filteredRef.current.length));
        }
      },
      { root, rootMargin: '300px', threshold: 0 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [listVisible]);

  // 필터/검색 변경 시 처음부터 다시 보여주고 맨 위로
  const resetView = () => {
    setVisible(BATCH);
    listCache.visible = BATCH;
    listCache.scrollTop = 0;
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const selectCategory = (cat) => {
    if (cat === category) return;
    setCategory(cat);
    listCache.category = cat;
    resetView();
  };

  const onSearchChange = (value) => {
    setQuery(value);
    listCache.query = value;
    resetView();
  };

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="relative h-screen overflow-y-auto bg-(--bg)">
      {/* 상단 우측 은은한 보라 장식 */}
      <div className="pointer-events-none absolute top-0 right-0 w-160 h-112 -translate-y-1/3 translate-x-1/4 rounded-full bg-violet-300/30 blur-[110px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 pt-28 md:pt-32 pb-20">
        {/* 타이틀 */}
        <div className="flex flex-col items-center text-center mb-8">
          <OrbitSparkle className="w-12 h-12 md:w-14 md:h-14 mb-1" />
          <AnimatedText
            as="h1"
            text="NEWS"
            gradient={['#8b5cf6', '#6366f1', '#60a5fa']}
            rise={0}
            stagger={0.06}
            className="text-5xl md:text-7xl font-black tracking-tight drop-shadow-[0_2px_8px_rgba(129,140,248,0.25)]"
          />
        </div>

        {/* 검색 */}
        <div className="max-w-xl mx-auto mb-6">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-(--text-soft)" />
            <input
              type="search"
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="제목 · 카테고리 · 내용 검색"
              aria-label="게시글 검색"
              className="w-full bg-(--input-bg) border border-(--border) rounded-full pl-11 pr-11 py-3 text-sm text-(--text) placeholder:text-(--text-soft) focus:outline-none focus:border-violet-500 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="검색어 지우기"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-(--text-soft) hover:text-(--text) hover:bg-(--surface-2) transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8">
          {categories.map((cat) => {
            const active = cat === category;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => selectCategory(cat)}
                className={`px-4 md:px-5 py-2 rounded-full border text-xs md:text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-violet-500 border-violet-500 text-white'
                    : 'bg-(--surface) border-(--border) text-(--text-muted) hover:text-(--text) hover:border-(--border-strong)'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 건수 + 운영자 글쓰기 버튼 */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-sm text-(--text-soft)">
            {isSearching ? (
              <>
                <span className="font-bold text-(--text)">‘{query.trim()}’</span> 검색 결과{' '}
                <span className="font-bold text-(--text)">{filtered.length}건</span>
              </>
            ) : (
              <span className="font-bold text-(--text)">총 {filtered.length}건</span>
            )}
          </p>

          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-linear-to-r from-violet-500 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <span className="text-base leading-none">＋</span> 새 글 작성
            </Link>
          )}
        </div>

        {/* 리스트 또는 빈 결과 */}
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center gap-3">
            <Sparkle className="w-10 h-10 text-violet-300" />
            {isSearching ? (
              <>
                <p className="text-(--text-muted) font-medium">검색 결과가 없어요.</p>
                <p className="text-xs text-(--text-soft)">다른 키워드나 카테고리로 찾아보세요.</p>
              </>
            ) : (
              <>
                <p className="text-(--text-muted) font-medium">아직 등록된 소식이 없어요.</p>
                <p className="text-xs text-(--text-soft)">운영자 콘솔에서 첫 게시글을 올려보세요.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {shown.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: (i % BATCH) * 0.06 }}
                >
                  <Link to={`/news/${item.id}?cat=${category}`} className="block">
                    <NewsCard item={item} />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* 무한 스크롤 센티넬 + 상태 표시 */}
            <div ref={sentinelRef} className="h-12 mt-6 flex items-center justify-center">
              {hasMore ? (
                <span className="flex items-center gap-2 text-xs text-violet-400">
                  <span className="h-4 w-4 rounded-full border-2 border-violet-300 border-t-violet-500 animate-spin" />
                  불러오는 중…
                </span>
              ) : (
                <span className="text-xs text-(--text-muted)">모든 소식을 불러왔어요</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
