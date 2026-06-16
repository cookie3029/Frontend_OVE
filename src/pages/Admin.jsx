import { useState, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedText from '../components/AnimatedText';
import InquiryConsole from '../components/InquiryConsole';
import { staggerContainer, staggerItem } from '../animations/variants';
import { useAuth } from '../hooks/useAuth';
import { WRITABLE_CATEGORIES } from '../data/newsData';
import {
  addUserPost,
  getUserPosts,
  deleteUserPost,
  updateUserPost,
  getCategories,
  addCategory,
  deleteCategory,
  uploadImages,
} from '../data/postsStore';
import { resetNewsListCache } from '../data/newsListCache';
import { fileToCompressedDataURL } from '../lib/image';

const inputClass =
  'w-full bg-(--input-bg) border border-(--border) rounded-xl px-4 py-3 text-sm text-(--text) placeholder:text-(--text-soft) focus:outline-none focus:border-violet-500 transition-colors';

// 압축된 data URL → File (서버 업로드용)
function dataUrlToFile(dataUrl, filename = 'image.jpg') {
  const [meta, b64] = dataUrl.split(',');
  const mime = (meta.match(/data:(.*?);/) || [])[1] || 'image/jpeg';
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new File([u8], filename, { type: mime });
}

/* ───────────────────────── 아이콘 ───────────────────────── */
function LockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
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

function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function EditIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ───────────────────────── 로그인 화면 ─────────────────────────
function LoginCard({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onLogin(email, password); // email, password 둘 다 전달 + await
    setSubmitting(false);
    if (!ok) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center px-6 md:px-20 pt-28 pb-16">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-sm w-full space-y-7 bg-(--surface) border border-(--border) p-6 sm:p-8 rounded-3xl backdrop-blur-xl"
      >
        <div className="text-center space-y-3">
          <motion.div variants={staggerItem} className="flex justify-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <LockIcon className="w-6 h-6" />
            </span>
          </motion.div>
          <AnimatedText
            as="h1"
            text="OPERATOR"
            className="font-black text-2xl sm:text-3xl text-(--text) tracking-tight"
            stagger={0.04}
          />
          <motion.p variants={staggerItem} className="text-xs text-(--text-soft)">
            운영자 전용 페이지입니다. 로그인 후 게시글을 작성할 수 있어요.
          </motion.p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <motion.div variants={staggerItem}>
            <label htmlFor="email" className="block text-[10px] font-mono tracking-wider text-(--text-muted) uppercase mb-1.5">
              email
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              className={inputClass}
              placeholder="운영자 이메일을 입력하세요"
            />
            <label htmlFor="password" className="block text-[10px] mt-4 font-mono tracking-wider text-(--text-muted) uppercase mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              className={inputClass}
              placeholder="운영자 비밀번호를 입력하세요"
            />
          </motion.div>

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

          <motion.button
            variants={staggerItem}
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-linear-to-r from-violet-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {submitting ? '로그인 중…' : '로그인'}
          </motion.button>

          <motion.div variants={staggerItem} className="text-center">
            <Link to="/news" className="text-xs text-(--text-soft) hover:text-(--text-muted) transition-colors">
              ← NEWS 로 돌아가기
            </Link>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}

// ───────────────────────── 게시글 입력 폼 (작성·수정 공용) ─────────────────────────
function PostForm({ initial, submitLabel, onSubmit, onCancel, categories = [], editing = false }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [imageBusy, setImageBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const contentRef = useRef(null);

  // 카테고리는 마운트 이후 비동기로 들어오므로, 작성 모드에서 값이 비어 있으면 첫 항목으로 맞춥니다.
  useEffect(() => {
    if (!editing && !categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, editing, categoryId]);

  // 커서 위치에 텍스트(이미지 마크다운)를 삽입
  const insertAtCursor = (text) => {
    const el = contentRef.current;
    const start = el ? el.selectionStart : content.length;
    const end = el ? el.selectionEnd : content.length;
    const next = content.slice(0, start) + text + content.slice(end);
    setContent(next);
    // 삽입 후 커서를 삽입한 텍스트 끝으로
    requestAnimationFrame(() => {
      if (el) {
        const pos = start + text.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  };

  // 이미지 선택 → 압축 → 업로드 → 본문 커서 위치에 ![](url) 삽입
  const handleInsertImages = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setError('');
    setImageBusy(true);
    try {
      const compressed = [];
      for (const f of files) {
        const dataUrl = await fileToCompressedDataURL(f);
        compressed.push(dataUrlToFile(dataUrl, `${Date.now()}-${f.name || 'image'}.jpg`));
      }
      const urls = await uploadImages(compressed);
      const md = urls.map((u) => `\n\n![](${u})\n\n`).join('');
      insertAtCursor(md);
    } catch (err) {
      setError(err?.response?.data?.err || err?.message || '이미지 업로드에 실패했어요.');
    } finally {
      setImageBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('제목을 입력해 주세요.');
      return;
    }
    if (!content.trim()) {
      setError('내용을 입력해 주세요.');
      return;
    }
    if (!editing && !categoryId) {
      setError('카테고리를 선택해 주세요. (없다면 ‘카테고리’ 탭에서 먼저 만들어 주세요.)');
      return;
    }

    // 작성: categoryId + content / 수정: 제목·본문만 (이미지는 본문 안에 마크다운으로 포함됨)
    const payload = editing
      ? { title: title.trim(), content }
      : { title: title.trim(), categoryId, content };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err?.response?.data?.err || '저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* 제목 */}
      <div>
        <label htmlFor="post-title" className="block text-[10px] font-mono tracking-wider text-(--text-muted) uppercase mb-1.5">
          제목
        </label>
        <input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="게시글 제목을 입력하세요"
          maxLength={120}
        />
      </div>

      {/* 카테고리 */}
      <div>
        <label htmlFor="post-category" className="block text-[10px] font-mono tracking-wider text-(--text-muted) uppercase mb-1.5">
          카테고리
        </label>
        <select
          id="post-category"
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          disabled={editing || categories.length === 0}
          className={`${inputClass} appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {categories.length === 0 && (
            <option value="">카테고리 없음 — ‘카테고리’ 탭에서 먼저 만들어 주세요</option>
          )}
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {editing && (
          <p className="mt-1.5 text-[11px] text-(--text-soft)">수정에서는 카테고리를 변경할 수 없어요.</p>
        )}
      </div>

      {/* 내용 (이미지는 본문 안에 인라인으로 삽입) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="post-content" className="block text-[10px] font-mono tracking-wider text-(--text-muted) uppercase">
            내용
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={imageBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-(--border-strong) px-2.5 py-1 text-[11px] font-medium text-(--text-muted) hover:text-(--text) hover:border-violet-500/60 transition-colors disabled:opacity-60"
          >
            {imageBusy ? (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-violet-300 border-t-violet-500 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            )}
            이미지 삽입
          </button>
        </div>
        <textarea
          id="post-content"
          ref={contentRef}
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`${inputClass} resize-none leading-relaxed`}
          placeholder="내용을 입력하세요. ‘이미지 삽입’을 누르면 커서 위치에 사진이 들어가요. 사진 위치는 ![](…) 부분을 잘라 옮기면 됩니다."
        />
        <p className="mt-1.5 text-[11px] text-(--text-soft)">
          줄바꿈은 그대로 표시돼요. 사진은 문장 사이 원하는 곳에 넣을 수 있어요.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleInsertImages(e.target.files)}
        />
      </div>

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

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl border border-(--border) text-sm font-semibold text-(--text-muted) hover:text-(--text) hover:border-(--border-strong) transition-colors"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={imageBusy || submitting}
          className="flex-1 py-3.5 bg-linear-to-r from-violet-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {submitting ? '저장 중…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ───────────────────────── 새 글 작성 카드 ─────────────────────────
function PostComposer({ onPublished, categories }) {
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (fields) => {
    const post = await addUserPost(fields); // 실패 시 throw → PostForm 에서 에러 표시
    resetNewsListCache();
    setFormKey((k) => k + 1); // 폼 초기화 (리마운트)
    onPublished(post);
  };

  return (
    <div className="bg-(--surface) border border-(--border) rounded-3xl p-5 sm:p-7 backdrop-blur-xl">
      <h2 className="text-lg font-bold text-(--text) flex items-center gap-2 mb-5">
        <Sparkle className="w-4 h-4 text-violet-400" />
        새 게시글 작성
      </h2>
      <PostForm key={formKey} submitLabel="게시글 등록" onSubmit={handleSubmit} categories={categories} />
    </div>
  );
}

// ───────────────────────── 수정 모달 ─────────────────────────
function EditModal({ post, onClose, onUpdated, categories }) {
  // ESC 로 닫기
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (fields) => {
    // 이미지는 본문(content) 안에 마크다운으로 들어있으므로 제목·본문만 보냅니다.
    const updated = await updateUserPost(post.serverId, {
      title: fields.title,
      content: fields.content,
    }); // 실패 시 throw
    resetNewsListCache();
    onUpdated(updated);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative flex min-h-full items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-(--surface) border border-(--border) rounded-3xl p-5 sm:p-7 backdrop-blur-xl"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-(--text) flex items-center gap-2">
              <EditIcon className="w-4 h-4 text-violet-400" />
              게시글 수정
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="p-2 -mr-2 rounded-lg text-(--text-muted) hover:text-(--text) hover:bg-(--input-bg) transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
          <PostForm
            initial={post}
            submitLabel="수정 완료"
            onSubmit={handleSubmit}
            onCancel={onClose}
            categories={categories}
            editing
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ───────────────────────── 빈 상태 ─────────────────────────
function EmptyState({ title, sub }) {
  return (
    <div className="bg-(--surface) border border-(--border) rounded-3xl p-10 text-center">
      <p className="text-sm text-(--text-muted)">{title}</p>
      {sub && <p className="text-xs text-(--text-soft) mt-1">{sub}</p>}
    </div>
  );
}

// ───────────────────────── 게시글 한 줄 ─────────────────────────
function PostRow({ post: p, onEdit, onDelete }) {
  return (
    <li className="flex items-center gap-3 p-2.5 rounded-2xl border border-(--border) hover:border-(--border-strong) transition-colors">
      {/* 썸네일 */}
      <div
        className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden"
        style={p.image ? undefined : { backgroundImage: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})` }}
      >
        {p.image && <img src={p.image} alt="" className="w-full h-full object-cover" />}
      </div>

      {/* 정보 */}
      <Link to={`/news/${p.id}`} className="min-w-0 flex-1 group">
        <p className="text-sm font-semibold text-(--text) truncate group-hover:text-violet-400 transition-colors">
          {p.title}
        </p>
        <p className="text-[11px] text-(--text-soft)">{p.date}</p>
      </Link>

      {/* 수정 · 삭제 */}
      <div className="shrink-0 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(p)}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-violet-400 hover:bg-violet-500/10 transition-colors"
        >
          <EditIcon className="w-3.5 h-3.5" />
          수정
        </button>
        <button
          type="button"
          onClick={() => onDelete(p)}
          className="px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          삭제
        </button>
      </div>
    </li>
  );
}

// ───────────────────── 내가 쓴 글 (검색 + 카테고리별) ─────────────────────
function ManagePosts({ posts, onEdit, onDelete }) {
  const [query, setQuery] = useState('');

  // 검색: 제목 · 내용 · 카테고리
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.content || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );
  }, [posts, query]);

  // 카테고리별 그룹 (WRITABLE_CATEGORIES 순서 우선, 그 외는 뒤에)
  const groups = useMemo(() => {
    const map = new Map();
    for (const p of filtered) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category).push(p);
    }
    const ordered = [];
    for (const c of WRITABLE_CATEGORIES) {
      if (map.has(c)) {
        ordered.push([c, map.get(c)]);
        map.delete(c);
      }
    }
    for (const [c, list] of map) ordered.push([c, list]);
    return ordered;
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* 검색창 */}
      <div className="relative">
        <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-(--text-soft)" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목 · 내용 · 카테고리로 검색"
          className={`${inputClass} pl-11`}
        />
      </div>

      {posts.length === 0 ? (
        <EmptyState title="아직 작성한 게시글이 없어요." sub="‘새 글 작성’ 탭에서 첫 게시글을 올려보세요." />
      ) : filtered.length === 0 ? (
        <EmptyState title="검색 결과가 없어요." sub="다른 검색어로 다시 찾아보세요." />
      ) : (
        <div className="space-y-7">
          {groups.map(([category, list]) => (
            <section key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-400 text-[11px] font-bold tracking-wide">
                  {category}
                </span>
                <span className="text-xs text-(--text-soft)">{list.length}개</span>
                <span className="flex-1 h-px bg-(--border)" />
              </div>
              <ul className="space-y-3">
                {list.map((p) => (
                  <PostRow key={p.id} post={p} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── 카테고리 관리 ─────────────────────────
function CategoryManager({ categories, onChanged }) {
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
      await addCategory(trimmed);
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
        `‘${cat.name}’ 카테고리를 삭제할까요?\n이 카테고리에 속한 게시글도 함께 삭제됩니다.`
      )
    )
      return;
    try {
      await deleteCategory(cat.id);
      await onChanged();
    } catch (err) {
      window.alert(err?.response?.data?.err || '카테고리를 삭제하지 못했어요.');
    }
  };

  return (
    <div className="bg-(--surface) border border-(--border) rounded-3xl p-5 sm:p-7 backdrop-blur-xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-(--text) flex items-center gap-2 mb-1">
          <Sparkle className="w-4 h-4 text-violet-400" />
          카테고리 관리
        </h2>
        <p className="text-xs text-(--text-soft)">
          새 글 작성 시 선택할 수 있는 카테고리를 만들고 지웁니다.
        </p>
      </div>

      {/* 생성 폼 */}
      <form onSubmit={create} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: CONTENTS, MUSIC, EVENT…"
          maxLength={50}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 px-5 rounded-xl bg-linear-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
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
        <EmptyState title="아직 카테고리가 없어요." sub="위에서 첫 카테고리를 만들어 보세요." />
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
                    backgroundImage: `linear-gradient(135deg, ${(c.gradient || ['#a78bfa', '#6366f1'])[0]}, ${(c.gradient || ['#a78bfa', '#6366f1'])[1]})`,
                  }}
                  aria-hidden="true"
                />
                <span className="inline-block px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-400 text-[11px] font-bold tracking-wide truncate">
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

// ───────────────────────── 탭 ─────────────────────────
function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
    >
      {active && (
        <motion.span
          layoutId="admin-tab-pill"
          className="absolute inset-0 rounded-xl bg-linear-to-r from-violet-500 to-indigo-600"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className={`relative z-10 ${active ? 'text-white' : 'text-(--text-muted)'}`}>
        {children}
      </span>
    </button>
  );
}

function Tabs({ tab, onChange, manageCount, categoryCount }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl bg-(--surface) border border-(--border) mb-6">
      <TabButton active={tab === 'write'} onClick={() => onChange('write')}>
        새 글 작성
      </TabButton>
      <TabButton active={tab === 'manage'} onClick={() => onChange('manage')}>
        내가 쓴 글
        <span className={`ml-1.5 ${tab === 'manage' ? 'text-white/80' : 'text-violet-400'}`}>
          {manageCount}
        </span>
      </TabButton>
      <TabButton active={tab === 'category'} onClick={() => onChange('category')}>
        카테고리
        <span className={`ml-1.5 ${tab === 'category' ? 'text-white/80' : 'text-violet-400'}`}>
          {categoryCount}
        </span>
      </TabButton>
    </div>
  );
}

// ───────────────────────── 운영자 대시보드 ─────────────────────────
function Dashboard({ onLogout }) {
  const [section, setSection] = useState('articles'); // 'articles' | 'inquiries'
  const [tab, setTab] = useState('write'); // 'write' | 'manage' | 'category'
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [justPublished, setJustPublished] = useState(null);
  const [editing, setEditing] = useState(null); // 수정 중인 게시글

  const refresh = async () => setPosts(await getUserPosts());
  const loadCategories = async () => setCategories(await getCategories());

  // 최초 1회 로드 (서버에서 글 + 카테고리)
  useEffect(() => {
    refresh();
    loadCategories();
  }, []);

  const handlePublished = async (post) => {
    await refresh();
    setJustPublished(post);
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`'${post.title}' 게시글을 삭제할까요?`)) return;
    try {
      await deleteUserPost(post.serverId);
      resetNewsListCache();
      if (justPublished && justPublished.id === post.id) setJustPublished(null);
      if (editing && editing.id === post.id) setEditing(null);
      await refresh();
    } catch (err) {
      window.alert(err?.response?.data?.err || '삭제하지 못했어요. 다시 시도해 주세요.');
    }
  };

  // 카테고리 생성/삭제 후 카테고리와 글 목록을 함께 갱신 (삭제 시 글도 사라질 수 있음)
  const handleCategoriesChanged = async () => {
    await loadCategories();
    await refresh();
  };

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 pt-28 md:pt-32 pb-20">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-4 mb-7">
        <div>
          <h2 className="text-xs font-mono tracking-[0.2em] text-violet-400 font-semibold uppercase">Operator Console</h2>
          <AnimatedText
            key={section}
            as="h1"
            text={section === 'articles' ? '게시글 관리' : '문의 관리'}
            className="font-black text-2xl sm:text-3xl text-(--text) tracking-tight"
            stagger={0.04}
          />
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="shrink-0 px-4 py-2.5 rounded-full border border-(--border) text-sm font-semibold text-(--text-muted) hover:text-(--text) hover:border-(--border-strong) transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* 섹션 전환 (게시글 / 문의) */}
      <div className="flex gap-1 p-1 rounded-2xl bg-(--surface) border border-(--border) mb-6">
        <button
          type="button"
          onClick={() => setSection('articles')}
          className="relative flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          {section === 'articles' && (
            <motion.span
              layoutId="admin-section-pill"
              className="absolute inset-0 rounded-xl bg-linear-to-r from-violet-500 to-indigo-600"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className={`relative z-10 ${section === 'articles' ? 'text-white' : 'text-(--text-muted)'}`}>
            게시글
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSection('inquiries')}
          className="relative flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          {section === 'inquiries' && (
            <motion.span
              layoutId="admin-section-pill"
              className="absolute inset-0 rounded-xl bg-linear-to-r from-cyan-500 to-indigo-600"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className={`relative z-10 ${section === 'inquiries' ? 'text-white' : 'text-(--text-muted)'}`}>
            문의
          </span>
        </button>
      </div>

      {/* ───────── 게시글 섹션 ───────── */}
      {section === 'articles' && (
        <>
          {/* 탭 */}
          <Tabs tab={tab} onChange={setTab} manageCount={posts.length} categoryCount={categories.length} />

      {/* 등록 성공 안내 (작성 탭) */}
      <AnimatePresence>
        {justPublished && tab === 'write' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="mb-5 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25"
          >
            <span className="text-sm font-medium text-emerald-500">게시글이 등록되었어요.</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab('manage')}
                className="px-3.5 py-2 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
              >
                내 글에서 보기
              </button>
              <Link
                to={`/news/${justPublished.id}`}
                className="px-3.5 py-2 rounded-full bg-emerald-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                새 글 보기
              </Link>
              <button
                type="button"
                onClick={() => setJustPublished(null)}
                className="px-3 py-2 rounded-full text-xs font-semibold text-(--text-muted) hover:text-(--text) transition-colors"
              >
                닫기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 탭 콘텐츠 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'write' && (
            <PostComposer onPublished={handlePublished} categories={categories} />
          )}
          {tab === 'manage' && (
            <ManagePosts posts={posts} onEdit={setEditing} onDelete={handleDelete} />
          )}
          {tab === 'category' && (
            <CategoryManager categories={categories} onChanged={handleCategoriesChanged} />
          )}
        </motion.div>
      </AnimatePresence>

          {/* 수정 모달 */}
          <AnimatePresence>
            {editing && (
              <EditModal
                post={editing}
                onClose={() => setEditing(null)}
                onUpdated={refresh}
                categories={categories}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* ───────── 문의 섹션 ───────── */}
      {section === 'inquiries' && <InquiryConsole />}

      <div className="text-center pt-6">
        <Link to="/news" className="text-xs text-(--text-soft) hover:text-(--text-muted) transition-colors">
          ← NEWS 목록으로
        </Link>
      </div>
    </div>
  );
}

// ───────────────────────── 페이지 진입점 ─────────────────────────
export default function Admin() {
  const { isAdmin, login, logout } = useAuth();

  return (
    <div className="h-screen overflow-y-auto bg-(--bg)">
      {/* 상단 우측 은은한 보라 장식 (NEWS 페이지와 통일감) */}
      <div className="pointer-events-none absolute top-0 right-0 w-160 h-112 -translate-y-1/3 translate-x-1/4 rounded-full bg-violet-300/30 blur-[110px]" />
      <div className="relative z-10 min-h-full">
        {isAdmin ? <Dashboard onLogout={logout} /> : <LoginCard onLogin={login} />}
      </div>
    </div>
  );
}
