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
    },
    hotelPrices: {
      name: "hotelPrices",
      description: "Get hotel prices based on the provided parameters",
      parameters: {
        type: "OBJECT",
        properties: {
          hotelNames: {
            type: "ARRAY",
            description: "Array of hotel names to get prices for.",
            items: {
                type: "STRING",
            }
          },
          adults: {
            type: "INTEGER",
            description: `Number of adult guests (1-9) per room.`
          },
          checkInDate: {
            type: "STRING",
            description: `Check-in date of the stay (hotel local date). 
            Format YYYY-MM-DD. The lowest accepted value is the present date 
            (no dates in the past). If not present, the default value will be 
            today's date in the GMT time zone.`
          },
          checkOutDate: {
            type: "STRING",
            description: `Check-out date of the stay (hotel local date). 
            Format YYYY-MM-DD. The lowest accepted value is checkInDate+1. 
            If not present, it will default to checkInDate +1.`
          },
          countryOfResidence: {
            type: "STRING",
            description: `Code of the country of residence of the traveler expressed using 
            ISO 3166-1 format.`
          },
          roomQuantity: {
            type: "INTEGER",
            description: `Number of rooms requested (1-9).`
          },
          priceRange: {
            type: "STRING",
            description: `Filter hotel offers by price per night interval 
            (ex: 200-300 or -300 or 100).
            It is mandatory to include a currency when this field is set.`
          },
          currency: {
            type: "STRING",
            description: `Use this parameter to request a specific currency. 
            ISO currency code (http://www.iso.org/iso/home/standards/currency_codes.htm).
            If a hotel does not support the requested currency, the prices for the hotel 
            will be returned in the local currency of the hotel.`
          },
          paymentPolicy: {
            type: "STRING",
            description: `Filter the response based on a specific payment type. 
            NONE means all types (default).`,
            enum: ["GUARANTEE", "DEPOSIT", "NONE"]
          },
          boardType: {
            type: "STRING",
            description: `Filter response based on available meals:
            - ROOM_ONLY = Room Only
            - BREAKFAST = Breakfast
            - HALF_BOARD = Diner & Breakfast (only for Aggregators)
            - FULL_BOARD = Full Board (only for Aggregators)
            - ALL_INCLUSIVE = All Inclusive (only for Aggregators)`,
            enum: ["ROOM_ONLY", "BREAKFAST", "HALF_BOARD", "FULL_BOARD", "ALL_INCLUSIVE"]
          },
          includeClosed: {
            type: "BOOLEAN",
            description: `Show all properties (include sold out) or available only. 
            For sold out properties, please check availability on other dates.`
          },
          bestRateOnly: {
            type: "BOOLEAN",
            description: `Used to return only the cheapest offer per hotel or all available offers.`
          },
          lang: {
            type: "STRING",
            description: `Requested language of descriptive texts.
            Examples: FR , fr , fr-FR.
            If a language is not available the text will be returned in english.
            ISO language code (https://www.iso.org/iso-639-language-codes.html).`
          }
        },
        required: ["hotelNames"]
      }
    },
    hotelReviews: {
      name: "hotelReviews",
      description: "Get hotel reviews based on the provided parameters",
      parameters: {
        type: "OBJECT",
        properties: {
          hotelIds: {
            type: "ARRAY",
            description: `Comma-separated list of Amadeus Hotel Ids (max. 3). 
            Amadeus Hotel Ids are found in the Hotel Search response (parameter name is 'hotelId').`,
            items: {
              type: "STRING",
            }
          }
        },
        required: ["hotelIds"]
      }
    }
}

module.exports = { functionDefinitions };