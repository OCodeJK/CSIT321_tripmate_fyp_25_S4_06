import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "./Footer";

export default function Subscription({ token, user, onBack }) {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    loadSubscriptionData();
  }, [token]);

  const loadSubscriptionData = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/account/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = res.data.user;
      
      setSubscriptionData({
        is_premium: userData.is_premium,
        premium_expires_at: userData.premium_expires_at
      });

      if (userData.premium_expires_at) {
        const expiresDate = new Date(userData.premium_expires_at);
        const today = new Date();
        const diffTime = expiresDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysLeft(diffDays > 0 ? diffDays : 0);
      }
    } catch (err) {
      console.error("Error loading subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (window.confirm("Subscribe to Premium for 30 days? (This is a demo - no payment required)")) {
      try {
        await axios.post("http://127.0.0.1:5000/api/premium/subscribe", {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Premium subscription activated!");
        loadSubscriptionData();
      } catch (err) {
        alert(err.response?.data?.error || "Failed to subscribe");
      }
    }
  };

  const handleCancel = async () => {
    if (window.confirm("Cancel subscription? Your premium access will remain until the end of your billing period.")) {
      try {
        await axios.post("http://127.0.0.1:5000/api/premium/cancel", {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Subscription cancellation confirmed. Premium access will remain until expiration.");
        loadSubscriptionData();
      } catch (err) {
        alert(err.response?.data?.error || "Failed to cancel subscription");
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "calc(100vh - 100px)",
      display: "flex",
      flexDirection: "column",
      background: "#f8fafc"
    }}>
      <div style={{
        maxWidth: "800px",
        width: "100%",
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 24px)",
        flex: "1",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px"
        }}>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "800",
            color: "#2d3748",
            margin: 0,
            letterSpacing: "-0.02em"
          }}>
            Subscription
          </h1>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                padding: "8px 16px",
                background: "transparent",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              Back
            </button>
          )}
        </div>

        {subscriptionData?.is_premium ? (
          <div>
            <div style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              borderRadius: "12px",
              padding: "32px",
              color: "white",
              marginBottom: "24px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px"
              }}>
                <div style={{
                  fontSize: "32px"
                }}>
                  ⭐
                </div>
                <h2 style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  margin: 0
                }}>
                  Premium Active
                </h2>
              </div>
              <p style={{
                fontSize: "16px",
                marginBottom: "8px",
                opacity: 0.9
              }}>
                Your premium subscription is active
              </p>
              {subscriptionData.premium_expires_at && (
                <div>
                  <p style={{
                    fontSize: "14px",
                    marginBottom: "8px",
                    opacity: 0.8
                  }}>
                    Expires: {new Date(subscriptionData.premium_expires_at).toLocaleDateString()}
                  </p>
                  <p style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    margin: 0
                  }}>
                    {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining
                  </p>
                </div>
              )}
            </div>

            <div style={{
              background: "#f8fafc",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px"
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#2d3748",
                marginBottom: "12px"
              }}>
                Premium Benefits
              </h3>
              <ul style={{
                listStyle: "none",
                padding: 0,
                margin: 0
              }}>
                {[
                  "Unlimited trips (no monthly limit)",
                  "Unlimited AI-powered Q&A",
                  "1GB Photo & Video uploads per trip",
                  "Export trip as MP4 video",
                  "Priority support"
                ].map((benefit, idx) => (
                  <li key={idx} style={{
                    padding: "8px 0",
                    color: "#475569",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span>✓</span> {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleCancel}
              style={{
                padding: "12px 24px",
                background: "transparent",
                color: "#dc2626",
                border: "2px solid #dc2626",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "600",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fef2f2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Cancel Subscription
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              background: "#f8fafc",
              borderRadius: "12px",
              padding: "32px",
              marginBottom: "24px",
              textAlign: "center"
            }}>
              <div style={{
                fontSize: "48px",
                marginBottom: "16px"
              }}>
                🎯
              </div>
              <h2 style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#2d3748",
                marginBottom: "8px"
              }}>
                Free Plan
              </h2>
              <p style={{
                color: "#64748b",
                marginBottom: "24px"
              }}>
                Upgrade to Premium for enhanced features
              </p>
            </div>

            <div style={{
              background: "white",
              border: "2px solid #4f46e5",
              borderRadius: "12px",
              padding: "32px",
              marginBottom: "24px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px"
              }}>
                <div>
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#2d3748",
                    marginBottom: "4px"
                  }}>
                    Premium Plan
                  </h3>
                  <p style={{
                    color: "#64748b",
                    fontSize: "14px",
                    margin: 0
                  }}>
                    $9.99/month
                  </p>
                </div>
                <div style={{
                  fontSize: "32px"
                }}>
                  ⭐
                </div>
              </div>

              <ul style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 24px 0"
              }}>
                {[
                  "Unlimited trips (no monthly limit)",
                  "Unlimited AI-powered Q&A",
                  "1GB Photo & Video uploads per trip",
                  "Export trip as MP4 video",
                  "Priority support"
                ].map((feature, idx) => (
                  <li key={idx} style={{
                    padding: "8px 0",
                    color: "#475569",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span style={{ color: "#4f46e5" }}>✓</span> {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleSubscribe}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
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
                Subscribe to Premium
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

