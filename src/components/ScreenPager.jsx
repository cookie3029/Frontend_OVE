import { useState, useEffect, useRef, Children } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ENTER = 0.7; // 페이드 인 시간(초)
const EXIT = 0.5; // 페이드 아웃 시간(초)
const LOCK_MS = (ENTER + EXIT) * 1000 + 150; // 전환 중 연속 입력 방지

/**
 * 일반 스크롤 대신 한 화면씩 페이드로 전환하는 풀페이지 페이저.
 * - 마우스 휠 / 방향키(↑↓, PageUp/Down) / 터치 스와이프로 화면 이동
 * - 전환은 현재 화면 페이드 아웃 → 다음 화면 페이드 인 (mode="wait")
 * - 각 화면이 활성화되며 마운트되므로 내부 글자 효과가 매번 재생됩니다.
 * - 오른쪽 점(인디케이터)을 클릭해 해당 화면으로 바로 이동할 수 있습니다.
 *
 * @param {React.ReactNode} children - 화면들(각 child가 한 화면)
 */
export default function ScreenPager({ children }) {
  const screens = Children.toArray(children);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0); // 이벤트 핸들러에서 최신 index 참조용
  const lockRef = useRef(false); // 전환 중 입력 잠금
  const touchStartY = useRef(null);
  const firstRef = useRef(true); // 최초 렌더 여부 — 첫 화면은 래퍼 페이드만 생략

  const navigate = (target) => {
    if (lockRef.current) return;
    const clamped = Math.max(0, Math.min(screens.length - 1, target));
    if (clamped === indexRef.current) return;
    lockRef.current = true;
    indexRef.current = clamped;
    setIndex(clamped);
    window.setTimeout(() => {
      lockRef.current = false;
    }, LOCK_MS);
  };

  useEffect(() => {
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) < 8) return; // 미세한 스크롤 무시
      navigate(indexRef.current + (e.deltaY > 0 ? 1 : -1));
    };
    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') navigate(indexRef.current + 1);
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') navigate(indexRef.current - 1);
    };
    const onTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
      if (touchStartY.current == null) return;
      const dy = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 40) navigate(indexRef.current + (dy > 0 ? 1 : -1));
      touchStartY.current = null;
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
    // navigate 는 ref + 안정적인 setIndex 만 사용하므로 한 번만 바인딩하면 됩니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screens.length]);

  // 최초 렌더가 끝나면 이후 전환부터는 래퍼도 정상 페이드
  useEffect(() => {
    firstRef.current = false;
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 첫 화면은 래퍼 페이드만 생략(즉시 표시)하되, 내부 글자 이펙트는 정상 재생되도록
          AnimatePresence 전역 initial={false} 대신 래퍼 자체에만 initial 을 끕니다. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={firstRef.current ? false : { opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: ENTER, ease: 'easeInOut' } }}
          exit={{ opacity: 0, transition: { duration: EXIT, ease: 'easeInOut' } }}
          className="absolute inset-0 h-full w-full"
        >
          {screens[index]}
        </motion.div>
      </AnimatePresence>

      {/* 화면 인디케이터 (클릭 시 해당 화면으로 이동) */}
      <div className="fixed right-5 md:right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
        {screens.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => navigate(i)}
            aria-label={`${i + 1}번째 화면으로 이동`}
            aria-current={i === index}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              i === index ? 'scale-125 bg-cyan-400' : 'bg-[var(--border-strong)] hover:bg-[var(--text-muted)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
