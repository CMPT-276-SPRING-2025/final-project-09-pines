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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const features: string[] = ["plan", "on-the-go", "recommend", "travel", "review",];
    const hasFetchedInitialRequest = useRef(false);
    const hasInitializedFeature = useRef<string | null>(null);

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

    // Get the welcome message for a given feature
    const getWelcomeMessage = (featureType: string) => {
        switch (featureType) {
            case "plan":
                return "Hi there! I'm your travel planning assistant. What trip would you like to plan?";
            case "on-the-go":
                return "Need help while traveling? I can provide real-time assistance with translations, directions, and local recommendations.";
            case "recommend":
                return "Looking for travel recommendations? Tell me your preferences and I'll suggest destinations, activities, and experiences.";
            case "travel":
                return "Ready to book your travel? I can help you find flights, hotels, and packages. Where would you like to go?";
            case "review":
                return "Looking for travel reviews? I can help you find information about hotels, restaurants, and attractions. What would you like to know about?";
            case "alert":
                return "I can keep you updated on travel alerts and changes. What would you like to be notified about?";
            default:
                return "Hello! How can I assist with your travel needs today?";
        }
    };

    // Load chat history from localStorage on component mount or feature change
    useEffect(() => {
        if (!feature) return;
        
        // Check if we're switching to a different feature
        if (hasInitializedFeature.current !== feature) {
            // Try to load stored messages
            const storedMessages = localStorage.getItem(`chatHistory-${feature}`);
            let parsedMessages: { type: string, text: string }[] = [];
            
            if (storedMessages) {
                try {
                    parsedMessages = JSON.parse(storedMessages);
                    // If we have stored messages, use them
                    if (parsedMessages.length > 0) {
                        setMessages(parsedMessages);
                        hasInitializedFeature.current = feature;
                        return;
                    }
                } catch (e) {
                    console.error("Error parsing stored messages:", e);
                }
            }
            
            // No stored messages or error parsing, so use welcome message
            setMessages([{ type: "gemini", text: getWelcomeMessage(feature) }]);
            hasInitializedFeature.current = feature;
        }
    }, [feature]);

    // Save chat history to localStorage whenever messages change
    useEffect(() => {
        if (feature && messages.length > 0) {
            localStorage.setItem(`chatHistory-${feature}`, JSON.stringify(messages));
        }
    }, [messages, feature]);

    // On mount, if there's a query from Home, use it as the first user message.
    useEffect(() => {
        if (feature && query && !hasFetchedInitialRequest.current) {
            hasFetchedInitialRequest.current = true;
            setIsProcessing(true);
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
                    })
                    .catch(error => {
                        console.error("Error fetching chat response:", error);
                        setMessages(prev => [...prev, { type: "gemini", text: "Error fetching response" }]);
                        setIsProcessing(false);
                    });
            }, 100);
        }
    };

    const handleFeatureClick = async (newFeature: string) => {
        if (newFeature === feature) return; // No need to switch if already on this feature
        
        setIsProcessing(true);
        
        // Save current messages before switching
        if (feature && messages.length > 0) {
            localStorage.setItem(`chatHistory-${feature}`, JSON.stringify(messages));
        }
        
        // Reset the initialization flag so the useEffect will handle loading messages
        hasInitializedFeature.current = null;
        
        // Navigate to the new feature - this will trigger the useEffect to load messages
        navigate(`/${newFeature}`);
        setIsProcessing(false);
        
        return Promise.resolve(); // Return a promise for chaining
    };

    const goHome = () => {
        const confirmLeave = window.confirm(
            "Warning: Going back will erase the current travel planning session. Are you sure?"
        );

        if (confirmLeave) {
            // Clear localStorage for all feature chats
            features.forEach(feat => {
                localStorage.removeItem(`chatHistory-${feat}`);
            });

            // Reset all state
            setMessages([]);
            hasInitializedFeature.current = null;
            hasFetchedInitialRequest.current = false;

            // Clear the backend chat history
            clearChat()
                .then(() => console.log("Backend chat history cleared"))
                .catch(error => console.error("Error clearing backend chat history:", error));

            // Navigate to home page
            navigate("/");
        }
    };

    const saveChat = () => {
        // Just a placeholder for now
        alert("This feature will save your chat history in a future update!");
    };

    // Create properly typed markdown components
    const markdownComponents: Components = {
        a: ({ children, href, ...props }: {
            children?: React.ReactNode;
            href?: string | null;
        }) => {
            return <a href={href || undefined} {...props}>{children}</a>;
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