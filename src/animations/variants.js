// 페이지 전반에서 공유하는 framer-motion 애니메이션 프리셋 모음

// 자식 요소를 순차적으로 등장시키는 컨테이너
export const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

// staggerContainer 내부에서 하나씩 떠오르는 아이템
export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
