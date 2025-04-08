const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  
  // Rest of your config remains the same
  ENDPOINTS: {
    ALERTS: '/alerts',
    CHAT: '/chat',
    CLEAR_CHAT: '/clearChat',
    LOCATIONS: '/locations/search',
    FLIGHTS_PRICE: '/flights/price'
  }
};

export default API_CONFIG;