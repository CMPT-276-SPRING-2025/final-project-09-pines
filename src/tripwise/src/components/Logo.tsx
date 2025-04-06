"use client"

import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

interface LogoProps {
  size?: "small" | "medium" | "large"
  className?: string
}

const Logo: React.FC<LogoProps> = ({ size = "medium", className = "" }) => {
  const navigate = useNavigate()
  
  const handleClick = () => {
    navigate("/")
  }
  
  // Determine size in pixels
  const dimensions = {
    small: { width: 40, height: 40, fontSize: 14 },
    medium: { width: 50, height: 50, fontSize: 16 },
    large: { width: 60, height: 60, fontSize: 20 }
  }
  
  const { width, height, fontSize } = dimensions[size]
  
  return (
    <motion.div
      className={`logo-container ${className}`}
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width,
        height,
        cursor: 'pointer',
        borderRadius: '50%',
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        color: 'white',
        fontWeight: 'bold',
        fontSize,
        position: 'relative',
        zIndex: 100
      }}
    >
      <div style={{ marginBottom: size === "small" ? -2 : -4 }}>
        <svg 
          width={width * 0.5} 
          height={width * 0.3} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22 16L14 8L14 3C14 2.45 13.55 2 13 2L11 2C10.45 2 10 2.45 10 3L10 8L2 16C2 16 1 17 2 18C3 19 4 18 4 18L10 12L10 17L8 19C8 19 7 20 8 21C9 22 10 21 10 21L12 19L14 21C14 21 15 22 16 21C17 20 16 19 16 19L14 17L14 12L20 18C20 18 21 19 22 18C23 17 22 16 22 16Z"
            fill="#0288d1"
          />
        </svg>
      </div>
      <div>TW</div>
    </motion.div>
  )
}

export default Logo
