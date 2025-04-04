import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

interface NavButtonsProps {
  features: string[];
  onFeatureClick: (feature: string) => void;
}

function NavButtons({ features, onFeatureClick }: NavButtonsProps) {
  const { feature } = useParams<{ feature: string }>();
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/");
  };

  return (
    <div className="nav-buttons-container">
      <button className="back-button" onClick={goHome} aria-label="Go back">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19 12H5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 19L5 12L12 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="chat-feature-buttons">
        {features.map((btnFeature) => (
          <motion.button
            key={btnFeature}
            className={`nav-button ${btnFeature === feature ? "active" : ""}`}
            onClick={() => onFeatureClick(btnFeature)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: features.indexOf(btnFeature) * 0.05 }}
          >
            {btnFeature}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default NavButtons;
