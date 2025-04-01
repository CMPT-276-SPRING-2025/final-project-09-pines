import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./Home.css";
import LoadingAnimation from "../components/LoadingAnimation";

// Define types for feature keys and data structure
type FeatureKey = "plan" | "on-the-go" | "recommend" | "travel" | "review" | "alert";

type FeatureData = {
  title: string;
  placeholder: string;
};

type FeatureMap = {
  [key in FeatureKey]: FeatureData;
};

// Map feature keys to their corresponding titles and placeholder texts
const featureMap: FeatureMap = {
  plan: {
    title: "So, you want to travel...",
    placeholder: "Where do you want to go?",
  },
  "on-the-go": {
    title: "Translate or guide, just ask",
    placeholder: "What do you need?",
  },
  recommend: {
    title: "Can't decide yourself?",
    placeholder: "Don't worry, we got you!",
  },
  travel: {
    title: "Hotels and flights",
    placeholder: "Find the cheapest ones here",
  },
  review: {
    title: "But, is it any good?",
    placeholder: "Hear what other people think",
  },
  alert: {
    title: "Stay in the know",
    placeholder: "What would you like to get alerts about?",
  },
};

function Home() {
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey>("plan");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle feature button click and update selected feature
  const handleFeatureClick = (feature: FeatureKey) => {
    setSelectedFeature(feature);
  };

  // Navigate to the selected feature's page when clicking the search bar
  const handleSearchClick = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    // Simulate a small delay for the loading animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigate(`/${selectedFeature}?q=${encodeURIComponent(query)}`);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  }

  // Navigate to the schedule page when clicking the calendar icon
  const handleCalendarClick = async () => {
    setIsLoading(true);
    // Simulate a small delay for the loading animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigate("/schedule");
  };

  // Define feature groups for button layout
  const topFeatures: FeatureKey[] = ["plan", "on-the-go", "recommend"];
  const bottomFeatures: FeatureKey[] = ["travel", "review", "alert"];

  if (isLoading) {
    return <LoadingAnimation message={`Loading ${selectedFeature}...`} />;
  }

  return (
    <div className="home-container">
      {/* Decorative elements */}
      <div className="decoration decoration-1"></div>
      <div className="decoration decoration-2"></div>
      
      {/* Calendar icon that redirects to the schedule page */}
      <motion.div 
        className="calendar-icon" 
        onClick={handleCalendarClick}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        📅
      </motion.div>

      <div className="main-content">
        {/* Left area containing the title and search bar */}
        <motion.div 
          className="left-area"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {featureMap[selectedFeature].title}
          </motion.h1>
          
          <motion.div 
            className="search-bar" 
            onClick={handleSearchClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -5 }}
          >
            <span className="search-emoji">✈️</span>
            <input
              className="text-input"
              type="text"
              placeholder={featureMap[selectedFeature].placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
          </motion.div>
        </motion.div>

        {/* Right area with feature selection buttons */}
        <motion.div 
          className="right-area"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="button-group-top">
            {topFeatures.map((feature, index) => (
              <motion.button
                key={feature}
                className={`feature-button ${
                  selectedFeature === feature ? "active" : ""
                }`}
                onClick={() => handleFeatureClick(feature)}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                {feature}
              </motion.button>
            ))}
          </div>

          <div className="button-group-bottom">
            {bottomFeatures.map((feature, index) => (
              <motion.button
                key={feature}
                className={`feature-button ${
                  selectedFeature === feature ? "active" : ""
                }`}
                onClick={() => handleFeatureClick(feature)}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                {feature}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Home;