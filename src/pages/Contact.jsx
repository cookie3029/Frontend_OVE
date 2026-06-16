import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedText from '../components/AnimatedText';
import { staggerContainer, staggerItem } from '../animations/variants';
import {
  getInquiryCategories,
  createInquiry,
  uploadInquiryFiles,
} from '../data/inquiryStore';

const inputClass =
  'w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] placeholder:text-[var(--text-soft)] focus:outline-none focus:border-cyan-500 transition-colors';

const labelClass =
  'block text-[10px] font-mono tracking-wider text-(--text-muted) uppercase mb-1.5';

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 백엔드 multer limit 과 동일(10MB)
const GENDERS = ['남성', '여성', '기타'];

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function PaperclipIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
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

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// ───────────────────────── 제출 완료 화면 ─────────────────────────
function SuccessCard({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full space-y-6 bg-(--surface) border border-(--border) p-8 rounded-3xl backdrop-blur-xl text-center"
    >
      <div className="flex justify-center">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
          <CheckIcon className="w-7 h-7" />
        </span>
      </div>
      <div className="space-y-1.5">
        <h1 className="font-black text-2xl text-(--text) tracking-tight">문의가 접수되었어요</h1>
        <p className="text-xs text-(--text-soft) leading-relaxed">
          보내주신 내용은 운영자에게 안전하게 전달되었습니다.
          <br />
          확인 후 입력하신 이메일로 회신드릴게요.
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="w-full py-3.5 bg-linear-to-r from-cyan-500 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
      >
        새 문의 작성하기
      </button>
    </motion.div>
  );
}

export default function Contact() {
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  // 카테고리 로드 (공개 엔드포인트)
  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await getInquiryCategories();
      if (!alive) return;
      setCategories(list);
      if (list.length > 0) setCategoryId(list[0].id);
      setCatLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;
    setError('');

    const tooBig = incoming.find((f) => f.size > MAX_SIZE);
    if (tooBig) {
      setError(`'${tooBig.name}' 파일이 너무 커요. (최대 ${formatBytes(MAX_SIZE)})`);
    }
    const valid = incoming.filter((f) => f.size <= MAX_SIZE);

    setFiles((prev) => {
      const merged = [...prev];
      for (const f of valid) {
        // 같은 이름+크기 중복 방지
        if (!merged.some((m) => m.name === f.name && m.size === f.size)) {
          merged.push(f);
        }
      }
      if (merged.length > MAX_FILES) {
        setError(`첨부는 최대 ${MAX_FILES}개까지 가능해요.`);
        return merged.slice(0, MAX_FILES);
      }
      return merged;
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setName('');
    setGender('');
    setEmail('');
    setPhone('');
    setCategoryId(categories[0]?.id ?? '');
    setMessage('');
    setFiles([]);
    setError('');
    setDone(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('성함(또는 법인명)을 입력해 주세요.');
    if (!gender) return setError('성별을 선택해 주세요.');
    if (!email.trim()) return setError('이메일을 입력해 주세요.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError('이메일 형식을 확인해 주세요.');
    if (!phone.trim()) return setError('연락처를 입력해 주세요.');
    if (!categoryId) return setError('문의 유형을 선택해 주세요.');
    if (!message.trim()) return setError('문의 내용을 입력해 주세요.');

    setSubmitting(true);
    try {
      const created = await createInquiry({
        name,
        gender,
        email,
        phone,
        categoryId: Number(categoryId),
        contactContent: message,
      });

      if (files.length > 0 && created?.id) {
        await uploadInquiryFiles(created.id, files);
      }
      setDone(true);
    } catch (err) {
      setError(
        err?.response?.data?.err ||
          '문의를 보내지 못했어요. 잠시 후 다시 시도해 주세요.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-(--bg)">
      <div className="min-h-full flex items-center justify-center px-6 md:px-20 pt-28 pb-16">
        {done ? (
          <SuccessCard onReset={resetForm} />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="max-w-md w-full space-y-7 bg-(--surface) border border-(--border) p-6 sm:p-8 rounded-3xl backdrop-blur-xl"
          >
            <div className="text-center space-y-1">
              <AnimatedText
                as="h1"
                text="CONTACT US"
                className="font-black text-2xl sm:text-3xl text-(--text) tracking-tight"
                stagger={0.04}
              />
              <motion.p variants={staggerItem} className="text-xs text-(--text-soft)">
                비즈니스 협업 제안 및 프로젝트 문의
              </motion.p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {/* 이름 / 법인명 */}
              <motion.div variants={staggerItem}>
                <label className={labelClass}>Company / Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="성함 또는 법인명을 입력하세요"
                  maxLength={100}
                />
              </motion.div>

              {/* 성별 (세그먼트) */}
              <motion.div variants={staggerItem}>
                <label className={labelClass}>Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {GENDERS.map((g) => {
                    const active = gender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                          active
                            ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                            : 'border-(--border) text-(--text-muted) hover:text-(--text) hover:border-(--border-strong)'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* 이메일 / 연락처 */}
              <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="010-0000-0000"
                    maxLength={40}
                  />
                </div>
              </motion.div>

              {/* 문의 유형 (카테고리) */}
              <motion.div variants={staggerItem}>
                <label className={labelClass}>Inquiry Type</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={catLoading || categories.length === 0}
                  className={`${inputClass} appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {catLoading && <option value="">불러오는 중…</option>}
                  {!catLoading && categories.length === 0 && (
                    <option value="">문의 유형 준비 중 — 잠시 후 다시 시도해 주세요</option>
                  )}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </motion.div>

              {/* 내용 */}
              <motion.div variants={staggerItem}>
                <label className={labelClass}>Message</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${inputClass} resize-none leading-relaxed`}
                  placeholder="협업 상세 내용을 서술해 주세요"
                />
              </motion.div>

              {/* 첨부파일 */}
              <motion.div variants={staggerItem}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`${labelClass} mb-0`}>Attachments</label>
                  <span className="text-[10px] text-(--text-soft)">
                    {files.length}/{MAX_FILES} · 최대 {formatBytes(MAX_SIZE)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={files.length >= MAX_FILES}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-(--border-strong) text-xs font-medium text-(--text-muted) hover:text-(--text) hover:border-cyan-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperclipIcon className="w-3.5 h-3.5" />
                  파일 첨부 (이미지·문서 등)
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />

                {files.length > 0 && (
                  <ul className="mt-2.5 space-y-1.5">
                    {files.map((f, i) => (
                      <li
                        key={`${f.name}-${f.size}-${i}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-(--input-bg) border border-(--border)"
                      >
                        <PaperclipIcon className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                        <span className="min-w-0 flex-1 truncate text-[11px] text-(--text)">{f.name}</span>
                        <span className="shrink-0 text-[10px] text-(--text-soft)">{formatBytes(f.size)}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          aria-label="첨부 제거"
                          className="shrink-0 p-1 rounded-md text-(--text-muted) hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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
                className="w-full py-3.5 bg-linear-to-r from-cyan-500 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {submitting ? '보내는 중…' : '제출하기'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
