const express = require('express');
const { handleTravelChat, clearChat } = require('../controllers/travelController');
const router = express.Router();

router.post('/chat', handleTravelChat);
router.post('/clearChat', clearChat);

module.exports = router;