import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Background } from "./components/Background";
import { pageVariants, springs } from "./lib/motion";
import Home from "./pages/Home";
import Game from "./pages/Game";
import End from "./pages/End";

/**
 * Pages cross-fade rather than queue: popLayout lifts the outgoing page out of
 * flow so the incoming one mounts immediately, and navigating again mid-way
 * just retargets the springs.
 */
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <div className="relative">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          transition={springs.smooth}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
            <Route path="/game/:mode" element={<Game />} />
            <Route path="/end" element={<End />} />
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
