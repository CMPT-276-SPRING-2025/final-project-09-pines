/**
 * Retrieves an access token from the Amadeus API.
 * @returns {Promise<object>} - The access token data.
 * @throws {Error} - If there is an error fetching the access token.
 */
async function getAccessToken() {
    const url = 'https://test.api.amadeus.com/v1/security/oauth2/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', process.env.AMADEUS_CLIENT_ID);
    params.append('client_secret', process.env.AMADEUS_CLIENT_SECRET);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const tokenData = await response.json();
        return tokenData;
    } catch (error) {
        console.error("Error fetching access token:", error);
        throw error;
    }
}

/**
 * Retrieves flight offers from the Amadeus API.
 * @param {object} queryParams - The query parameters for the flight search.
 * @returns {Promise<object>} - The flight offers data.
 * @throws {Error} - If there is an error fetching flight offers.
 */
async function getFlightOffers(queryParams) {
    try {
        const token = await getAccessToken();
        const endpoint = 'https://test.api.amadeus.com/v2/shopping/flight-offers';
        const url = new URL(endpoint);

        // Set a default value for the max flights if not provided:
        if (!queryParams.max) {
            queryParams.max = "5";
        }

        Object.keys(queryParams).forEach(key => {
            url.searchParams.append(key, queryParams[key]);
        });

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.access_token}`
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error fetching flight offers: ${response.statusText}`, errorText);
            throw new Error(`Error fetching flight offers: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error in getFlightOffers:", error);
        throw error;
    }
}

/**
 * Retrieves hotels by city from the Amadeus API.
 * @param {object} queryParams - The query parameters for the hotel search.
 * @returns {Promise<object>} - The hotels data.
 * @throws {Error} - If there is an error fetching hotels by city.
 */
async function getHotelsByCity(queryParams) {
    try {
        const token = await getAccessToken();
        const endpoint = 'https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city';
        const url = new URL(endpoint);

        // Append each query parameter to the URL.
        Object.keys(queryParams).forEach(key => {
            url.searchParams.append(key, queryParams[key]);
        });

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.access_token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error fetching hotels by city: ${response.statusText}`, errorText);
            throw new Error(`Error fetching hotels by city: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error in getHotelsByCity:", error);
        throw error;
    }
}

/**
 * Retrieves hotel offers from the Amadeus API.
 * @param {object} queryParams - The query parameters for the hotel search.
 * @returns {Promise<object>} - The hotel offers data.
 * @throws {Error} - If there is an error fetching hotel offers.
 */
async function getHotelOffers(queryParams) {
    try {
        const token = await getAccessToken();
        // Use the v3 endpoint for hotel offers.
        const endpoint = 'https://test.api.amadeus.com/v3/shopping/hotel-offers';
        const url = new URL(endpoint);

        // Extract hotelIds from queryParams
        if (!queryParams.hotelIds || queryParams.hotelIds.length === 0) {
            throw new Error("No hotel IDs provided in the request parameters.");
        }

        // Append hotelIds as a comma-separated string.
        url.searchParams.append('hotelIds', queryParams.hotelIds.join(','));

        // Create a copy of queryParams without the hotelIds to avoid duplicate parameters
        const otherParams = { ...queryParams };
        delete otherParams.hotelIds;

        // Append any additional query parameters provided.
        Object.keys(otherParams).forEach(key => {
            url.searchParams.append(key, otherParams[key]);
        });

        // Append currency if not already provided.
        if (!queryParams.currency) {
            url.searchParams.append('currency', 'USD');
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.access_token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error fetching hotel offers: ${response.statusText}`, errorText);
            throw new Error(`Error fetching hotel offers: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error in getHotelOffers:", error);
        throw error;
    }
}

/**
 * Get hotel reviews and sentiments from Amadeus
 * @param {string[]} hotelIds - An array of hotel IDs
 * @returns {Promise<Object>} - Reviews data
 */
async function getHotelReviews(hotelIds) {
    try {
        // Get access token
        const token = await getAccessToken();

        // The hotel sentiments endpoint
        const endpoint = 'https://test.api.amadeus.com/v2/e-reputation/hotel-sentiments';
        const url = new URL(endpoint);

        // Ensure hotelIds is an array
        if (!Array.isArray(hotelIds)) {
            throw new Error("hotelIds must be an array");
        }

        // Split the hotelIds into chunks of 3
        const hotelIdChunks = [];
        for (let i = 0; i < hotelIds.length; i += 3) {
            hotelIdChunks.push(hotelIds.slice(i, i + 3));
        }

        let allReviews = [];

        // Fetch reviews for each chunk
        for (const chunk of hotelIdChunks) {
            // Add the hotel IDs to the URL params
            url.searchParams.append('hotelIds', chunk.join(','));

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token.access_token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error fetching hotel reviews: ${response.statusText}`, errorText);
                throw new Error(`Error fetching hotel reviews: ${response.statusText}`);
            }

            const data = await response.json();

            if (data && data.data) {
                allReviews = allReviews.concat(data.data);
            }
        }

        return { data: allReviews };
    } catch (error) {
        console.error("Error in getHotelReviews:", error);

        // Check if this is an API subscription issue
        if (error.response && error.response.status === 403) {
            console.error("Possible API subscription issue - Hotel Ratings API may not be enabled");
        }

        throw error;
    }
}

// ============= ALERT-RELATED FUNCTIONS =============

/**
 * Get current flight price for an alert
 * @param {string} origin - Origin location code
 * @param {string} destination - Destination location code
 * @param {string} departureDate - Departure date in YYYY-MM-DD format
 * @param {string} returnDate - Return date in YYYY-MM-DD format
 * @returns {Promise<Object>} - The price data
 */
async function getFlightPriceForAlert(origin, destination, departureDate, returnDate) {
    try {
        // Format the query parameters
        const queryParams = {
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: departureDate,
            returnDate: returnDate,
            adults: "1",
            nonStop: "false",
            currencyCode: "USD",
            max: "1"
        };

        // Use the existing getFlightOffers function
        const flightData = await getFlightOffers(queryParams);

        if (!flightData || !flightData.data || flightData.data.length === 0) {
            // If no real data available, return a fallback with a placeholder price
            console.warn("No flight offers found for alert, using fallback price");
            return {
                price: 500,
                currency: "USD",
                priceVerified: false
            };
        }

        // Extract price from the cheapest flight offer
        const cheapestOffer = flightData.data[0];

        return {
            price: parseFloat(cheapestOffer.price.total),
            currency: cheapestOffer.price.currency,
            priceVerified: true,
            flightNumber: cheapestOffer.itineraries[0].segments[0].number,
            airline: cheapestOffer.itineraries[0].segments[0].carrierCode
        };
    } catch (error) {
        console.error("Error getting flight price for alert:", error);

        // Return a fallback with placeholder data
        return {
            price: 500,
            currency: "USD",
            priceVerified: false
        };
    }
}

/**
 * Get hotel price for an alert
 * @param {string} hotelId - The hotel ID
 * @param {string} checkInDate - Check-in date in YYYY-MM-DD format
 * @param {string} checkOutDate - Check-out date in YYYY-MM-DD format
 * @returns {Promise<Object>} - The price data
 */
async function getHotelPriceForAlert(hotelId, checkInDate, checkOutDate) {
    try {
        // Format the query parameters
        const queryParams = {
            hotelIds: [hotelId],
            adults: "1",
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            roomQuantity: "1",
            currency: "USD",
            priceRange: "0-2000"
        };

        // Use the existing getHotelOffers function
        const hotelData = await getHotelOffers(queryParams);

        if (!hotelData || !hotelData.data || hotelData.data.length === 0) {
            // If no real data available, return a fallback with a placeholder price
            console.warn("No hotel offers found for alert, using fallback price");
            return {
                price: 200,  // Fallback price
                pricePerNight: 200,
                currency: "USD",
                priceVerified: false,
                availability: 65
            };
        }

        // Extract the cheapest room offer
        const hotelOffer = hotelData.data[0];

        if (!hotelOffer.offers || hotelOffer.offers.length === 0) {
            console.warn("No room offers found for hotel, using fallback price");
            return {
                price: 200,  // Fallback price
                pricePerNight: 200,
                currency: "USD",
                priceVerified: false,
                availability: 65
            };
        }

        // Find the cheapest room
        let cheapestRoom = hotelOffer.offers[0];
        for (const offer of hotelOffer.offers) {
            if (parseFloat(offer.price.total) < parseFloat(cheapestRoom.price.total)) {
                cheapestRoom = offer;
            }
        }

        // Get real availability data
        let availability = 65; // Default booking percentage

        // Count available vs. total rooms
        const totalRooms = hotelOffer.offers.length;
        const availableRooms = hotelOffer.offers.filter(offer =>
            offer.available === true ||
            (offer.policies && offer.policies.guarantee && offer.policies.guarantee.acceptedPayments)
        ).length;

        if (totalRooms > 0) {
            // Calculate booked percentage
            const percentAvailable = (availableRooms / totalRooms) * 100;
            availability = 100 - percentAvailable; // Convert to "booked" percentage
            availability = Math.min(Math.max(availability, 30), 95); // Keep between 30-95%
        }

        return {
            price: parseFloat(cheapestRoom.price.total),
            pricePerNight: cheapestRoom.price.variations?.average?.base
                ? parseFloat(cheapestRoom.price.variations.average.base)
                : parseFloat(cheapestRoom.price.total) / getDateDifference(checkInDate, checkOutDate),
            currency: cheapestRoom.price.currency,
            priceVerified: true,
            roomType: cheapestRoom.room?.typeEstimated?.category || "Standard",
            boardType: cheapestRoom.boardType || "ROOM_ONLY",
            availability: availability
        };
    } catch (error) {
        console.error("Error getting hotel price for alert:", error);

        // Return a fallback with placeholder data
        return {
            price: 200,
            pricePerNight: 200,
            currency: "USD",
            priceVerified: false,
            availability: 65
        };
    }
}

/**
 * Helper function to get the difference between two dates in days
 * @param {string} startDate - The start date in YYYY-MM-DD format.
 * @param {string} endDate - The end date in YYYY-MM-DD format.
 * @returns {number} - The difference between the two dates in days.
 */
function getDateDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1; // Return at least 1 day
}

/**
 * Search for airport and city codes for autocomplete
 * @param {string} keyword - Search keyword
 * @returns {Promise<Array>} - Matching locations
 */
async function searchLocations(keyword) {
    try {
        const token = await getAccessToken();
        const endpoint = 'https://test.api.amadeus.com/v1/reference-data/locations';
        const url = new URL(endpoint);

        url.searchParams.append('keyword', keyword);
        url.searchParams.append('subType', 'AIRPORT,CITY');

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.access_token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error searching locations: ${response.statusText}`, errorText);
            throw new Error(`Error searching locations: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error in searchLocations:", error);
        throw error;
    }
}

/**
 * Check if a flight price has changed
 * @param {Object} alert - The flight alert object
 * @returns {Promise<Object>} - Updated alert data
 */
async function checkFlightPriceChange(alert) {
    try {
        // Get current price from Amadeus
        const priceData = await getFlightPriceForAlert(
            alert.origin,
            alert.destination,
            alert.startDate,
            alert.endDate
        );

        // If we couldn't get real price data, keep the existing price
        if (!priceData.priceVerified) {
            console.warn(`Could not verify price for alert ${alert.id}, keeping existing price`);
            return {
                ...alert,
                lastChecked: new Date().toISOString()
            };
        }

        // Compare with the stored price
        const previousPrice = alert.currentPrice;
        const currentPrice = priceData.price;
        const priceDifference = previousPrice - currentPrice;
        const percentChange = (priceDifference / previousPrice) * 100;

        // Update the alert object with real data
        return {
            ...alert,
            previousPrice,
            currentPrice,
            priceDifference,
            percentChange,
            currency: priceData.currency || alert.currency,
            lastChecked: new Date().toISOString(),
            isPriceDropped: currentPrice < previousPrice,
            isTargetReached: currentPrice <= alert.targetPrice,
            priceVerified: true
        };
    } catch (error) {
        console.error(`Error checking flight price change for alert ${alert.id}:`, error);
        // Return the original alert with error flag
        return {
            ...alert,
            lastChecked: new Date().toISOString(),
            checkError: true,
            errorMessage: error.message
        };
    }
}

module.exports = {
    getAccessToken,
    getFlightOffers,
    getHotelsByCity,
    getHotelOffers,
    getHotelReviews,
    // Alert-related functions
    getFlightPriceForAlert,
    getHotelPriceForAlert,
    searchLocations,
    checkFlightPriceChange
};