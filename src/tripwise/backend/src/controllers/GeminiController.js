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
    travel: [functionDefinitions.searchFlights, functionDefinitions.listHotels],
    // Add other features and their function definitions here
};

// Use your API key from environment variables
const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let chatSession = null;
let conversationHistory = []; // Add this at the top with your other variables

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
  return hotelsList;
  } catch (error) {
    throw error;
  }
}

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
                } else if (functionName === "searchHotels") {
                    functionResponse = await searchHotels(functionArgs);
                } else {
                    return res.status(400).json({ message: `Unknown function: ${functionName}` });
                }

                console.log("Function response:", functionResponse);

                // Create function response prompt
                const functionDataPrompt = functionName === "searchFlights"
                    ? "Please convert the following flight offer data into a friendly, human-readable summary:\n" + JSON.stringify(functionResponse)
                    : "Please convert the following hotel offer data into a friendly, human-readable summary:\n" + JSON.stringify(functionResponse);

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