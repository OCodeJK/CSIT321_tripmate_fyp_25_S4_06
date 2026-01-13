import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "./Footer";

export default function EditProfile({ token, user, onBack, onUpdateUser }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUserData();
  }, [token]);

  const loadUserData = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/account/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = res.data.user;
      setFormData({
        username: userData.username || "",
        email: userData.email || "",
        full_name: userData.full_name || "",
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Failed to load profile data");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate password if changing
    if (formData.new_password) {
      if (!formData.current_password) {
        setError("Current password is required to change password");
        setLoading(false);
        return;
      }
      if (formData.new_password.length < 6) {
        setError("New password must be at least 6 characters");
        setLoading(false);
        return;
      }
      if (formData.new_password !== formData.confirm_password) {
        setError("New passwords do not match");
        setLoading(false);
        return;
      }
    }

    try {
      const updateData = {
        email: formData.email,
        full_name: formData.full_name
      };

      if (formData.new_password) {
        updateData.password = formData.new_password;
        updateData.current_password = formData.current_password;
      }

      await axios.put("http://127.0.0.1:5000/api/account/", updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess("Profile updated successfully!");
      
      // Update user in parent component
      if (onUpdateUser) {
        const updatedUser = { ...user, email: formData.email, full_name: formData.full_name };
        onUpdateUser(updatedUser);
      }

      // Clear password fields
      setFormData({
        ...formData,
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 100px)",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{
        maxWidth: "600px",
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
          marginBottom: "24px"
        }}>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "800",
            color: "#2d3748",
            margin: 0,
            letterSpacing: "-0.02em"
          }}>
            Edit Profile
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

        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
            color: "#dc2626"
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
            color: "#166534"
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: "#2d3748",
              marginBottom: "8px"
            }}>
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              disabled
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                background: "#f8fafc",
                color: "#64748b"
              }}
            />
            <p style={{
              fontSize: "12px",
              color: "#94a3b8",
              marginTop: "4px",
              margin: 0
            }}>
              Username cannot be changed
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: "#2d3748",
              marginBottom: "8px"
            }}>
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: "#2d3748",
              marginBottom: "8px"
            }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
          </div>

          <div style={{
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: "1px solid #e2e8f0"
          }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#2d3748",
              marginBottom: "16px"
            }}>
              Change Password
            </h3>
            <p style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "20px"
            }}>
              Leave blank if you don't want to change your password
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#2d3748",
                marginBottom: "8px"
              }}>
                Current Password
              </label>
              <input
                type="password"
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#2d3748",
                marginBottom: "8px"
              }}>
                New Password
              </label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#2d3748",
                marginBottom: "8px"
              }}>
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "#cbd5e1" : "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "15px",
              fontWeight: "600",
              marginTop: "24px",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#4338ca";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#4f46e5";
              }
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

