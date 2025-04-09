# TripWise - Your Intelligent Travel Companion

TripWise is a comprehensive travel planning application that integrates AI-powered recommendations, flight and hotel search, customizable scheduling, and community reviews to simplify the travel planning process.

## Links

- **Deployed Application:** [TripWise Live App](https://final-project-09-pines-eoxv.vercel.app)
- **Project Report:** [Final Project Documentation](https://drive.google.com/file/d/1Q-UR3NwNcTSP6leLiAe2QVbQEQrsagXm/view?usp=share_link)
- **Demo Video:** [TripWise Demonstration](https://drive.google.com/file/d/1qU5IFAcN_1T8ti7Mi_DU4-sNDXgxsS4p/view?usp=sharing)

## Local Deployment Instructions

TripWise runs on two separate servers - frontend and backend. Follow these steps to set up the development environment:

### Prerequisites

- Node.js (v16.0 or higher)
- npm (v8.0 or higher)
- Git

### Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/CMPT-276-SPRING-2025/final-project-09-pines.git
cd final-project-09-pines
```

2. **Frontend Setup**

```bash
cd src/tripwise
npm install
npm run dev
```

The frontend server will start at http://localhost:5173

3. **Backend Setup** (in a separate terminal)

```bash
cd src/tripwise/backend
npm install
npm start
```

The backend server will run at http://localhost:3000

### Environment Variables

Create a `.env` file in both the root directory and the backend directory with the following variables:

```
VITE_API_URL=http://localhost:3000
VITE_GEMINI_API_KEY=your_gemini_api_key
```

In the backend directory:

```
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret
GEMINI_API_KEY=your_gemini_api_key
```

You can obtain API keys from:
- [Amadeus for Developers](https://developers.amadeus.com/)
- [Google AI Studio](https://makersuite.google.com/app/apikey)

## Project Structure

```
FINAL-PROJECT-09-PINES/
├── .github/
├── docs/
├── misc/
├── src/
│   └── tripwise/
│       ├── backend/
│       │   ├── node_modules/
│       │   ├── src/
│       │   │   ├── controllers/
│       │   │   │   ├── alertController.js
│       │   │   │   ├── amadeusController.js
│       │   │   │   ├── functionDef...js
│       │   │   │   └── GeminiController.js
│       │   │   ├── prompts/
│       │   │   ├── routes/
│       │   │   │   ├── alertRoutes.js
│       │   │   │   ├── flightRoutes.js
│       │   │   │   ├── GeminiRoutes.js
│       │   │   │   ├── locationRoutes.js
│       │   │   │   └── server.js
│       │   ├── .env
│       │   ├── package-lock.json
│       │   └── package.json
│       ├── public/
│       │   └── vite.svg
│       └── src/
│           ├── assets/
│           │   └── react.svg
│           ├── components/
│           │   ├── CreateAlertModal.tsx
│           │   ├── LoadingAnimation.tsx
│           │   ├── NavButtons.tsx
│           │   └── [other components]
│           ├── config/
│           ├── models/
│           ├── pages/
│           │   ├── AlertsPage.css
│           │   ├── AlertsPage.tsx
│           │   ├── ChatPage.css
│           │   ├── ChatPage.tsx
│           │   ├── Home.css
│           │   ├── Home.tsx
│           │   ├── Schedule.css
│           │   └── Schedule.tsx
│           ├── services/
│           │   ├── alertService.ts
│           │   └── api.ts
│           ├── App.css
│           ├── App.tsx
│           ├── index.css
│           ├── main.tsx
│           └── vite-env.d.ts
├── .env
├── .eslintrc.cjs
├── .gitignore
├── .gitkeep
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Features

- **AI-Powered Travel Assistant**: Get personalized recommendations using Gemini API
- **Flight and Hotel Search**: Find and compare options using Amadeus API
- **Interactive Trip Scheduling**: Create and organize your travel itinerary
- **Price Alerts**: Monitor flight prices for the best deals
- **Traveler Reviews**: Read and contribute authentic travel experiences
- **Responsive Design**: Optimized for both desktop and mobile use

## Core Functionality

### Chat Interface
The application features a conversational AI interface powered by Gemini API, allowing users to:
- Ask for travel recommendations
- Get information about destinations and Flight/Hotel Prices
- Plan itineraries through natural language
- Receive personalized travel advice

### Travel Search
Using the Amadeus API integration, users can:
- Search for flights across multiple airlines
- Find hotel accommodations with detailed information
- Set price alerts for specific routes
- View location information and points of interest

### Schedule Management
The schedule feature enables users to:
- Create and organize daily itineraries
- Add, edit, and remove activities
- Visualize their travel timeline
- Manage trip details in one place

## Development Standards

Our codebase follows these standards:

- **TypeScript**: All frontend code uses TypeScript for type safety
- **Component Architecture**: UI is built with reusable React components
- **Modular Design**: Backend functionality is organized into controllers and routes
- **API Structure**: RESTful API principles for backend endpoints
- **Code Documentation**: Functions include purpose and parameter documentation
- **Clean Code**: No dead code or unnecessary comments
  
## Contributors

- **Muneeb Kamran** - Lead Backend Engineer & Project Coordinator
- **Mitch Brown** - Senior Backend Developer
- **Mirza Asdaf Baig** - Frontend Developer & CI/CD Specialist
- **Chris Reeder** - Frontend Architect

## License

This project is part of CMPT 276 coursework and is not licensed for commercial use.
