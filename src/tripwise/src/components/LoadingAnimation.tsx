"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import "./LoadingAnimation.css"

interface LoadingAnimationProps {
  message: string
  onAnimationComplete?: () => void
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ message, onAnimationComplete }) => {
  const [animationStarted, setAnimationStarted] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Start animation after a short delay
    const startTimer = setTimeout(() => {
      setAnimationStarted(true)
    }, 100)

    // Simulate progress - FASTER ANIMATION
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 2 // Doubled speed
        if (newProgress >= 100) {
          clearInterval(progressInterval)

          // Call onAnimationComplete after animation finishes
          setTimeout(() => {
            if (onAnimationComplete) {
              onAnimationComplete()
            }
          }, 300) // Reduced from 500ms

          return 100
        }
        return newProgress
      })
    }, 20) // Reduced from 30ms

    return () => {
      clearTimeout(startTimer)
      clearInterval(progressInterval)
    }
  }, [onAnimationComplete])

  return (
    <div className="loading-container">
      <div className="loading-stars"></div>
      <div className="loading-stars-2"></div>

      <motion.div
        className="loading-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }} // Reduced from 0.5
      >
        <div className="loading-animation">
          <div className="plane-container">
            <motion.div
              className="plane"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{
                x: `${progress}%`,
                opacity: 1,
                rotate: [0, 5, -5, 0],
                y: [0, -10, 0],
              }}
              transition={{
                x: { duration: 2, ease: "linear" }, // Reduced from 3
                rotate: { repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }, // Reduced from 2
                y: { repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }, // Reduced from 2
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22 16L14 8L14 3C14 2.45 13.55 2 13 2L11 2C10.45 2 10 2.45 10 3L10 8L2 16C2 16 1 17 2 18C3 19 4 18 4 18L10 12L10 17L8 19C8 19 7 20 8 21C9 22 10 21 10 21L12 19L14 21C14 21 15 22 16 21C17 20 16 19 16 19L14 17L14 12L20 18C20 18 21 19 22 18C23 17 22 16 22 16Z"
                  fill="#0288d1"
                />
              </svg>
            </motion.div>
          </div>

          <div className="loading-track">
            <motion.div className="loading-track-fill" style={{ width: `${progress}%` }}></motion.div>
          </div>

          <div className="loading-progress-text">{progress}%</div>
        </div>

        <motion.p
          className="loading-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }} // Reduced from 0.3
        >
          {message}
        </motion.p>

        <div className="loading-tips">
          <AnimatePresence mode="wait">
            <motion.p
              key={Math.floor(progress / 25)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }} // Reduced from 0.5
            >
              {getTravelTip(Math.floor(progress / 25))}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="loading-clouds">
        <div className="loading-cloud loading-cloud-1"></div>
        <div className="loading-cloud loading-cloud-2"></div>
        <div className="loading-cloud loading-cloud-3"></div>
      </div>
    </div>
  )
}

function getTravelTip(index: number): string {
  const tips = [
    "Pack light and smart - you can always buy what you need.",
    "Learn a few phrases in the local language.",
    "Keep digital copies of all important documents.",
    "Always have a backup plan for your itinerary.",
  ]

  return tips[index % tips.length]
}

export default LoadingAnimation
