import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { NAV_LINKS } from '../data/navLinks';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

// 해/달 아이콘 (다크/라이트 토글용)
function SunIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

function MenuIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// 운영자 페이지 진입용 자물쇠 (로그인 상태에 따라 잠김/열림)
function LockIcon({ className, open }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      {open ? <path d="M8 11V7a4 4 0 0 1 7.5-2" /> : <path d="M8 11V7a4 4 0 0 1 8 0v4" />}
    </svg>
  );
}

export default function Navigation() {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { isAdmin } = useAuth();
  const isLight = theme === 'light';
  const [open, setOpen] = useState(false);

  // 라우트가 바뀌면 모바일 메뉴 닫기
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isActiveLink = (item) =>
    item.path === '/'
      ? location.pathname === '/'
      : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 sm:px-6 md:px-16 py-4 md:py-5 bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--border)] transition-colors duration-300">
        <Link
          to="/"
          className="text-lg md:text-xl font-black black-han-sans-regular tracking-widest whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400 hover:opacity-80 transition-opacity"
        >
          DAY:OVE STAR
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          {/* 데스크톱 메뉴 */}
          <nav className="hidden lg:flex space-x-1 text-xs font-semibold tracking-[0.15em]">
            {NAV_LINKS.map((item) => {
              const isActive = isActiveLink(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 xl:px-5 py-2.5 rounded-full whitespace-nowrap transition-colors duration-300 black-han-sans-regular ${
                    isActive ? 'text-cyan-400' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <span className="text-[0.9rem] relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="navBubble"
                      className="absolute inset-0 bg-cyan-500/10 border border-cyan-500/20 rounded-full black-han-sans-regular"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 운영자 페이지 진입 (메인 메뉴와 분리). 로그인 시 보라색으로 강조 */}
          <Link
            to="/admin"
            aria-label="운영자 페이지"
            title={isAdmin ? '운영자 페이지 (로그인됨)' : '운영자 페이지'}
            className={`p-2.5 rounded-full border transition-colors ${
              isAdmin
                ? 'border-violet-500/40 text-violet-400 bg-violet-500/10'
                : 'border-(--border) text-(--text-muted) hover:text-(--text) hover:border-(--border-strong)'
            }`}
          >
            <LockIcon className="w-[18px] h-[18px]" open={isAdmin} />
          </Link>

          {/* 다크 / 라이트 토글 */}
          <button
            type="button"
            onClick={toggle}
            aria-label={isLight ? '다크 모드로 전환' : '라이트 모드로 전환'}
            title={isLight ? '다크 모드로 전환' : '라이트 모드로 전환'}
            className="p-2.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
          >
            {isLight ? <MoonIcon className="w-[18px] h-[18px]" /> : <SunIcon className="w-[18px] h-[18px]" />}
          </button>

          {/* 모바일 햄버거 (md 미만에서만) */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={open}
            className="lg:hidden p-2.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
          >
            {open ? <CloseIcon className="w-[18px] h-[18px]" /> : <MenuIcon className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </header>

      {/* 모바일 전체화면 메뉴 */}
      <AnimatePresence>
        {open && (
          <motion.nav
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[45] lg:hidden flex flex-col items-center justify-center gap-2 bg-[var(--bg)] backdrop-blur-xl"
          >
            {NAV_LINKS.map((item, i) => {
              const isActive = isActiveLink(item);
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`black-han-sans-regular text-2xl px-8 py-3 rounded-full transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
