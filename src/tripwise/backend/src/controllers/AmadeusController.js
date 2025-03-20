require('dotenv').config();

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

async function getFlightOffers(queryParams) {
    try {
        const token = await getAccessToken();
        const endpoint = 'https://test.api.amadeus.com/v2/shopping/flight-offers';
        const url = new URL(endpoint);
        
        // Set a default value for the max flights if not provided:
        if (!queryParams.max) {
            queryParams.max = "5";  // use string since URLSearchParams expects string values
        }

        Object.keys(queryParams).forEach(key => {
            url.searchParams.append(key, queryParams[key]);
        });
        
        console.log("Requesting flight offers from:", url.toString());
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
        console.log("Received flight offers data:", data);
        return data;
    } catch (error) {
        console.error("Error in getFlightOffers:", error);
        throw error;
    }
}

module.exports = {
    getAccessToken,
    getFlightOffers
};