import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Background } from "./components/Background";
import Home from "./pages/Home";
import Game from "./pages/Game";
import End from "./pages/End";

const App = () => (
  <BrowserRouter>
    <Background />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game" element={<Game />} />
      <Route path="/game/:mode" element={<Game />} />
      <Route path="/end" element={<End />} />
    </Routes>
  </BrowserRouter>
);

export default App;
