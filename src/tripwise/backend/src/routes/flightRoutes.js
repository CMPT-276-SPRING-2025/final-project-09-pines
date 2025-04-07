const express = require('express');
const router = express.Router();
const amadeus = require('../controllers/AmadeusController');

/**
 * Get flight price - useful for creating new alerts
 * @route POST /api/flights/price
 */
router.post('/price', async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate } = req.body;
    
    // Validate required parameters
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ error: 'Origin, destination, and departure date are required' });
    }
    
    // Validate that airport codes are 3 letters
    const originCode = origin.trim().toUpperCase();
    const destinationCode = destination.trim().toUpperCase();
    
    if (originCode.length !== 3 || destinationCode.length !== 3) {
      return res.status(400).json({ 
        error: 'Airport codes must be 3 letters (IATA code)',
        examples: { origin: 'YVR', destination: 'YUL' }
      });
    }
    
    console.log(`Flight price request for alerts: ${originCode} to ${destinationCode}, ${departureDate} - ${returnDate}`);
    
    // For alert price check, get multiple offers and calculate average price
    const queryParams = {
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate: departureDate,
      returnDate: returnDate || departureDate,
      adults: "1",
      nonStop: "false",
      currencyCode: "USD",
      max: "5"  // Get more flights to calculate average
    };
    
    try {
      // Get flight offers
      const flightData = await amadeus.getFlightOffers(queryParams);
      
      if (!flightData || !flightData.data || flightData.data.length === 0) {
        console.warn("No flight offers found for alert, using fallback price");
        return res.status(200).json({
          price: 500,
          currency: "USD",
          priceVerified: false
          // Removed availability
        });
      }
      
      // Calculate average price from all offers
      let totalPrice = 0;
      let currency = flightData.data[0].price.currency;
      
      flightData.data.forEach(offer => {
        totalPrice += parseFloat(offer.price.total);
      });
      
      const averagePrice = totalPrice / flightData.data.length;
      
      console.log(`Calculated average price for ${originCode} to ${destinationCode}: ${averagePrice} ${currency}`);
      
      // Return the average price
      res.status(200).json({
        price: Math.round(averagePrice * 100) / 100, // Round to 2 decimals
        currency: currency,
        priceVerified: true,
        flightCount: flightData.data.length
      });
    } catch (error) {
      console.error('Error getting flight offers:', error);
      
      // Return fallback data if API fails
      res.status(200).json({
        price: 500,
        currency: "USD",
        priceVerified: false
        // Removed availability
      });
    }
  } catch (error) {
    console.error('Error in flight price endpoint:', error);
    res.status(500).json({ error: 'Failed to get flight price' });
  }
});

module.exports = router;