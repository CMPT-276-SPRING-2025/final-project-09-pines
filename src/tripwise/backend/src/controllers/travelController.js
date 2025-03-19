require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Replace with your actual API key or use process.env for security.
const apiKey= process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

exports.handleTravelChat = async (req, res) => {
  const { query } = req.body;
  try {
    const result = await model.generateContent(query);
    // Log the full raw result for debugging
    console.log("Gemini API result:", result);
    // Check if the response exists and has the expected method/text property.
    if (result && result.response && typeof result.response.text === "function") {
      const message = result.response.text();
      console.log("Extracted message:", message);
      res.json({ message });
    } else {
      console.error("Unexpected Gemini API response structure:", result);
      res.status(500).json({ message: "Unexpected response format from Gemini API" });
    }
  } catch (error) {
    console.error("Error in handleTravelChat:", error);
    res.status(500).json({ message: "Error fetching response from Gemini API" });
  }
};