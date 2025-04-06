import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CreateAlertModal from "../components/CreateAlertModal";
import "./Alert.css";


// Define types for our alerts
interface Alert {
  id: string;
  type: "flight" | "hotel";
  from?: string;
  to?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  currentPrice: number;
  targetPrice: number;
  availability: number;
  isNightlyRate?: boolean;
  isAlmostFull?: boolean;
}

export default function Alert() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "1",
      type: "flight",
      from: "New York",
      to: "London",
      startDate: new Date(2023, 11, 15),
      endDate: new Date(2023, 11, 22),
      currentPrice: 750,
      targetPrice: 650,
      availability: 85,
    },
    {
      id: "2",
      type: "hotel",
      location: "Marriott Resort Miami",
      startDate: new Date(2024, 0, 10),
      endDate: new Date(2024, 0, 15),
      currentPrice: 220,
      targetPrice: 180,
      availability: 70,
      isNightlyRate: true,
    },
    {
      id: "3",
      type: "flight",
      from: "San Francisco",
      to: "Tokyo",
      startDate: new Date(2024, 2, 5),
      endDate: new Date(2024, 2, 20),
      currentPrice: 980,
      targetPrice: 850,
      availability: 60,
    },
    {
      id: "4",
      type: "hotel",
      location: "Hilton Garden Inn Seattle",
      startDate: new Date(2024, 1, 3),
      endDate: new Date(2024, 1, 7),
      currentPrice: 195,
      targetPrice: 160,
      availability: 50,
      isNightlyRate: true,
    },
    {
      id: "5",
      type: "flight",
      from: "Chicago",
      to: "Miami",
      startDate: new Date(2023, 11, 23),
      endDate: new Date(2023, 11, 30),
      currentPrice: 420,
      targetPrice: 350,
      availability: 90,
      isAlmostFull: true,
    },
    {
      id: "6",
      type: "hotel",
      location: "Grand Hyatt New York",
      startDate: new Date(2023, 11, 24),
      endDate: new Date(2023, 11, 26),
      currentPrice: 310,
      targetPrice: 250,
      availability: 85,
      isNightlyRate: true,
      isAlmostFull: true,
    },
  ]);

  // Filter alerts based on search query and active filter
  const filteredAlerts = alerts.filter((alert) => {
    // Filter by search query
    const matchesSearch =
      searchQuery === "" ||
      (alert.type === "flight" &&
        `${alert.from} ${alert.to}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (alert.type === "hotel" && alert.location?.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by type
    const matchesType =
      activeFilter === "all" ||
      (activeFilter === "flights" && alert.type === "flight") ||
      (activeFilter === "hotels" && alert.type === "hotel");

    return matchesSearch && matchesType;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleCreateAlert = (newAlert: Omit<Alert, "id">) => {
    const id = (alerts.length + 1).toString();
    setAlerts([...alerts, { ...newAlert, id }]);
    setShowCreateModal(false);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
  };

  const handleEditAlert = (id: string) => {
    // In a real app, this would open the edit modal with the alert data
    console.log(`Editing alert ${id}`);
  };

  const handleToggleNotification = (id: string) => {
    // In a real app, this would toggle notifications for the alert
    console.log(`Toggling notification for alert ${id}`);
  };

  const handleAddToCalendar = (alert: Alert) => {
    // In a real app, this would add the alert to the calendar
    console.log(`Adding alert to calendar: ${JSON.stringify(alert)}`);
    navigate("/schedule");
  };

  const goHome = () => {
    navigate("/");
  };

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
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>

      <div className="alert-header">
        <div className="alert-title-section">
          <h1 className="alert-title">Travel Alerts</h1>
          <p className="alert-subtitle">Get notified when prices drop or availability changes</p>
        </div>
        <motion.button 
          className="create-alert-button"
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="plus-icon">+</span>
          Create Alert
        </motion.button>
      </div>

      <div className="alert-search-row">
        <div className="alert-search-box">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#90CAF9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 21L16.65 16.65" stroke="#90CAF9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="#0288D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Filter
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

      <div className="alerts-grid">
        <AnimatePresence>
          {filteredAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              className={`alert-card ${alert.isAlmostFull ? "almost-full" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {alert.isAlmostFull && <div className="almost-full-badge">Almost Full</div>}

              <div className="alert-card-header">
                <div className="alert-destination">
                  {alert.type === "flight" ? (
                    <>
                      <svg className="alert-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 16.32C22 16.32 18 20 12 20C6 20 2 16.32 2 16.32M12 4V20M12 4L8 8M12 4L16 8" stroke="#0288D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{alert.from} to {alert.to}</span>
                    </>
                  ) : (
                    <>
                      <svg className="alert-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 22V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H19C19.5304 6 20.0391 6.21071 20.4142 6.58579C20.7893 6.96086 21 7.46957 21 8V22M3 22H21M3 22H2M21 22H22M7 6V3C7 2.73478 7.10536 2.48043 7.29289 2.29289C7.48043 2.10536 7.73478 2 8 2H16C16.2652 2 16.5196 2.10536 16.7071 2.29289C16.8946 2.48043 17 2.73478 17 3V6" stroke="#0288D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                  <span className="alert-value">
                    ${alert.currentPrice}
                    {alert.isNightlyRate ? "/night" : ""}
                  </span>
                </div>

                <div className="alert-price-row">
                  <span className="alert-label">Target Price</span>
                  <span className="alert-value target-price">
                    ${alert.targetPrice}
                    {alert.isNightlyRate ? "/night" : ""}
                  </span>
                </div>

                <div className="alert-price-row">
                  <span className="alert-label">Availability</span>
                  <span className={`alert-value ${alert.availability > 80 ? "high-availability" : ""}`}>
                    {alert.availability}% {alert.availability > 80 ? "full" : "booked"}
                  </span>
                </div>
              </div>

              <div className="alert-actions">
                <button 
                  className="alert-action-button edit-button"
                  onClick={() => handleEditAlert(alert.id)}
                >
                  Edit
                </button>

                <div className="alert-action-icons">
                  <button 
                    className="alert-icon-button notification-button"
                    onClick={() => handleToggleNotification(alert.id)}
                    aria-label="Toggle notifications"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#0288D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="#0288D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <button 
                    className="alert-icon-button calendar-button"
                    onClick={() => handleAddToCalendar(alert)}
                    aria-label="Add to calendar"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#0288D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 2V6" stroke="#0288D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 2V6" stroke="#0288D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 10H21" stroke="#0288D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <button 
                    className="alert-icon-button delete-button"
                    onClick={() => handleDeleteAlert(alert.id)}
                    aria-label="Delete alert"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18" stroke="#FF5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6 6L18 18" stroke="#FF5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create Alert Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateAlertModal 
            onClose={() => setShowCreateModal(false)} 
            onCreateAlert={handleCreateAlert} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}