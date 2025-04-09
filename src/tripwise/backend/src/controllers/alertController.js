// src/tripwise/backend/src/controllers/alertController.js
const amadeus = require('../controllers/AmadeusController');

// In-memory data store for alerts (for demo purposes)
let alerts = [];
let nextAlertId = 1;

/**
 * Retrieves all alerts.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>}
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
 * Retrieves alerts filtered by type.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>}
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
 * Creates a new alert.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>}
 */
exports.createAlert = async (req, res) => {
  try {
    const alertData = req.body;

    if (!alertData.type) {
      return res.status(400).json({ error: 'Alert type is required' });
    }

    // Standardize to uppercase
    if (alertData.from) alertData.from = alertData.from.toUpperCase();
    if (alertData.to) alertData.to = alertData.to.toUpperCase();

    if (alertData.type === 'flight') {
      if (!alertData.from || !alertData.to) {
        return res.status(400).json({ error: 'Origin and destination are required for flight alerts' });
      }

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

    const newAlert = {
      id: nextAlertId++,
      ...alertData,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastChecked: new Date().toISOString()
    };

    alerts.push(newAlert);

    res.status(201).json({ data: newAlert });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
};

/**
 * Updates an existing alert.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>}
 */
exports.updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const alertIndex = alerts.findIndex(alert => alert.id === parseInt(id));

    if (alertIndex === -1) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const alert = alerts[alertIndex];
    if (alert.type === 'Flight' &&
      (updates.origin || updates.destination || updates.startDate || updates.endDate)) {
      try {
        const origin = updates.origin || alert.origin;
        const destination = updates.destination || alert.destination;
        const startDate = updates.startDate || alert.startDate;
        const endDate = updates.endDate || alert.endDate;

        const priceData = await amadeus.getFlightPriceForAlert(
          origin, destination, startDate, endDate
        );

        if (priceData.priceVerified) {
          updates.currentPrice = priceData.price;
          updates.currency = priceData.currency;
          updates.priceVerified = true;
        }
      } catch (apiError) {
        console.error('Error fetching updated flight price:', apiError);
      }
    }

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
 * Deletes an alert.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>}
 */
exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alertIndex = alerts.findIndex(alert => alert.id === parseInt(id));

    if (alertIndex === -1) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alerts.splice(alertIndex, 1);

    res.status(200).json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
};

/**
 * Checks alerts for price changes.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>}
 */
exports.checkAlerts = async (req, res) => {
  try {
    const alertsToCheck = alerts.filter(alert =>
      alert.type === 'Flight' &&
      (!alert.lastChecked || new Date(alert.lastChecked) < new Date(Date.now() - 60 * 60 * 1000))
    );

    if (alertsToCheck.length === 0) {
      return res.status(200).json({ message: 'No alerts to check' });
    }


    const updatedAlerts = await Promise.all(
      alertsToCheck.map(async (alert) => {
        try {
          const updatedAlert = await amadeus.checkFlightPriceChange(alert);

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
 * Gets alerts that need notifications (price dropped or target reached).
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>}
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
 * Marks alerts as notified.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>}
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
 * Checks hotel alerts for price changes.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>}
 */
exports.checkHotelAlerts = async (req, res) => {
  try {
    // For simplicity, in this demo we'll just simulate price changes for hotels
    const hotelAlerts = alerts.filter(alert => alert.type === 'hotel');

    if (hotelAlerts.length === 0) {
      return res.status(200).json({ message: 'No hotel alerts to check' });
    }

    const updatedAlerts = hotelAlerts.map(alert => {
      // For demo purposes, randomly decrease or increase price
      const previousPrice = alert.currentPrice;
      let currentPrice = previousPrice;

      if (Math.random() < 0.7) {
        // Decrease by 1-15%
        const decreasePercent = 1 + (Math.random() * 15);
        currentPrice = previousPrice * (1 - (decreasePercent / 100));
      } else {
        // Increase by 1-10%
        const increasePercent = 1 + (Math.random() * 10);
        currentPrice = previousPrice * (1 + (increasePercent / 100));
      }

      currentPrice = Math.round(currentPrice * 100) / 100;

      const priceDifference = previousPrice - currentPrice;
      const percentChange = (priceDifference / previousPrice) * 100;

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

      const index = alerts.findIndex(a => a.id === alert.id);
      if (index !== -1) {
        alerts[index] = updatedAlert;
      }

      return updatedAlert;
    });

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

/**
 * Gets the alert data. (Used for testing purposes)
 * @returns {Array} - The alerts array.
 */
exports.getAlertData = () => alerts;