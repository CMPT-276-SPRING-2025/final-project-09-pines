// src/tripwise/backend/src/controllers/alertController.js
const amadeus = require('../controllers/AmadeusController');

// Simple in-memory data store for alerts
let alerts = [];
let nextAlertId = 1;

/**
 * Get all alerts
 */
exports.getAlerts = async (req, res) => {
  try {
    res.status(200).json({ data: alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

/**
 * Get alerts filtered by type
 */
exports.getAlertsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (type !== 'Flight' && type !== 'Hotel') {
      return res.status(400).json({ error: 'Invalid alert type. Must be "Flight" or "Hotel"' });
    }
    
    const filteredAlerts = alerts.filter(alert => alert.type === type);
    res.status(200).json({ data: filteredAlerts });
  } catch (error) {
    console.error('Error fetching alerts by type:', error);
    res.status(500).json({ error: 'Failed to fetch alerts by type' });
  }
};

/**
 * Create a new alert
 */
exports.createAlert = async (req, res) => {
  try {
    const alertData = req.body;
    
    // Validate required fields
    if (!alertData.type) {
      return res.status(400).json({ error: 'Alert type is required' });
    }
    
    // Always standardize to uppercase
    if (alertData.from) alertData.from = alertData.from.toUpperCase();
    if (alertData.to) alertData.to = alertData.to.toUpperCase();
    
    // For Flight type
    if (alertData.type === 'flight') {
      // Check for required flight fields
      if (!alertData.from || !alertData.to) {
        return res.status(400).json({ error: 'Origin and destination are required for flight alerts' });
      }
      
      // Validate airport codes (must be 3 letters)
      if (alertData.from.length !== 3 || alertData.to.length !== 3) {
        return res.status(400).json({ 
          error: 'Airport codes must be 3 letters (IATA code)',
          examples: { from: 'YVR', to: 'YUL' }
        });
      }
    } else if (alertData.type === 'hotel') {
      if (!alertData.location) {
        return res.status(400).json({ error: 'Location is required for hotel alerts' });
      }
    } else {
      return res.status(400).json({ error: 'Alert type must be "flight" or "hotel"' });
    }
    
    if (!alertData.startDate || !alertData.endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    if (isNaN(alertData.currentPrice) || isNaN(alertData.targetPrice)) {
      return res.status(400).json({ error: 'Current price and target price must be numbers' });
    }
    
    // Generate a new alert object
    const newAlert = {
      id: nextAlertId++,
      ...alertData,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastChecked: new Date().toISOString()
    };
    
    // Store the alert
    alerts.push(newAlert);
    
    res.status(201).json({ data: newAlert });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
};

/**
 * Update an existing alert
 */
exports.updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Find the alert to update
    const alertIndex = alerts.findIndex(alert => alert.id === parseInt(id));
    
    if (alertIndex === -1) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // If changing origin/destination/dates for a flight alert, try to get updated price
    const alert = alerts[alertIndex];
    if (alert.type === 'Flight' && 
        (updates.origin || updates.destination || updates.startDate || updates.endDate)) {
      try {
        const origin = updates.origin || alert.origin;
        const destination = updates.destination || alert.destination;
        const startDate = updates.startDate || alert.startDate;
        const endDate = updates.endDate || alert.endDate;
        
        console.log(`Fetching updated flight price for ${origin} to ${destination}`);
        const priceData = await amadeus.getFlightPriceForAlert(
          origin, destination, startDate, endDate
        );
        
        // Only update price if it was verified from the API
        if (priceData.priceVerified) {
          console.log(`Using verified updated price: ${priceData.price} ${priceData.currency}`);
          updates.currentPrice = priceData.price;
          updates.currency = priceData.currency;
          // Removed availability and isAlmostFull
          updates.priceVerified = true;
        }
      } catch (apiError) {
        console.error('Error fetching updated flight price:', apiError);
      }
    }
    
    // Update the alert
    alerts[alertIndex] = {
      ...alerts[alertIndex],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    res.status(200).json({ data: alerts[alertIndex] });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
};

/**
 * Delete an alert
 */
exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alertIndex = alerts.findIndex(alert => alert.id === parseInt(id));
    
    if (alertIndex === -1) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Remove the alert
    alerts.splice(alertIndex, 1);
    
    res.status(200).json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
};

/**
 * Check alerts for price changes
 */
exports.checkAlerts = async (req, res) => {
  try {
    // Only check flight alerts that haven't been checked in the last hour
    const alertsToCheck = alerts.filter(alert => 
      alert.type === 'Flight' &&
      (!alert.lastChecked || new Date(alert.lastChecked) < new Date(Date.now() - 60 * 60 * 1000))
    );
    
    if (alertsToCheck.length === 0) {
      return res.status(200).json({ message: 'No alerts to check' });
    }
    
    console.log(`Checking prices for ${alertsToCheck.length} alerts`);
    
    const updatedAlerts = await Promise.all(
      alertsToCheck.map(async (alert) => {
        try {
          console.log(`Checking price for alert ${alert.id}: ${alert.origin} to ${alert.destination}`);
          const updatedAlert = await amadeus.checkFlightPriceChange(alert);
          
          // Update the alert in the alerts array
          const index = alerts.findIndex(a => a.id === alert.id);
          if (index !== -1) {
            alerts[index] = updatedAlert;
          }
          
          return updatedAlert;
        } catch (error) {
          console.error(`Error checking alert ${alert.id}:`, error);
          return alert;
        }
      })
    );
    
    // Calculate stats about changes
    const priceDrops = updatedAlerts.filter(alert => alert.isPriceDropped).length;
    const targetReached = updatedAlerts.filter(alert => alert.isTargetReached).length;
    
    res.status(200).json({ 
      message: `${updatedAlerts.length} alerts checked, ${priceDrops} price drops, ${targetReached} targets reached`,
      data: updatedAlerts
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    res.status(500).json({ error: 'Failed to check alerts' });
  }
};

/**
 * Get alerts that need notifications (price dropped or target reached)
 */
exports.getAlertsForNotification = async (req, res) => {
  try {
    const alertsToNotify = alerts.filter(alert => 
      !alert.notificationSent && 
      ((alert.isPriceDropped && alert.priceDifference >= 10) || alert.isTargetReached)
    );
    
    res.status(200).json({ data: alertsToNotify });
  } catch (error) {
    console.error('Error fetching alerts for notification:', error);
    res.status(500).json({ error: 'Failed to fetch alerts for notification' });
  }
};

/**
 * Mark alerts as notified
 */
exports.markAlertsAsNotified = async (req, res) => {
  try {
    const { alertIds } = req.body;
    
    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({ error: 'alertIds must be a non-empty array' });
    }
    
    let updatedCount = 0;
    
    alertIds.forEach(id => {
      const alertIndex = alerts.findIndex(alert => alert.id === parseInt(id));
      if (alertIndex !== -1) {
        alerts[alertIndex].notificationSent = true;
        updatedCount++;
      }
    });
    
    res.status(200).json({ message: `${updatedCount} alerts marked as notified` });
  } catch (error) {
    console.error('Error marking alerts as notified:', error);
    res.status(500).json({ error: 'Failed to mark alerts as notified' });
  }
};

/**
 * Check hotel alerts for price changes
 */
exports.checkHotelAlerts = async (req, res) => {
  try {
    // For simplicity, in this demo we'll just simulate price changes for hotels
    // In a real implementation, you would use amadeus.getHotelPriceForAlert
    
    const hotelAlerts = alerts.filter(alert => alert.type === 'hotel');
    
    if (hotelAlerts.length === 0) {
      return res.status(200).json({ message: 'No hotel alerts to check' });
    }
    
    console.log(`Checking prices for ${hotelAlerts.length} hotel alerts`);
    
    const updatedAlerts = hotelAlerts.map(alert => {
      // For demo purposes, randomly decrease or increase price
      const previousPrice = alert.currentPrice;
      let currentPrice = previousPrice;
      
      // 70% chance of price decrease, 30% chance of increase
      if (Math.random() < 0.7) {
        // Decrease by 1-15%
        const decreasePercent = 1 + (Math.random() * 15);
        currentPrice = previousPrice * (1 - (decreasePercent / 100));
      } else {
        // Increase by 1-10%
        const increasePercent = 1 + (Math.random() * 10);
        currentPrice = previousPrice * (1 + (increasePercent / 100));
      }
      
      // Round to 2 decimal places
      currentPrice = Math.round(currentPrice * 100) / 100;
      
      const priceDifference = previousPrice - currentPrice;
      const percentChange = (priceDifference / previousPrice) * 100;
      
      // Update the alert
      const updatedAlert = {
        ...alert,
        previousPrice,
        currentPrice,
        priceDifference,
        percentChange,
        lastChecked: new Date().toISOString(),
        isPriceDropped: currentPrice < previousPrice,
        isTargetReached: currentPrice <= alert.targetPrice,
        priceVerified: true
      };
      
      // Update in the main alerts array
      const index = alerts.findIndex(a => a.id === alert.id);
      if (index !== -1) {
        alerts[index] = updatedAlert;
      }
      
      return updatedAlert;
    });
    
    // Calculate stats about changes
    const priceDrops = updatedAlerts.filter(alert => alert.isPriceDropped).length;
    const targetReached = updatedAlerts.filter(alert => alert.isTargetReached).length;
    
    res.status(200).json({ 
      message: `${updatedAlerts.length} hotel alerts checked, ${priceDrops} price drops, ${targetReached} targets reached`,
      data: updatedAlerts
    });
  } catch (error) {
    console.error('Error checking hotel alerts:', error);
    res.status(500).json({ error: 'Failed to check hotel alerts' });
  }
};

// Export alerts for testing
exports.getAlertData = () => alerts;