import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Background } from "./components/Background";
import { pageVariants, springs } from "./lib/motion";
import Home from "./pages/Home";
import Simulator from "./pages/Simulator";
import Game from "./pages/Game";
import End from "./pages/End";
import SongFormatter from "./pages/SongFormatter";

/**
 * Pages cross-fade rather than queue: popLayout lifts the outgoing page out of
 * flow so the incoming one mounts immediately, and navigating again mid-way
 * just retargets the springs.
 */
const AnimatedRoutes = () => {
  const location = useLocation();
  // Menus are keyed by path so Back mid-transition reverses them. Rounds and
  // results are keyed per navigation: re-entering /game while the previous round
  // is still animating out must mount a fresh round, not revive the old one
  // (old prompt, old clock, speech already cancelled).
  const isRoundPage = location.pathname.startsWith('/game') || location.pathname === '/end';
  const pageKey = isRoundPage ? location.key : location.pathname;
  return (
    <div className="relative">
      {/* No initial={false}: that flag is inherited by every motion element in
          the first page and would silently disable their enter animations. */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={pageKey}
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          transition={springs.smooth}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/songs" element={<SongFormatter />} />
            <Route path="/game" element={<Game />} />
            <Route path="/game/:mode" element={<Game />} />
            <Route path="/end" element={<End />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const App = () => (
  // reducedMotion="user": movement becomes plain opacity fades when the OS asks for it.
  <MotionConfig reducedMotion="user">
    <BrowserRouter>
      <Background />
      <AnimatedRoutes />
    </BrowserRouter>
  </MotionConfig>
);

export default App;
