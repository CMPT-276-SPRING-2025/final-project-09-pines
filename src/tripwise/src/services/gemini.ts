export async function fetchChatResponse(feature: string, query: string): Promise<string> {
    try {
        let prompt = "";
        switch (feature) {
            case "plan":
                prompt = "You are a travel planner that helps design detailed itineraries based on user input.";
                break;
            case "on-the-go":
                prompt = "You are an on-the-go travel assistant providing quick, concise advice.";
                break;
            case "recommend":
                prompt = "You are a travel recommendation engine that suggests the best deals and experiences.";
                break;
            case "travel":
                prompt = "Your goal is to return a JSON object with relevant flight or hotel information. If the user is looking for a flight return originLocationCode (required), destinationLocationCode (required, should be inferred from users location unless otherwise stated), departureDate (required), returnDate, and adults (required), children, infants, travelClass, includedAirlineCodes, excludedAirlineCodes, nonStop, currencyCode (this should be determined by users location), maxPrice, max. Be as friendly as possible to get all the needed data. Do not return JSON unless you have all relevant information, when you have the needed data return only the JSON object, no other text. Make sure all dates are in the future.";
                break;
            case "review":
                prompt = "You are a travel review summarizer. Provide concise summaries of user reviews for flights and hotels.";
                break;
            case "alert":
                prompt = "You are a travel alert system. Notify users of important travel information and alerts.";
                break;
            default:
                return "Invalid feature";
        }
      console.log(`Sending request to ${feature} endpoint with query: "${query}"`);
      
      // Build the endpoint URL according to the feature
      const endpoint = "http://localhost:5001/api/chat";

        
      console.log("Calling endpoint:", endpoint);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ feature, prompt, query }),
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        return `Server error (${response.status}): ${errorText || response.statusText}`;
      }
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (!data || typeof data.message === 'undefined') {
        return "Invalid response format from server";
      }
      
      return data.message;
    } catch (error) {
      console.error("Fetch error in fetchChatResponse:", error);
      
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        return "Cannot connect to API server. Is the backend running?";
      }
      
      if (error instanceof Error) {
        return `Error: ${error.message}`;
      } else {
        return "Unknown error";
      }
    }
  }

export async function clearChat(): Promise<void> {
  try {
    const endpoint = "http://localhost:5001/api/clearChat";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server error response:", errorText);
      throw new Error(`Server error (${response.status}): ${errorText || response.statusText}`);
    }

    console.log("Chat history cleared successfully");
  } catch (error) {
    console.error("Error clearing chat history:", error);
    throw error;
  }
}