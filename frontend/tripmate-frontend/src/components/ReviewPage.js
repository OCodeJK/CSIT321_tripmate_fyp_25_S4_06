import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "./Footer";

export default function ReviewPage({ token, user }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [lowRatingFeedback, setLowRatingFeedback] = useState([]);
  const [existingReview, setExistingReview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const feedbackOptions = [
    "Poor user interface design",
    "Difficult to use",
    "Missing important features",
    "Slow performance",
    "Too expensive",
    "Not enough trip destinations",
    "Photo upload issues",
    "Route optimization not working well",
    "Other (please specify in comments)"
  ];

  useEffect(() => {
    if (token) {
      loadMyReview();
    }
  }, [token]);

  const loadMyReview = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/website-reviews/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.review) {
        setExistingReview(res.data.review);
        setRating(res.data.review.rating);
        setComment(res.data.review.comment || "");
        setLowRatingFeedback(res.data.review.low_rating_feedback || []);
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Error loading review:", err);
    }
  };

  const handleFeedbackToggle = (option) => {
    setLowRatingFeedback(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    if (rating <= 2 && lowRatingFeedback.length === 0) {
      alert("Please select at least one reason for your low rating");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://127.0.0.1:5000/api/website-reviews/", {
        rating,
        comment: comment.trim(),
        low_rating_feedback: rating <= 2 ? lowRatingFeedback : []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmitted(true);
      alert("Thank you for your review!");
    } catch (err) {
      console.error("Error submitting review:", err);
      alert(err.response?.data?.error || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

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
        <h1 style={{
          fontSize: "28px",
          fontWeight: "800",
          color: "#2d3748",
          marginBottom: "8px",
          letterSpacing: "-0.02em"
        }}>
          Review TripMate
        </h1>
        <p style={{
          color: "#64748b",
          marginBottom: "32px",
          fontSize: "15px"
        }}>
          Help us improve by sharing your experience
        </p>

        {submitted && existingReview ? (
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px"
          }}>
            <p style={{ color: "#166534", margin: 0 }}>
              ✓ You've already submitted a review. You can update it below.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div style={{ marginBottom: "32px" }}>
            <label style={{
              display: "block",
              fontSize: "16px",
              fontWeight: "600",
              color: "#2d3748",
              marginBottom: "12px"
            }}>
              How would you rate TripMate? *
            </label>
            <div style={{
              display: "flex",
              gap: "4px",
              alignItems: "center",
              flexWrap: "wrap"
            }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "48px",
                    padding: "8px 4px",
                    lineHeight: "1",
                    transition: "transform 0.2s ease",
                    minWidth: "56px",
                    minHeight: "56px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "scale(1.15)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {(hoveredRating >= star || rating >= star) ? "⭐" : "☆"}
                </button>
              ))}
              {rating > 0 && (
                <span style={{
                  marginLeft: "16px",
                  color: "#64748b",
                  fontSize: "15px",
                  fontWeight: "500"
                }}>
                  {rating === 1 ? "Poor" : 
                   rating === 2 ? "Fair" :
                   rating === 3 ? "Good" :
                   rating === 4 ? "Very Good" : "Excellent"}
                </span>
              )}
            </div>
          </div>

          {/* Low Rating Feedback */}
          {rating <= 2 && rating > 0 && (
            <div style={{
              marginBottom: "32px",
              padding: "20px",
              background: "#fef2f2",
              borderRadius: "8px",
              border: "1px solid #fecaca"
            }}>
              <label style={{
                display: "block",
                fontSize: "16px",
                fontWeight: "600",
                color: "#2d3748",
                marginBottom: "12px"
              }}>
                What could we improve? (Select all that apply) *
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {feedbackOptions.map((option) => (
                  <label
                    key={option}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      cursor: "pointer",
                      padding: "8px",
                      borderRadius: "6px",
                      transition: "background 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fee2e2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={lowRatingFeedback.includes(option)}
                      onChange={() => handleFeedbackToggle(option)}
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer"
                      }}
                    />
                    <span style={{ color: "#475569", fontSize: "14px" }}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Comment */}
          <div style={{ marginBottom: "32px" }}>
            <label style={{
              display: "block",
              fontSize: "16px",
              fontWeight: "600",
              color: "#2d3748",
              marginBottom: "12px"
            }}>
              Additional Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical",
                color: "#2d3748"
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || rating === 0}
            style={{
              padding: "12px 32px",
              background: rating === 0 ? "#cbd5e1" : "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: rating === 0 ? "not-allowed" : "pointer",
              fontSize: "15px",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (rating > 0) {
                e.currentTarget.style.background = "#4338ca";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (rating > 0) {
                e.currentTarget.style.background = "#4f46e5";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? "Submitting..." : submitted && existingReview ? "Update Review" : "Submit Review"}
          </button>
        </form>
      </div>
      </div>
      <Footer />
    </div>
  );
}

