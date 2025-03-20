export async function fetchChatResponse(feature: string, query: string): Promise<string> {
    try {
        let prompt = "";
        switch (feature) {
            case "plan":
                prompt = ""
                break;
            case "on-the-go":
                prompt = "";
                break;
            case "recommend":
                prompt = "";
                break;
            case "travel":
                prompt = "You are designed to help users communicate seamlessly with the amadeus API to find the cheapest flights and hotels, take whatever input the user gives you and format it as an API call to the amadeus API. If a users chat does not make sense for this purpose then you should respond that you are not designed to handle that request, instead just respond in the most friendly way possible asking for the relevant information. Try to infer as much information as possible from the user's chat to make the API call as accurate as possible. If the user asks for a specific hotel or flight then you should respond with the relevant information from the API. If the user asks for a general recommendation then you should respond with a list of the top 5 cheapest flights or hotels. If the user asks for a specific type of hotel or flight then you should respond with the relevant information from the API. If the user asks for a specific type of hotel or flight then you should respond with the relevant information from the API. When the API call is made only print the API call and no other text";
                break;
            case "review":
                prompt = "";
                break;
            case "alert":
                prompt = "";
                break;
            default:
                return "Invalid feature";
        }
      console.log(`Sending request to ${feature} endpoint with query: "${query}"`);
      
      // Build the endpoint URL according to the feature
      const endpoint = feature === "travel" 
        ? "http://localhost:5001/api/travel/chat" 
        : `http://localhost:5001/api/${feature}/chat`;
        
      console.log("Calling endpoint:", endpoint);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ prompt, query }),
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
    const endpoint = "http://localhost:5001/api/travel/clearChat";
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