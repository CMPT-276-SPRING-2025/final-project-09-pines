import { useParams, useSearchParams } from "react-router-dom";
import './ChatPage.css'
import React, { useEffect, useState } from "react";
import { fetchChatResponse } from "../services/gemini.ts";

function ChatPage() {
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

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>Chat - {feature}</h2>
            </div>
            <div className="chat-window">
                {messages.map((message, index) => (
                    <div key={index} className={`chat-message ${message.type}-message`}>
                        {message.text}
                    </div>
                ))}
            </div>
            <div className="chat-input-container">
                <input 
                    type="text"
                    className="chat-input"
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />
                <button className="chat-send-button" onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}

export default ChatPage;