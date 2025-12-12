import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Slideshow({ photos, onClose }) {
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
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}>
        <div style={{ color: "white", textAlign: "center" }}>
          <p>No photos to display</p>
          <button
            onClick={onClose}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentPhoto = allPhotos[currentIndex];

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.95)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(255,255,255,0.2)",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "10px 20px",
          cursor: "pointer",
          fontSize: "16px"
        }}
      >
        ✕ Close
      </button>

      <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "80vh" }}>
        <img
          src={`http://127.0.0.1:5000${currentPhoto.url}`}
          alt={currentPhoto.filename}
          style={{
            maxWidth: "100%",
            maxHeight: "80vh",
            objectFit: "contain",
            borderRadius: "8px"
          }}
        />
        <div style={{
          position: "absolute",
          bottom: "-40px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "white",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "14px", marginBottom: "4px" }}>
            {currentPhoto.location}
          </div>
          <div style={{ fontSize: "12px", opacity: 0.8 }}>
            {currentIndex + 1} / {allPhotos.length}
          </div>
        </div>
      </div>

      <div style={{
        position: "absolute",
        bottom: "40px",
        display: "flex",
        gap: "12px",
        alignItems: "center"
      }}>
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)}
          style={{
            background: "rgba(255,255,255,0.2)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 20px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          ← Prev
        </button>
        
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: isPlaying ? "#ef4444" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600"
          }}
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % allPhotos.length)}
          style={{
            background: "rgba(255,255,255,0.2)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 20px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

