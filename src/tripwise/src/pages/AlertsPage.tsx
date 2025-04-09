"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import CreateAlertModal from "../components/CreateAlertModal"
import LoadingAnimation from "../components/LoadingAnimation"
import alertService from "../services/alertService"
import { Alert } from "../services/models/Alert"
import "./AlertsPage.css"

export default function AlertsPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch alerts on component mount
  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedAlerts = await alertService.getAlerts()
      setAlerts(fetchedAlerts)
    } catch (err) {
      console.error("Error fetching alerts:", err)
      setError("Failed to load alerts. Please try again.")
      // Use sample data if API fails
      setAlerts([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter alerts based on search query and active filter
  const filteredAlerts = alerts.filter((alert) => {
    // Filter by search query
    const matchesSearch =
      searchQuery === "" ||
      (alert.type === "flight" && `${alert.from} ${alert.to}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (alert.type === "hotel" && alert.location?.toLowerCase().includes(searchQuery.toLowerCase()))

    // Filter by type
    const matchesType =
      activeFilter === "all" ||
      (activeFilter === "flights" && alert.type === "flight") ||
      (activeFilter === "hotels" && alert.type === "hotel")

    return matchesSearch && matchesType
  })

  const formatDate = (date: Date | string) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const handleCreateAlert = async (newAlert: Omit<Alert, "id">) => {
    setIsLoading(true)
    setError(null)
    try {
      const createdAlert = await alertService.createAlert(newAlert)
      setAlerts([...alerts, createdAlert])
      setShowCreateModal(false)
    } catch (err) {
      console.error("Error creating alert:", err)
      setError("Failed to create alert. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateAlert = async (updatedAlert: Alert) => {
    setIsLoading(true)
    setError(null)
    try {
      const { id, ...alertData } = updatedAlert
      const result = await alertService.updateAlert(id, alertData)
      setAlerts(alerts.map(alert => alert.id === id ? result : alert))
      setEditingAlert(null)
      setShowCreateModal(false)
    } catch (err) {
      console.error("Error updating alert:", err)
      setError("Failed to update alert. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAlert = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this alert?")) return
    
    setIsLoading(true)
    setError(null)
    try {
      await alertService.deleteAlert(id)
      setAlerts(alerts.filter(alert => alert.id !== id))
    } catch (err) {
      console.error("Error deleting alert:", err)
      setError("Failed to delete alert. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert)
    setShowCreateModal(true)
  }

  const handleToggleNotification = (id: string | number) => {
    // In a real app, this would toggle notifications for the alert
  }

  const handleAddToCalendar = (alert: Alert) => {
    // In a real app, this would add the alert to the calendar
    navigate("/schedule")
  }

  const goHome = () => {
    navigate("/")
  }

  if (isLoading && alerts.length === 0) {
    return <LoadingAnimation message="Loading alerts..." />
  }

  return (
    <div className="alert-container">
      {/* Decorative elements */}
      <div className="alert-decoration alert-decoration-1"></div>
      <div className="alert-decoration alert-decoration-2"></div>

      {/* Back button */}
      <motion.button
        className="back-button"
        onClick={goHome}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Go back to home"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M12 19L5 12L12 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>

      <div className="alert-header">
        <div className="alert-title-section">
          <h1 className="alert-title">Travel Alerts</h1>
          <p className="alert-subtitle">Get notified when prices drop</p>
        </div>
        <motion.button
          className="create-alert-button"
          onClick={() => {
            setEditingAlert(null)
            setShowCreateModal(true)
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="plus-icon">+</span>
          Create Alert
        </motion.button>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="alert-search-row">
        <div className="alert-search-box">
          <svg
            className="search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
              stroke="#90CAF9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 21L16.65 16.65"
              stroke="#90CAF9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search alerts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="alert-search-input"
          />
        </div>
        <motion.button 
          className="filter-button" 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          onClick={() => fetchAlerts()} // Refresh alerts
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z"
              stroke="#0288D1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Refresh
        </motion.button>
      </div>

      <div className="alert-tabs">
        <button
          className={`alert-tab ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          All Alerts
        </button>
        <button
          className={`alert-tab ${activeFilter === "flights" ? "active" : ""}`}
          onClick={() => setActiveFilter("flights")}
        >
          Flights
        </button>
        <button
          className={`alert-tab ${activeFilter === "hotels" ? "active" : ""}`}
          onClick={() => setActiveFilter("hotels")}
        >
          Hotels
        </button>
      </div>

      {isLoading && alerts.length > 0 && (
        <div className="loading-overlay">
          <LoadingAnimation message="Updating alerts..." />
        </div>
      )}

      {filteredAlerts.length === 0 ? (
        <div className="no-alerts">
          <p>No alerts found. Create a new alert to get started!</p>
          <motion.button
            className="create-first-alert-button"
            onClick={() => {
              setEditingAlert(null)
              setShowCreateModal(true)
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create Your First Alert
          </motion.button>
        </div>
      ) : (
        <div className="alerts-grid">
          <AnimatePresence>
            {filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                className={`alert-card ${alert.isAlmostFull ? "almost-full" : ""} ${alert.isPriceDropped ? "price-dropped" : ""} ${alert.isTargetReached ? "target-reached" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {alert.isAlmostFull && <div className="almost-full-badge">Almost Full</div>}
                {alert.isPriceDropped && <div className="price-drop-badge">Price Dropped!</div>}
                {alert.isTargetReached && <div className="target-reached-badge">Target Reached!</div>}

                <div className="alert-card-header">
                  <div className="alert-destination">
                    {alert.type === "flight" ? (
                      <>
                        <svg
                          className="alert-icon"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M22 16.32C22 16.32 18 20 12 20C6 20 2 16.32 2 16.32M12 4V20M12 4L8 8M12 4L16 8"
                            stroke="#0288D1"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>
                          {alert.from} to {alert.to}
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="alert-icon"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3 22V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H19C19.5304 6 20.0391 6.21071 20.4142 6.58579C20.7893 6.96086 21 7.46957 21 8V22"
                            stroke="#0288D1"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M3 22H21"
                            stroke="#0288D1"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7 6V3C7 2.73478 7.10536 2.48043 7.29289 2.29289C7.48043 2.10536 7.73478 2 8 2H16C16.2652 2 16.5196 2.10536 16.7071 2.29289C16.8946 2.48043 17 2.73478 17 3V6"
                            stroke="#0288D1"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>{alert.location}</span>
                      </>
                    )}
                  </div>
                  <div className="alert-type-badge">{alert.type === "flight" ? "Flight" : "Hotel"}</div>
                </div>

                <div className="alert-dates">
                  {formatDate(alert.startDate)} - {formatDate(alert.endDate)}
                </div>

                <div className="alert-details">
                  <div className="alert-price-row">
                    <span className="alert-label">Current Price</span>
                    <span className={`alert-value ${alert.isPriceDropped ? "price-dropped-value" : ""}`}>
                      ${alert.currentPrice}
                      {alert.isNightlyRate ? "/night" : ""}
                      
                      {alert.previousPrice && alert.isPriceDropped && (
                        <span className="price-change">
                          ↓ ${(alert.previousPrice - alert.currentPrice).toFixed(2)}
                        </span>
                      )}
                      
                      {alert.previousPrice && !alert.isPriceDropped && alert.previousPrice !== alert.currentPrice && (
                        <span className="price-change increase">
                          ↑ ${(alert.currentPrice - alert.previousPrice).toFixed(2)}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="alert-price-row">
                    <span className="alert-label">Target Price</span>
                    <span className={`alert-value target-price ${alert.isTargetReached ? "target-reached-value" : ""}`}>
                      ${alert.targetPrice}
                      {alert.isNightlyRate ? "/night" : ""}
                      {alert.isTargetReached && (
                        <span className="target-check">✓</span>
                      )}
                    </span>
                  </div>
                  
                  {/* Removed availability section */}
                  
                  {/* Show last checked time if available */}
                  {alert.lastChecked && (
                    <div className="alert-last-checked">
                      Last checked: {new Date(alert.lastChecked).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="alert-actions">
                  <button className="alert-action-button edit-button" onClick={() => handleEditAlert(alert)}>
                    Edit
                  </button>

                  <div className="alert-action-icons">
                    <button
                      className={`alert-icon-button notification-button ${!alert.notificationSent && (alert.isPriceDropped || alert.isTargetReached) ? "has-notification" : ""}`}
                      onClick={() => handleToggleNotification(alert.id)}
                      aria-label="Toggle notifications"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                          stroke="#0288D1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                          stroke="#0288D1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <button
                      className="alert-icon-button calendar-button"
                      onClick={() => handleAddToCalendar(alert)}
                      aria-label="Add to calendar"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
                          stroke="#0288D1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 2V6"
                          stroke="#0288D1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 2V6"
                          stroke="#0288D1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 10H21"
                          stroke="#0288D1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <button
                      className="alert-icon-button delete-button"
                      onClick={() => handleDeleteAlert(alert.id)}
                      aria-label="Delete alert"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M18 6L6 18"
                          stroke="#FF5252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6 6L18 18"
                          stroke="#FF5252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Alert Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateAlertModal 
            onClose={() => {
              setShowCreateModal(false)
              setEditingAlert(null)
            }} 
            onCreateAlert={editingAlert ? handleUpdateAlert : handleCreateAlert}
            existingAlert={editingAlert}
          />
        )}
      </AnimatePresence>
    </div>
  )
}