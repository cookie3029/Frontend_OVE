import { motion } from 'framer-motion';
import AnimatedText from '../components/AnimatedText';
import { staggerContainer, staggerItem } from '../animations/variants';
import { TEAM_MEMBERS } from '../data/members';

export default function Member() {
  return (
    <div className="h-screen overflow-y-auto bg-(--bg)">
      <div className="min-h-full flex flex-col items-center justify-center px-6 md:px-12 pt-28 pb-16">
        <div className="text-center mb-10 md:mb-16 space-y-2">
          <h2 className="text-xs font-mono tracking-[0.2em] text-indigo-400 font-semibold uppercase">Our Talents</h2>
          <AnimatedText
            as="h1"
            text="MEMBER PROFILE"
            className="font-black text-3xl sm:text-4xl md:text-5xl text-(--text) tracking-tight"
            stagger={0.03}
          />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl w-full"
        >
          {TEAM_MEMBERS.map((member, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`bg-linear-to-b ${member.color} border border-(--border) rounded-2xl p-6 text-center shadow-xl backdrop-blur-md flex flex-col items-center transition-colors duration-300 ${member.border}`}
            >
              {/* 임시 원형 일러스트 박스 */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-(--surface-2) flex items-center justify-center text-4xl mb-6 border border-(--border-strong) shadow-inner">
                {member.image}
              </div>

              <h3 className="text-lg md:text-xl font-bold text-(--text) mb-1">{member.name}</h3>
              <p className="text-xs font-mono text-indigo-400 mb-4 uppercase tracking-wider">{member.role}</p>
              <p className="text-(--text-muted) text-sm leading-relaxed mb-6 grow max-w-60">{member.bio}</p>

              {/* SNS 숏컷 아이콘 */}
              <div className="flex gap-4 text-(--text-soft) border-t border-(--border) pt-4 w-full justify-center"></div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
