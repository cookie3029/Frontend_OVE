import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ScreenPager from '../components/ScreenPager';
import AnimatedText from '../components/AnimatedText';
import { staggerContainer } from '../animations/variants';
import { BRAND_GRADIENT } from '../lib/gradient';

export default function Home() {
  // 인트로 로딩 화면이 떠 있는 동안에는 히어로 애니메이션이 그 뒤에서 끝나버려
  // 진입 시 효과가 안 보인다. 로더가 사라진 뒤에 재생되도록 대기한다.
  const [ready, setReady] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !window.__introActive; // 로더가 떠 있으면 끝날 때까지 대기
  });

  useEffect(() => {
    if (ready) return;
    let fired = false;
    const play = () => {
      if (fired) return;
      fired = true;
      setReady(true);
    };
    window.addEventListener('intro:done', play);
    // 안전장치: 이벤트를 놓쳐도 일정 시간 뒤엔 재생
    const fallback = setTimeout(play, 3000);
    return () => {
      window.removeEventListener('intro:done', play);
      clearTimeout(fallback);
    };
  }, [ready]);

  return (
    <ScreenPager>
      {/* 화면 1: HERO */}
      <section className="relative h-full w-full flex flex-col justify-center items-center text-center px-6 overflow-hidden bg-(--bg)">
        {/* 사이버틱 오로라 배경 백그라운드 레이어 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-125 h-125 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          key={ready ? 'hero-go' : 'hero-wait'}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative z-20 max-w-3xl space-y-6"
        >
          {/* 글자가 하나씩 떠오르는 히어로 헤드라인 */}
          <h1 className="font-black text-[clamp(1.8rem,8.5vw,3rem)] text-(--text) tracking-tight uppercase leading-none">
            <AnimatedText
              as="span"
              text="Beyond Reality"
              className="block"
              stagger={0.04}
              nowrap
              size="text-[clamp(1.8rem,8.5vw,3rem)]"
              lift="-mt-[0.12em]"
            />
            <AnimatedText
              as="span"
              text="Behind Screen"
              className="block"
              gradient={BRAND_GRADIENT}
              stagger={0.04}
              delay={0.6}
              nowrap
              size="text-[clamp(1.8rem,8.5vw,3rem)]"
              lift="-mt-[0.12em]"
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 1.4 }}
            className="text-(--text-muted) text-sm md:text-[1rem] font_korean max-w-xl px-2 mx-auto leading-relaxed -my-5"
          >
            스크린이라는 얇은 유리벽을 넘어, 
            <br/> 상상이 온전한 현실이 되는 대안형 가상 세계를 창조합니다.
          </motion.p>
        </motion.div>
      </section>

      {/* 화면 2: SERVICES */}
      <section className="h-full w-full px-8 md:px-30 flex items-center justify-center bg-(--bg-2)">
        <div className="text-center space-y-4">
          <span className="block text-2xl mb-1 text-indigo-400 tracking-[0.3em] font-semibold">STAGE 01</span>
          <AnimatedText
            as="h2"
            text="NEXT-GEN STREAMING"
            className="font-black text-[clamp(1.2rem,7vw,3rem)] text-(--text) tracking-tight leading-none"
            rise={0}
            stagger={0.03}
            nowrap
            size="text-[clamp(1.2rem,7vw,3rem)]"
          />
          <p className="text-(--text-muted) text-sm md:text-base font_korean max-w-md px-2 mx-auto leading-relaxed -my-3">
            고도화된 모션 캡쳐 아키텍처 기술을 결합하여 <br/> 실시간 모션 동기화와 시청자 참여형 시스템을 실현합니다.
          </p>
        </div>
      </section>

      {/* 화면 3: FEATURES */}
      <section className="h-full w-full px-8 md:px-20 flex items-center justify-center bg-(--bg)">
        <div className="text-center space-y-4">
          <span className="block font-mono text-2xl text-purple-400 tracking-[0.3em] mb-1 font-semibold ">STAGE 02</span>
          <AnimatedText
            as="h2"
            text="UNIVERSE & MUSIC"
            className="font-black text-[clamp(1.2rem,7vw,3rem)] text-(--text) tracking-tight leading-none"
            rise={0}
            stagger={0.03}
            nowrap
            size="text-[clamp(1.2rem,7vw,3rem)]"
          />
          <p className="text-(--text-muted) text-sm md:text-base font_korean max-w-md px-2 mx-auto leading-relaxed -my-3">
            독창적인 앨범 릴리즈와 유기적으로 연결된 <br/>다중 세계관 시나리오를 설계하여 견고한 팬덤 서사를 구축합니다.
          </p>
        </div>
      </section>
    </ScreenPager>
  );
}
