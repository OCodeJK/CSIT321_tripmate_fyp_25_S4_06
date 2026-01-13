import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Footer from "./Footer";

export default function TripList({ token, onCreateNew }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [filter, setFilter] = useState("all"); // "all", "ongoing", "past"
  const menuRefs = useRef({});

  const loadTrips = useCallback(async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/trips/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips(res.data.trips);
    } catch (err) {
      console.error("Error loading trips:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);


  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadTrips();
      return;
    }

    try {
      const res = await axios.get(
        `http://127.0.0.1:5000/api/trips/search?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrips(res.data.trips);
    } catch (err) {
      console.error("Error searching trips:", err);
    }
  };

  const deleteTrip = async (tripId) => {
    if (!window.confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
      return;
    }
    try {
      await axios.delete(`http://127.0.0.1:5000/api/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Reload trips after deletion
      loadTrips();
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error deleting trip:", err);
      alert("Failed to delete trip. Please try again.");
    }
  };

  const duplicateTrip = async (trip) => {
    try {
      const tripData = {
        name: `${trip.name} (Copy)`,
        description: trip.description || "",
        origin: trip.origin,
        destinations: trip.destinations || [],
        optimized_route: trip.optimized_route || [],
        total_distance_km: trip.total_distance_km,
        route_mode: trip.route_mode || "DRIVING",
        travel_preference: trip.travel_preference || "auto",
        budget: trip.budget
      };

      await axios.post("http://127.0.0.1:5000/api/trips/", tripData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      loadTrips();
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error duplicating trip:", err);
      alert("Failed to duplicate trip. Please try again.");
    }
  };

  const startTripAgain = async (tripId) => {
    try {
      await axios.put(`http://127.0.0.1:5000/api/trips/${tripId}`, {
        end_date: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadTrips();
      setOpenMenuId(null);
      alert("Trip started again successfully!");
    } catch (err) {
      console.error("Error starting trip again:", err);
      alert("Failed to start trip again. Please try again.");
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>
        Loading trips...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: "1600px", width: "100%", margin: "0 auto", padding: "clamp(16px, 4vw, 32px)", flex: "1", display: "flex", flexDirection: "column" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "40px"
      }}>
        <h1 style={{ 
          fontSize: "28px", 
          fontWeight: "800", 
          color: "#0f172a",
          letterSpacing: "-0.02em",
          margin: 0
        }}>
          My Trips
        </h1>
        <button
          onClick={onCreateNew}
          style={{
            padding: "10px 20px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
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
          + New Trip
        </button>
      </div>

      <div style={{ marginBottom: "32px", display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search trips..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            fontSize: "14px",
            background: "white",
            transition: "all 0.2s ease"
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15, 23, 42, 0.05)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "10px 16px",
              background: filter === "all" ? "#4f46e5" : "white",
              color: filter === "all" ? "white" : "#64748b",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (filter !== "all") {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== "all") {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter("ongoing")}
            style={{
              padding: "10px 16px",
              background: filter === "ongoing" ? "#4f46e5" : "white",
              color: filter === "ongoing" ? "white" : "#64748b",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (filter !== "ongoing") {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== "ongoing") {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }
            }}
          >
            Ongoing
          </button>
          <button
            onClick={() => setFilter("past")}
            style={{
              padding: "10px 16px",
              background: filter === "past" ? "#4f46e5" : "white",
              color: filter === "past" ? "white" : "#64748b",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (filter !== "past") {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== "past") {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }
            }}
          >
            Past
          </button>
        </div>
      </div>

      {trips.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "80px 20px",
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <p style={{ fontSize: "18px", color: "#64748b", marginBottom: "24px" }}>
            {searchQuery ? "No trips match your search" : "You haven't created any trips yet"}
          </p>
          <button
            onClick={onCreateNew}
            style={{
              padding: "12px 32px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Create Your First Trip
          </button>
        </div>
      ) : (() => {
        const ongoingTrips = trips.filter(trip => !trip.end_date);
        const pastTrips = trips.filter(trip => trip.end_date);
        
        const showOngoing = filter === "all" || filter === "ongoing";
        const showPast = filter === "all" || filter === "past";
        
        return (
          <>
            {showOngoing && ongoingTrips.length > 0 && (
              <>
                {filter === "all" && (
                  <h2 style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#475569",
                    marginBottom: "20px",
                    marginTop: "0"
                  }}>
                    Ongoing
                  </h2>
                )}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
                  gap: "clamp(20px, 3vw, 32px)",
                  marginBottom: showOngoing && showPast && ongoingTrips.length > 0 && pastTrips.length > 0 ? "48px" : "0"
                }}>
                  {ongoingTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      onCreateNew={onCreateNew}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      menuRefs={menuRefs}
                      duplicateTrip={duplicateTrip}
                      startTripAgain={startTripAgain}
                      deleteTrip={deleteTrip}
                    />
                  ))}
                </div>
              </>
            )}
            {showPast && pastTrips.length > 0 && (
              <>
                {showOngoing && ongoingTrips.length > 0 && filter === "all" && (
                  <div style={{
                    height: "1px",
                    background: "#e2e8f0",
                    marginBottom: "32px",
                    marginTop: "16px"
                  }} />
                )}
                {filter === "all" && (
                  <h2 style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#475569",
                    marginBottom: "20px",
                    marginTop: "0"
                  }}>
                    Past
                  </h2>
                )}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
                  gap: "clamp(20px, 3vw, 32px)"
                }}>
                  {pastTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      onCreateNew={onCreateNew}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      menuRefs={menuRefs}
                      duplicateTrip={duplicateTrip}
                      startTripAgain={startTripAgain}
                      deleteTrip={deleteTrip}
                    />
                  ))}
                </div>
              </>
            )}
            {filter === "ongoing" && ongoingTrips.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "white",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <p style={{ fontSize: "16px", color: "#64748b" }}>
                  No ongoing trips
                </p>
              </div>
            )}
            {filter === "past" && pastTrips.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "white",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <p style={{ fontSize: "16px", color: "#64748b" }}>
                  No past trips
                </p>
              </div>
            )}
          </>
        );
      })()}
      </div>
      <Footer />
    </div>
  );
}

function TripCard({ trip, onCreateNew, openMenuId, setOpenMenuId, menuRefs, duplicateTrip, startTripAgain, deleteTrip }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "40px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        transition: "all 0.2s ease",
        position: "relative",
        border: "1px solid #f1f5f9"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = "#f1f5f9";
      }}
    >
      <div
        onClick={() => onCreateNew(trip.id)}
        style={{
          cursor: "pointer"
        }}
      >
        <h3 style={{
            fontSize: "28px",
            fontWeight: "700",
            marginBottom: "20px",
            color: "#0f172a",
            letterSpacing: "-0.01em"
        }}>
          {trip.name}
        </h3>
          <div style={{ 
            fontSize: "17px",
            color: "#64748b",
            marginTop: "16px",
            lineHeight: "1.8"
          }}>
            {trip.origin && (
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontWeight: "600", color: "#475569", fontSize: "18px" }}>From:</span> <span style={{ fontSize: "17px" }}>{trip.origin.name || "Unknown"}</span>
              </div>
            )}
            {trip.destinations && trip.destinations.length > 0 && (
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontWeight: "600", color: "#475569", fontSize: "18px" }}>To:</span> <span style={{ fontSize: "17px" }}>{trip.destinations.map(d => d.name).filter(Boolean).join(", ") || "Unknown"}</span>
              </div>
            )}
            {trip.start_date && (
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontWeight: "600", color: "#475569", fontSize: "18px" }}>Start Date:</span> <span style={{ fontSize: "17px" }}>{new Date(trip.start_date).toLocaleDateString()}</span>
              </div>
            )}
            {trip.end_date && (
              <div style={{
                display: "inline-block",
                marginTop: "12px",
                padding: "6px 14px",
                background: "#f1f5f9",
                color: "#64748b",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600"
              }}>
                ✓ Ended
              </div>
            )}
          </div>
        </div>
        <div
          ref={(el) => (menuRefs.current[trip.id] = el)}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px"
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === trip.id ? null : trip.id);
            }}
            style={{
              padding: "6px",
              background: "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "24px",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "28px",
              transition: "all 0.2s ease",
              lineHeight: "1"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#475569";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            ⋯
          </button>
          {openMenuId === trip.id && (
            <div
              style={{
                position: "absolute",
                top: "36px",
                right: "0",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                border: "1px solid #e2e8f0",
                minWidth: "180px",
                zIndex: 1000,
                overflow: "hidden"
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateTrip(trip);
                }}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid #f1f5f9",
                  cursor: "pointer",
                  fontSize: "15px",
                  color: "#475569",
                  textAlign: "left",
                  transition: "background 0.2s ease",
                  fontWeight: "500"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Duplicate
              </button>
              {trip.end_date && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startTripAgain(trip.id);
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    fontSize: "15px",
                    color: "#16a34a",
                    textAlign: "left",
                    transition: "background 0.2s ease",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f0fdf4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Start Trip Again
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete "${trip.name}"? This action cannot be undone.`)) {
                    deleteTrip(trip.id);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "15px",
                  color: "#dc2626",
                  textAlign: "left",
                  transition: "background 0.2s ease",
                  fontWeight: "500"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fef2f2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

