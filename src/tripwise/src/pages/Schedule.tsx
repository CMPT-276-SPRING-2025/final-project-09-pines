import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Schedule.css'; // Make sure to create this CSS file

interface Trip {
  id: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  notes: string;
}

function Schedule() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([
    {
      id: '1',
      destination: 'Paris, France',
      startDate: new Date(2025, 4, 15),
      endDate: new Date(2025, 4, 22),
      notes: 'Visit the Eiffel Tower and Louvre Museum'
    },
    {
      id: '2',
      destination: 'Tokyo, Japan',
      startDate: new Date(2025, 6, 10),
      endDate: new Date(2025, 6, 20),
      notes: 'Explore Shibuya and try authentic ramen'
    }
  ]);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const goHome = () => {
    navigate('/');
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  return (
    <motion.div
      className="schedule-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="schedule-content">
        <div className="schedule-header">
          <motion.button
            className="back-button"
            onClick={goHome}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
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
          </motion.button>
          
          <h1 className="schedule-title">Your Travel Schedule</h1>
        </div>
        
        <div className="calendar-card">
          <div className="calendar-header">
            <button onClick={prevMonth} className="month-nav-button">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            
            <h2 className="month-title">
              <span className="calendar-icon">📅</span>
              {monthName}
            </h2>
            
            <button onClick={nextMonth} className="month-nav-button">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          
          <div className="calendar-body">
            <div className="trips-section">
              <h3 className="section-title">Upcoming Trips</h3>
              
              {trips.length > 0 ? (
                <div className="trips-list">
                  {trips.map((trip) => (
                    <motion.div
                      key={trip.id}
                      className="trip-card"
                      whileHover={{ y: -5 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="trip-content">
                        <div>
                          <h4 className="trip-destination">{trip.destination}</h4>
                          <p className="trip-dates">
                            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                          </p>
                          <p className="trip-notes">{trip.notes}</p>
                        </div>
                        
                        <button className="delete-trip-button">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3 6H5H21"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="no-trips-message">No trips scheduled yet</p>
              )}
              
              <motion.button
                className="add-trip-button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="add-icon"
                >
                  <path
                    d="M12 5V19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Add New Trip
              </motion.button>
            </div>
            
            <div className="suggestions-section">
              <h3 className="section-title">Trip Suggestions</h3>
              
              <div className="suggestions-grid">
                <motion.div
                  className="suggestion-card weekend-getaway"
                  whileHover={{ y: -5 }}
                >
                  <h4 className="suggestion-title">Weekend Getaway</h4>
                  <p className="suggestion-description">Explore nearby destinations for a quick escape</p>
                </motion.div>
                
                <motion.div
                  className="suggestion-card summer-vacation"
                  whileHover={{ y: -5 }}
                >
                  <h4 className="suggestion-title">Summer Vacation</h4>
                  <p className="suggestion-description">Plan your perfect summer getaway</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Schedule;