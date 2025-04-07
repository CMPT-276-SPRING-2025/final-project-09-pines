const express = require('express');
const router = express.Router();
// Change the import path to match the actual location
const amadeus = require('../controllers/AmadeusController');

// Search for airport and city locations
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword || keyword.length < 2) {
      return res.status(400).json({ error: 'Keyword must be at least 2 characters' });
    }
    
    // Search for locations using Amadeus API
    const data = await amadeus.searchLocations(keyword);
    
    res.status(200).json({ data: data.data || [] });
  } catch (error) {
    console.error('Error searching locations:', error);
    res.status(500).json({ error: 'Failed to search locations' });
  }
});

module.exports = router;