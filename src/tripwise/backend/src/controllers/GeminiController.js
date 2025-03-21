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
      
      let searchParamsObj;
      try {
        searchParamsObj = JSON.parse(extractedText);
        console.log("Parsed searchParamsObj:", searchParamsObj);
      } catch (e) {
        searchParamsObj = null;
        console.log("Could not parse extracted text as JSON.");
      }

      // Only perform Amadeus API calls when the feature is "travel"
      if (feature === "travel") {
        // Check if this is a flight search.
        if (
          searchParamsObj &&
          searchParamsObj.originLocationCode &&
          searchParamsObj.destinationLocationCode &&
          searchParamsObj.departureDate &&
          searchParamsObj.adults
        ) {
          console.log("Detected flight search. Calling Amadeus.getFlightOffers with:", searchParamsObj);
          const flightOffers = await Amadeus.getFlightOffers(searchParamsObj);
          const friendlyPrompt = "Please convert the following flight offer data into a friendly, human-readable summary:\n" + JSON.stringify(flightOffers);
          console.log("Sending friendly prompt to Gemini (flight):", friendlyPrompt);
          const friendlyResult = await chatSession.sendMessage(friendlyPrompt);
          const friendlyText = friendlyResult.response && typeof friendlyResult.response.text === "function"
            ? friendlyResult.response.text()
            : "Could not retrieve a friendly summary.";
          return res.json({ message: friendlyText });
          
        // Check if this is a hotel search.
        } else if (
          searchParamsObj &&
          searchParamsObj.cityCode &&
          searchParamsObj.checkInDate &&
          searchParamsObj.checkOutDate &&
          searchParamsObj.adults
        ) {
          console.log("Detected hotel search with parameters:", searchParamsObj);
          const hotelsData = await Amadeus.getHotelsByCity({ cityCode: searchParamsObj.cityCode });
          const hotelIDs = hotelsData.data ? hotelsData.data.map(hotel => hotel.hotelId).slice(0, 10) : [];
          console.log("Extracted and limited hotelIDs:", hotelIDs);
          if (hotelIDs.length === 0) {
            throw new Error("No hotels found for the given city.");
          }
          const hotelOfferParams = {
            checkInDate: searchParamsObj.checkInDate,  
            checkOutDate: searchParamsObj.checkOutDate,
            adults: searchParamsObj.adults,
            currency: searchParamsObj.currency
          };
          const hotelOffers = await Amadeus.getHotelOffers(hotelIDs, hotelOfferParams);
          const friendlyPrompt = "Please convert the following hotel offer data into a friendly, human-readable summary:\n" + JSON.stringify(hotelOffers);
          console.log("Sending friendly prompt to Gemini (hotel):", friendlyPrompt);
          const friendlyResult = await chatSession.sendMessage(friendlyPrompt);
          const friendlyText = friendlyResult.response && typeof friendlyResult.response.text === "function"
            ? friendlyResult.response.text()
            : "Could not retrieve a friendly summary.";
          return res.json({ message: friendlyText });
        }
      }
      
      console.log("Falling back to Gemini text response.");
      return res.json({ message: text });

    } else {
      console.error("Unexpected Gemini API response:", response);
      return res.status(500).json({ message: "Failed to get a valid response from Gemini API" });
    }
  } catch (error) {
    console.error("Error in handleChat:", error);
    return res.status(500).json({ message: "Error fetching response from Gemini API" });
  }
};