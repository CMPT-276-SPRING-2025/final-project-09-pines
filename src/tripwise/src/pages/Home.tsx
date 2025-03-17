import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

// Define types for feature keys and data structure
type FeatureKey = "plan" | "on-the-go" | "recommend" | "travel" | "review" | "alert";

type FeatureData = {
  title: string;
  placeholder: string;
};

type FeatureMap = {
  plan: FeatureData;
  "on-the-go": FeatureData;
  recommend: FeatureData;
  travel: FeatureData;
  review: FeatureData;
  alert: FeatureData;
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

  // Handle feature button click and update selected feature
  const handleFeatureClick = (feature: FeatureKey) => {
    setSelectedFeature(feature);
  };

  // Navigate to the selected feature's page when clicking the search bar
  const handleSearchClick = () => {
    navigate(`/${selectedFeature}`);
  };

  // Navigate to the schedule page when clicking the calendar icon
  const handleCalendarClick = () => {
    navigate("/schedule");
  };

  // Define feature groups for button layout
  const topFeatures: FeatureKey[] = ["plan", "on-the-go", "recommend"];
  const bottomFeatures: FeatureKey[] = ["travel", "review", "alert"];

  return (
    <div className="home-container">
      {/* Calendar icon that redirects to the schedule page */}
      <div className="calendar-icon" onClick={handleCalendarClick}>
        📅
      </div>

      <div className="main-content">
        {/* Left area containing the title and search bar */}
        <div className="left-area">
          <h1>{featureMap[selectedFeature].title}</h1>
          <div className="search-bar" onClick={handleSearchClick}>
            <span className="search-emoji">📍</span>
            <input
              type="text"
              placeholder={featureMap[selectedFeature].placeholder}
              readOnly
            />
          </div>
        </div>

        {/* Right area with feature selection buttons */}
        <div className="right-area">
          <div className="button-group-top">
            {topFeatures.map((feature) => (
              <button
                key={feature}
                className={`feature-button ${
                  selectedFeature === feature ? "active" : ""
                }`}
                onClick={() => handleFeatureClick(feature)}
              >
                {feature}
              </button>
            ))}
          </div>

          <div className="button-group-bottom">
            {bottomFeatures.map((feature) => (
              <button
                key={feature}
                className={`feature-button ${
                  selectedFeature === feature ? "active" : ""
                }`}
                onClick={() => handleFeatureClick(feature)}>
                {feature}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
