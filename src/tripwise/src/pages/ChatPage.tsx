import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import './ChatPage.css'
import React, { useEffect, useState } from "react";
import { fetchChatResponse, clearChat } from "../services/gemini.ts";

function ChatPage() {
    const navigate = useNavigate();
    const { feature } = useParams<{ feature: string }>();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<{ type: string, text: string }[]>([]);

    // On mount, if there's a query from Home, use it as the first user message.
    useEffect(() => {
        if (feature && query) {
            fetchChatResponse(feature, query)
                .then((response) => {
                    // Set initial messages: the home page's query and the Gemini response.
                    setMessages([{ type: "user", text: query }, { type: "gemini", text: response }]);
                })
                .catch((error) => {
                    console.error("Error fetching chat response:", error);
                    setMessages([{ type: "user", text: query }, { type: "gemini", text: "Error fetching response" }]);
                });
        }
    }, [feature, query]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

    const sendMessage = () => {
        if (inputValue.trim() && feature) {
            const userMessage = inputValue.trim();
            // Append the new user message after what is already there.
            setMessages(prev => [...prev, { type: "user", text: userMessage }]);
            // Call the backend and then append the Gemini response.
            fetchChatResponse(feature, userMessage)
                .then(response => {
                    setMessages(prev => [...prev, { type: "gemini", text: response }]);
                })
                .catch(error => {
                    console.error("Error fetching chat response:", error);
                    setMessages(prev => [...prev, { type: "gemini", text: "Error fetching response" }]);
                });
            setInputValue("");
        }
    };

    const features: string[] = ["plan", "on-the-go", "recommend", "travel", "review", "alert"];

    const handleFeatureClick = async (feature: string) => {
        setMessages([]);
        try {
            await clearChat();
            console.log("Chat cleared");
        } catch (error) {
            console.error("Error clearing chat:", error);
        }
        navigate(`/${feature}`);
    };

    const goHome = () => {
        navigate("/");
    };

    const saveChat = () => {
        // Save the chat messages to the backend.
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <button className="back-button" onClick={goHome}>←</button>
                <div className="chat-feature-buttons">
                    {features.map((btnfeature) => (
                        <button
                            key={btnfeature}
                            className={`feature-button ${btnfeature === feature ? "active" : ""}`}
                            onClick={() => handleFeatureClick(btnfeature)}
                        >
                            {btnfeature}
                        </button>
                    ))}
                </div>
            </div>

            <div className="chat-window">
                {messages.map((message, index) => (
                    <div key={index} className={`chat-message ${message.type}-message`}>
                        {message.text}
                    </div>
                ))}
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
                    />
                </div>
                <button className="chat-send-button" onClick={saveChat}>+</button>
            </div>
        </div>
    );
}

export default ChatPage;