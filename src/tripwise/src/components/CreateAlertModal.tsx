"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import alertService from "../services/alertService"
import { Alert } from "../services/models/Alert"

interface CreateAlertModalProps {
  onClose: () => void
  onCreateAlert: (alert: any) => void
  existingAlert?: Alert | null
}

// Rest of your component remains the same...

export default function CreateAlertModal({ onClose, onCreateAlert, existingAlert }: CreateAlertModalProps) {
  const [alertType, setAlertType] = useState<"flight" | "hotel">("flight")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [location, setLocation] = useState("")
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [currentPrice, setCurrentPrice] = useState("")
  const [targetPrice, setTargetPrice] = useState("")
  const [isNightlyRate, setIsNightlyRate] = useState(false)
  const [isCheckingPrice, setIsCheckingPrice] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Set initial values when editing an existing alert
  useEffect(() => {
    if (existingAlert) {
      setAlertType(existingAlert.type)
      
      if (existingAlert.type === "flight") {
        setFrom(existingAlert.from || "")
        setTo(existingAlert.to || "")
      } else {
        setLocation(existingAlert.location || "")
        setIsNightlyRate(existingAlert.isNightlyRate || false)
      }
      
      if (existingAlert.startDate) {
        const startDate = typeof existingAlert.startDate === 'string' 
          ? existingAlert.startDate.split('T')[0]
          : existingAlert.startDate.toISOString().split('T')[0];
        setDepartureDate(startDate);
      }
      
      if (existingAlert.endDate) {
        const endDate = typeof existingAlert.endDate === 'string'
          ? existingAlert.endDate.split('T')[0]
          : existingAlert.endDate.toISOString().split('T')[0];
        setReturnDate(endDate);
      }
      
      setCurrentPrice(existingAlert.currentPrice.toString())
      setTargetPrice(existingAlert.targetPrice.toString())
    }
  }, [existingAlert])

// In the checkCurrentPrice function, update the "else" block:
// Fix the flight price check function:
const checkCurrentPrice = async () => {
  if (alertType === "flight") {
    if (!from || !to || !departureDate || !returnDate) {
      setError("Please fill in all flight details to check prices")
      return
    }
    
    setIsCheckingPrice(true)
    setError(null)
    
    try {
      console.log(`Getting price for ${from} to ${to}`)
      const priceData = await alertService.getFlightPrice(from, to, departureDate, returnDate)
      console.log("Price data returned:", priceData)
      setCurrentPrice(priceData.price.toString())
    } catch (err) {
      console.error("Error fetching flight price:", err)
      setError("Could not fetch current price. Please enter manually.")
    } finally {
      setIsCheckingPrice(false)
    }
  } else {
    // Hotel price check functionality - this part is correct
    if (!location || !departureDate || !returnDate) {
      setError("Please fill in location and dates to check hotel prices")
      return
    }
    
    setIsCheckingPrice(true)
    setError(null)
    
    try {
      console.log(`Getting average hotel prices for ${location}`)
      const priceData = await alertService.getHotelPrice(location, departureDate, returnDate)
      console.log("Hotel price data returned:", priceData)
      setCurrentPrice(priceData.price.toString())
      
      // If it's an existing alert, preserve the nightly rate setting
      if (!existingAlert) {
        // For new alerts, set nightly rate based on date difference
        const checkIn = new Date(departureDate)
        const checkOut = new Date(returnDate)
        const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
        
        // If stay is more than 1 night, suggest it's a nightly rate
        if (nights > 1) {
          setIsNightlyRate(true)
        }
      }
    } catch (err) {
      console.error("Error fetching hotel prices:", err)
      setError("Could not fetch average hotel price. Please enter manually.")
    } finally {
      setIsCheckingPrice(false)
    }
  }
}

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validate form based on alert type
    if (alertType === "flight") {
      if (!from || !to) {
        setError("Please enter both origin and destination")
        return
      }
      
      // Validate airport codes (must be 3 letters)
      const originCode = from.trim().toUpperCase()
      const destinationCode = to.trim().toUpperCase()
      
      if (originCode.length !== 3 || destinationCode.length !== 3) {
        setError("Airport codes must be 3 letters (e.g., YVR, YUL)")
        return
      }
    } else {
      // Hotel validation
      if (!location) {
        setError("Please enter a hotel location")
        return
      }
    }
    
    if (!departureDate) {
      setError("Please enter check-in date")
      return
    }
    
    if (!currentPrice || isNaN(parseFloat(currentPrice)) || parseFloat(currentPrice) <= 0) {
      setError("Please enter a valid current price")
      return
    }
    
    if (!targetPrice || isNaN(parseFloat(targetPrice)) || parseFloat(targetPrice) <= 0) {
      setError("Please enter a valid target price")
      return
    }
    
    try {
      // Create alert data based on form inputs
      const newAlert: any = {
        type: alertType,
        startDate: new Date(departureDate),
        endDate: returnDate ? new Date(returnDate) : new Date(departureDate),
        currentPrice: parseFloat(currentPrice),
        targetPrice: parseFloat(targetPrice),
      }
      
      // Add type-specific fields
      if (alertType === "flight") {
        newAlert.from = from.toUpperCase()
        newAlert.to = to.toUpperCase()
      } else {
        newAlert.location = location
        newAlert.isNightlyRate = isNightlyRate
      }
      
      // Add ID if editing an existing alert
      if (existingAlert) {
        newAlert.id = existingAlert.id
      }
      
      onCreateAlert(newAlert)
    } catch (err) {
      console.error("Error creating alert:", err)
      setError("Failed to create alert. Please try again.")
    }
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {existingAlert ? "Edit Alert" : `Create ${alertType === "flight" ? "Flight" : "Hotel"} Alert`}
            </h2>
            <p className="modal-subtitle">Get notified when prices drop</p>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="modal-error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Alert Type Selection */}
            {!existingAlert && (
              <div className="form-group">
                <label className="form-label">Alert Type</label>
                <div className="radio-group">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="flight"
                      name="alertType" 
                      checked={alertType === "flight"}
                      onChange={() => setAlertType("flight")}
                    />
                    <label htmlFor="flight">Flight</label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="hotel"
                      name="alertType"
                      checked={alertType === "hotel"}
                      onChange={() => setAlertType("hotel")}
                    />
                    <label htmlFor="hotel">Hotel</label>
                  </div>
                </div>
              </div>
            )}

            {/* Different fields based on alert type */}
            {alertType === "flight" ? (
              <>
                <div className="form-group">
                  <label className="form-label">From</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Airport code (e.g. YVR)"
                    value={from}
                    onChange={(e) => setFrom(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">To</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Airport code (e.g. YUL)"
                    value={to}
                    onChange={(e) => setTo(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="City or hotel name"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-col">
                <label className="form-label">
                  {alertType === "flight" ? "Departure" : "Check-in"}
                </label>
                <input
                  type="date"
                  className="date-input"
                  value={departureDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-col">
                <label className="form-label">
                  {alertType === "flight" ? "Return" : "Check-out"}
                </label>
                <input
                  type="date"
                  className="date-input"
                  value={returnDate}
                  min={departureDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {alertType === "hotel" && (
              <div className="form-group">
                <div className="toggle-switch">
                  <span className="toggle-label">Price is per night</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={isNightlyRate}
                      onChange={() => setIsNightlyRate(!isNightlyRate)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            )}

            <div className="form-row price-row">
              <div className="form-col">
                <label className="form-label">Current Price ($)</label>
                <div className="price-input-container">
                  <input
                    type="number"
                    className="price-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    required
                  />
                  {alertType === "flight" ? (
                    <button
                      type="button"
                      className="check-price-button"
                      onClick={checkCurrentPrice}
                      disabled={isCheckingPrice || !from || !to || !departureDate || !returnDate}
                    >
                      {isCheckingPrice ? "Checking..." : "Get Price"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="check-price-button"
                      onClick={checkCurrentPrice}
                      disabled={isCheckingPrice || !location || !departureDate || !returnDate}
                    >
                      {isCheckingPrice ? "Checking..." : "Average Price"}
                    </button>
                  )}
                </div>
              </div>

              <div className="form-col">
                <label className="form-label">Target Price ($)</label>
                <input
                  type="number"
                  className="price-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button">
              {existingAlert ? "Update Alert" : "Create Alert"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}