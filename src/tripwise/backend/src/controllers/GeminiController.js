require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Amadeus = require('./AmadeusController'); // ensure this module exports getFlightOffers

// Use your API key from environment variables
const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// In-memory chat session (for a real app, store per user/session)
let chatSession = null;

// Function to extract hotel references from chat history
const extractHotelReferences = (chatSession) => {
  if (!chatSession) return [];
  
  // Look for hotel information in previous responses
  const hotelMentions = [];
  
  try {
    // Get chat history if available
    if (chatSession.getHistory && typeof chatSession.getHistory === 'function') {
      const history = chatSession.getHistory();
      
      for (const msg of history) {
        if (msg.role === 'model' && msg.parts && msg.parts[0] && msg.parts[0].text) {
          // Look for hotel names in AI responses
          const hotelMatches = msg.parts[0].text.match(/(?:hotel|Hotel|HOTEL)\s[A-Za-z\s\d]+/gi);
          if (hotelMatches) {
            hotelMatches.forEach(match => {
              const hotelName = match.replace(/(?:hotel|Hotel|HOTEL)\s/i, '').trim();
              if (hotelName && !hotelMentions.includes(hotelName)) {
                hotelMentions.push(hotelName);
              }
            });
          }
          
          // Look for hotel IDs
          const hotelIdMatches = msg.parts[0].text.match(/(?:hotel ID|hotelId|HOTEL ID)[:\s]+([A-Z0-9]+)/gi);
          if (hotelIdMatches) {
            hotelIdMatches.forEach(match => {
              const idPart = match.replace(/(?:hotel ID|hotelId|HOTEL ID)[:\s]+/i, '').trim();
              if (idPart && !hotelMentions.includes(`ID:${idPart}`)) {
                hotelMentions.push(`ID:${idPart}`);
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error extracting hotel references:", error);
  }
  
  return hotelMentions;
};

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
      let updatedPrompt = prompt;
      
      // Enhanced review prompt when feature is review
      if (feature === "review") {
        updatedPrompt = `You are a travel review expert that helps travelers understand accommodation quality.
        
        When responding about hotel or destination reviews:
        
        1. Organize your summary by categories (cleanliness, location, service, value, amenities, etc.)
        2. Highlight both the positive and negative points mentioned in reviews
        3. Include specific details and quotes from reviewers when available
        4. Mention the general sentiment (overwhelmingly positive, mixed, etc.)
        5. Provide specific ratings by category if available (e.g., "Cleanliness: 4.5/5")
        
        If asked about specific aspects, focus your response on just those aspects.
        When comparing multiple properties, provide a fair comparison based on review data.
        Format responses with clear headings and scannable sections.
        
        Include information about which types of travelers rated the property well:
        - Families with children
        - Couples
        - Solo travelers
        - Business travelers
        
        Conclude with a brief overall recommendation based on the reviews.
        If you don't have specific review information, be honest and suggest what travelers typically look for.
        
        Today's date is ${today}.`;
      } else {
        updatedPrompt = `${prompt}\nToday's date is ${today}.`;
      }
      
      chatSession = model.startChat({
        history: [{ role: "user", parts: [{ text: updatedPrompt }] }]
      });
    }
    
    // Extract a potential hotel ID from the query for review feature
    let hotelId = null;
    if (feature === "review") {
      const hotelIdMatch = query.match(/(?:hotel ID|hotelId|HOTEL ID)[:\s]+([A-Z0-9]+)/i);
      if (hotelIdMatch && hotelIdMatch[1]) {
        hotelId = hotelIdMatch[1];
        console.log(`Detected hotel ID in query: ${hotelId}`);
      }
      
      // For review feature, check if we can enhance with hotel context
      const recentHotels = extractHotelReferences(chatSession);
      
      if (recentHotels.length > 0) {
        console.log("Found hotels from previous conversations:", recentHotels);
        
        // Send a context reminder before handling the query
        const contextPrompt = `Before I answer the user's next question, I should remember that they have previously discussed these hotels: ${recentHotels.join(', ')}. If their question relates to any of these hotels, I should prioritize information about them.`;
        
        await chatSession.sendMessage(contextPrompt);
      }
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
        
        // Check if we got a hotel ID from JSON that we didn't get from regex
        if (!hotelId && searchParamsObj && searchParamsObj.hotelId) {
          hotelId = searchParamsObj.hotelId;
          console.log(`Found hotel ID in JSON: ${hotelId}`);
        }
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
      // Handle review feature with Amadeus integration
      else if (feature === "review" && hotelId) {
        console.log(`Processing review request for hotel ID: ${hotelId}`);
        try {
          // Fetch hotel reviews from Amadeus
          const reviewsData = await Amadeus.getHotelReviews(hotelId);
          
          if (reviewsData && reviewsData.data && reviewsData.data.length > 0) {
            console.log("Successfully retrieved review data from Amadeus");
            
            // Format the data to help Gemini process it
            const reviewPrompt = `
            Please analyze these hotel reviews and provide a comprehensive summary:
            
            ${JSON.stringify(reviewsData)}
            
            Follow these guidelines for your summary:
            1. Start with an overall sentiment analysis
            2. Break down ratings by category (cleanliness, service, etc.)
            3. Highlight key positive aspects with specific examples or quotes
            4. Mention common criticisms or areas for improvement
            5. Note which types of travelers had the best experiences (families, couples, business, etc.)
            6. Conclude with an overall recommendation
            
            Make your response scannable with clear headings and bullet points where appropriate.
            `;
            
            const reviewResult = await chatSession.sendMessage(reviewPrompt);
            const reviewSummary = reviewResult.response && typeof reviewResult.response.text === "function"
              ? reviewResult.response.text()
              : "Could not analyze the review data.";
            
            return res.json({ message: reviewSummary });
          } else {
            console.log("No review data found, falling back to general information");
            
            // Fallback if no review data is available
            const fallbackPrompt = `I couldn't find specific review data for hotel ID ${hotelId}. Based on your travel expertise, please provide:
            1. What typical travelers look for in hotel reviews
            2. Common factors that affect hotel ratings
            3. Questions the user should consider asking about this hotel
            4. General advice for interpreting hotel reviews`;
            
            const fallbackResult = await chatSession.sendMessage(fallbackPrompt);
            const fallbackText = fallbackResult.response && typeof fallbackResult.response.text === "function"
              ? fallbackResult.response.text()
              : "Could not provide review information.";
            
            return res.json({ message: fallbackText });
          }
        } catch (error) {
          console.error("Error processing hotel reviews:", error);
          
          // Graceful error handling
          const errorPrompt = `I encountered an error fetching reviews for hotel ID ${hotelId}. Please provide general guidance on:
          1. What makes a good hotel based on typical reviews
          2. How to interpret hotel reviews effectively
          3. What aspects of hotels typically get the best and worst reviews`;
          
          const errorResult = await chatSession.sendMessage(errorPrompt);
          const errorText = errorResult.response && typeof errorResult.response.text === "function"
            ? errorResult.response.text()
            : "An error occurred while fetching hotel reviews. Please try again later.";
          
          return res.json({ message: errorText });
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