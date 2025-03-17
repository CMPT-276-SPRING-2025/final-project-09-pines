import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

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

const featureMap: FeatureMap = {
  plan: {
    title: "So, you want to travel...",
    placeholder: "where do you want to go?",
  },
  "on-the-go": {
    title: "translate or guide, just ask",
    placeholder: "What do you need?",
  },
  recommend: {
    title: "Can't decide yourself?",
    placeholder: "don't worry we got you!",
  },
  travel: {
    title: "Hotels and flights",
    placeholder: "find the cheapest ones here",
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

  const handleFeatureClick = (feature: FeatureKey) => {
    setSelectedFeature(feature);
  };

  const handleSearchClick = () => {
    navigate(`/${selectedFeature}`);
  };

  const handleCalendarClick = () => {
    navigate("/schedule");
  };

  const topFeatures: FeatureKey[] = ["plan", "on-the-go", "recommend"];
  const bottomFeatures: FeatureKey[] = ["travel", "review", "alert"];

  return (
    <div className="home-container">
      <div className="calendar-icon" onClick={handleCalendarClick}>
        📅
      </div>

      <div className="main-content">
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
                onClick={() => handleFeatureClick(feature)}
              >
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
