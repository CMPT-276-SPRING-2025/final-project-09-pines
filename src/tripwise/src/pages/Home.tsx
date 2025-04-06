"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import "./Home.css"
import LoadingAnimation from "../components/LoadingAnimation"
import AnimatedBackground from "../components/AnimatedBackground"

// Define types for feature keys and data structure
type FeatureKey = "plan" | "on-the-go" | "recommend" | "travel" | "review" | "alert"

type FeatureData = {
  title: string
  placeholder: string
  icon: string
  suggestions: string[]
}

type FeatureMap = {
  [key in FeatureKey]: FeatureData
}

// Map feature keys to their corresponding titles and placeholder texts
const featureMap: FeatureMap = {
  plan: {
    title: "So, you want to travel...",
    placeholder: "Where do you want to go?",
    icon: "✈️",
    suggestions: ["Paris", "Tokyo", "New York", "Bali", "Santorini", "Marrakech"],
  },
  "on-the-go": {
    title: "Translate or guide, just ask",
    placeholder: "What do you need?",
    icon: "🗣️",
    suggestions: [
      "How to say hello in Japanese?",
      "Best restaurants near me",
      "Public transport in London",
      "Is this price fair?",
    ],
  },
  recommend: {
    title: "Can't decide yourself?",
    placeholder: "Don't worry, we got you!",
    icon: "🌟",
    suggestions: [
      "Beach vacation in December",
      "Family-friendly cities",
      "Adventure destinations",
      "Cultural experiences",
    ],
  },
  travel: {
    title: "Hotels and flights",
    placeholder: "Find the cheapest ones here",
    icon: "🏨",
    suggestions: [
      "5-star hotels in Dubai",
      "Flights to Rome in July",
      "Budget accommodations in Bangkok",
      "Business class deals",
    ],
  },
  review: {
    title: "But, is it any good?",
    placeholder: "Hear what other people think",
    icon: "⭐",
    suggestions: [
      "Eiffel Tower reviews",
      "Best time to visit Machu Picchu",
      "Is the London Pass worth it?",
      "Tokyo Disney reviews",
    ],
  },
  alert: {
    title: "Stay in the know",
    placeholder: "What would you like to get alerts about?",
    icon: "🔔",
    suggestions: [
      "Price drops for flights to Hawaii",
      "Hotel availability in Barcelona",
      "Travel advisories for Thailand",
      "Visa requirements",
    ],
  },
}

function Home() {
  const navigate = useNavigate()
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey>("plan")
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Handle feature button click and update selected feature
  const handleFeatureClick = (feature: FeatureKey) => {
    if (feature === "alert") {
      setIsLoading(true)
      setPendingNavigation("/alert")
      return
    }

    setSelectedFeature(feature)
    setShowSuggestions(true)

    // Focus the search input when changing features
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Navigate to the selected feature's page when clicking the search bar
  const handleSearchClick = () => {
    if (!query.trim()) {
      setShowSuggestions(true)
      return
    }

    setIsLoading(true)
    setPendingNavigation(`/${selectedFeature}?q=${encodeURIComponent(query)}`)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchClick()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setIsLoading(true)
    setPendingNavigation(`/${selectedFeature}?q=${encodeURIComponent(suggestion)}`)
  }

  // Navigate to the schedule page when clicking the calendar icon
  const handleCalendarClick = () => {
    setIsLoading(true)
    setPendingNavigation("/schedule")
  }

  // Handle location icon click
  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setQuery("Near me")
          setIsLoading(true)
          setPendingNavigation(
            `/${selectedFeature}?q=Near%20me&lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
          )
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }

  // Handle animation completion
  const handleAnimationComplete = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  if (isLoading) {
    return <LoadingAnimation message={`Loading ${selectedFeature}...`} onAnimationComplete={handleAnimationComplete} />
  }

  return (
    <div className="home-container">
      <AnimatedBackground />

      {/* Corner icons */}
      <motion.div
        className="corner-icon calendar-icon"
        onClick={handleCalendarClick}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      <motion.div
        className="corner-icon location-icon"
        onClick={handleLocationClick}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <div className="main-content">
        {/* Title */}
        <motion.h1
          className="home-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {featureMap[selectedFeature].title}
        </motion.h1>

        {/* Search area */}
        <div className="search-area">
          <motion.div
            className="search-bar-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="search-bar">
              <span className="search-emoji">{featureMap[selectedFeature].icon}</span>
              <input
                ref={searchInputRef}
                className="search-input"
                type="text"
                placeholder={featureMap[selectedFeature].placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setShowSuggestions(true)}
              />
              <motion.button
                className="search-button"
                onClick={handleSearchClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 21L16.65 16.65"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            </div>

            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  className="suggestions-container"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {featureMap[selectedFeature].suggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.9)", x: 5 }}
                    >
                      {suggestion}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Feature buttons */}
          <div className="feature-buttons">
            <div className="feature-buttons-row">
              {["plan", "on-the-go", "recommend"].map((feature, index) => (
                <motion.button
                  key={feature}
                  className={`feature-button ${selectedFeature === feature ? "active" : ""}`}
                  onClick={() => handleFeatureClick(feature as FeatureKey)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {feature === "on-the-go" ? "On-The-Go" : feature.charAt(0).toUpperCase() + feature.slice(1)}
                </motion.button>
              ))}
            </div>

            <div className="feature-buttons-row">
              {["travel", "review", "alert"].map((feature, index) => (
                <motion.button
                  key={feature}
                  className={`feature-button ${selectedFeature === feature ? "active" : ""}`}
                  onClick={() => handleFeatureClick(feature as FeatureKey)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {feature.charAt(0).toUpperCase() + feature.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
