"use client"

import { useEffect, useRef, useState } from "react"
import "./AnimatedBackground.css"

interface FloatingCircle {
  x: number
  y: number
  size: number
  opacity: number
  speedX: number
  speedY: number
  hue: number
  pulseSpeed: number
  pulsePhase: number
}

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const animationRef = useRef<number>(0)
  const circlesRef = useRef<FloatingCircle[]>([])
  const isInitializedRef = useRef(false)

  // Initialize canvas and floating circles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      setDimensions({ width: window.innerWidth, height: window.innerHeight })

      // Only initialize circles once or when resizing
      initializeCircles()
      isInitializedRef.current = true
    }

    const initializeCircles = () => {
      if (!canvas) return

      // Create fewer, larger glowy circles
      const circleCount = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 50000), 25)
      const circles: FloatingCircle[] = []

      for (let i = 0; i < circleCount; i++) {
        circles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 40 + 20, // Larger sizes for the glowy circles
          opacity: Math.random() * 0.3 + 0.1,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          hue: 210 + Math.random() * 30, // Blue hue range
          pulseSpeed: Math.random() * 0.02 + 0.01,
          pulsePhase: Math.random() * Math.PI * 2,
        })
      }

      circlesRef.current = circles
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const animate = () => {
      // Clear canvas with a fade effect
      ctx.fillStyle = "rgba(12, 30, 62, 0.2)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const circles = circlesRef.current
      const mouseRadius = 150
      const time = Date.now() * 0.001

      // Update and draw floating circles
      for (let i = 0; i < circles.length; i++) {
        const circle = circles[i]

        // Update circle position
        circle.x += circle.speedX
        circle.y += circle.speedY

        // Bounce off edges with some damping
        if (circle.x < circle.size || circle.x > canvas.width - circle.size) {
          circle.speedX = -circle.speedX * 0.9
          if (circle.x < circle.size) circle.x = circle.size
          if (circle.x > canvas.width - circle.size) circle.x = canvas.width - circle.size
        }

        if (circle.y < circle.size || circle.y > canvas.height - circle.size) {
          circle.speedY = -circle.speedY * 0.9
          if (circle.y < circle.size) circle.y = circle.size
          if (circle.y > canvas.height - circle.size) circle.y = canvas.height - circle.size
        }

        // Check distance to mouse
        const dx = mousePosition.x - circle.x
        const dy = mousePosition.y - circle.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < mouseRadius + circle.size) {
          // Move circles away from mouse with smooth effect
          const force = (1 - distance / (mouseRadius + circle.size)) * 0.05
          circle.speedX -= dx * force
          circle.speedY -= dy * force
        }

        // Calculate pulsing effect
        const pulseAmount = Math.sin(time * circle.pulseSpeed + circle.pulsePhase) * 0.2 + 0.8
        const currentSize = circle.size * pulseAmount
        const currentOpacity = circle.opacity * (0.7 + pulseAmount * 0.3)

        // Draw glowy circle with multiple layers
        for (let j = 5; j >= 0; j--) {
          const gradientSize = currentSize * (1 + j * 0.5)
          const gradientOpacity = currentOpacity * (1 - j * 0.15)

          const glow = ctx.createRadialGradient(circle.x, circle.y, 0, circle.x, circle.y, gradientSize)
          glow.addColorStop(0, `hsla(${circle.hue}, 100%, 70%, ${gradientOpacity})`)
          glow.addColorStop(0.5, `hsla(${circle.hue}, 100%, 60%, ${gradientOpacity * 0.5})`)
          glow.addColorStop(1, `hsla(${circle.hue}, 100%, 50%, 0)`)

          ctx.beginPath()
          ctx.fillStyle = glow
          ctx.arc(circle.x, circle.y, gradientSize, 0, Math.PI * 2)
          ctx.fill()
        }

        // Draw core of the circle
        ctx.beginPath()
        ctx.fillStyle = `hsla(${circle.hue}, 100%, 80%, ${currentOpacity * 1.5})`
        ctx.arc(circle.x, circle.y, currentSize * 0.4, 0, Math.PI * 2)
        ctx.fill()

        // Apply some drag to slow circles
        circle.speedX *= 0.99
        circle.speedY *= 0.99

        // Add slight random movement
        circle.speedX += (Math.random() - 0.5) * 0.01
        circle.speedY += (Math.random() - 0.5) * 0.01

        // Limit max speed
        const maxSpeed = 0.5
        const speed = Math.sqrt(circle.speedX * circle.speedX + circle.speedY * circle.speedY)
        if (speed > maxSpeed) {
          circle.speedX = (circle.speedX / speed) * maxSpeed
          circle.speedY = (circle.speedY / speed) * maxSpeed
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [dimensions, mousePosition])

  return (
    <div className="animated-background">
      <div className="gradient-overlay"></div>
      <canvas ref={canvasRef} className="particles-canvas"></canvas>
      <div className="wave-container">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>
      <div className="star-field">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          ></div>
        ))}
      </div>
      <div className="shooting-star"></div>
    </div>
  )
}

export default AnimatedBackground

