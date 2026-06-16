import { useState, useEffect, useRef } from 'react';

const KEY = 'nexus_theme';

// index.html 의 인라인 스크립트가 미리 붙여둔 클래스를 우선 신뢰
function getInitial() {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('light')) {
    return 'light';
  }
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // 무시
  }
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitial);
  const firstRun = useRef(true);

  useEffect(() => {
    const root = document.documentElement;

    // 최초 로드 시에는 트랜지션 없이 즉시 적용 (깜빡임/초기 전환 방지)
    if (firstRun.current) {
      firstRun.current = false;
      root.classList.toggle('light', theme === 'light');
      try {
        localStorage.setItem(KEY, theme);
      } catch {
        // 무시
      }
      return;
    }

    // 토글하는 순간에만 전환 애니메이션 활성화
    root.classList.add('theme-animating');
    root.classList.toggle('light', theme === 'light');
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // 무시
    }
    const timer = window.setTimeout(() => root.classList.remove('theme-animating'), 550);
    return () => window.clearTimeout(timer);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  return { theme, toggle };
}
