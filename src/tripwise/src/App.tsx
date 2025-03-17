import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import Plan from "./pages/Plan.tsx";
import OnTheGo from "./pages/OnTheGo.tsx"
import Recommend from "./pages/Recommend.tsx";
import Travel from "./pages/Travel.tsx";
import Review from "./pages/Review.tsx";
import Alert from "./pages/Alert.tsx";
import Schedule from "./pages/schedule.tsx";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/on-the-go" element={<OnTheGo />} />
        <Route path="/recommend" element={<Recommend />} />
        <Route path="/travel" element={<Travel />} />
        <Route path="/review" element={<Review />} />
        <Route path="/alert" element={<Alert />} />
        <Route path="/schedule" element={<Schedule />} />
      </Routes>
    </Router>
  );
}

export default App;
