import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from '../pages/Home';
import AboutUs from '../pages/AboutUs';
import Member from '../pages/Member';
import News from '../pages/News';
import NewsDetail from '../pages/NewsDetail';
import Contact from '../pages/Contact';
import Admin from '../pages/Admin';

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    // mode="wait": 이전 페이지가 완전히 사라진 뒤 새 페이지가 나타나도록 제어합니다.
    <AnimatePresence mode="wait">
      {/*
        페이지(세션) 전환 페이드.
        - 전환 래퍼를 AnimatePresence 직속 자식에 두어야 exit 가 확실히 동작합니다.
        - variants(문자열 라벨) 대신 "객체 기반" initial/animate/exit 를 사용해
          내부 섹션의 whileInView(스크롤 페이드)에 상태가 전파/간섭되지 않게 합니다.
      */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.7, ease: 'easeInOut' } }} // 찬찬히 나타남
        exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }} // 찬찬히 사라짐
      >
        {/* location 을 명시해야 페이드 아웃 중 이전 페이지가 그대로 유지됩니다. */}
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/members" element={<Member />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
