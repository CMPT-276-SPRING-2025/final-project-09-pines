// src/tripwise/backend/src/server.js

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const alertRoutes = require('./routes/alertRoutes');
const locationRoutes = require('./routes/locationRoutes');
const geminiRoutes = require('./routes/GeminiRoutes');
const flightRoutes = require('./routes/flightRoutes');

// Use routes
app.use('/api/alerts', alertRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api', geminiRoutes);

// Schedule alert checking job (runs every hour)
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled alert check');
  try {
    // Make a request to the alert check endpoint
    const response = await fetch(`http://localhost:${process.env.PORT || 10000}/api/alerts/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Alert check result:', data);
  } catch (error) {
    console.error('Failed to run scheduled alert check:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

// Start the server - Using port 5001 consistently
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;