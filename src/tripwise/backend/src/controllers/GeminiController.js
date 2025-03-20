require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Use your API key from environment variables
const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// In-memory chat session (for a real app, store per user/session)
let chatSession = null;

exports.clearChat = (req, res) => {
  try {
    chatSession = null;
    res.json({ message: "Chat history cleared" });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    res.status(500).json({ message: "Error clearing chat history" });
  }
};

exports.handleTravelChat = async (req, res) => {
  const { prompt, query } = req.body;
  try {
    // Reinitialize chatSession if needed
    if (!chatSession) {
      // Initialize with the instruction first.
      chatSession = model.startChat({
        history: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200 },
      });
    }
    // Now send the user's query as a separate message.
    const result = await chatSession.sendMessage(query);
    const response = result.response;
    if (response?.text) {
      res.json({ message: response.text() });
    } else {
      res.status(500).json({ message: "Failed to get a valid response" });
    }
  } catch (error) {
    console.error("Error in handleTravelChat:", error);
    res.status(500).json({ message: "Error fetching response from Gemini API" });
  }
};