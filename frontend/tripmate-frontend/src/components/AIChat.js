import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function AIChat({ locations, photos, token, user, tripId }) {
  // Extract destination from locations (first is origin, rest are destinations)
  const getDestinationMessage = () => {
    if (!locations || locations.length === 0) {
      return "Hi! I can answer questions about the places you've visited on your trip. What would you like to know?";
    }
    
    const destinationNames = locations.length > 1 
      ? locations.slice(1).map(loc => loc.name).filter(Boolean)
      : locations.map(loc => loc.name).filter(Boolean);
    
    if (destinationNames.length > 0) {
      const destinationsStr = destinationNames.join(" and ");
      return `Hi! I can help you with your trip to ${destinationsStr}. What would you like to know?`;
    }
    
    return "Hi! I can answer questions about the places you've visited on your trip. What would you like to know?";
  };

  const [messages, setMessages] = useState([
    { role: "assistant", content: getDestinationMessage() }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await axios.post("http://127.0.0.1:5000/api/ai/chat", {
          message: input,
          locations: locations,
          photos: photos,
          trip_id: tripId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMessages((prev) => [...prev, { role: "assistant", content: res.data.response }]);
        // Increment question count for free users
        if (!user?.is_premium) {
          setQuestionsUsed(prev => prev + 1);
        }
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Sorry, I encountered an error. Please try again.";
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      padding: "24px",
      marginTop: "24px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      display: "flex",
      flexDirection: "column",
      height: "500px"
    }}>
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>
          🤖 Ask About Your Trip
        </h3>
        {!user?.is_premium && tripId && (
          <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: "500", background: "#fef3c7", padding: "4px 8px", borderRadius: "6px" }}>
            Free: {questionsUsed}/5 questions used
          </span>
        )}
        {user?.is_premium && (
          <span style={{ fontSize: "12px", color: "#4f46e5", fontWeight: "500", background: "#e0e7ff", padding: "4px 8px", borderRadius: "6px" }}>
            Premium: Unlimited
          </span>
        )}
      </div>
      
      <div style={{
        flex: 1,
        overflowY: "auto",
        marginBottom: "16px",
        padding: "12px",
        background: "#f8fafc",
        borderRadius: "8px"
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "12px",
              textAlign: msg.role === "user" ? "right" : "left"
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "10px 16px",
                borderRadius: "12px",
                background: msg.role === "user" ? "#4f46e5" : "#e2e8f0",
                color: msg.role === "user" ? "white" : "#2d3748",
                maxWidth: "70%",
                fontSize: "14px",
                lineHeight: "1.5"
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ textAlign: "left", color: "#64748b", fontSize: "14px" }}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about your trip..."
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "14px"
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          style={{
            padding: "12px 24px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

