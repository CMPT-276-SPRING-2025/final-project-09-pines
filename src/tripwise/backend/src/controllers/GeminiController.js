require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Amadeus = require('./AmadeusController');
const PlanPrompt = require('./prompts/PlanPrompt');
const OnTheGoPrompt =require('./prompts/OnTheGoPrompt');
const RecommendPrompt = require('./prompts/RecommendPrompt');
const TravelPrompt = require('./prompts/TravelPrompt');
const ReviewPrompt = require('./prompts/ReviewPrompt');
const AlertPrompt = require('./prompts/AlertPrompt');
const { functionDefinitions } = require('./functionDefinitions');

// Mapping between features and function definitions
const featureFunctionMap = {
    travel: [functionDefinitions.searchFlights, functionDefinitions.listHotels, functionDefinitions.hotelPrices],
    // Add other features and their function definitions here
};

// Use your API key from environment variables
const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let chatSession = null;
let conversationHistory = []; // Add this at the top with your other variables

const titleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(function (word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  };

async function searchFlights(searchParams) {
    try {
        console.log("Detected flight search. Calling Amadeus.getFlightOffers with:", searchParams);
        const flightOffers = await Amadeus.getFlightOffers(searchParams);
        return flightOffers;
    } catch (error) {
        console.error("Error fetching flight offers:", error);
        throw error;
    }
}

async function listHotels(searchParams) {
    try {
      const hotelsList = await Amadeus.getHotelsByCity(searchParams);
      // Store the results for future reference
    lastHotelSearchResults = {
        data: hotelsList.data.map(hotel => ({
          name: hotel.name,
          hotelId: hotel.hotelId
        }))
    };
      return hotelsList;
    } catch (error) {
      throw error;
    }
}

async function hotelPrices(searchParams) {
    try {
        console.log("Detected hotel prices request. Calling Amadeus.getHotelOffers with:", searchParams);

        let hotelIds = [];

        // Check if hotelNames are provided
        if (searchParams.hotelNames && searchParams.hotelNames.length > 0) {
            // Map hotel names to hotel IDs using lastHotelSearchResults
            if (!lastHotelSearchResults || !lastHotelSearchResults.data) {
                throw new Error("No previous hotel search results available. Please search for hotels first.");
            }

            hotelIds = searchParams.hotelNames.map(name => {
                const hotel = lastHotelSearchResults.data.find(h => h.name === name);
                if (hotel) {
                    return hotel.hotelId;
                } else {
                    console.warn(`Hotel with name "${name}" not found in previous search results.`);
                    return null; // Or handle not found hotels as needed
                }
            }).filter(id => id !== null); // Filter out hotels not found

            if (hotelIds.length === 0) {
                throw new Error("No matching hotel IDs found for the provided hotel names.");
            }
        } else {
            // If no hotelNames are provided, use the previous hotel IDs
            if (lastHotelSearchResults && lastHotelSearchResults.data) {
                hotelIds = lastHotelSearchResults.data.map(hotel => hotel.hotelId);
                console.log("Using hotel IDs from previous search:", hotelIds);
            } else {
                throw new Error("No hotel IDs provided and no previous hotel search results available. Please search for hotels first.");
            }
        }

        // Validate hotel IDs
        if (hotelIds.length === 0) {
            throw new Error("No valid hotel IDs available.");
        }

        // Split hotelIds into chunks of 6
        const hotelIdChunks = [];
        for (let i = 0; i < hotelIds.length; i += 6) {
            hotelIdChunks.push(hotelIds.slice(i, i + 6));
        }

        // Fetch hotel offers for each chunk
        const hotelOffersResponses = [];
        for (const chunk of hotelIdChunks) {
            // Ensure currency is CAD if not provided
            const chunkSearchParams = { ...searchParams, hotelIds: chunk };
            delete chunkSearchParams.hotelNames; // Remove hotelNames, as it's not needed anymore
            if (!chunkSearchParams.currency) {
                chunkSearchParams.currency = 'CAD';
            }
            console.log("Requesting hotel offers for chunk:", chunk);
            try {
                const hotelOffers = await Amadeus.getHotelOffers(chunkSearchParams);
                hotelOffersResponses.push(hotelOffers);
            } catch (error) {
                console.error("Error fetching hotel offers for chunk:", chunk, error);
                // Handle the error as needed, e.g., skip this chunk or throw an error
            }
        }

        // Combine the responses
        const combinedHotelOffers = { data: [], warnings: [] };
        for (const response of hotelOffersResponses) {
            if (response.data) {
                combinedHotelOffers.data = combinedHotelOffers.data.concat(response.data);
            }
            if (response.warnings) {
                combinedHotelOffers.warnings = combinedHotelOffers.warnings.concat(response.warnings);
            }
        }

        // Handle warnings
        if (combinedHotelOffers.warnings.length > 0) {
            console.warn("Amadeus API returned warnings:", combinedHotelOffers.warnings);
        }

        return combinedHotelOffers;

    } catch (error) {
        console.error("Error fetching hotel offers:", error);
        throw error;
    }
}

exports.clearChat = (req, res) => {
    try {
        conversationHistory = []; // Clear the history
        res.json({ message: "Chat history cleared" });
    } catch (error) {
        console.error("Error clearing chat history:", error);
        res.status(500).json({ message: "Error clearing chat history" });
    }
};

exports.handleChat = async (req, res) => {
    const { feature, query, currentDate } = req.body;
    let prompt = "";
    let relevantFunctionDefinitions = [];

    try {
        // Get the prompt from the appropriate class
        const promptClass = getPromptClassForFeature(feature);
        prompt = promptClass.getPrompt(currentDate);

        // Get relevant function definitions based on feature
        relevantFunctionDefinitions = featureFunctionMap[feature] || [];

        // Initialize conversation history if it's empty
        if (conversationHistory.length === 0) {
            conversationHistory = [];
        }

        // Add user query to history
        conversationHistory.push({ role: "user", parts: [{ text: query }] });

        // Create the complete conversation with system instructions at the beginning
        const systemInstruction = { role: "user", parts: [{ text: prompt }] };
        const modelResponse = { role: "model", parts: [{ text: "I'll help you with that." }] };
        const fullContents = [
            systemInstruction,
            modelResponse,
            ...conversationHistory
        ];

        // Generate content with the system prompt and conversation history
        const geminiResponse = await model.generateContent({
            contents: fullContents,
            tools: relevantFunctionDefinitions.length > 0 ? [{ function_declarations: relevantFunctionDefinitions }] : undefined
        });

        const response = geminiResponse.response;
        console.log("Gemini response:", response);

        if (!response || !response.candidates || response.candidates.length === 0) {
            return res.status(500).json({ message: "No content in Gemini response" });
        }

        // Extract content and add model response to history
        const geminiContent = response.candidates[0].content;
        conversationHistory.push({ role: "model", parts: geminiContent.parts });

        // Check if Gemini wants to call a function
        if (geminiContent.parts[0].functionCall) {
            const functionName = geminiContent.parts[0].functionCall.name;
            const functionArgs = geminiContent.parts[0].functionCall.args;

            console.log(`Gemini wants to call function: ${functionName} with args:`, functionArgs);

            let functionResponse;
            try {
                if (functionName === "searchFlights") {
                    functionResponse = await searchFlights(functionArgs);
                } else if (functionName === "listHotels") {
                    functionResponse = await listHotels(functionArgs);
                } else if (functionName === "hotelPrices") {
                    functionResponse = await hotelPrices(functionArgs);
                } else {
                    return res.status(400).json({ message: `Unknown function: ${functionName}` });
                }

                console.log("Function response:", functionResponse);

                // Create function response prompt
                const functionDataPrompt = functionName === "searchFlights"
                    ? "Please convert the following flight offer data into a friendly, human-readable summary:\n" + JSON.stringify(functionResponse)
                    : "Please convert the following hotel offer data into a friendly, human-readable summary, using proper noun casing for the hotel names. It should not just be a list of hotels but have nicer formatting. Choose the best 5:\n" + JSON.stringify(functionResponse);

                // Add the function response request to conversation history
                conversationHistory.push({ role: "user", parts: [{ text: functionDataPrompt }] });

                // Generate summary with updated conversation history
                const fullContentsForSummary = [
                    systemInstruction,
                    modelResponse,
                    ...conversationHistory
                ];

                const summaryResponse = await model.generateContent({
                    contents: fullContentsForSummary
                });

                const summaryContent = summaryResponse.response.candidates[0].content;
                // Add summary to history
                conversationHistory.push({ role: "model", parts: summaryContent.parts });

                const friendlyText = summaryContent.parts[0].text;
                return res.json({ message: friendlyText });
            } catch (error) {
                console.error("Error calling function:", error);
                return res.status(500).json({ message: `Error calling function: ${functionName}` });
            }
        } else {
            // If Gemini doesn't want to call a function, return the text response
            const text = geminiContent.parts[0].text;
            console.log("Gemini returned text:", text);
            return res.json({ message: text });
        }
    } catch (error) {
        console.error("Error in handleChat:", error);
        return res.status(500).json({ message: "Error fetching response from Gemini API" });
    }
};

// Helper function to get the appropriate prompt class
function getPromptClassForFeature(feature) {
    switch (feature) {
        case "plan": return new PlanPrompt();
        case "on-the-go": return new OnTheGoPrompt();
        case "recommend": return new RecommendPrompt();
        case "travel": return new TravelPrompt();
        case "review": return new ReviewPrompt();
        case "alert": return new AlertPrompt();
        default: throw new Error("Invalid feature");
    }
}