import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function PhotoManager({ locations, onPhotosUpdate, tripId, token, photos: photosProp }) {
  const [photos, setPhotos] = useState(photosProp || {});
  const fileInputRef = useRef(null);

  // Sync with parent photos prop when it changes
  useEffect(() => {
    if (photosProp) {
      setPhotos(photosProp);
    }
  }, [photosProp]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (!tripId) {
      alert("Please save your trip first before uploading photos");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("photos", file);
    });
    formData.append("trip_id", tripId);
    formData.append("location_name", "All Locations");

    try {
      const res = await axios.post("http://127.0.0.1:5000/api/photos/upload", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        },
      });
      
      const newPhotos = res.data.photos || [];
      const locationKey = "All Locations";
      setPhotos((prev) => {
        const updated = {
          ...prev,
          [locationKey]: [...(prev[locationKey] || []), ...newPhotos],
        };
        if (onPhotosUpdate) {
          onPhotosUpdate(updated);
        }
        return updated;
      });
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("Failed to upload photos");
    }
  };

  const deletePhoto = async (locationName, photoId) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/api/photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPhotos((prev) => {
        const updated = {
          ...prev,
          [locationName]: prev[locationName]?.filter((p) => p.id !== photoId) || [],
        };
        // Remove location key if no photos left
        if (updated[locationName] && updated[locationName].length === 0) {
          delete updated[locationName];
        }
        if (onPhotosUpdate) {
          onPhotosUpdate(updated);
        }
        return updated;
      });
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo");
    }
  };

  return (
    <div style={{ 
      background: "white", 
      borderRadius: "12px", 
      padding: "24px", 
      marginTop: "24px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>
        📸 Photo Gallery
      </h3>
      
      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "10px 20px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          Upload Photos
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
        {Object.entries(photos).map(([locationName, locationPhotos]) =>
          locationPhotos.map((photo) => (
            <div key={photo.id} style={{ position: "relative" }}>
              <img
                src={`http://127.0.0.1:5000${photo.url}`}
                alt={photo.filename}
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "8px"
                }}
              />
              <button
                onClick={() => deletePhoto("All Locations", photo.id)}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "rgba(239, 68, 68, 0.9)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

