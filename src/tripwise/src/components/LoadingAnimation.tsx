import React, { useEffect, useState } from "react";
import "./LoadingAnimation.css";

interface LoadingAnimationProps {
  message: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ message }) => {
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStarted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="loading-container">
      <div className="loading-animation">
        <div className="plane-container">
          <div className={`plane ${animationStarted ? 'plane-takeoff' : ''}`}>✈️</div>
        </div>
        <div className="loading-track">
          <div className="loading-track-fill"></div>
        </div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingAnimation;
