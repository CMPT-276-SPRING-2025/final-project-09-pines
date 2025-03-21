import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import ChatPage from "./pages/ChatPage.tsx";
import Schedule from "./pages/Schedule.tsx";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:feature" element={<ChatPage />} />
        <Route path="/:schedule" element={<Schedule />} />
      </Routes>
    </Router>
  );
}

export default App;
