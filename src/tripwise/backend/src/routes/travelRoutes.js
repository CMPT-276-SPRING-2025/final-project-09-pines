const express = require('express');
const { handleTravelChat } = require('../controllers/travelController');
const router = express.Router();

router.post('/chat', handleTravelChat);

module.exports = router;