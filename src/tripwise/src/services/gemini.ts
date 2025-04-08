import API_CONFIG from '../config/api';

/**
 * Fetches a chat response from the specified feature endpoint.
 * @param {string} feature - The feature to query.
 * @param {string} query - The user's query.
 * @returns {Promise<string>} - The chat response from the server.
 */
export async function fetchChatResponse(feature: string, query: string): Promise<string> {
  try {
    console.log(`Sending request to ${feature} endpoint with query: "${query}"`);

    // Get current date
    const today = new Date();
    const currentDate = today.toLocaleDateString();

    // Build the endpoint URL using the config
    const endpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT}`;

    console.log("Calling endpoint:", endpoint);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ feature, query, currentDate }),
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

/**
 * Clears the chat history by sending a request to the clear chat endpoint.
 * @returns {Promise<void>}
 */
export async function clearChat(): Promise<void> {
  try {
    const endpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLEAR_CHAT}`;
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