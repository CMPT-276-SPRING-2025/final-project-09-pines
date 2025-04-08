// src/tripwise/src/services/alertService.ts

import { Alert, convertToAPIFormat, convertToUIFormat } from './models/Alert';
import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

/**
 * alertService object containing methods for managing alerts.
 */
const alertService = {
  /**
   * Retrieves all alerts.
   * @returns {Promise<Alert[]>} - A promise that resolves with an array of alerts.
   * @throws {Error} - If there is an error fetching alerts.
   */
  getAlerts: async (): Promise<Alert[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts`);

      if (!response.ok) {
        throw new Error(`Error fetching alerts: ${response.statusText}`);
      }

      const data = await response.json();

      // Convert API format to UI format
      return data.data.map((alert: Alert) => convertToUIFormat(alert));
    } catch (error) {
      console.error('Error in getAlerts:', error);
      throw error;
    }
  },

  /**
   * Retrieves alerts by type (flight or hotel).
   * @param {('flight' | 'hotel')} type - The type of alerts to retrieve.
   * @returns {Promise<Alert[]>} - A promise that resolves with an array of alerts of the specified type.
   * @throws {Error} - If there is an error fetching alerts by type.
   */
  getAlertsByType: async (type: 'flight' | 'hotel'): Promise<Alert[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/type/${type}`);

      if (!response.ok) {
        throw new Error(`Error fetching alerts by type: ${response.statusText}`);
      }

      const data = await response.json();

      // Convert API format to UI format
      return data.data.map((alert: Alert) => convertToUIFormat(alert));
    } catch (error) {
      console.error(`Error in getAlertsByType (${type}):`, error);
      throw error;
    }
  },

  /**
   * Creates a new alert.
   * @param {Omit<Alert, 'id'>} alert - The alert object to create (excluding the 'id' property).
   * @returns {Promise<Alert>} - A promise that resolves with the created alert.
   * @throws {Error} - If there is an error creating the alert.
   */
  createAlert: async (alert: Omit<Alert, 'id'>): Promise<Alert> => {
    try {
      // Convert UI format to API format
      const apiAlert = convertToAPIFormat(alert as Alert);

      const response = await fetch(`${API_BASE_URL}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiAlert)
      });

      if (!response.ok) {
        throw new Error(`Error creating alert: ${response.statusText}`);
      }

      const data = await response.json();

      // Convert API response back to UI format
      return convertToUIFormat(data.data);
    } catch (error) {
      console.error('Error in createAlert:', error);
      throw error;
    }
  },

  /**
   * Updates an existing alert.
   * @param {(string | number)} id - The ID of the alert to update.
   * @param {Partial<Alert>} updates - An object containing the properties to update.
   * @returns {Promise<Alert>} - A promise that resolves with the updated alert.
   * @throws {Error} - If there is an error updating the alert.
   */
  updateAlert: async (id: string | number, updates: Partial<Alert>): Promise<Alert> => {
    try {
      // Convert UI format to API format
      const apiUpdates = convertToAPIFormat(updates as Alert);

      const response = await fetch(`${API_BASE_URL}/alerts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiUpdates)
      });

      if (!response.ok) {
        throw new Error(`Error updating alert: ${response.statusText}`);
      }

      const data = await response.json();

      // Convert API response back to UI format
      return convertToUIFormat(data.data);
    } catch (error) {
      console.error(`Error in updateAlert (${id}):`, error);
      throw error;
    }
  },

  /**
   * Deletes an alert.
   * @param {(string | number)} id - The ID of the alert to delete.
   * @returns {Promise<void>} - A promise that resolves when the alert is successfully deleted.
   * @throws {Error} - If there is an error deleting the alert.
   */
  deleteAlert: async (id: string | number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Error deleting alert: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error in deleteAlert (${id}):`, error);
      throw error;
    }
  },

  /**
   * Validates if origin and destination codes are valid.
   * @param {string} origin - The origin location code.
   * @param {string} destination - The destination location code.
   * @returns {Promise<boolean>} - A promise that resolves with a boolean indicating whether the airport codes are valid.
   */
  validateAirportCodes: async (origin: string, destination: string): Promise<boolean> => {
    try {
      // First check if codes are already in IATA format (3 letter codes)
      const isOriginIATA = /^[A-Z]{3}$/.test(origin.toUpperCase());
      const isDestinationIATA = /^[A-Z]{3}$/.test(destination.toUpperCase());

      // If both are already IATA codes, assume they're valid
      if (isOriginIATA && isDestinationIATA) {
        return true;
      }

      // Otherwise, search for each to validate
      const originResults = await alertService.searchLocations(origin);
      const destinationResults = await alertService.searchLocations(destination);

      return originResults.length > 0 && destinationResults.length > 0;
    } catch (error) {
      console.error('Error validating airport codes:', error);
      return false;
    }
  },

  /**
   * Searches for airport and city codes for autocomplete.
   * @param {string} keyword - The search keyword.
   * @returns {Promise<any[]>} - A promise that resolves with an array of location suggestions.
   */
  searchLocations: async (keyword: string): Promise<
    {
      id: string;
      name: string;
      code: string;
      city: string;
      country: string;
      type: string;
    }[]
  > => {
    try {
      if (!keyword || keyword.length < 2) {
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/locations/search?keyword=${encodeURIComponent(keyword)}`);

      if (!response.ok) {
        throw new Error(`Error searching locations: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.data as {
        iataCode: string;
        name: string;
        address?: {
          cityName: string;
          countryName: string;
        };
        subType: string;
      }[]).map((location) => ({
        id: location.iataCode,
        name: `${location.name} (${location.iataCode})`,
        code: location.iataCode,
        city: location.address?.cityName || '',
        country: location.address?.countryName || '',
        type: location.subType
      }));
    } catch (error) {
      console.error('Error in searchLocations:', error);
      return [];
    }
  },

  /**
   * Gets the current flight price - useful for creating new alerts.
   * @param {string} origin - The origin location code.
   * @param {string} destination - The destination location code.
   * @param {string} departureDate - The departure date in YYYY-MM-DD format.
   * @param {string} returnDate - The return date in YYYY-MM-DD format.
   * @returns {Promise<{price: number, currency: string}>} - A promise that resolves with the current flight price and currency.
   */
  getFlightPrice: async (origin: string, destination: string, departureDate: string, returnDate: string): Promise<{ price: number; currency: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/flights/price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin,
          destination,
          departureDate,
          returnDate
        })
      });

      if (!response.ok) {
        throw new Error(`Error getting flight price: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getFlightPrice:', error);
      throw error;
    }
  },

  /**
   * Gets the current hotel price for a location using Amadeus API.
   * @param {string} location - The location/city name.
   * @param {string} checkInDate - Check-in date in YYYY-MM-DD format.
   * @param {string} checkOutDate - Check-out date in YYYY-MM-DD format.
   * @returns {Promise<{price: number, currency: string}>} - A promise that resolves with the average hotel price and currency.
   */
  getHotelPrice: async (location: string, checkInDate: string, checkOutDate: string): Promise<{ price: number; currency: string }> => {
    try {
      console.log(`Fetching hotel prices for ${location} (${checkInDate} to ${checkOutDate})`);

      // Step 1: Convert location to cityCode using Amadeus location API
      const locationResponse = await fetch(`${API_CONFIG.BASE_URL}/locations/search?keyword=${encodeURIComponent(location)}`);

      if (!locationResponse.ok) {
        throw new Error(`Error searching location: ${locationResponse.statusText}`);
      }

      const data = await locationResponse.json();
      const locationResults: {
        subType: string;
        type: string;
        iataCode: string;
        name: string;
        address?: {
          cityName: string;
          countryName: string;
        };
      }[] = data.data || [];

      // Find the first city in results
      const cityLocation = locationResults.find((loc) =>
        loc.subType === 'CITY' || loc.type === 'CITY'
      );

      if (!cityLocation) {
        console.warn(`Could not find city code for ${location}, using fallback price`);
        return {
          price: Math.floor(Math.random() * 400) + 100, // Fallback
          currency: "USD"
        };
      }

      const cityCode = cityLocation.iataCode;
      console.log(`Found city code: ${cityCode} for ${location}`);

      // Step 2: Get hotels in this city
      const hotelsResponse = await fetch(`${API_CONFIG.BASE_URL}/hotels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cityCode: cityCode,
          radius: 5,
          radiusUnit: 'KM',
          amenities: ['SWIMMING_POOL', 'SPA', 'RESTAURANT'],
          ratings: ['3', '4', '5'],
          hotelSource: 'ALL'
        })
      });

      if (!hotelsResponse.ok) {
        throw new Error(`Error fetching hotels: ${hotelsResponse.statusText}`);
      }

      const hotelsData = await hotelsResponse.json();
      const hotels = hotelsData.data || [];

      // If no hotels found, return fallback
      if (hotels.length === 0) {
        console.warn(`No hotels found in ${location}, using fallback price`);
        return {
          price: Math.floor(Math.random() * 400) + 100, // Fallback
          currency: "USD"
        };
      }

      // Take up to 5 hotels for price check
      const hotelsToCheck = hotels.slice(0, 5);
      const hotelIds = hotelsToCheck.map((hotel: { hotelId: string }) => hotel.hotelId);

      // Step 3: Get prices for these hotels
      const pricesResponse = await fetch(`${API_CONFIG.BASE_URL}/hotel-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hotelIds: hotelIds,
          adults: 1,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          currency: 'USD',
          roomQuantity: 1,
          priceRange: '0-2000'
        })
      });

      if (!pricesResponse.ok) {
        throw new Error(`Error fetching hotel prices: ${pricesResponse.statusText}`);
      }

      const pricesData = await pricesResponse.json();
      const hotelOffers = pricesData.data || [];

      // If no price offers found, return fallback
      if (hotelOffers.length === 0) {
        console.warn(`No hotel prices found for ${location}, using fallback price`);
        return {
          price: Math.floor(Math.random() * 400) + 100, // Fallback
          currency: "USD"
        };
      }

      // Step 4: Calculate average price from all offers
      let totalPrice = 0;
      let validPricesCount = 0;
      let currency = "USD";

      hotelOffers.forEach((hotel: { offers: { price: { total: string; }; }[]; }) => {
        if (hotel.offers && hotel.offers.length > 0) {
          // Find the cheapest offer for each hotel
          let cheapestOffer = hotel.offers[0];
          for (const offer of hotel.offers) {
            if (parseFloat(offer.price.total) < parseFloat(cheapestOffer.price.total)) {
              cheapestOffer = offer;
            }
          }

          totalPrice += parseFloat(cheapestOffer.price.total);
          validPricesCount++;
          currency = cheapestOffer.price.currency; // Typically USD as requested
        }
      });

      // If no valid prices found, return fallback
      if (validPricesCount === 0) {
        console.warn(`No valid prices found for hotels in ${location}, using fallback price`);
        return {
          price: Math.floor(Math.random() * 400) + 100, // Fallback
          currency: "USD"
        };
      }

      // Calculate average price
      const averagePrice = totalPrice / validPricesCount;

      // Round to 2 decimal places
      const roundedPrice = Math.round(averagePrice * 100) / 100;

      console.log(`Average hotel price in ${location}: ${roundedPrice} ${currency} (based on ${validPricesCount} hotels)`);

      return {
        price: roundedPrice,
        currency: currency
      };
    } catch (error) {
      console.error("Error fetching hotel prices:", error);
      // Fallback price if API call fails
      return {
        price: Math.floor(Math.random() * 400) + 100,
        currency: "USD"
      };
    }
  }
};

// Export the alertService as a default export
export default alertService;

// Also export as a named export for backward compatibility
export { alertService };