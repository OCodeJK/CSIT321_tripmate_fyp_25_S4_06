import React, { useState } from "react";
import axios from "axios";
import Footer from "./Footer";

export default function AccountSettings({ token, user, onBack, onLogout }) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== "delete") {
      setError("Please type 'delete' to confirm");
      return;
    }

    if (!window.confirm("Are you absolutely sure? This action cannot be undone. All your trips, photos, and data will be permanently deleted.")) {
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await axios.delete("http://127.0.0.1:5000/api/account/", {
        data: { confirmation: deleteConfirmation },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert("Account deleted successfully");
      if (onLogout) {
        onLogout();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete account");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmation("");
    }
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 100px)",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "24px",
        flex: "1"
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
            Account Settings
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

        {/* Privacy Settings */}
        <div style={{
          marginBottom: "32px",
          paddingBottom: "32px",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <h2 style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#2d3748",
            marginBottom: "16px"
          }}>
            Privacy
          </h2>
          <div style={{
            background: "#f8fafc",
            borderRadius: "8px",
            padding: "16px"
          }}>
            <p style={{
              color: "#64748b",
              fontSize: "14px",
              margin: 0
            }}>
              Your account information is kept private and secure. We never share your personal data with third parties.
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div style={{
          marginBottom: "32px",
          paddingBottom: "32px",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <h2 style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#2d3748",
            marginBottom: "16px"
          }}>
            Notifications
          </h2>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              padding: "12px",
              borderRadius: "8px",
              transition: "background 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}>
              <input
                type="checkbox"
                defaultChecked
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer"
                }}
              />
              <span style={{ color: "#475569", fontSize: "14px" }}>
                Email notifications for trip updates
              </span>
            </label>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              padding: "12px",
              borderRadius: "8px",
              transition: "background 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}>
              <input
                type="checkbox"
                defaultChecked
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer"
                }}
              />
              <span style={{ color: "#475569", fontSize: "14px" }}>
                Premium feature announcements
              </span>
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div style={{
          marginBottom: "32px",
          paddingBottom: "32px",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <h2 style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#2d3748",
            marginBottom: "16px"
          }}>
            Data Management
          </h2>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <button
              onClick={() => alert("Export feature coming soon!")}
              style={{
                padding: "12px 20px",
                background: "transparent",
                color: "#4f46e5",
                border: "2px solid #4f46e5",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                textAlign: "left",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#eef2ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Export My Data
            </button>
            <p style={{
              fontSize: "12px",
              color: "#94a3b8",
              margin: 0
            }}>
              Download all your trips, photos, and account data
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{
          background: "#fef2f2",
          borderRadius: "8px",
          padding: "24px",
          border: "1px solid #fecaca"
        }}>
          <h2 style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#dc2626",
            marginBottom: "12px"
          }}>
            Danger Zone
          </h2>
          <p style={{
            color: "#991b1b",
            fontSize: "14px",
            marginBottom: "16px"
          }}>
            Once you delete your account, there is no going back. Please be certain.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: "12px 24px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#b91c1c";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#dc2626";
              }}
            >
              Delete Account
            </button>
          ) : (
            <div>
              {error && (
                <div style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  padding: "8px",
                  marginBottom: "12px",
                  color: "#dc2626",
                  fontSize: "13px"
                }}>
                  {error}
                </div>
              )}
              <p style={{
                color: "#991b1b",
                fontSize: "13px",
                marginBottom: "8px"
              }}>
                Type <strong>"delete"</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type 'delete'"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  fontSize: "14px",
                  marginBottom: "12px"
                }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    background: loading ? "#cbd5e1" : "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600"
                  }}
                >
                  {loading ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmation("");
                    setError("");
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    color: "#64748b",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

