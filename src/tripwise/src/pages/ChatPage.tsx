import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import './ChatPage.css'
import React, { useEffect, useState, useRef } from "react";
import { fetchChatResponse, clearChat } from "../services/gemini.ts";
import ReactMarkdown from "react-markdown";
import { Components } from "react-markdown";

function ChatPage() {
    const navigate = useNavigate();
    const { feature } = useParams<{ feature: string }>();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<{ type: string, text: string }[]>([]);
    const [location, setLocation] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingHotel, setProcessingHotel] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const features: string[] = ["plan", "on-the-go", "recommend", "travel", "review", "alert"];

    // Function to extract hotel names from previous messages
    const extractHotelsFromMessages = (messages: { type: string, text: string }[]): string[] => {
        const hotelMentions: string[] = [];
        
        // Look through bot messages for hotel mentions
        messages.forEach(message => {
            if (message.type === "gemini") {
                // Simple regex to find hotel names - can be improved
                const hotelMatches = message.text.match(/(?:hotel|Hotel|HOTEL)\s[A-Za-z\s\d]+/gi);
                if (hotelMatches) {
                    hotelMatches.forEach(match => {
                        const hotelName = match.replace(/(?:hotel|Hotel|HOTEL)\s/i, '').trim();
                        if (hotelName && !hotelMentions.includes(hotelName)) {
                            hotelMentions.push(hotelName);
                        }
                    });
                }
            }
        });
        
        return hotelMentions;
    };

    // Scroll to bottom of messages whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Request user's current location on mount.
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
                    setLocation(coords);
                    console.log("User location:", coords);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setLocation("Unknown");
                }
            );
        } else {
            console.error("Geolocation is not supported by this browser.");
            setLocation("Not supported");
        }
    }, []);

    // On mount, if there's a query from Home, use it as the first user message.
    useEffect(() => {
        if (feature && query) {
            setIsProcessing(true);
            // Append the user's location into the query.
            const promptWithLocation = `User location: ${location || "unknown"}\n${query}`;
            fetchChatResponse(feature, promptWithLocation)
                .then((response) => {
                    // Set initial messages: the home page's query and the Gemini response.
                    setMessages([{ type: "user", text: query }, { type: "gemini", text: response }]);
                    setIsProcessing(false);
                })
                .catch((error) => {
                    console.error("Error fetching chat response:", error);
                    setMessages([{ type: "user", text: query }, { type: "gemini", text: "Error fetching response" }]);
                    setIsProcessing(false);
                });
        } else if (feature && !query) {
            // Display a welcome message for the feature
            let welcomeMessage = "";
            
            switch (feature) {
                case "plan":
                    welcomeMessage = "Hi there! I'm your travel planning assistant. What trip would you like to plan?";
                    break;
                case "on-the-go":
                    welcomeMessage = "Need help while traveling? I can provide real-time assistance with translations, directions, and local recommendations.";
                    break;
                case "recommend":
                    welcomeMessage = "Looking for travel recommendations? Tell me your preferences and I'll suggest destinations, activities, and experiences.";
                    break;
                case "travel":
                    welcomeMessage = "Ready to book your travel? I can help you find flights, hotels, and packages. Where would you like to go?";
                    break;
                case "review":
                    welcomeMessage = "Looking for travel reviews? I can help you find information about hotels, restaurants, and attractions. What would you like to know about?";
                    break;
                case "alert":
                    welcomeMessage = "I can keep you updated on travel alerts and changes. What would you like to be notified about?";
                    break;
                default:
                    welcomeMessage = "Hello! How can I assist with your travel needs today?";
            }
            
            setMessages([{ type: "gemini", text: welcomeMessage }]);
        }
    }, [feature, query, location]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    };

    const handleSendMessage = () => {
        if (inputValue.trim() && feature && !isProcessing) {
            sendMessage(inputValue.trim());
            setInputValue("");
        }
    };

    const sendMessage = (userMessage: string) => {
        if (userMessage && feature) {
            setIsProcessing(true);
            // Append location information to the query prompt.
            const promptWithLocation = `User location: ${location || "unknown"}\n${userMessage}`;
            setMessages(prev => [...prev, { type: "user", text: userMessage }]);
            
            // Add a small delay before sending to ensure UI updates
            setTimeout(() => {
                fetchChatResponse(feature, promptWithLocation)
                    .then(response => {
                        setMessages(prev => [...prev, { type: "gemini", text: response }]);
                        setIsProcessing(false);
                        setProcessingHotel(null);
                    })
                    .catch(error => {
                        console.error("Error fetching chat response:", error);
                        setMessages(prev => [...prev, { type: "gemini", text: "Error fetching response" }]);
                        setIsProcessing(false);
                        setProcessingHotel(null);
                    });
            }, 100);
        }
    };

    const requestHotelReview = ({ name, id }: { name: string, id: string }) => {
        setProcessingHotel(id);
        
        if (feature === "review") {
            const reviewQuery = `Can you provide reviews for hotel ID: ${id}`;
            sendMessage(reviewQuery);
        } else {
            // First show that we're processing the request
            setIsProcessing(true);
            
            handleFeatureClick("review").then(() => {
                // Wait a bit longer to ensure feature change is complete
                setTimeout(() => {
                    const reviewQuery = `Can you provide reviews for hotel ID: ${id}`;
                    sendMessage(reviewQuery);
                }, 1000); // Increased timeout to 1000ms
            });
        }
    };

    const handleFeatureClick = async (newFeature: string) => {
        setIsProcessing(true);
        
        try {

            // Only after clearing, reset messages
            setMessages([]);
            
            // If switching to review feature, check for hotel mentions in previous messages
            if (newFeature === "review" && feature !== "review") {
                const recentHotels = extractHotelsFromMessages(messages);
                
                // If we found hotels, suggest them for review
                if (recentHotels.length > 0) {
                    setTimeout(() => {
                        setMessages([{ 
                            type: "gemini", 
                            text: `I see you were looking at ${recentHotels.join(', ')}. Would you like to see reviews for any of these hotels?` 
                        }]);
                        setIsProcessing(false);
                    }, 300);
                } else {
                    setTimeout(() => {
                        setMessages([{ 
                            type: "gemini", 
                            text: "What hotel or destination would you like to read reviews about?" 
                        }]);
                        setIsProcessing(false);
                    }, 300);
                }
            } else {
                // For other features, show a welcome message
                let welcomeMessage = "";
                
                switch (newFeature) {
                    case "plan":
                        welcomeMessage = "Hi there! I'm your travel planning assistant. What trip would you like to plan?";
                        break;
                    case "on-the-go":
                        welcomeMessage = "Need help while traveling? I can provide real-time assistance with translations, directions, and local recommendations.";
                        break;
                    case "recommend":
                        welcomeMessage = "Looking for travel recommendations? Tell me your preferences and I'll suggest destinations, activities, and experiences.";
                        break;
                    case "travel":
                        welcomeMessage = "Ready to book your travel? I can help you find flights, hotels, and packages. Where would you like to go?";
                        break;
                    case "review":
                        welcomeMessage = "Looking for travel reviews? I can help you find information about hotels, restaurants, and attractions. What would you like to know about?";
                        break;
                    case "alert":
                        welcomeMessage = "I can keep you updated on travel alerts and changes. What would you like to be notified about?";
                        break;
                    default:
                        welcomeMessage = "Hello! How can I assist with your travel needs today?";
                }
                
                setTimeout(() => {
                    setMessages([{ type: "gemini", text: welcomeMessage }]);
                    setIsProcessing(false);
                }, 300);
            }
            
            // Navigate to the new feature
            navigate(`/${newFeature}`);
            
        } catch (error) {
            console.error("Error during feature switch:", error);
            setIsProcessing(false);
        }
        
        return Promise.resolve(); // Return a promise for chaining
    };

    const goHome = () => {
        navigate("/");
    };

    // Handle clicks on hotel links in messages
    const handleHotelLinkClick = (hotelId: string, hotelName: string) => {
        requestHotelReview({ name: hotelName, id: hotelId });
    };

    const saveChat = () => {
        // Just a placeholder for now
        alert("This feature will save your chat history in a future update!");
    };

    // Create properly typed markdown components
    const markdownComponents: Components = {
        a: ({ node, children, href, ...props }: any) => {
            // Handle hotel ID links specially
            if (href?.startsWith('#hotelId=')) {
                const hotelId = href.replace('#hotelId=', '');
                const hotelName = String(children || 'Hotel');
                const isProcessingThisHotel = processingHotel === hotelId;
                
                return (
                    <button 
                        className={`hotel-link ${isProcessingThisHotel ? 'processing' : ''}`}
                        onClick={() => handleHotelLinkClick(hotelId, hotelName)}
                        type="button"
                        disabled={isProcessing || isProcessingThisHotel}
                    >
                        {isProcessingThisHotel ? 'Loading...' : children}
                    </button>
                );
            }
            return <a href={href} {...props}>{children}</a>;
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <button className="back-button" onClick={goHome}>←</button>
                <div className="chat-feature-buttons">
                    {features.map((btnfeature) => (
                        <button
                            key={btnfeature}
                            className={`nav-button ${btnfeature === feature ? "active" : ""}`}
                            onClick={() => handleFeatureClick(btnfeature)}
                            disabled={isProcessing}
                        >
                            {btnfeature}
                        </button>
                    ))}
                </div>
            </div>

            <div className="chat-window">
                {messages.length === 0 && !isProcessing && (
                    <div className="empty-state">
                        <p>No messages yet. Type something to start chatting!</p>
                    </div>
                )}
                
                {messages.map((message, index) => (
                    <div key={index} className={`chat-message ${message.type}-message`}>
                        <ReactMarkdown components={markdownComponents}>
                            {message.text}
                        </ReactMarkdown>
                    </div>
                ))}
                
                {isProcessing && (
                    <div className="chat-message gemini-message">
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input-row">
                <div className="chat-input-box">
                    <input 
                        type="text"
                        className="chat-input"
                        placeholder="Type a message..."
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={isProcessing}
                    />
                </div>
                <button 
                    className="chat-send-button" 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isProcessing}
                >
                    ➤
                </button>
                <button 
                    className="chat-save-button" 
                    onClick={saveChat}
                    disabled={messages.length === 0 || isProcessing}
                >
                    +
                </button>
            </div>
        </div>
    );
}

export default ChatPage;