// 운영자 전용 "문의" 콘솔.
//  - 탭 1) 문의 내역  : 방문자가 남긴 문의글 + 첨부파일 열람 / 검색 / 삭제
//  - 탭 2) 문의 카테고리 : 문의 분류(카테고리) 생성 / 삭제
// 게시글(보라) 섹션과 시각적으로 구분되도록 청록(cyan/teal) 톤을 씁니다.
// 자기 데이터(문의·카테고리)는 스스로 불러옵니다 — Admin 의 게시글 상태에 의존하지 않습니다.

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getInquiries,
  deleteInquiry,
  getInquiryCategories,
  addInquiryCategory,
  deleteInquiryCategory,
} from '../data/inquiryStore';

const inputClass =
  'w-full bg-(--input-bg) border border-(--border) rounded-xl px-4 py-3 text-sm text-(--text) placeholder:text-(--text-soft) focus:outline-none focus:border-cyan-500 transition-colors';

/* ───────────────────────── 아이콘 (자체 정의) ───────────────────────── */
function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function Sparkle({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2 Q13 10 22 12 Q13 14 12 22 Q11 14 2 12 Q11 10 12 2 Z" />
    </svg>
  );
}
function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
function PhoneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}
function PaperclipIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
function DownloadIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}
function RefreshIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
function InboxIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  );
}

/* ───────────────────────── 공용 ───────────────────────── */
function EmptyState({ title, sub }) {
  return (
    <div className="bg-(--surface) border border-(--border) rounded-3xl p-10 text-center">
      <p className="text-sm text-(--text-muted)">{title}</p>
      {sub && <p className="text-xs text-(--text-soft) mt-1">{sub}</p>}
    </div>
  );
}

function genderTone(g) {
  if (g === '남성') return 'bg-sky-500/15 text-sky-400';
  if (g === '여성') return 'bg-pink-500/15 text-pink-400';
  return 'bg-(--input-bg) text-(--text-soft)';
}

/* ───────────────────────── 탭 (cyan) ───────────────────────── */
function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
    >
      {active && (
        <motion.span
          layoutId="inquiry-tab-pill"
          className="absolute inset-0 rounded-xl bg-linear-to-r from-cyan-500 to-indigo-600"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className={`relative z-10 ${active ? 'text-white' : 'text-(--text-muted)'}`}>
        {children}
      </span>
    </button>
  );
}

function Tabs({ tab, onChange, listCount, categoryCount }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl bg-(--surface) border border-(--border) mb-6">
      <TabButton active={tab === 'list'} onClick={() => onChange('list')}>
        문의 내역
        <span className={`ml-1.5 ${tab === 'list' ? 'text-white/80' : 'text-cyan-400'}`}>
          {listCount}
        </span>
      </TabButton>
      <TabButton active={tab === 'category'} onClick={() => onChange('category')}>
        문의 카테고리
        <span className={`ml-1.5 ${tab === 'category' ? 'text-white/80' : 'text-cyan-400'}`}>
          {categoryCount}
        </span>
      </TabButton>
    </div>
  );
}

/* ───────────────────────── 첨부 ───────────────────────── */
function AttachmentGrid({ files }) {
  if (!files || files.length === 0) return null;
  const images = files.filter((f) => f.isImage);
  const others = files.filter((f) => !f.isImage);

  return (
    <div className="mt-3.5 space-y-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-(--text-soft)">
        <PaperclipIcon className="w-3.5 h-3.5" />
        첨부 {files.length}개
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              title={f.name}
              className="relative block w-20 h-20 rounded-xl overflow-hidden border border-(--border) hover:border-cyan-500/60 transition-colors group"
            >
              <img src={f.url} alt={f.name} loading="lazy" className="w-full h-full object-cover" />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </a>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {others.map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              download
              title={f.name}
              className="inline-flex items-center gap-2 max-w-full px-3 py-2 rounded-xl bg-(--input-bg) border border-(--border) text-xs font-medium text-(--text-muted) hover:text-cyan-400 hover:border-cyan-500/60 transition-colors"
            >
              <DownloadIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{f.name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── 문의 카드 ───────────────────────── */
function InquiryCard({ item, onDelete }) {
  const initial = (item.visitor.name || '?').trim().charAt(0) || '?';
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-(--surface) border border-(--border) rounded-3xl p-5 sm:p-6"
    >
      {/* 상단: 방문자 + 카테고리/날짜 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="shrink-0 grid place-items-center w-11 h-11 rounded-2xl text-white font-bold"
            style={{ backgroundImage: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})` }}
            aria-hidden="true"
          >
            {initial}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-(--text) truncate">{item.visitor.name || '이름 없음'}</p>
              {item.visitor.gender && (
                <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${genderTone(item.visitor.gender)}`}>
                  {item.visitor.gender}
                </span>
              )}
            </div>
            <p className="text-[11px] text-(--text-soft)">{item.date}</p>
          </div>
        </div>

        <span className="shrink-0 inline-block px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 text-[11px] font-bold tracking-wide">
          {item.category}
        </span>
      </div>

      {/* 연락처 */}
      <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-(--text-muted)">
        {item.visitor.email && (
          <a href={`mailto:${item.visitor.email}`} className="inline-flex items-center gap-1.5 hover:text-cyan-400 transition-colors">
            <MailIcon className="w-3.5 h-3.5 text-(--text-soft)" />
            {item.visitor.email}
          </a>
        )}
        {item.visitor.phone && (
          <a href={`tel:${item.visitor.phone}`} className="inline-flex items-center gap-1.5 hover:text-cyan-400 transition-colors">
            <PhoneIcon className="w-3.5 h-3.5 text-(--text-soft)" />
            {item.visitor.phone}
          </a>
        )}
      </div>

      {/* 본문 */}
      {item.content && (
        <div className="mt-3.5 p-3.5 rounded-2xl bg-(--input-bg) border border-(--border)">
          <p className="text-sm text-(--text) whitespace-pre-wrap break-words leading-relaxed">{item.content}</p>
        </div>
      )}

      {/* 첨부 */}
      <AttachmentGrid files={item.files} />

      {/* 삭제 */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          삭제
        </button>
      </div>
    </motion.li>
  );
}

/* ───────────────────────── 문의 내역 탭 ───────────────────────── */
function InquiryList({ inquiries, loading, error, onReload, onChanged }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inquiries;
    return inquiries.filter((it) => {
      const v = it.visitor || {};
      return (
        (v.name || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q) ||
        (v.phone || '').toLowerCase().includes(q) ||
        (it.content || '').toLowerCase().includes(q) ||
        (it.category || '').toLowerCase().includes(q)
      );
    });
  }, [inquiries, query]);

  const handleDelete = async (item) => {
    if (!window.confirm(`'${item.visitor.name || '이 방문자'}'님의 문의를 삭제할까요?`)) return;
    try {
      await deleteInquiry(item.serverId);
      await onChanged();
    } catch (err) {
      window.alert(err?.response?.data?.err || '문의를 삭제하지 못했어요. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="space-y-5">
      {/* 검색 + 새로고침 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-(--text-soft)" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 · 이메일 · 연락처 · 내용 · 카테고리로 검색"
            className={`${inputClass} pl-11`}
          />
        </div>
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          title="새로고침"
          className="shrink-0 grid place-items-center w-12 rounded-xl border border-(--border) text-(--text-muted) hover:text-cyan-400 hover:border-cyan-500/60 transition-colors disabled:opacity-50"
        >
          <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <EmptyState title="문의를 불러오지 못했어요." sub={error} />
      ) : loading && inquiries.length === 0 ? (
        <EmptyState title="문의를 불러오는 중…" />
      ) : inquiries.length === 0 ? (
        <div className="bg-(--surface) border border-(--border) rounded-3xl p-12 text-center">
          <InboxIcon className="w-9 h-9 mx-auto text-(--text-soft)" />
          <p className="text-sm text-(--text-muted) mt-3">아직 접수된 문의가 없어요.</p>
          <p className="text-xs text-(--text-soft) mt-1">방문자가 문의를 남기면 여기에 표시됩니다.</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="검색 결과가 없어요." sub="다른 검색어로 다시 찾아보세요." />
      ) : (
        <>
          <p className="text-xs text-(--text-soft)">
            전체 {inquiries.length}건{query.trim() && ` 중 ${filtered.length}건 표시`}
          </p>
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {filtered.map((it) => (
                <InquiryCard key={it.id} item={it} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}
    </div>
  );
}

/* ───────────────────────── 문의 카테고리 탭 ───────────────────────── */
function InquiryCategoryManager({ categories, onChanged }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const create = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    setError('');
    if (!trimmed) {
      setError('카테고리 이름을 입력해 주세요.');
      return;
    }
    if (categories.some((c) => c.name === trimmed)) {
      setError('이미 있는 카테고리예요.');
      return;
    }
    setBusy(true);
    try {
      await addInquiryCategory(trimmed);
      setName('');
      await onChanged();
    } catch (err) {
      setError(err?.response?.data?.err || '카테고리를 만들지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (cat) => {
    if (
      !window.confirm(
        `‘${cat.name}’ 카테고리를 삭제할까요?\n이 카테고리로 접수된 문의글도 함께 삭제됩니다.`
      )
    )
      return;
    try {
      await deleteInquiryCategory(cat.id);
      await onChanged();
    } catch (err) {
      window.alert(err?.response?.data?.err || '카테고리를 삭제하지 못했어요.');
    }
  };

  return (
    <div className="bg-(--surface) border border-(--border) rounded-3xl p-5 sm:p-7 backdrop-blur-xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-(--text) flex items-center gap-2 mb-1">
          <Sparkle className="w-4 h-4 text-cyan-400" />
          문의 카테고리 관리
        </h2>
        <p className="text-xs text-(--text-soft)">
          방문자가 문의를 남길 때 선택하는 분류를 만들고 지웁니다. 최소 1개가 있어야 문의를 받을 수 있어요.
        </p>
      </div>

      {/* 생성 폼 */}
      <form onSubmit={create} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 제휴 문의, 채용, 기술 지원…"
          maxLength={50}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 px-5 rounded-xl bg-linear-to-r from-cyan-500 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {busy ? '추가 중…' : '추가'}
        </button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-rose-400 font-medium"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* 목록 */}
      {categories.length === 0 ? (
        <EmptyState title="아직 문의 카테고리가 없어요." sub="위에서 첫 카테고리를 만들어 보세요." />
      ) : (
        <ul className="space-y-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-(--input-bg) border border-(--border)"
            >
              <span className="inline-flex items-center gap-2.5 min-w-0">
                <span
                  className="shrink-0 w-6 h-6 rounded-md ring-1 ring-black/5"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${(c.gradient || ['#22d3ee', '#3b82f6'])[0]}, ${(c.gradient || ['#22d3ee', '#3b82f6'])[1]})`,
                  }}
                  aria-hidden="true"
                />
                <span className="inline-block px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 text-[11px] font-bold tracking-wide truncate">
                  {c.name}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(c)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────────────────────── 진입점 ───────────────────────── */
export default function InquiryConsole() {
  const [tab, setTab] = useState('list'); // 'list' | 'category'
  const [inquiries, setInquiries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInquiries = async () => {
    setLoading(true);
    setError('');
    try {
      setInquiries(await getInquiries());
    } catch (err) {
      setError(err?.response?.data?.err || '목록을 불러오는 중 문제가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => setCategories(await getInquiryCategories());

  useEffect(() => {
    loadInquiries();
    loadCategories();
  }, []);

  // 카테고리 삭제는 문의글까지 함께 지우므로(CASCADE) 두 목록을 같이 갱신합니다.
  const handleCategoriesChanged = async () => {
    await loadCategories();
    await loadInquiries();
  };

  return (
    <div>
      <Tabs tab={tab} onChange={setTab} listCount={inquiries.length} categoryCount={categories.length} />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'list' && (
            <InquiryList
              inquiries={inquiries}
              loading={loading}
              error={error}
              onReload={loadInquiries}
              onChanged={loadInquiries}
            />
          )}
          {tab === 'category' && (
            <InquiryCategoryManager categories={categories} onChanged={handleCategoriesChanged} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
