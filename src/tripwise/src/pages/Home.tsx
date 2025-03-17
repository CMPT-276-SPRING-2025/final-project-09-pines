import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

type FeatureKey = "plan" | "on-the-go" | "recommend" | "travel" | "review" | "alert";

const featureMap: Record<FeatureKey, { title: string; placeholder: string }> = {
  plan: {
    title: "So, you want to travel... ✈️",
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

  return (
    <div>
      <div onClick={handleCalendarClick}>
        📅
      </div>

      <div>
        <div>
          <h1>{featureMap[selectedFeature].title}</h1>
          <div onClick={handleSearchClick}>
            <span className="search-emoji">📍</span>
            <input
              placeholder={featureMap[selectedFeature].placeholder}
              readOnly
            />
          </div>
        </div>

        <div>
          {(
            [
              "plan",
              "on-the-go",
              "recommend",
              "travel",
              "review",
              "alert",
            ] as FeatureKey[] ).map((feature) => (
            <button onClick={() => handleFeatureClick(feature)} >
              {feature}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
  