import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ChatPage from "./pages/ChatPage";
import Schedule from "./pages/Schedule";
import Alerts from "./pages/AlertsPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:feature" element={<ChatPage />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;