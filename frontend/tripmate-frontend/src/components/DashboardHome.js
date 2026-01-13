import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "./Footer";

export default function DashboardHome({ token, user, onCreateNew, onNavigateToTrips }) {
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadRecentTrips = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/trips/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Get the 3 most recent trips
      const sorted = res.data.trips.sort((a, b) => {
        const dateA = new Date(a.created_at || a.updated_at || 0);
        const dateB = new Date(b.created_at || b.updated_at || 0);
        return dateB - dateA;
      });
      setRecentTrips(sorted.slice(0, 3));
    } catch (err) {
      console.error("Error loading trips:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "clamp(24px, 5vw, 40px) clamp(16px, 4vw, 24px)", background: "#f8fafc", flex: "1", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "56px" }}>
        <h1 style={{
          fontSize: "clamp(32px, 5vw, 48px)",
          fontWeight: "800",
          color: "#0f172a",
          marginBottom: "16px",
          letterSpacing: "-0.03em",
          lineHeight: "1.1"
        }}>
          Welcome back, {user.full_name || user.username}! 👋
        </h1>
        <p style={{
          fontSize: "clamp(16px, 3vw, 18px)",
          color: "#64748b",
          fontWeight: "400",
          lineHeight: "1.6"
        }}>
          Here's an overview of your travel plans and recent activity
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "clamp(16px, 3vw, 24px)",
        marginBottom: "clamp(32px, 6vw, 64px)"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "20px",
          padding: "clamp(24px, 5vw, 40px)",
          boxShadow: "0 10px 40px rgba(102, 126, 234, 0.25)",
          border: "none",
          color: "white",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.3s ease"
        }}
        onClick={() => onCreateNew()}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 16px 48px rgba(102, 126, 234, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 10px 40px rgba(102, 126, 234, 0.25)";
        }}
        >
          <div style={{
            fontSize: "48px",
            marginBottom: "20px",
            opacity: "0.9"
          }}>
            🗺️
          </div>
          <h3 style={{
            fontSize: "clamp(20px, 4vw, 24px)",
            fontWeight: "700",
            color: "white",
            marginBottom: "12px",
            letterSpacing: "-0.01em"
          }}>
            Plan Your Trip
          </h3>
          <p style={{
            fontSize: "clamp(14px, 2.5vw, 15px)",
            color: "rgba(255, 255, 255, 0.9)",
            marginBottom: "24px",
            lineHeight: "1.6"
          }}>
            Create a new trip and start planning your adventure
          </p>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "600",
            border: "1px solid rgba(255, 255, 255, 0.3)"
          }}>
            Get Started →
          </div>
        </div>

        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "clamp(24px, 5vw, 40px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
          transition: "all 0.3s ease",
          cursor: "pointer"
        }}
        onClick={() => onCreateNew()}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)";
          e.currentTarget.style.borderColor = "#cbd5e1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
          e.currentTarget.style.borderColor = "#e2e8f0";
        }}
        >
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            marginBottom: "24px"
          }}>
            📸
          </div>
          <h3 style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "#0f172a",
            marginBottom: "12px",
            letterSpacing: "-0.01em"
          }}>
            Your Memories
          </h3>
          <p style={{
            fontSize: "15px",
            color: "#64748b",
            marginBottom: "24px",
            lineHeight: "1.6"
          }}>
            View and manage your trip photos
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigateToTrips(); }}
            style={{
              padding: "12px 24px",
              background: "transparent",
              color: "#4f46e5",
              border: "2px solid #4f46e5",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#4f46e5";
            }}
          >
            View Photos
          </button>
        </div>

        {!!user.is_premium && (
          <div style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
            borderRadius: "20px",
            padding: "clamp(24px, 5vw, 40px)",
            boxShadow: "0 10px 40px rgba(251, 191, 36, 0.25)",
            border: "none",
            color: "white",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              marginBottom: "24px"
            }}>
              ⭐
            </div>
            <h3 style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "white",
              marginBottom: "12px",
              letterSpacing: "-0.01em"
            }}>
              Premium Features
            </h3>
            <p style={{
              fontSize: "15px",
              color: "rgba(255, 255, 255, 0.95)",
              marginBottom: "24px",
              lineHeight: "1.6"
            }}>
              Access AI chat and video exports
            </p>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              fontSize: "13px",
              color: "white",
              fontWeight: "700",
              border: "1px solid rgba(255, 255, 255, 0.3)"
            }}>
              ✓ Premium Active
            </div>
          </div>
        )}
      </div>

      {!loading && recentTrips.length > 0 && (
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px"
          }}>
            <h2 style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#0f172a",
              letterSpacing: "-0.02em"
            }}>
              Recent Trips
            </h2>
            <button
              onClick={() => onNavigateToTrips && onNavigateToTrips()}
              style={{
                padding: "10px 20px",
                background: "transparent",
                color: "#4f46e5",
                border: "none",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#4338ca";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#4f46e5";
              }}
            >
              View All <span>→</span>
            </button>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "24px"
          }}>
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => onCreateNew(trip.id)}
                style={{
                  background: "white",
                  borderRadius: "20px",
                  padding: "32px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <h3 style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#0f172a",
                  marginBottom: "16px",
                  letterSpacing: "-0.01em"
                }}>
                  {trip.name}
                </h3>
                {trip.origin && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px"
                  }}>
                    <span style={{ fontSize: "14px", color: "#94a3b8" }}>📍</span>
                    <p style={{
                      fontSize: "15px",
                      color: "#475569",
                      margin: 0
                    }}>
                      <span style={{ fontWeight: "600", color: "#64748b" }}>From:</span> {trip.origin.name || "Unknown"}
                    </p>
                  </div>
                )}
                {trip.destinations && trip.destinations.length > 0 && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px"
                  }}>
                    <span style={{ fontSize: "14px", color: "#94a3b8" }}>✈️</span>
                    <p style={{
                      fontSize: "15px",
                      color: "#475569",
                      margin: 0
                    }}>
                      <span style={{ fontWeight: "600", color: "#64748b" }}>To:</span> {trip.destinations.map(d => d.name).filter(Boolean).join(", ") || "Unknown"}
                    </p>
                  </div>
                )}
                {trip.end_date && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    background: "#f1f5f9",
                    color: "#64748b",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}>
                    <span>✓</span> Completed
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
      <Footer />
    </div>
  );
}

