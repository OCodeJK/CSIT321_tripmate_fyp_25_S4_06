import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "./Footer";

export default function AdminPanel({ token, user, onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    full_name: "",
    is_admin: false,
    is_premium: false,
    is_suspended: false,
    suspended_reason: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUsers();
  }, [token, filterType]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = filterType !== "all" ? { type: filterType } : {};
      const res = await axios.get("http://127.0.0.1:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      loadUsers();
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get("http://127.0.0.1:5000/api/admin/users/search", {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: searchQuery }
      });
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user.id);
    setEditForm({
      username: user.username || "",
      email: user.email || "",
      full_name: user.full_name || "",
      is_admin: user.is_admin || false,
      is_premium: user.is_premium || false,
      is_suspended: user.is_suspended || false,
      suspended_reason: user.suspended_reason || ""
    });
    setError("");
    setSuccess("");
  };

  const handleUpdate = async () => {
    try {
      setError("");
      setSuccess("");
      await axios.put(
        `http://127.0.0.1:5000/api/admin/users/${editingUser}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("User updated successfully");
      setEditingUser(null);
      loadUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update user");
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setError("");
      setSuccess("");
      await axios.delete(
        `http://127.0.0.1:5000/api/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("User deleted successfully");
      loadUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete user");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 100px)",
      background: "#f8fafc",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{
        padding: "clamp(16px, 4vw, 24px)",
        flex: "1"
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto"
        }}>
        {/* Header */}
        <div style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <h1 style={{
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: "8px",
              letterSpacing: "-0.02em"
            }}>
              Admin Panel 👑
            </h1>
            <p style={{
              fontSize: "16px",
              color: "#64748b"
            }}>
              Manage all user accounts
            </p>
          </div>
          <button
            onClick={onBack}
            style={{
              padding: "10px 20px",
              background: "#f1f5f9",
              color: "#475569",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
            }}
          >
            ← Back
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{
          background: "white",
          padding: "clamp(16px, 4vw, 24px)",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "24px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          <div style={{ flex: "1", minWidth: "min(200px, 100%)" }}>
            <input
              type="text"
              placeholder="Search by username, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchUsers()}
              style={{
                width: "100%",
                padding: "10px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
          <button
            onClick={searchUsers}
            style={{
              padding: "10px 20px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4338ca";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#4f46e5";
            }}
          >
            Search
          </button>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setSearchQuery("");
            }}
            style={{
              padding: "10px 16px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              outline: "none",
              background: "white"
            }}
          >
            <option value="all">All Users</option>
            <option value="free">Free Users</option>
            <option value="premium">Premium Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            background: "#fee2e2",
            color: "#dc2626",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "24px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            background: "#d1fae5",
            color: "#059669",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "24px",
            fontSize: "14px"
          }}>
            {success}
          </div>
        )}

        {/* Users Table */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden"
        }}>
          {loading ? (
            <div style={{
              padding: "clamp(40px, 8vw, 60px)",
              textAlign: "center",
              color: "#64748b"
            }}>
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div style={{
              padding: "clamp(40px, 8vw, 60px)",
              textAlign: "center",
              color: "#64748b"
            }}>
              No users found
            </div>
          ) : (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "600px"
              }}>
                <thead>
                  <tr style={{
                    background: "#f8fafc",
                    borderBottom: "2px solid #e2e8f0"
                  }}>
                    <th style={{
                      padding: "clamp(12px, 2vw, 16px)",
                      textAlign: "left",
                      fontSize: "clamp(10px, 2vw, 12px)",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>ID</th>
                    <th style={{
                      padding: "clamp(12px, 2vw, 16px)",
                      textAlign: "left",
                      fontSize: "clamp(10px, 2vw, 12px)",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>Username</th>
                    <th style={{
                      padding: "clamp(12px, 2vw, 16px)",
                      textAlign: "left",
                      fontSize: "clamp(10px, 2vw, 12px)",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>Email</th>
                    <th style={{
                      padding: "clamp(12px, 2vw, 16px)",
                      textAlign: "left",
                      fontSize: "clamp(10px, 2vw, 12px)",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>Full Name</th>
                    <th style={{
                      padding: "clamp(12px, 2vw, 16px)",
                      textAlign: "left",
                      fontSize: "clamp(10px, 2vw, 12px)",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>Type</th>
                    <th style={{
                      padding: "clamp(12px, 2vw, 16px)",
                      textAlign: "left",
                      fontSize: "clamp(10px, 2vw, 12px)",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>Created</th>
                    <th style={{
                      padding: "clamp(12px, 2vw, 16px)",
                      textAlign: "left",
                      fontSize: "clamp(10px, 2vw, 12px)",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem, index) => (
                    <tr
                      key={userItem.id}
                      style={{
                        borderBottom: index < users.length - 1 ? "1px solid #f1f5f9" : "none",
                        background: editingUser === userItem.id ? "#fef3c7" : "white"
                      }}
                    >
                      {editingUser === userItem.id ? (
                        <>
                          <td style={{ padding: "16px", fontSize: "14px", color: "#1e293b" }}>
                            {userItem.id}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <input
                              type="text"
                              value={editForm.username}
                              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                fontSize: "14px",
                                outline: "none"
                              }}
                            />
                          </td>
                          <td style={{ padding: "16px" }}>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                fontSize: "14px",
                                outline: "none"
                              }}
                            />
                          </td>
                          <td style={{ padding: "16px" }}>
                            <input
                              type="text"
                              value={editForm.full_name}
                              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                fontSize: "14px",
                                outline: "none"
                              }}
                            />
                          </td>
                          <td style={{ padding: "16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={editForm.is_admin}
                                  onChange={(e) => setEditForm({ ...editForm, is_admin: e.target.checked })}
                                />
                                <span>Admin</span>
                              </label>
                              <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={editForm.is_premium}
                                  onChange={(e) => setEditForm({ ...editForm, is_premium: e.target.checked })}
                                />
                                <span>Premium</span>
                              </label>
                              <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={editForm.is_suspended}
                                  onChange={(e) => setEditForm({ ...editForm, is_suspended: e.target.checked })}
                                />
                                <span>Suspended</span>
                              </label>
                              {editForm.is_suspended && (
                                <input
                                  type="text"
                                  placeholder="Suspension reason..."
                                  value={editForm.suspended_reason}
                                  onChange={(e) => setEditForm({ ...editForm, suspended_reason: e.target.value })}
                                  style={{
                                    width: "100%",
                                    padding: "6px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    outline: "none",
                                    marginTop: "4px"
                                  }}
                                />
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "16px", fontSize: "14px", color: "#64748b" }}>
                            {formatDate(userItem.created_at)}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <button
                                onClick={handleUpdate}
                                style={{
                                  padding: "6px 12px",
                                  background: "#10b981",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "500"
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                style={{
                                  padding: "6px 12px",
                                  background: "#64748b",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "500"
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: "clamp(12px, 2vw, 16px)", fontSize: "clamp(12px, 2.5vw, 14px)", color: "#1e293b", fontWeight: "500" }}>
                            {userItem.id}
                          </td>
                          <td style={{ padding: "clamp(12px, 2vw, 16px)", fontSize: "clamp(12px, 2.5vw, 14px)", color: "#1e293b" }}>
                            {userItem.username}
                          </td>
                          <td style={{ padding: "clamp(12px, 2vw, 16px)", fontSize: "clamp(12px, 2.5vw, 14px)", color: "#475569" }}>
                            {userItem.email}
                          </td>
                          <td style={{ padding: "clamp(12px, 2vw, 16px)", fontSize: "clamp(12px, 2.5vw, 14px)", color: "#475569" }}>
                            {userItem.full_name || "—"}
                          </td>
                          <td style={{ padding: "clamp(12px, 2vw, 16px)" }}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {userItem.is_admin && (
                                <span style={{
                                  padding: "4px 8px",
                                  background: "#e0e7ff",
                                  color: "#4f46e5",
                                  borderRadius: "6px",
                                  fontSize: "clamp(10px, 2vw, 11px)",
                                  fontWeight: "600"
                                }}>
                                  Admin
                                </span>
                              )}
                              {userItem.is_premium && (
                                <span style={{
                                  padding: "4px 8px",
                                  background: "#fffbeb",
                                  color: "#a16207",
                                  borderRadius: "6px",
                                  fontSize: "clamp(10px, 2vw, 11px)",
                                  fontWeight: "600"
                                }}>
                                  Premium
                                </span>
                              )}
                              {userItem.is_suspended && (
                                <span style={{
                                  padding: "4px 8px",
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  borderRadius: "6px",
                                  fontSize: "clamp(10px, 2vw, 11px)",
                                  fontWeight: "600"
                                }}>
                                  Suspended
                                </span>
                              )}
                              {!userItem.is_admin && !userItem.is_premium && !userItem.is_suspended && (
                                <span style={{
                                  padding: "4px 8px",
                                  background: "#f1f5f9",
                                  color: "#64748b",
                                  borderRadius: "6px",
                                  fontSize: "clamp(10px, 2vw, 11px)",
                                  fontWeight: "600"
                                }}>
                                  Free
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "clamp(12px, 2vw, 16px)", fontSize: "clamp(12px, 2.5vw, 14px)", color: "#64748b" }}>
                            {formatDate(userItem.created_at)}
                          </td>
                          <td style={{ padding: "clamp(12px, 2vw, 16px)" }}>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <button
                                onClick={() => handleEdit(userItem)}
                                style={{
                                  padding: "6px 12px",
                                  background: "#4f46e5",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  transition: "background 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#4338ca";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#4f46e5";
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(userItem.id, userItem.username)}
                                style={{
                                  padding: "6px 12px",
                                  background: "#dc2626",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  transition: "background 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#b91c1c";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#dc2626";
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: "24px", fontSize: "14px", color: "#64748b", textAlign: "center" }}>
          Total users: {users.length}
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

