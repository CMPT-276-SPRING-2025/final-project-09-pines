export async function fetchChatResponse(feature: string, query: string): Promise<string> {
    try {
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
        body: JSON.stringify({ query }),
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