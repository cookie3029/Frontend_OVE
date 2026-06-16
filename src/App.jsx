import { BrowserRouter as Router } from 'react-router-dom';
import Navigation from './components/Navigation';
import AnimatedRoutes from './components/AnimatedRoutes';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  return (
    <Router>
      {/* 첫 방문(세션당 1회) 인트로 로딩 화면 — 전체를 덮는 오버레이 */}
      <LoadingScreen />
      <div className="h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)] antialiased selection:bg-cyan-500/20 selection:text-cyan-400 transition-colors duration-300">
        <Navigation />
        <AnimatedRoutes />
      </div>
    </Router>
  );
}
