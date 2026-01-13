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
    setProgress(10);

    try {
      setProgress(20);
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
          timeout: 300000, // 5 minutes timeout for video processing
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                20 + (progressEvent.loaded * 80) / progressEvent.total
              );
              setProgress(percentCompleted);
            } else {
              setProgress(50); // Indeterminate progress
            }
          }
        }
      );

      setProgress(90);
      
      // Check if response is an error (check content type)
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.error || "Export failed");
      }
      
      // Verify it's actually a video file
      if (!contentType.includes('video') && !contentType.includes('application/octet-stream')) {
        const text = await response.data.text();
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Export failed");
        } catch {
          throw new Error("Invalid response from server");
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      const tripName = routeData?.optimizedRoute?.[0]?.name || "trip";
      link.setAttribute("download", `${tripName}-recap-${Date.now()}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setProgress(100);
      setTimeout(() => {
        alert("Video exported successfully! Check your downloads folder.");
      }, 500);
    } catch (error) {
      console.error("Error exporting video:", error);
      let errorMessage = "Failed to export video. ";
      if (error.response?.data) {
        // Try to read error message from blob
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage += errorData.error || "";
          } catch {
            errorMessage += "Please try again.";
          }
        } else {
          errorMessage += error.response.data.error || "Please try again.";
        }
      } else {
        errorMessage += error.message || "Please try again.";
      }
      alert(errorMessage);
    } finally {
      setIsExporting(false);
      setTimeout(() => setProgress(0), 2000);
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

