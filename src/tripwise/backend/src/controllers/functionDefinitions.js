const functionDefinitions = {
    searchFlights: {
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
    listHotels: {
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
}

module.exports = { functionDefinitions };