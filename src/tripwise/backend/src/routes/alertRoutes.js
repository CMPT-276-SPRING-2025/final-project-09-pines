const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// Get all alerts
router.get('/', alertController.getAlerts);

// Get alerts by type (Flight or Hotel)
router.get('/type/:type', alertController.getAlertsByType);

// Create a new alert
router.post('/', alertController.createAlert);

// Update an existing alert
router.put('/:id', alertController.updateAlert);

// Delete an alert
router.delete('/:id', alertController.deleteAlert);

// Check alerts for price changes
router.post('/check', async (req, res) => {
  try {
    const { type } = req.query;
    
    if (type === 'hotel') {
      return alertController.checkHotelAlerts(req, res);
    } else if (type === 'flight') {
      return alertController.checkAlerts(req, res);
    } else {
      // Check all alerts by default
      const flightResults = await alertController.checkAlerts(req, res);
      const hotelResults = await alertController.checkHotelAlerts(req, res);
      
      return res.status(200).json({
        message: 'All alerts checked',
        flightResults,
        hotelResults
      });
    }
  } catch (error) {
    console.error('Error checking alerts:', error);
    return res.status(500).json({ error: 'Failed to check alerts' });
  }
});

// Get alerts that need notifications
router.get('/notify', alertController.getAlertsForNotification);

// Mark alerts as notified
router.post('/notify', alertController.markAlertsAsNotified);

module.exports = router;