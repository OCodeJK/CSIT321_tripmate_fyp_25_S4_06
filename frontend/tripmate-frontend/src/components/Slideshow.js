import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "./Footer";

export default function Slideshow({ photos, onClose, onBackToTrip }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  const allPhotos = Object.entries(photos || {}).flatMap(([location, locationPhotos]) =>
    locationPhotos.map((photo) => ({ ...photo, location }))
  );

  useEffect(() => {
    if (isPlaying && allPhotos.length > 0) {
      const id = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % allPhotos.length);
      }, 3000);
      setIntervalId(id);
      return () => clearInterval(id);
    } else if (intervalId) {
      clearInterval(intervalId);
    }
  }, [isPlaying, allPhotos.length]);

  if (allPhotos.length === 0) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#f5f7fa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        minHeight: "100vh"
      }}>
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "48px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          textAlign: "center",
          maxWidth: "500px"
        }}>
          <h1 style={{ 
            fontSize: "28px", 
            fontWeight: "800", 
            marginBottom: "16px",
            color: "#2d3748",
            letterSpacing: "-0.02em"
          }}>
            End of Trip Slideshow
          </h1>
          <p style={{ 
            color: "#64748b", 
            marginBottom: "32px",
            fontSize: "15px"
          }}>
            No photos to display
          </p>
          <button
            onClick={onBackToTrip || onClose}
            style={{
              padding: "12px 32px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4338ca";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Back to Trip Planner
          </button>
        </div>
        
        {/* Footer */}
        <footer style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "40px 24px",
          background: "rgba(79, 70, 229, 0.05)",
          color: "#475569",
          textAlign: "center",
          borderTop: "1px solid rgba(226, 232, 240, 0.5)"
        }}>
          <div style={{ 
            fontSize: "20px", 
            fontWeight: "800", 
            marginBottom: "16px", 
            color: "#4f46e5",
            letterSpacing: "-0.02em"
          }}>
            TripMate
          </div>
          <p style={{ fontSize: "15px", marginBottom: "24px", color: "#64748b" }}>
            Your all-in-one travel planning companion
          </p>
          <p style={{ fontSize: "13px", color: "#94a3b8" }}>
            © 2026 TripMate. All rights reserved.
          </p>
        </footer>
      </div>
    );
  }

  const currentPhoto = allPhotos[currentIndex];

  const handleShare = () => {
    // Share functionality - can be implemented later
    alert("Share to Social Media feature coming soon!");
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "#f5f7fa",
      display: "flex",
      flexDirection: "column",
      zIndex: 1000,
      minHeight: "100vh",
      overflow: "auto"
    }}>
      {/* Header */}
      <div style={{
        background: "white",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        borderBottom: "1px solid rgba(226, 232, 240, 0.5)"
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "800",
            color: "#2d3748",
            letterSpacing: "-0.02em",
            margin: 0
          }}>
            End of Trip Slideshow
          </h1>
          <div style={{
            fontSize: "14px",
            color: "#64748b",
            fontWeight: "500"
          }}>
            {currentIndex + 1} / {allPhotos.length}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        maxWidth: "1400px",
        margin: "0 auto",
        width: "100%",
        position: "relative"
      }}>
        {/* Left Navigation Arrow */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)}
          style={{
            position: "absolute",
            left: "24px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "white",
            color: "#4f46e5",
            border: "2px solid #e2e8f0",
            borderRadius: "12px",
            width: "56px",
            height: "56px",
            cursor: "pointer",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#4f46e5";
            e.currentTarget.style.color = "white";
            e.currentTarget.style.borderColor = "#4f46e5";
            e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.color = "#4f46e5";
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
          }}
        >
          ‹
        </button>

        {/* Central Display Area */}
        <div style={{
          width: "100%",
          maxWidth: "900px",
          height: "600px",
          background: "#1e293b",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          margin: "0 100px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          overflow: "hidden"
        }}>
          {isPlaying ? (
            <img
              src={`http://127.0.0.1:5000${currentPhoto.url}`}
              alt={currentPhoto.filename}
              onClick={() => setIsPlaying(false)}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                cursor: "pointer"
              }}
            />
          ) : (
            <button
              onClick={() => setIsPlaying(true)}
              style={{
                background: "white",
                border: "none",
                borderRadius: "50%",
                width: "80px",
                height: "80px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                color: "#4f46e5",
                zIndex: 10,
                paddingLeft: "4px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.background = "#4f46e5";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color = "#4f46e5";
              }}
            >
              ▶
            </button>
          )}
        </div>

        {/* Right Navigation Arrow */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % allPhotos.length)}
          style={{
            position: "absolute",
            right: "24px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "white",
            color: "#4f46e5",
            border: "2px solid #e2e8f0",
            borderRadius: "12px",
            width: "56px",
            height: "56px",
            cursor: "pointer",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#4f46e5";
            e.currentTarget.style.color = "white";
            e.currentTarget.style.borderColor = "#4f46e5";
            e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.color = "#4f46e5";
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
          }}
        >
          ›
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{
        padding: "24px",
        maxWidth: "1400px",
        margin: "0 auto",
        width: "100%"
      }}>
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <button
            onClick={handleShare}
            style={{
              padding: "12px 32px",
              background: "white",
              color: "#4f46e5",
              border: "2px solid #4f46e5",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.color = "white";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.color = "#4f46e5";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Share to Social Media
          </button>
          <button
            onClick={onBackToTrip || onClose}
            style={{
              padding: "12px 32px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4338ca";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Back to Trip Planner
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

