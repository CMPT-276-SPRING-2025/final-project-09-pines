// src/tripwise/src/services/models/Alert.ts

export type AlertType = 'flight' | 'hotel';

export interface Alert {
  id: string | number;
  type: AlertType;
  from?: string;  // For flights (origin)
  to?: string;    // For flights (destination)
  location?: string; // For hotels
  startDate: string | Date;
  endDate: string | Date;
  currentPrice: number;
  previousPrice?: number;
  targetPrice: number;
  availability?: number; // Now optional since API doesn't provide it
  isNightlyRate?: boolean; // For hotels
  isAlmostFull?: boolean;
  currency?: string;
  createdAt?: string;
  lastUpdated?: string;
  lastChecked?: string;
  notificationSent?: boolean;
  isPriceDropped?: boolean;
  isTargetReached?: boolean;
  priceDifference?: number;
  percentChange?: number;
  checkError?: boolean;
  errorMessage?: string;
  priceVerified?: boolean;
}

export interface FlightAlert extends Alert {
  type: 'flight';
  from: string; // Airport or city code
  to: string;   // Airport or city code
  airline?: string; // Airline code
  flightNumber?: string;
}

export interface HotelAlert extends Alert {
  type: 'hotel';
  location: string;
  hotelId?: string;
  isNightlyRate: boolean; // Whether price is per night or total
  roomType?: string;
  boardType?: string;
}

// Helper function to convert from/to your existing Alert format
export const convertDateFormat = (dateString: string | Date): string => {
  if (typeof dateString === 'string') {
    return dateString;
  }
  return dateString.toISOString().split('T')[0];
};

// Helper to convert from API to your UI format
export const convertToUIFormat = (alert: Alert): Alert => {
  // Convert dates from ISO strings to Date objects if needed
  const startDate = typeof alert.startDate === 'string' 
    ? new Date(alert.startDate) 
    : alert.startDate;
  
  const endDate = typeof alert.endDate === 'string' 
    ? new Date(alert.endDate) 
    : alert.endDate;
  
  return {
    ...alert,
    startDate,
    endDate
  };
};

// Helper to convert from your UI format to API format
export const convertToAPIFormat = (alert: Alert): Alert => {
  // Convert Date objects to ISO date strings
  const startDate = typeof alert.startDate === 'object' 
    ? (alert.startDate as Date).toISOString().split('T')[0] 
    : alert.startDate;
  
  const endDate = typeof alert.endDate === 'object' 
    ? (alert.endDate as Date).toISOString().split('T')[0] 
    : alert.endDate;
  
  return {
    ...alert,
    startDate,
    endDate
  };
};