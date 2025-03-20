require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Amadeus = require('./AmadeusController'); // ensure this module exports getFlightOffers

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

exports.handleChat = async (req, res) => {
  const { feature, prompt, query } = req.body;
  try {
    if (!chatSession) {
      const today = new Date().toISOString().split("T")[0];

      const updatedPrompt = `${prompt}\nToday's date is ${today}.`;

      chatSession = model.startChat({
        history: [{ role: "user", parts: [{ text: updatedPrompt }] }]
      });
    }

    // Send the user's query as a separate message.
    const result = await chatSession.sendMessage(query);
    const response = result.response;
    if (response && typeof response.text === "function") {
      const text = response.text();
      console.log("Gemini returned text:", text);

      let extractedText = text;
      if (text.includes("```")) {
        const codeBlockRegex = /```(?:json)?\n([\s\S]*?)\n```/;
        const match = text.match(codeBlockRegex);
        if (match && match[1]) {
          extractedText = match[1];
          console.log("Extracted JSON from markdown:", extractedText);
        }
      }
      
      let flightQueryParams;
      try {
        flightQueryParams = JSON.parse(extractedText);
        console.log("Parsed flightQueryParams:", flightQueryParams);
      } catch (e) {
        flightQueryParams = null;
        console.log("Could not parse extracted text as JSON.");
      }

      // If the parsed object contains flight query details, call Amadeus.
      if (
        flightQueryParams &&
        flightQueryParams.originLocationCode &&
        flightQueryParams.destinationLocationCode &&
        flightQueryParams.departureDate &&
        flightQueryParams.adults
      ) {
        console.log("Calling Amadeus.getFlightOffers with:", flightQueryParams);
        const flightOffers = await Amadeus.getFlightOffers(flightQueryParams);
        
        // Now ask Gemini to convert the flight offers data into human-friendly text.
        const friendlyPrompt = "Please convert the following flight offer data into a friendly, human-readable summary:\n" + JSON.stringify(flightOffers);
        console.log("Sending friendly prompt to Gemini:", friendlyPrompt);
        
        const friendlyResult = await chatSession.sendMessage(friendlyPrompt);
        const friendlyText = friendlyResult.response && typeof friendlyResult.response.text === "function"
          ? friendlyResult.response.text()
          : "Could not retrieve a friendly summary.";
        
        return res.json({ message: friendlyText });
      } else {
        console.log("Falling back to Gemini text response.");
        return res.json({ message: text });
      }

    } else {
      console.error("Unexpected Gemini API response:", response);
      return res.status(500).json({ message: "Failed to get a valid response from Gemini API" });
    }
  } catch (error) {
    console.error("Error in handleChat:", error);
    return res.status(500).json({ message: "Error fetching response from Gemini API" });
  }
};