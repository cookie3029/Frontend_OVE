// 첫 방문(세션당 1회)에만 보이는 인트로 로딩 화면.
//  - 세리프(serif) 큰 퍼센트 숫자가 은은한 글로우와 함께 0 → 100% 차오르고,
//  - 아래에 NOW LOADING... 라벨이 넓은 자간으로 표시된 뒤,
//  - 화면이 부드럽게 사라지며 본문이 나타납니다.
//  - 라이트/다크 테마(<html>.light)에 따라 색이 바뀝니다.
//
// "1회만" 기준: 기본값 sessionStorage = "브라우저 세션당 1회"
//   완전히 "평생 1회" → STORAGE 를 window.localStorage 로 변경
//   "새로고침마다 다시 보이게" → 아래 RESHOW_ON_RELOAD 를 true 로 변경

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SEEN_KEY = 'intro_loader_seen';
const STORAGE = () => window.sessionStorage; // ← localStorage 로 바꾸면 "평생 1회"
const RESHOW_ON_RELOAD = false; // ← true 면 새로고침 때마다 다시 표시(참고 사f이트와 동일 동작)

const SERIF = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

// 로딩 종료 연출 타이밍(ms)
//  count: 0→100 카운트 / hold: 100%에서 잠깐 머무름 / contentFade: %·문구가 사라지는 시간
//  themeHold: 순수 테마색으로 머무는 시간 / overlayFade: 테마색이 걷히며 랜딩이 드러나는 시간
const TIMING = {
  normal: { count: 1500, hold: 250, contentFade: 650, themeHold: 300, overlayFade: 900 },
  reduced: { count: 600, hold: 120, contentFade: 220, themeHold: 120, overlayFade: 350 },
};

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function isReloadNavigation() {
  try {
    const nav = performance.getEntriesByType('navigation');
    return nav.length > 0 && nav[0].type === 'reload';
  } catch {
    return false;
  }
}

function readIsLight() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('light');
}

export default function LoadingScreen() {
  const reduced = useRef(prefersReducedMotion());

  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    let show;
    if (RESHOW_ON_RELOAD && isReloadNavigation()) {
      show = true;
    } else {
      try {
        show = !STORAGE().getItem(SEEN_KEY);
      } catch {
        show = true; // 저장소가 막혀 있어도 1회는 보여줌
      }
    }
    // 인트로가 뜰 예정이면 표시 → 히어로 등 진입 애니메이션이 끝날 때까지 대기하게 함
    if (show) {
      try {
        window.__introActive = true;
      } catch {
        /* 무시 */
      }
    }
    return show;
  });
  const [progress, setProgress] = useState(0);
  const [settled, setSettled] = useState(false); // true면 %·문구가 사라지고 순수 테마색만 남음
  const [isLight, setIsLight] = useState(readIsLight);
  const rafRef = useRef(0);
  const doneRef = useRef(false);

  // 표시되는 순간 "봤음" 기록 → 도중에 떠나도 다시 안 뜸
  useEffect(() => {
    if (!visible) return;
    try {
      STORAGE().setItem(SEEN_KEY, '1');
    } catch {
      /* 무시 */
    }
  }, [visible]);

  // 본문 스크롤 잠금
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  // 로딩 중 테마가 바뀌어도 색을 따라가도록 <html> class 감시
  useEffect(() => {
    if (!visible) return;
    const el = document.documentElement;
    const obs = new MutationObserver(() => setIsLight(el.classList.contains('light')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [visible]);

  // 카운터(0→100) 후, 끝나면 단계적으로 사라짐:
  //  ① hold ② %·문구 페이드아웃(순수 테마색) ③ themeHold ④ 오버레이를 서서히 걷어 랜딩 노출
  useEffect(() => {
    if (!visible) return;
    const T = reduced.current ? TIMING.reduced : TIMING.normal;
    const start = performance.now();
    const timers = [];

    const tick = (now) => {
      const t = Math.min(1, (now - start) / T.count);
      setProgress(Math.floor(easeOutCubic(t) * 100));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        setProgress(100);
        // ① 100%에서 잠깐 머문 뒤 → %·문구를 천천히 페이드아웃(순수 테마색만 남음)
        timers.push(setTimeout(() => setSettled(true), T.hold));
        // ② 테마색에서 잠시 머문 뒤 → 오버레이를 서서히 걷어 랜딩을 드러냄(+ 히어로 재생 신호)
        timers.push(
          setTimeout(() => {
            try { window.__introActive = false; } catch { /* 무시 */ }
            try { window.dispatchEvent(new Event('intro:done')); } catch { /* 무시 */ }
            setVisible(false);
          }, T.hold + T.contentFade + T.themeHold)
        );
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      timers.forEach(clearTimeout);
    };
  }, [visible]);

  const pctColor = isLight ? '#1d4ed8' : '#fde68a'; // blue-700 / amber-200
  const pctGlow = isLight
    ? 'drop-shadow(0 0 15px rgba(29,78,216,0.15))'
    : 'drop-shadow(0 0 15px rgba(96,165,250,0.30))';
  const labelColor = isLight ? 'rgba(55,65,81,0.5)' : '#fde68a'; // gray-700/50 / amber-200

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro-loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: (reduced.current ? TIMING.reduced.overlayFade : TIMING.normal.overlayFade) / 1000,
            ease: 'easeInOut',
          }}
          role="status"
          aria-live="polite"
          aria-label={`Now loading ${progress}%`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)', // 사이트 테마 배경색과 동일 (라이트/다크 자동)
            color: 'var(--text)',
            transition: 'background-color 0.4s ease, color 0.4s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: settled ? 0 : 1,
              transition: `opacity ${
                reduced.current ? TIMING.reduced.contentFade : TIMING.normal.contentFade
              }ms ease`,
            }}
          >
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 60,
                lineHeight: 1,
                marginBottom: 16,
                color: pctColor,
                filter: pctGlow,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {progress}%
            </div>
            <p
              style={{
                fontSize: 12,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                margin: 0,
                color: labelColor,
              }}
            >
              Now Loading...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
