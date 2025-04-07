/**
 * Central configuration for API endpoints
 * This file serves as a single source of truth for all API URLs
 */
const API_CONFIG = {
    // Base URL for backend API calls (using port 5001 for consistency with your chat service)
    BASE_URL: 'http://localhost:5001/api',
    
    // Endpoints
    ENDPOINTS: {
      ALERTS: '/alerts',
      CHAT: '/chat',
      CLEAR_CHAT: '/clearChat',
      LOCATIONS: '/locations/search',
      FLIGHTS_PRICE: '/flights/price'
    }
  };
  
  export default API_CONFIG;