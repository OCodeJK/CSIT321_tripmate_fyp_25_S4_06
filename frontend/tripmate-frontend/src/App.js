import React, { useState, useEffect, useRef } from "react";
import HomePage from "./components/HomePage";
import Login from "./components/Login";
import Register from "./components/Register";
import TripList from "./components/TripList";
import TripPlanner from "./components/TripPlanner";
import DashboardHome from "./components/DashboardHome";
import ReviewPage from "./components/ReviewPage";
import EditProfile from "./components/EditProfile";
import Subscription from "./components/Subscription";
import AccountSettings from "./components/AccountSettings";
import HelpSupport from "./components/HelpSupport";
import AdminPanel from "./components/AdminPanel";
import axios from "axios";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentView, setCurrentView] = useState("home"); // "home", "login", "register", "list", "planner", "reviews", "edit-profile", "subscription", "account-settings", "help", "admin"
  const [hoveredNav, setHoveredNav] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    // Check for existing session
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      // Verify token is still valid
      axios.post("http://127.0.0.1:5000/api/auth/verify", {}, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
      .then((res) => {
        setUser(res.data.user);
        setToken(savedToken);
        setCurrentView("home");
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setCurrentView("home");
      });
    }
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setCurrentView("home");
  };

  const handleRegister = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setCurrentView("home");
  };

  const handleGetStarted = () => {
    setCurrentView("register");
  };

  const handleShowLogin = () => {
    setCurrentView("login");
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setCurrentView("home");
    setSelectedTripId(null);
  };

  const handleCreateNew = (tripId = null) => {
    setSelectedTripId(tripId);
    setCurrentView("planner");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedTripId(null);
  };

  const handleBackToHome = () => {
    setCurrentView("home");
    setSelectedTripId(null);
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  // Show home page, login, or register if not authenticated
  if (!user || !token) {
    if (currentView === "login") {
      return (
        <div className="App">
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView("register")}
            onBack={() => setCurrentView("home")}
          />
        </div>
      );
    }
    
    if (currentView === "register") {
      return (
        <div className="App">
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentView("login")}
            onBack={() => setCurrentView("home")}
          />
        </div>
      );
    }

    return (
      <div className="App">
        <HomePage
          onGetStarted={handleGetStarted}
          onLogin={handleShowLogin}
        />
      </div>
    );
  }

  // Show main app if authenticated
  return (
    <div className="App">
      <nav style={{
        background: "white",
        padding: "16px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 24px)", fontWeight: "700", color: "#4f46e5", margin: 0 }}>
            TripMate
          </h1>
          <div style={{ display: "flex", gap: "clamp(16px, 3vw, 32px)", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => { setCurrentView("home"); setSelectedTripId(null); }}
              onMouseEnter={() => setHoveredNav("home")}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                padding: "8px 0",
                background: "transparent",
                color: currentView === "home" ? "#1e293b" : "#64748b",
                border: "none",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: currentView === "home" ? "600" : "500",
                position: "relative",
                transition: "color 0.2s ease"
              }}
            >
              Home
              <div style={{
                position: "absolute",
                bottom: "-4px",
                left: "0",
                width: hoveredNav === "home" || currentView === "home" ? "100%" : "0%",
                height: "2px",
                background: "#4f46e5",
                transition: "width 0.3s ease",
                borderRadius: "2px"
              }} />
            </button>
            <button
              onClick={() => { setCurrentView("list"); setSelectedTripId(null); }}
              onMouseEnter={() => setHoveredNav("list")}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                padding: "8px 0",
                background: "transparent",
                color: currentView === "list" ? "#1e293b" : "#64748b",
                border: "none",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: currentView === "list" ? "600" : "500",
                position: "relative",
                transition: "color 0.2s ease"
              }}
            >
              My Trips
              <div style={{
                position: "absolute",
                bottom: "-4px",
                left: "0",
                width: hoveredNav === "list" || currentView === "list" ? "100%" : "0%",
                height: "2px",
                background: "#4f46e5",
                transition: "width 0.3s ease",
                borderRadius: "2px"
              }} />
            </button>
            <button
              onClick={() => { setCurrentView("reviews"); setSelectedTripId(null); }}
              onMouseEnter={() => setHoveredNav("reviews")}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                padding: "8px 0",
                background: "transparent",
                color: currentView === "reviews" ? "#1e293b" : "#64748b",
                border: "none",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: currentView === "reviews" ? "600" : "500",
                position: "relative",
                transition: "color 0.2s ease"
              }}
            >
              Review
              <div style={{
                position: "absolute",
                bottom: "-4px",
                left: "0",
                width: hoveredNav === "reviews" || currentView === "reviews" ? "100%" : "0%",
                height: "2px",
                background: "#4f46e5",
                transition: "width 0.3s ease",
                borderRadius: "2px"
              }} />
            </button>
            {!!user.is_premium && (
              <button
                style={{
                  padding: "8px 16px",
                  background: "#fffbeb",
                  color: "#a16207",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "default",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fef3c7";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fffbeb";
                }}
              >
                <span style={{ fontSize: "16px" }}>⭐</span>
                Premium
              </button>
            )}
            {!!user.is_admin && (
              <button
                style={{
                  padding: "8px 16px",
                  background: "#e0e7ff",
                  color: "#4f46e5",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "default",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#c7d2fe";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#e0e7ff";
                }}
              >
                <span style={{ fontSize: "16px" }}>👑</span>
                Admin
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative", flexWrap: "wrap" }} ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 12px 6px 6px",
              background: showProfileMenu ? "#f1f5f9" : "transparent",
              color: "#475569",
              border: "1px solid #e2e8f0",
              borderRadius: "24px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (!showProfileMenu) {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }
            }}
            onMouseLeave={(e) => {
              if (!showProfileMenu) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }
            }}
          >
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px",
              fontWeight: "600",
              flexShrink: 0
            }}>
              {(user.full_name || user.username || "").charAt(0).toUpperCase()}
            </div>
            <span className="user-name-text" style={{ fontSize: "14px", fontWeight: "500" }}>{user.full_name || user.username}</span>
            <span style={{ fontSize: "10px", color: "#94a3b8" }}>▼</span>
          </button>
          
          {showProfileMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: "0",
                marginTop: "8px",
                background: "white",
                borderRadius: "16px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                border: "1px solid #e2e8f0",
                minWidth: "240px",
                zIndex: 1000,
                overflow: "hidden",
                padding: "8px"
              }}
            >
              <div style={{
                padding: "16px",
                borderBottom: "1px solid #f1f5f9",
                marginBottom: "4px"
              }}>
                <div style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>
                  {user.full_name || user.username}
                </div>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  {user.email || user.username}
                </div>
              </div>
              
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setCurrentView("edit-profile");
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#475569",
                  textAlign: "left",
                  transition: "background 0.2s ease",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  borderRadius: "8px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#eef2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0
                }}>
                  👤
                </div>
                <span>Edit Profile</span>
              </button>
              
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setCurrentView("subscription");
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#475569",
                  textAlign: "left",
                  transition: "background 0.2s ease",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  borderRadius: "8px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#eef2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0
                }}>
                  💳
                </div>
                <span>Subscriptions</span>
              </button>
              
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setCurrentView("account-settings");
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#475569",
                  textAlign: "left",
                  transition: "background 0.2s ease",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  borderRadius: "8px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#eef2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0
                }}>
                  ⚙️
                </div>
                <span>Account Settings</span>
              </button>
              
              {!!user.is_admin && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setCurrentView("admin");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#4f46e5",
                    textAlign: "left",
                    transition: "background 0.2s ease",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    borderRadius: "8px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#eef2ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#e0e7ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    flexShrink: 0
                  }}>
                    👑
                  </div>
                  <span>Admin Panel</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setCurrentView("help");
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#475569",
                  textAlign: "left",
                  transition: "background 0.2s ease",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  borderRadius: "8px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#eef2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0
                }}>
                  ❓
                </div>
                <span>Help & Support</span>
              </button>
              
              <div style={{
                height: "1px",
                background: "#e2e8f0",
                margin: "8px 0"
              }} />
              
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  handleLogout();
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#dc2626",
                  textAlign: "left",
                  transition: "background 0.2s ease",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  borderRadius: "8px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fef2f2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0
                }}>
                  🚪
                </div>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {currentView === "home" ? (
        <DashboardHome 
          token={token} 
          user={user} 
          onCreateNew={handleCreateNew}
          onNavigateToTrips={() => setCurrentView("list")}
        />
      ) : currentView === "list" ? (
        <TripList token={token} onCreateNew={handleCreateNew} />
      ) : currentView === "reviews" ? (
        <ReviewPage token={token} user={user} />
      ) : currentView === "edit-profile" ? (
        <EditProfile 
          token={token} 
          user={user} 
          onBack={handleBackToHome}
          onUpdateUser={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }}
        />
      ) : currentView === "subscription" ? (
        <Subscription 
          token={token} 
          user={user} 
          onBack={handleBackToHome}
        />
      ) : currentView === "account-settings" ? (
        <AccountSettings 
          token={token} 
          user={user} 
          onBack={handleBackToHome}
          onLogout={handleLogout}
        />
      ) : currentView === "help" ? (
        <HelpSupport onBack={handleBackToHome} />
      ) : currentView === "admin" ? (
        <AdminPanel 
          token={token} 
          user={user} 
          onBack={handleBackToHome}
        />
      ) : (
        <TripPlanner
          token={token}
          user={user}
          tripId={selectedTripId}
          onBack={handleBackToHome}
        />
      )}
    </div>
  );
}

export default App;
