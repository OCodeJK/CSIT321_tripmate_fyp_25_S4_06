import React, { useState } from "react";
import Footer from "./Footer";

export default function HelpSupport({ onBack }) {
  const [openSection, setOpenSection] = useState(null);

  const faqSections = [
    {
      title: "Getting Started",
      items: [
        {
          q: "How do I create my first trip?",
          a: "Click on 'Create New Trip' from the home page or trips list. Enter your starting point and destinations, then click 'Plan & Save Trip' to get an optimized route."
        },
        {
          q: "How does route optimization work?",
          a: "TripMate uses advanced algorithms to find the shortest route visiting all your destinations. It tries all possible orders and picks the one with the shortest total distance."
        },
        {
          q: "Can I change my trip after creating it?",
          a: "Yes! Open your trip from 'My Trips' and you can edit the name, description, destinations, and other details. Click 'Update Trip' to save changes."
        }
      ]
    },
    {
      title: "Photos & Memories",
      items: [
        {
          q: "How do I upload photos?",
          a: "After saving a trip, scroll down to the Photo Gallery section. Click 'Upload Photos' and select images from your device. Photos are organized by location."
        },
        {
          q: "What's the photo size limit?",
          a: "Free users can upload photos up to 5MB each. Premium users have a 20MB limit per photo."
        },
        {
          q: "How do I view my photos?",
          a: "Photos appear in the Photo Gallery section of your trip. When you end a trip, a slideshow will automatically display all your trip photos."
        }
      ]
    },
    {
      title: "Premium Features",
      items: [
        {
          q: "What's included in Premium?",
          a: "Premium includes unlimited AI-powered Q&A, video export of your trips, larger photo upload limits (20MB), and priority support."
        },
        {
          q: "How do I subscribe to Premium?",
          a: "Go to your profile menu and select 'Subscription'. Click 'Subscribe to Premium' to activate your 30-day subscription."
        },
        {
          q: "Can I cancel my subscription?",
          a: "Yes, you can cancel anytime from the Subscription page. Your premium access will remain active until the end of your billing period."
        }
      ]
    },
    {
      title: "Technical Support",
      items: [
        {
          q: "The map isn't loading",
          a: "Make sure you have a valid Google Maps API key configured. Check your browser console for errors and ensure your internet connection is stable."
        },
        {
          q: "I can't save my trip",
          a: "Ensure you're logged in and have a valid session. Try refreshing the page or logging out and back in. Check that all required fields are filled."
        },
        {
          q: "Photos won't upload",
          a: "Check that your photos are under the size limit (5MB for free, 20MB for premium). Ensure your trip is saved first, and try using a different browser if issues persist."
        }
      ]
    },
    {
      title: "Account & Settings",
      items: [
        {
          q: "How do I change my password?",
          a: "Go to 'Edit Profile' from your profile menu. Enter your current password and new password, then click 'Save Changes'."
        },
        {
          q: "Can I delete my account?",
          a: "Yes, you can delete your account from Account Settings. This will permanently delete all your trips, photos, and data. This action cannot be undone."
        },
        {
          q: "How do I update my email?",
          a: "Go to 'Edit Profile' and update your email address. Make sure the new email isn't already registered to another account."
        }
      ]
    }
  ];

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 100px)",
      display: "flex",
      flexDirection: "column",
      background: "#f8fafc"
    }}>
      <div style={{
        maxWidth: "900px",
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
            Help & Support
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

        {/* Contact Section */}
        <div style={{
          background: "#eef2ff",
          borderRadius: "8px",
          padding: "24px",
          marginBottom: "32px"
        }}>
          <h2 style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#2d3748",
            marginBottom: "12px"
          }}>
            Need More Help?
          </h2>
          <p style={{
            color: "#475569",
            fontSize: "14px",
            marginBottom: "16px"
          }}>
            Can't find what you're looking for? Contact our support team:
          </p>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#475569",
              fontSize: "14px"
            }}>
              <span>📧</span>
              <span>support@tripmate.com</span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#475569",
              fontSize: "14px"
            }}>
              <span>💬</span>
              <span>Live chat available 9 AM - 6 PM (Mon-Fri)</span>
            </div>
          </div>
        </div>

        {/* FAQ Sections */}
        <div>
          {faqSections.map((section, sectionIndex) => (
            <div key={sectionIndex} style={{
              marginBottom: "24px"
            }}>
              <button
                onClick={() => toggleSection(sectionIndex)}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: openSection === sectionIndex ? "#f8fafc" : "transparent",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (openSection !== sectionIndex) {
                    e.currentTarget.style.background = "#f8fafc";
                  }
                }}
                onMouseLeave={(e) => {
                  if (openSection !== sectionIndex) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#2d3748",
                  margin: 0
                }}>
                  {section.title}
                </h3>
                <span style={{
                  fontSize: "20px",
                  color: "#64748b"
                }}>
                  {openSection === sectionIndex ? "−" : "+"}
                </span>
              </button>

              {openSection === sectionIndex && (
                <div style={{
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "0 0 8px 8px",
                  border: "1px solid #e2e8f0",
                  borderTop: "none"
                }}>
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} style={{
                      marginBottom: itemIndex < section.items.length - 1 ? "20px" : "0",
                      paddingBottom: itemIndex < section.items.length - 1 ? "20px" : "0",
                      borderBottom: itemIndex < section.items.length - 1 ? "1px solid #e2e8f0" : "none"
                    }}>
                      <h4 style={{
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#2d3748",
                        marginBottom: "8px"
                      }}>
                        {item.q}
                      </h4>
                      <p style={{
                        fontSize: "14px",
                        color: "#64748b",
                        margin: 0,
                        lineHeight: "1.6"
                      }}>
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

