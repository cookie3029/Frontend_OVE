import { motion } from 'framer-motion';
import AnimatedText from '../components/AnimatedText';
import { staggerContainer, staggerItem } from '../animations/variants';

export default function AboutUs() {
  return (
    // h-screen + overflow-y-auto: 모바일에서 내용이 길면 이 영역 안에서 스크롤
    <div className="h-screen overflow-y-auto bg-(--bg)">
      {/* min-h-full + 가운데 정렬: 짧으면 가운데, 길면 위에서부터 스크롤 (잘림 없음) */}
      <div className="min-h-full flex flex-col items-center justify-center px-6 md:px-20 pt-28 pb-16">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-4xl w-full space-y-10 md:space-y-12"
        >
          <div className="text-center space-y-2">
            <motion.span variants={staggerItem} className="text-xs font-mono tracking-[0.2em] text-cyan-400">
              WHO WE ARE
            </motion.span>
            <AnimatedText
              as="h1"
              text="ABOUT PRODUCTION"
              className="font-black text-3xl sm:text-4xl md:text-5xl text-(--text) tracking-tight"
              delay={0.15}
              stagger={0.03}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
            <motion.div
              variants={staggerItem}
              className="p-6 md:p-8 bg-(--surface) border border-(--border) rounded-2xl space-y-4 hover:border-cyan-500/30 transition-colors"
            >
              <h3 className="text-lg md:text-xl font-bold text-(--text)">가상 자아의 가치 증명</h3>
              <p className="text-(--text-muted) text-sm leading-relaxed">
                단순한 아바타 스트리밍의 범주를 넘어 크리에이터 내부의 예술적 역량을 기술로 증폭하여 버츄얼 아티스트로서의 영속적 가치를 만들어 나갑니다.
              </p>
            </motion.div>
            <motion.div
              variants={staggerItem}
              className="p-6 md:p-8 bg-(--surface) border border-(--border) rounded-2xl space-y-4 hover:border-indigo-500/30 transition-colors"
            >
              <h3 className="text-lg md:text-xl font-bold text-(--text)">글로벌 엔터테인먼트</h3>
              <p className="text-(--text-muted) text-sm leading-relaxed">
                언어와 국경의 장벽이 없는 가상 도메인의 이점을 백분 활용하여 전 세계 팬덤이 한 공간에서 공명할 수 있는 글로벌 허브를 지향합니다.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
