const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware - CORRECT CORS CONFIGURATION
app.use(cors({
  origin: ['https://final-project-09-pines-eoxv.vercel.app', 'https://final-project-09-pines-mktkemsk2-muneebs-projects-4f85e1c8.vercel.app'],
  credentials: true
}));
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

// Add a simple test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Backend is running!' });
});

// Start the server - Using port 5001 consistently
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
});

module.exports = app;