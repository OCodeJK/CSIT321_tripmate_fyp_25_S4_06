import React, { useState } from "react";
import axios from "axios";

export default function ExportButton({ locations, photos, routeData, token, user }) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    if (Object.keys(photos || {}).length === 0) {
      alert("Please add some photos before exporting");
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/export/video",
        {
          locations: locations,
          photos: photos,
          routeData: routeData
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress(percentCompleted);
          }
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `trip-recap-${Date.now()}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert("Video exported successfully!");
    } catch (error) {
      console.error("Error exporting video:", error);
      alert("Failed to export video. Please try again.");
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      padding: "24px",
      marginTop: "24px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      textAlign: "center"
    }}>
      <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>
        🎬 Export Trip Recap {!user?.is_premium && <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: "400" }}>(Premium Only)</span>}
      </h3>
      <p style={{ marginBottom: "20px", color: "#64748b", fontSize: "14px" }}>
        Create a beautiful video slideshow of your trip with photos and route information
      </p>
      
      {isExporting && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{
            width: "100%",
            height: "8px",
            background: "#e2e8f0",
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              background: "#4f46e5",
              transition: "width 0.3s"
            }} />
          </div>
          <p style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
            Exporting... {progress}%
          </p>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={isExporting || Object.keys(photos || {}).length === 0 || !user?.is_premium}
        style={{
          padding: "12px 32px",
          background: isExporting || Object.keys(photos || {}).length === 0 || !user?.is_premium ? "#cbd5e1" : "#4f46e5",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: isExporting || Object.keys(photos || {}).length === 0 || !user?.is_premium ? "not-allowed" : "pointer",
          fontSize: "16px",
          fontWeight: "600"
        }}
      >
        {isExporting ? "Exporting..." : !user?.is_premium ? "Upgrade to Premium" : "Export to MP4"}
      </button>
    </div>
  );
}

