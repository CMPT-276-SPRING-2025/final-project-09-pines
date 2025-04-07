"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"

interface Alert {
  type: "flight" | "hotel"
  from?: string
  to?: string
  location?: string
  startDate: Date
  endDate: Date
  currentPrice: number
  targetPrice: number
  availability: number
  isNightlyRate?: boolean
  isAlmostFull?: boolean
}

interface CreateAlertModalProps {
  onClose: () => void
  onCreateAlert: (alert: Omit<Alert, "id">) => void
}

export default function CreateAlertModal({ onClose, onCreateAlert }: CreateAlertModalProps) {
  const [alertType, setAlertType] = useState<"flight" | "hotel">("flight")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [location, setLocation] = useState("")
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [priceDrops, setPriceDrops] = useState(true)
  const [limitedAvailability, setLimitedAvailability] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Create a new alert based on form data
    const newAlert: Omit<Alert, "id"> = {
      type: alertType,
      startDate: new Date(departureDate),
      endDate: returnDate ? new Date(returnDate) : new Date(departureDate),
      currentPrice: Math.floor(Math.random() * 500) + 100, // Random price for demo
      targetPrice: Math.floor(Math.random() * 300) + 100, // Random target price for demo
      availability: Math.floor(Math.random() * 50) + 50, // Random availability for demo
      isAlmostFull: Math.random() > 0.7, // Random almost full status for demo
    }

    if (alertType === "flight") {
      newAlert.from = from
      newAlert.to = to
    } else {
      newAlert.location = location
      newAlert.isNightlyRate = true
    }

    onCreateAlert(newAlert)
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
            <h2 className="modal-title">Create New Alert</h2>
            <p className="modal-subtitle">Set up alerts for price drops or limited availability</p>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Alert Type</label>
              <div className="radio-group">
                <div className="radio-option">
                  <input
                    type="radio"
                    id="flight"
                    name="alertType"
                    className="radio-input"
                    checked={alertType === "flight"}
                    onChange={() => setAlertType("flight")}
                  />
                  <label htmlFor="flight" className="radio-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M22 16.32C22 16.32 18 20 12 20C6 20 2 16.32 2 16.32M12 4V20M12 4L8 8M12 4L16 8"
                        stroke="#0288D1"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Flight
                  </label>
                </div>

                <div className="radio-option">
                  <input
                    type="radio"
                    id="hotel"
                    name="alertType"
                    className="radio-input"
                    checked={alertType === "hotel"}
                    onChange={() => setAlertType("hotel")}
                  />
                  <label htmlFor="hotel" className="radio-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3 22V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H19C19.5304 6 20.0391 6.21071 20.4142 6.58579C20.7893 6.96086 21 7.46957 21 8V22M3 22H21M3 22H2M21 22H22M7 6V3C7 2.73478 7.10536 2.48043 7.29289 2.29289C7.48043 2.10536 7.73478 2 8 2H16C16.2652 2 16.5196 2.10536 16.7071 2.29289C16.8946 2.48043 17 2.73478 17 3V6"
                        stroke="#0288D1"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Hotel
                  </label>
                </div>
              </div>
            </div>

            {alertType === "flight" ? (
              <>
                <div className="form-group">
                  <label className="form-label">From</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="City or airport"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">To</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="City or airport"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label">Hotel Location</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Hotel name or location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-col">
                <label className="form-label">Departure</label>
                <input
                  type="date"
                  className="date-input"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-col">
                <label className="form-label">Return (optional)</label>
                <input
                  type="date"
                  className="date-input"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Alert me for</label>

              <div className="toggle-switch">
                <span className="toggle-label">Price drops</span>
                <label className="toggle">
                  <input type="checkbox" checked={priceDrops} onChange={() => setPriceDrops(!priceDrops)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-switch">
                <span className="toggle-label">Limited availability</span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={limitedAvailability}
                    onChange={() => setLimitedAvailability(!limitedAvailability)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="submit-button">
              Create Alert
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}