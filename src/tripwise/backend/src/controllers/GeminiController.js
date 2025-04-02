require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Amadeus = require('./AmadeusController');
const PlanPrompt = require('./prompts/PlanPrompt');
const OnTheGoPrompt =require('./prompts/OnTheGoPrompt');
const RecommendPrompt = require('./prompts/RecommendPrompt');
const TravelPrompt = require('./prompts/TravelPrompt');
const ReviewPrompt = require('./prompts/ReviewPrompt');
const AlertPrompt = require('./prompts/AlertPrompt');

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
  let functionDefinitions = [];

  // Set function definitions based on feature
  if (feature === "travel") {
      functionDefinitions = [
        {
          name: "searchFlights",
          description: "Search for flights based on the provided parameters",
          parameters: {
              type: "OBJECT",
              properties: {
                  originLocationCode: { 
                    type: "STRING", 
                    description: "city/airport IATA code from which the traveler will depart, e.g. BOS for Boston" 
                  },
                  destinationLocationCode: { 
                    type: "STRING", 
                    description: "city/airport IATA code to which the traveler is going, e.g. PAR for Paris" 
                  },
                  departureDate: { 
                    type: "STRING", 
                    description: `the date on which the traveler will depart from the origin to go to the destination. 
                      Dates are specified in the ISO 8601 YYYY-MM-DD format, e.g. 2017-12-25` 
                  },
                  returnDate: { 
                    type: "STRING", 
                    description: `the date on which the traveler will depart from the 
                    destination to return to the origin. If this parameter is not specified, 
                    only one-way itineraries are found. If this parameter is specified, 
                    only round-trip itineraries are found. Dates are specified in the 
                    ISO 8601 YYYY-MM-DD format, e.g. 2018-02-28` 
                  },
                  adults: { 
                    type: "INTEGER", 
                    description: `the number of adult travelers (age 12 or older on date of departure). 
                    The total number of seated travelers (adult and children) can not exceed 9.` 
                  },
                  children: {
                    type: "INTEGER",
                    description: `the number of child travelers (older than age 2 and younger than age 12 on date of departure) 
                    who will each have their own separate seat. If specified, this number should be greater than or equal to 0`
                  },
                  infants: {
                    type: "INTEGER",
                    description: `the number of infant travelers (whose age is less or equal to 2 on date of departure). 
                    Infants travel on the lap of an adult traveler, and thus the number of infants must not exceed 
                    the number of adults. If specified, this number should be greater than or equal to 0`
                  },
                  travelClass: {
                    type: "STRING",
                    description: `most of the flight time should be spent in a cabin of this quality or higher. 
                    The accepted travel class is economy, premium economy, business or first class. 
                    If no travel class is specified, the search considers any travel class`,
                    enum: [
                      "ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"
                    ]
                  },
                  includedAirlineCodes: {
                    type: "STRING",
                    description: `This option ensures that the system will only consider these airlines. 
                    This can not be cumulated with parameter excludedAirlineCodes.
                    Airlines are specified as IATA airline codes and are comma-separated, e.g. 6X,7X,8X`
                  },
                  excludedAirlineCodes: {
                    type: "STRING",
                    description: `This option ensures that the system will ignore these airlines. 
                    This can not be cumulated with parameter includedAirlineCodes.
                    Airlines are specified as IATA airline codes and are comma-separated, e.g. 6X,7X,8X`
                  },
                  nonStop: {
                    type: "BOOLEAN",
                    description: `if set to true, the search will find only flights going from the origin 
                    to the destination with no stop in between`
                  },
                  currencyCode: {
                    type: "STRING",
                    description: `the preferred currency for the flight offers. 
                    Currency is specified in the ISO 4217 format, e.g. EUR for Euro`
                  },
                  maxPrice: {
                    type: "INTEGER",
                    description: `maximum price per traveler. By default, no limit is applied. 
                    If specified, the value should be a positive number with no decimals`
                  },
                  max: {
                    type: "INTEGER",
                    description: `maximum number of flight offers to return. 
                    If specified, the value should be greater than or equal to 1`
                  }
              },
              required: ["originLocationCode", "destinationLocationCode", "departureDate", "adults"]
          }
      },
      {
          name: "listHotels",
          description: "Search for hotels based on the provided parameters",
          parameters: {
              type: "OBJECT",
              properties: {
                  cityCode: { 
                    type: "STRING", 
                    description: "Destination city code or airport code. In case of city code , the search will be done around the city center. Available codes can be found in IATA table codes (3 chars IATA Code)." 
                  },
                  radius: { 
                    type: "INTEGER", 
                    description: "Maximum distance from the geographical coordinates express in defined units. The default unit is metric kilometer." 
                  },
                  radiusUnit: { 
                    type: "STRING", 
                    description: "Unit of measurement used to express the radius. It can be either metric kilometer or imperial mile.",
                    enum: ["KM", "MI"]
                  },
                  chainCode: { 
                    type: "ARRAY", 
                    description: "Array of hotel chain codes. Each code is a string consisted of 2 capital alphabetic characters.", 
                    items: {
                      type: "STRING",
                    }
                  },
                  amenities: {
                    type: "ARRAY",
                    description: "List of amenities.",
                    items: {
                      type: "STRING",
                      enum: [ "SWIMMING_POOL", "SPA", "FITNESS_CENTER", "AIR_CONDITIONING", 
                        "RESTAURANT", "PARKING", "PETS_ALLOWED", "AIRPORT_SHUTTLE", "BUSINESS_CENTER", 
                        "DISABLED_FACILITIES", "WIFI", "MEETING_ROOMS", "NO_KID_ALLOWED", "TENNIS", "GOLF", 
                        "KITCHEN", "ANIMAL_WATCHING", "BABY-SITTING", "BEACH", "CASINO", "JACUZZI", "SAUNA", 
                        "SOLARIUM", "MASSAGE", "VALET_PARKING", "BAR or LOUNGE", "KIDS_WELCOME", "NO_PORN_FILMS", 
                        "MINIBAR", "TELEVISION", "WI-FI_IN_ROOM", "ROOM_SERVICE", "GUARDED_PARKG", "SERV_SPEC_MENU" ]
                    }
                  },
                  ratings: {
                    type: "ARRAY",
                    description: "Hotel stars. Up to four values can be requested at the same time in a comma separated list.",
                    items: {
                      type: "STRING",
                      enum: ["1", "2", "3", "4", "5"]
                    }
                  },
                  hotelSource: {
                    type: "STRING",
                    description: "Hotel source with values BEDBANK for aggregators, DIRECTCHAIN for GDS/Distribution and ALL for both.",
                    enum: ["BEDBANK", "DIRECTCHAIN", "ALL"]
                  }
              },
              required: ["cityCode"]
          }
      }
    ];
  }

  try {
      // Get the prompt from the appropriate class
      const promptClass = getPromptClassForFeature(feature);
      prompt = promptClass.getPrompt(currentDate);
      
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
          tools: functionDefinitions.length > 0 ? [{ function_declarations: functionDefinitions }] : undefined
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