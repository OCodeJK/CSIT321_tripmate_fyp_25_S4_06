import React from "react";

export default function Footer({ whiteText = false }) {
  return (
    <footer style={{
      width: "100%",
      padding: "clamp(24px, 5vw, 40px) clamp(16px, 4vw, 24px)",
      background: whiteText ? "transparent" : "rgba(79, 70, 229, 0.05)",
      color: whiteText ? "white" : "#475569",
      textAlign: "center",
      borderTop: whiteText ? "none" : "1px solid rgba(226, 232, 240, 0.5)",
      boxSizing: "border-box",
      marginTop: "auto"
    }}>
      <div style={{ 
        fontSize: "clamp(18px, 4vw, 20px)", 
        fontWeight: "800", 
        marginBottom: "16px", 
        color: whiteText ? "white" : "#4f46e5",
        letterSpacing: "-0.02em"
      }}>
        TripMate
      </div>
      <p style={{ fontSize: "clamp(14px, 3vw, 15px)", marginBottom: "24px", color: whiteText ? "white" : "#64748b" }}>
        Your all-in-one travel planning companion
      </p>
      <p style={{ fontSize: "clamp(12px, 2.5vw, 13px)", color: whiteText ? "rgba(255, 255, 255, 0.9)" : "#94a3b8" }}>
        © 2026 TripMate. All rights reserved.
      </p>
    </footer>
  );
}

