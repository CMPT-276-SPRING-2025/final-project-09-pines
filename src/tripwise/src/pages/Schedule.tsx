"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { TouchBackend } from "react-dnd-touch-backend"
import { Calendar, MapPin, Plus, Trash2, Edit2, Save, X, ChevronLeft, ChevronRight } from "lucide-react"
import "./Schedule.css"

// Detect if we're on a touch device
const isTouchDevice = () => {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0
}

// Define types for our data structures
interface Activity {
  id: string
  title: string
  description: string
  location?: string
  startTime: string
  duration: number // in minutes
  category: "food" | "attraction" | "transport" | "accommodation" | "other"
  day: number // 1-based index of the day in the trip
}

interface Trip {
  id: string
  destination: string
  startDate: Date
  endDate: Date
  notes: string
  activities: Activity[]
}

interface ActivityItemProps {
  activity: Activity
  onEdit: (activity: Activity) => void
  onDelete: (id: string) => void
  isTemplate?: boolean
}

interface DragItem extends Activity {
  isTemplate?: boolean
}

interface TimeSlotProps {
  day: number
  hour: number
  onDrop: (item: DragItem, day: number, time: string) => void
}

interface DayColumnProps {
  day: number
  date: Date
  activities: Activity[]
  onDrop: (item: DragItem, day: number, time: string) => void
  onEdit: (activity: Activity) => void
  onDelete: (id: string) => void
}

// Activity item component
const ActivityItem = ({ activity, onEdit, onDelete, isTemplate = false }: ActivityItemProps) => {
  const [{ isDragging }, dragRef] = useDrag<DragItem, unknown, { isDragging: boolean }>(() => ({
    type: isTemplate ? "ACTIVITY_TEMPLATE" : "ACTIVITY",
    item: { ...activity, isTemplate } as DragItem,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  // Calculate the category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "food":
        return "var(--category-food)"
      case "attraction":
        return "var(--category-attraction)"
      case "transport":
        return "var(--category-transport)"
      case "accommodation":
        return "var(--category-accommodation)"
      default:
        return "var(--category-other)"
    }
  }

  // Format time from 24h to 12h format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  return (
    <div
      ref={dragRef as unknown as React.RefObject<HTMLDivElement>}
      className={`activity-item ${activity.category} ${isDragging ? "dragging" : ""} ${isTemplate ? "template" : ""}`}
      style={{
        borderLeftColor: getCategoryColor(activity.category),
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div className="activity-time">{formatTime(activity.startTime)}</div>
      <div className="activity-content">
        <h4 className="activity-title">{activity.title}</h4>
        {activity.location && (
          <div className="activity-location">
            <MapPin size={14} />
            <span>{activity.location}</span>
          </div>
        )}
        {!isTemplate && activity.description && <p className="activity-description">{activity.description}</p>}
      </div>
      {!isTemplate && (
        <div className="activity-actions">
          <button onClick={() => onEdit(activity)} className="activity-action-btn edit">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(activity.id)} className="activity-action-btn delete">
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

// Time slot component
const TimeSlot = ({ day, hour, onDrop }: TimeSlotProps) => {
  const [{ isOver }, dropRef] = useDrop<DragItem, unknown, { isOver: boolean }>(() => ({
    accept: ["ACTIVITY", "ACTIVITY_TEMPLATE"],
    drop: (item: DragItem) => onDrop(item, day, `${hour}:00`),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))

  return (
    <div
      ref={dropRef as unknown as React.RefObject<HTMLDivElement>}
      className={`time-slot ${isOver ? "drop-hover" : ""}`}
      data-hour={hour}
      data-day={day}
    >
      {isOver && <div className="drop-indicator" />}
    </div>
  )
}

// Day column component
const DayColumn = ({ day, date, activities, onDrop, onEdit, onDelete }: DayColumnProps) => {
  // Generate time slots for the day (6 AM to 11 PM)
  const timeSlots = Array.from({ length: 18 }, (_, i) => i + 6)

  // Format the date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  // Filter activities for this day
  const dayActivities = activities.filter((activity) => activity.day === day)

  return (
    <div className="day-column">
      <div className="day-header">
        <span className="day-number">Day {day}</span>
        <span className="day-date">{formatDate(date)}</span>
      </div>
      <div className="time-slots">
        {timeSlots.map((hour) => (
          <TimeSlot key={`day${day}-hour${hour}`} day={day} hour={hour} onDrop={onDrop} />
        ))}

        {/* Position activities over the time slots */}
        {dayActivities.map((activity) => {
          const [hours, minutes] = activity.startTime.split(":").map(Number)
          const startHour = hours + minutes / 60
          const topPosition = (startHour - 6) * 60 // 6 is the starting hour, 60px is the height of 1 hour

          return (
            <div key={activity.id} className="positioned-activity" style={{ top: `${topPosition}px` }}>
              <ActivityItem activity={activity} onEdit={onEdit} onDelete={onDelete} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Main Schedule component
function Schedule() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([
    {
      id: "1",
      destination: "Paris, France",
      startDate: new Date(2025, 4, 15),
      endDate: new Date(2025, 4, 18),
      notes: "Visit the Eiffel Tower and Louvre Museum",
      activities: [
        {
          id: "a1",
          title: "Eiffel Tower Visit",
          description: "Enjoy the view from the top of the Eiffel Tower",
          location: "Champ de Mars, 5 Avenue Anatole France",
          startTime: "10:00",
          duration: 180,
          category: "attraction",
          day: 1,
        },
        {
          id: "a2",
          title: "Lunch at Le Jules Verne",
          description: "Fine dining experience with a view",
          location: "Eiffel Tower, 2nd floor",
          startTime: "13:30",
          duration: 90,
          category: "food",
          day: 1,
        },
        {
          id: "a3",
          title: "Louvre Museum",
          description: "See the Mona Lisa and other famous artworks",
          location: "Rue de Rivoli, 75001 Paris",
          startTime: "9:30",
          duration: 240,
          category: "attraction",
          day: 2,
        },
        {
          id: "a4",
          title: "Seine River Cruise",
          description: "Evening cruise along the Seine River",
          location: "Pont de l'Alma",
          startTime: "19:00",
          duration: 60,
          category: "attraction",
          day: 2,
        },
        {
          id: "a5",
          title: "Check-out & Airport Transfer",
          description: "Taxi to Charles de Gaulle Airport",
          location: "Hotel to CDG Airport",
          startTime: "10:00",
          duration: 60,
          category: "transport",
          day: 3,
        },
      ],
    },
    {
      id: "2",
      destination: "Tokyo, Japan",
      startDate: new Date(2025, 6, 10),
      endDate: new Date(2025, 6, 20),
      notes: "Explore Shibuya and try authentic ramen",
      activities: [],
    },
  ])

  // Activity templates that can be dragged onto the schedule
  const activityTemplates: Activity[] = [
    {
      id: "template-breakfast",
      title: "Breakfast",
      description: "",
      startTime: "8:00",
      duration: 60,
      category: "food",
      day: 0,
    },
    {
      id: "template-lunch",
      title: "Lunch",
      description: "",
      startTime: "12:00",
      duration: 60,
      category: "food",
      day: 0,
    },
    {
      id: "template-dinner",
      title: "Dinner",
      description: "",
      startTime: "19:00",
      duration: 90,
      category: "food",
      day: 0,
    },
    {
      id: "template-sightseeing",
      title: "Sightseeing",
      description: "",
      startTime: "10:00",
      duration: 180,
      category: "attraction",
      day: 0,
    },
    {
      id: "template-transport",
      title: "Transport",
      description: "",
      startTime: "9:00",
      duration: 60,
      category: "transport",
      day: 0,
    },
    {
      id: "template-hotel",
      title: "Hotel Check-in/out",
      description: "",
      startTime: "15:00",
      duration: 60,
      category: "accommodation",
      day: 0,
    },
  ]

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(trips[0])
  const [isAddingActivity, setIsAddingActivity] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [showAddTripForm, setShowAddTripForm] = useState(false)
  const [newTrip, setNewTrip] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    notes: "",
  })
  const [visibleDays, setVisibleDays] = useState<number[]>([1, 2, 3])
  const scheduleRef = useRef<HTMLDivElement>(null)

  // Handle dropping an activity onto a time slot
  const handleDrop = (item: DragItem, day: number, time: string) => {
    if (!selectedTrip) return

    const newActivity: Activity = {
      ...item,
      id: item.isTemplate ? `activity-${Date.now()}` : item.id,
      day: day,
      startTime: time,
    }

    if (item.isTemplate) {
      // Create a new activity from template
      setTrips((prevTrips) =>
        prevTrips.map((trip) =>
          trip.id === selectedTrip.id
            ? {
                ...trip,
                activities: [...trip.activities, newActivity],
              }
            : trip,
        ),
      )
    } else {
      // Move existing activity
      setTrips((prevTrips) =>
        prevTrips.map((trip) =>
          trip.id === selectedTrip.id
            ? {
                ...trip,
                activities: trip.activities.map((activity) => (activity.id === item.id ? newActivity : activity)),
              }
            : trip,
        ),
      )
    }
  }

  // Handle adding a new activity
  const handleAddActivity = () => {
    if (!selectedTrip) return

    setEditingActivity({
      id: `activity-${Date.now()}`,
      title: "",
      description: "",
      location: "",
      startTime: "12:00",
      duration: 60,
      category: "other",
      day: 1,
    })
    setIsAddingActivity(true)
  }

  // Handle editing an activity
  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity)
    setIsAddingActivity(true)
  }

  // Handle deleting an activity
  const handleDeleteActivity = (activityId: string) => {
    if (!selectedTrip) return

    setTrips((prevTrips) =>
      prevTrips.map((trip) =>
        trip.id === selectedTrip.id
          ? {
              ...trip,
              activities: trip.activities.filter((activity) => activity.id !== activityId),
            }
          : trip,
      ),
    )
  }

  // Handle saving an activity (new or edited)
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrip || !editingActivity) return

    setTrips((prevTrips) =>
      prevTrips.map((trip) =>
        trip.id === selectedTrip.id
          ? {
              ...trip,
              activities:
                isAddingActivity && !trip.activities.find((a) => a.id === editingActivity.id)
                  ? [...trip.activities, editingActivity]
                  : trip.activities.map((activity) =>
                      activity.id === editingActivity.id ? editingActivity : activity,
                    ),
            }
          : trip,
      ),
    )

    setIsAddingActivity(false)
    setEditingActivity(null)
  }

  // Handle adding a new trip
  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault()

    const newTripObj: Trip = {
      id: `trip-${Date.now()}`,
      destination: newTrip.destination,
      startDate: new Date(newTrip.startDate),
      endDate: new Date(newTrip.endDate),
      notes: newTrip.notes,
      activities: [],
    }

    setTrips([...trips, newTripObj])
    setSelectedTrip(newTripObj)
    setShowAddTripForm(false)
    setNewTrip({
      destination: "",
      startDate: "",
      endDate: "",
      notes: "",
    })
  }

  // Handle deleting a trip
  const handleDeleteTrip = (tripId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this trip?")
    if (!confirmDelete) return

    const newTrips = trips.filter((trip) => trip.id !== tripId)
    setTrips(newTrips)

    if (selectedTrip && selectedTrip.id === tripId) {
      setSelectedTrip(newTrips.length > 0 ? newTrips[0] : null)
    }
  }

  // Calculate the days to display based on the selected trip
  useEffect(() => {
    if (selectedTrip) {
      const tripDuration =
        Math.ceil((selectedTrip.endDate.getTime() - selectedTrip.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      setVisibleDays([1, 2, 3].filter((day) => day <= tripDuration))
    }
  }, [selectedTrip])

  // Navigate to previous days
  const showPreviousDays = () => {
    if (visibleDays[0] <= 1) return

    const newFirstDay = Math.max(1, visibleDays[0] - 3)
    setVisibleDays(
      [newFirstDay, newFirstDay + 1, newFirstDay + 2].filter((day) => {
        if (!selectedTrip) return false
        const tripDuration =
          Math.ceil((selectedTrip.endDate.getTime() - selectedTrip.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        return day <= tripDuration
      }),
    )
  }

  // Navigate to next days
  const showNextDays = () => {
    if (!selectedTrip) return

    const tripDuration =
      Math.ceil((selectedTrip.endDate.getTime() - selectedTrip.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (visibleDays[visibleDays.length - 1] >= tripDuration) return

    const newFirstDay = visibleDays[0] + 3
    setVisibleDays([newFirstDay, newFirstDay + 1, newFirstDay + 2].filter((day) => day <= tripDuration))
  }

  // Calculate date for a specific day in the trip
  const getDateForDay = (day: number) => {
    if (!selectedTrip) return new Date()

    const date = new Date(selectedTrip.startDate)
    date.setDate(date.getDate() + day - 1)
    return date
  }

  // Navigate back to home
  const goHome = () => {
    navigate("/")
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  // Determine if we should use touch backend
  const backendForDND = isTouchDevice() ? TouchBackend : HTML5Backend

  return (
    <DndProvider backend={backendForDND}>
      <motion.div
        className="schedule-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="schedule-content">
          <div className="schedule-header">
            <h1 className="schedule-title">Your Travel Schedule</h1>
          </div>

          <motion.button className="back-button" onClick={goHome} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <ChevronLeft size={24} />
          </motion.button>

          {/* Trip selector */}
          <div className="trip-selector">
            <div className="trip-selector-header">
              <h2>My Trips</h2>
              <button className="add-trip-button-small" onClick={() => setShowAddTripForm(true)}>
                <Plus size={20} />
                <span>New Trip</span>
              </button>
            </div>

            <div className="trip-cards">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className={`trip-card-small ${selectedTrip?.id === trip.id ? "selected" : ""}`}
                  onClick={() => setSelectedTrip(trip)}
                >
                  <div className="trip-card-content">
                    <h3>{trip.destination}</h3>
                    <p className="trip-dates">
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </p>
                  </div>
                  <button
                    className="delete-trip-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTrip(trip.id)
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedTrip ? (
            <>
              <div className="schedule-planner">
                <div className="schedule-planner-header">
                  <div className="destination-info">
                    <h2>{selectedTrip.destination}</h2>
                    <p className="trip-dates">
                      <Calendar size={16} className="icon" />
                      {formatDate(selectedTrip.startDate)} - {formatDate(selectedTrip.endDate)}
                    </p>
                  </div>

                  <div className="schedule-navigation">
                    <button className="nav-button" onClick={showPreviousDays} disabled={visibleDays[0] <= 1}>
                      <ChevronLeft size={20} />
                    </button>
                    <span className="days-indicator">
                      Days {visibleDays[0]}-{visibleDays[visibleDays.length - 1]}
                    </span>
                    <button
                      className="nav-button"
                      onClick={showNextDays}
                      disabled={
                        !selectedTrip ||
                        visibleDays[visibleDays.length - 1] >=
                          Math.ceil(
                            (selectedTrip.endDate.getTime() - selectedTrip.startDate.getTime()) / (1000 * 60 * 60 * 24),
                          ) +
                            1
                      }
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="schedule-view">
                  {/* Time indicators */}
                  <div className="time-indicators">
                    <div className="time-indicator-header"></div>
                    {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => (
                      <div key={`time-${hour}`} className="time-indicator">
                        {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  <div className="day-columns" ref={scheduleRef}>
                    {visibleDays.map((day) => (
                      <DayColumn
                        key={`day-${day}`}
                        day={day}
                        date={getDateForDay(day)}
                        activities={selectedTrip.activities}
                        onDrop={handleDrop}
                        onEdit={handleEditActivity}
                        onDelete={handleDeleteActivity}
                      />
                    ))}
                  </div>
                </div>

                {/* Activity templates */}
                <div className="activity-templates">
                  <h3>Activity Templates</h3>
                  <p className="template-instructions">Drag and drop these templates onto your schedule</p>
                  <div className="templates-container">
                    {activityTemplates.map((template) => (
                      <ActivityItem
                        key={template.id}
                        activity={template}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        isTemplate={true}
                      />
                    ))}
                  </div>
                  <button className="add-custom-activity" onClick={handleAddActivity}>
                    <Plus size={16} />
                    Create Custom Activity
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-trips-message">
              <h2>No trips scheduled yet</h2>
              <p>Create a new trip to start planning your itinerary</p>
              <button className="add-trip-button" onClick={() => setShowAddTripForm(true)}>
                <Plus size={20} />
                Add New Trip
              </button>
            </div>
          )}

          {/* Add/Edit Activity Modal */}
          {isAddingActivity && editingActivity && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>
                    {editingActivity.id.startsWith("activity-") &&
                    !selectedTrip?.activities.find((a) => a.id === editingActivity.id)
                      ? "Add Activity"
                      : "Edit Activity"}
                  </h3>
                  <button
                    className="close-button"
                    onClick={() => {
                      setIsAddingActivity(false)
                      setEditingActivity(null)
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveActivity} className="activity-form">
                  <div className="form-group">
                    <label htmlFor="activity-title">Title</label>
                    <input
                      id="activity-title"
                      type="text"
                      value={editingActivity.title}
                      onChange={(e) => setEditingActivity({ ...editingActivity, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="activity-day">Day</label>
                      <select
                        id="activity-day"
                        value={editingActivity.day}
                        onChange={(e) =>
                          setEditingActivity({ ...editingActivity, day: Number.parseInt(e.target.value) })
                        }
                        required
                      >
                        {selectedTrip &&
                          Array.from(
                            {
                              length:
                                Math.ceil(
                                  (selectedTrip.endDate.getTime() - selectedTrip.startDate.getTime()) /
                                    (1000 * 60 * 60 * 24),
                                ) + 1,
                            },
                            (_, i) => i + 1,
                          ).map((day) => (
                            <option key={`day-option-${day}`} value={day}>
                              Day {day}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="activity-time">Start Time</label>
                      <input
                        id="activity-time"
                        type="time"
                        value={editingActivity.startTime}
                        onChange={(e) => setEditingActivity({ ...editingActivity, startTime: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="activity-duration">Duration (min)</label>
                      <input
                        id="activity-duration"
                        type="number"
                        min="15"
                        step="15"
                        value={editingActivity.duration}
                        onChange={(e) =>
                          setEditingActivity({ ...editingActivity, duration: Number.parseInt(e.target.value) })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="activity-category">Category</label>
                    <select
                      id="activity-category"
                      value={editingActivity.category}
                      onChange={(e) => setEditingActivity({ ...editingActivity, category: e.target.value as any })}
                      required
                    >
                      <option value="food">Food</option>
                      <option value="attraction">Attraction</option>
                      <option value="transport">Transport</option>
                      <option value="accommodation">Accommodation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="activity-location">Location</label>
                    <input
                      id="activity-location"
                      type="text"
                      value={editingActivity.location || ""}
                      onChange={(e) => setEditingActivity({ ...editingActivity, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="activity-description">Description</label>
                    <textarea
                      id="activity-description"
                      value={editingActivity.description}
                      onChange={(e) => setEditingActivity({ ...editingActivity, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="form-buttons">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setIsAddingActivity(false)
                        setEditingActivity(null)
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="save-button">
                      <Save size={16} />
                      Save Activity
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Trip Modal */}
          {showAddTripForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Add New Trip</h3>
                  <button className="close-button" onClick={() => setShowAddTripForm(false)}>
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAddTrip} className="trip-form">
                  <div className="form-group">
                    <label htmlFor="trip-destination">Destination</label>
                    <input
                      id="trip-destination"
                      type="text"
                      value={newTrip.destination}
                      onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="trip-start-date">Start Date</label>
                      <input
                        id="trip-start-date"
                        type="date"
                        value={newTrip.startDate}
                        onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="trip-end-date">End Date</label>
                      <input
                        id="trip-end-date"
                        type="date"
                        value={newTrip.endDate}
                        onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="trip-notes">Notes</label>
                    <textarea
                      id="trip-notes"
                      value={newTrip.notes}
                      onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="form-buttons">
                    <button type="button" className="cancel-button" onClick={() => setShowAddTripForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="save-button">
                      <Save size={16} />
                      Create Trip
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </DndProvider>
  )
}

export default Schedule