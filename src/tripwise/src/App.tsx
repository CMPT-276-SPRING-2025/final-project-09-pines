import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import ChatPage from "./pages/ChatPage.tsx";
import Schedule from "./pages/Schedule.tsx";
import Alert from "./pages/Alert.tsx";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/alert" element={<Alert />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/:feature" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;