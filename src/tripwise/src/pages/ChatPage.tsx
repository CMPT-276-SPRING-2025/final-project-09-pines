"use client"

import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import "./ChatPage.css"
import type React from "react"
import { useEffect, useState, useRef } from "react"
import { fetchChatResponse, clearChat } from "../services/gemini.ts"
import ReactMarkdown from "react-markdown"
import NavButtons from "../components/NavButtons"
import { ChevronUp } from "lucide-react"
import Logo from "../components/Logo"

function ChatPage() {
  const navigate = useNavigate()
  const { feature } = useParams<{ feature: string }>()
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") || ""
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<{ type: string; text: string; id: string }[]>([])
  const [location, setLocation] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Request user's current location on mount.
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`
          setLocation(coords)
          console.log("User location:", coords)
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocation("Unknown")
        },
      )
    } else {
      console.error("Geolocation is not supported by this browser.")
      setLocation("Not supported")
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // On mount, if there's a query from Home, use it as the first user message.
  useEffect(() => {
    if (feature && query) {
      setIsLoading(true)
      setIsTyping(true)
      // Append the user's location into the query.
      const promptWithLocation = `User location: ${location || "unknown"}
${query}`

      // Add user message immediately
      setMessages([{ type: "user", text: query, id: Date.now().toString() }])

      fetchChatResponse(feature, promptWithLocation)
        .then((response) => {
          // Simulate typing effect
          setIsTyping(false)

          // Add AI response with slight delay for better UX
          setTimeout(() => {
            setMessages((prev) => [...prev, { type: "gemini", text: response, id: Date.now().toString() }])
            setIsLoading(false)
          }, 300)
        })
        .catch((error) => {
          console.error("Error fetching chat response:", error)
          setIsTyping(false)
          setMessages((prev) => [
            ...prev,
            { type: "gemini", text: "Error fetching response", id: Date.now().toString() },
          ])
          setIsLoading(false)
        })
    }
  }, [feature, query, location])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  const sendMessage = () => {
    if (inputValue.trim() && feature) {
      const userMessage = inputValue.trim()
      const messageId = Date.now().toString()

      // Append location information to the query prompt.
      const promptWithLocation = `User location: ${location || "unknown"}
${userMessage}`

      setMessages((prev) => [...prev, { type: "user", text: userMessage, id: messageId }])
      setInputValue("")
      setIsLoading(true)
      setIsTyping(true)

      fetchChatResponse(feature, promptWithLocation)
        .then((response) => {
          setIsTyping(false)

          // Add AI response with slight delay for better UX
          setTimeout(() => {
            setMessages((prev) => [...prev, { type: "gemini", text: response, id: Date.now().toString() }])
            setIsLoading(false)
          }, 300)
        })
        .catch((error) => {
          console.error("Error fetching chat response:", error)
          setIsTyping(false)
          setMessages((prev) => [
            ...prev,
            { type: "gemini", text: "Error fetching response", id: Date.now().toString() },
          ])
          setIsLoading(false)
        })
    }
  }

  const features: string[] = ["on-the-go", "recommend", "travel", "review", "alert"]

  const handleFeatureClick = async (feature: string) => {
    setMessages([])
    try {
      await clearChat()
      console.log("Chat cleared")
    } catch (error) {
      console.error("Error clearing chat:", error)
    }
    navigate(`/${feature}`)
  }

  const handleSendToSchedule = () => {
    // Logic to send to schedule
    console.log("Sending to schedule")
    setShowMenu(false)
    // Navigate to schedule with current chat data
    navigate("/schedule?fromChat=true")
  }

  const handleClearChat = async () => {
    // Logic to clear chat
    console.log("Clearing chat")
    setShowMenu(false)
    setMessages([])
    try {
      await clearChat()
      console.log("Chat cleared")
    } catch (error) {
      console.error("Error clearing chat:", error)
    }
  }

  // Generate a random bubble animation delay
  const getRandomDelay = () => {
    return Math.random() * 2
  }

  return (
    <motion.div
      className="chat-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated background elements */}
      <div className="chat-background">
        <div className="chat-decoration chat-decoration-1"></div>
        <div className="chat-decoration chat-decoration-2"></div>

        {/* Floating bubbles */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="floating-bubble"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${getRandomDelay()}s`,
              width: `${Math.random() * 60 + 20}px`,
              height: `${Math.random() * 60 + 20}px`,
              opacity: Math.random() * 0.3 + 0.1,
            }}
          ></div>
        ))}
      </div>

      {/* Add Logo to top left corner */}
      <Logo className="app-logo" size="small" />

      <div className="chat-header">
        <NavButtons features={features} onFeatureClick={handleFeatureClick} />
      </div>

      <motion.div
        className="chat-window"
        ref={chatWindowRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`chat-message ${message.type}-message`}
              initial={{ opacity: 0, y: 20, x: message.type === "user" ? 20 : -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {message.type === "user" && (
                <div className="message-avatar user-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              <div className="message-content">
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>

              {message.type === "gemini" && (
                <div className="message-avatar gemini-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="#0288d1"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M12 16V12" stroke="#0288d1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path
                      d="M12 8H12.01"
                      stroke="#0288d1"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              className="chat-message gemini-message typing-message"
              initial={{ opacity: 0, y: 20, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="message-avatar gemini-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="#0288d1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M12 16V12" stroke="#0288d1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 8H12.01" stroke="#0288d1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messageEndRef} />
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="chat-input-row"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="chat-input-box">
          <input
            type="text"
            className="chat-input"
            placeholder="Type a message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />

          <div className="chat-input-actions">
            <motion.div className="chat-menu-container" ref={menuRef}>
              <motion.button
                className={`chat-menu-button ${showMenu ? "active" : ""}`}
                onClick={() => setShowMenu(!showMenu)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Show options"
              >
                <ChevronUp size={20} />
              </motion.button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    className="chat-popup-menu"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="chat-menu-item"
                      onClick={handleSendToSchedule}
                      whileHover={{ backgroundColor: "rgba(2, 136, 209, 0.1)" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
                          stroke="#0288d1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 2V6"
                          stroke="#0288d1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 2V6"
                          stroke="#0288d1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 10H21"
                          stroke="#0288d1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Send to Schedule</span>
                    </motion.div>
                    <motion.div
                      className="chat-menu-item"
                      onClick={handleClearChat}
                      whileHover={{ backgroundColor: "rgba(2, 136, 209, 0.1)" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M3 6H5H21"
                          stroke="#0288d1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                          stroke="#0288d1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Clear Chat</span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        <motion.button
          className="chat-send-button"
          onClick={sendMessage}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          disabled={isLoading || !inputValue.trim()}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M22 2L15 22L11 13L2 9L22 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export default ChatPage

