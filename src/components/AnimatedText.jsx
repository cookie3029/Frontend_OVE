import { Fragment } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { sampleGradient } from '../lib/gradient';

/**
 * 텍스트를 글자 단위로 분해해 하나씩 등장시키는 컴포넌트.
 *
 * - 라우트 페이지에 진입할 때마다 마운트되며 재생되므로 "세션마다" 다시 실행됩니다.
 * - 각 글자는 객체 기반 initial/animate + 명시적 transition.delay 로 동작하여
 *   다른 variant 컨테이너 안에 중첩돼도 안정적으로 재생됩니다.
 * - 단어 단위로 묶어 단어 중간에서 줄바꿈이 일어나지 않게 처리했습니다.
 * - gradient prop을 주면 글자마다 색을 보간해 그라데이션처럼 보이게 합니다.
 * - 접근성: 컨테이너에 aria-label로 원문을 제공하고 글자 span은 aria-hidden 처리.
 *   prefers-reduced-motion 사용자는 이동/블러 없이 opacity 만으로 부드럽게 등장합니다.
 *
 * @param {string} text - 표시할 문자열. '\n' 으로 줄바꿈할 수 있습니다.
 * @param {string} [as='span'] - 렌더링할 태그명 (h1, h2, span 등)
 * @param {string} [className] - 컨테이너에 적용할 클래스
 * @param {string[]} [gradient] - 글자별 색 보간에 사용할 HEX 정지점 배열
 * @param {number} [stagger=0.04] - 글자 간 등장 간격(초)
 * @param {number} [delay=0] - 전체 시작 지연(초)
 * @param {number} [duration=0.5] - 글자 하나의 등장 시간(초)
 * @param {number} [rise=18] - 글자가 떠오르는 높이(px)
 * @param {boolean} [inView=false] - true면 화면에 들어올 때 재생, false면 마운트 즉시 재생
 */
export default function AnimatedText({
  text,
  as: Tag = 'span',
  className = '',
  gradient = null,
  stagger = 0.04,
  delay = 0,
  duration = 0.5,
  rise = 18,
  inView = false,
  nowrap = false,
  size = 'text-[3rem]',
  lift = '',
  ...rest
}) {
  const reduceMotion = useReducedMotion();
  const lines = String(text).split('\n');

  // reduce-motion: 이동/블러 없이 opacity 만으로 (그래도 한 글자씩 등장)
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, y: rise, filter: 'blur(6px)' };
  const shown = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' };

  let order = 0; // 등장 순서 (전체 글자 기준)
  let letter = 0; // 그라데이션 위치 (공백 제외 글자 기준)
  const totalLetters = Math.max(
    lines.reduce((sum, line) => sum + line.replace(/\s/g, '').length, 0) - 1,
    1
  );

  return (
    <Tag className={className} aria-label={lines.join(' ')} {...rest}>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} className={`block ${lift} ${nowrap ? 'whitespace-nowrap' : ''}`} aria-hidden="true">
          {line.split(' ').map((word, wordIdx, words) => (
            <Fragment key={wordIdx}>
              {/* 단어 단위로 묶어 단어 중간에서 줄바꿈되지 않도록 함 */}
              <span className={`${size} inline-block black-han-sans-regular whitespace-nowrap`}>
                {Array.from(word).map((char, ci) => {
                  const color = gradient ? sampleGradient(gradient, letter / totalLetters) : undefined;
                  const charDelay = delay + order * stagger;
                  order += 1;
                  letter += 1;
                  return (
                    <motion.span
                      key={ci}
                      initial={hidden}
                      animate={inView ? undefined : shown}
                      whileInView={inView ? shown : undefined}
                      viewport={inView ? { once: true, amount: 0.4 } : undefined}
                      transition={{ duration, ease: [0.16, 1, 0.3, 1], delay: charDelay }}
                      className="inline-block"
                      style={{ color, willChange: 'transform, opacity, filter' }}
                    >
                      {char}
                    </motion.span>
                  );
                })}
              </span>
              {/* 단어 사이 공백 (줄바꿈 허용 지점) */}
              {wordIdx < words.length - 1 ? ' ' : null}
            </Fragment>
          ))}
        </span>
      ))}
    </Tag>
  );
}
