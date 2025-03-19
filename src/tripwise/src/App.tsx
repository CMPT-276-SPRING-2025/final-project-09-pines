import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import ChatPage from "./pages/ChatPage.tsx";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:feature" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;
