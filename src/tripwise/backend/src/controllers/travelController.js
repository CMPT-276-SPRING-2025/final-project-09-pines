require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Use your API key from environment variables
const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// In-memory chat session (for a real app, store per user/session)
let chatSession = null;

exports.clearChat = (req, res) => {
  chatSession = null;
  res.json({ message: "Chat history cleared" });
};

exports.handleTravelChat = async (req, res) => {
  const { query } = req.body;
  try {
    // Initialize chat session if it doesn't exist
    if (!chatSession) {
      chatSession = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 200,
        },
      });
    }

    const result = await chatSession.sendMessage(query);
    const response = result.response;

    if (response && response.text) {
      const message = response.text();
      res.json({ message: message });
    } else {
      console.error("Unexpected Gemini API response:", response);
      res.status(500).json({ message: "Failed to get a valid response from Gemini API" });
    }
  } catch (error) {
    console.error("Error in handleTravelChat:", error);
    res.status(500).json({ message: "Error fetching response from Gemini API" });
  }
};