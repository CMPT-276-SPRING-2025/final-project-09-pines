const express = require('express');
const { handleChat, clearChat } = require('../controllers/GeminiController');
const router = express.Router();

router.post('/chat', handleChat);
router.post('/clearChat', clearChat);

module.exports = router;