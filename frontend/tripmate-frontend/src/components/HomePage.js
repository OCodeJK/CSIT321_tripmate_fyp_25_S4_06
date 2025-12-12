import React, { useState, useEffect, useRef } from "react";

// Custom hook for scroll animations
function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Optional: unobserve after animation to improve performance
          // observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return [ref, isVisible];
}

export default function HomePage({ onGetStarted, onLogin }) {
  // Animation refs for different sections
  const [heroRef, heroVisible] = useScrollAnimation();
  const [featuresTitleRef, featuresTitleVisible] = useScrollAnimation();
  const [testimonialsTitleRef, testimonialsTitleVisible] = useScrollAnimation();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      {/* Navigation */}
      <nav style={{
        background: "rgba(255, 255, 255, 0.9)",
        padding: "16px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ 
          fontSize: "24px", 
          fontWeight: "800", 
          color: "#4f46e5",
          letterSpacing: "-0.02em"
        }}>
          TripMate
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button
            onClick={onLogin}
            style={{
              padding: "8px 20px",
              background: "transparent",
              color: "#475569",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#1e293b";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#475569";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Log in
          </button>
          <button
            onClick={onGetStarted}
            style={{
              padding: "10px 24px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4338ca";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        style={{
          padding: "80px 24px",
          textAlign: "center",
          maxWidth: "800px",
          margin: "0 auto",
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 0.8s ease-out, transform 0.8s ease-out"
        }}
      >
        <h1 style={{
          fontSize: "clamp(42px, 5vw, 64px)",
          fontWeight: "800",
          color: "#1e293b",
          marginBottom: "24px",
          lineHeight: "1.1",
          letterSpacing: "-0.03em",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
          One Website for all your travel planning needs
        </h1>
        <p style={{
          fontSize: "clamp(18px, 2vw, 22px)",
          color: "#64748b",
          marginBottom: "40px",
          lineHeight: "1.7",
          fontWeight: "400",
          letterSpacing: "-0.01em"
        }}>
          Create detailed itineraries, plan optimized routes, and manage your trip memories seamlessly - all in one place.
        </p>
        <div style={{ 
          display: "flex", 
          gap: "16px", 
          justifyContent: "center", 
          flexWrap: "wrap",
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          transition: "opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s"
        }}>
          <button
            onClick={onGetStarted}
            style={{
              padding: "16px 32px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "17px",
              fontWeight: "600",
              letterSpacing: "-0.01em",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4338ca";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(79, 70, 229, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.3)";
            }}
          >
            Start planning
          </button>
          <button
            onClick={onLogin}
            style={{
              padding: "16px 32px",
              background: "white",
              color: "#4f46e5",
              border: "2px solid #4f46e5",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "17px",
              fontWeight: "600",
              letterSpacing: "-0.01em",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.color = "white";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.color = "#4f46e5";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Log in
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: "80px 24px",
        background: "rgba(255, 255, 255, 0.8)",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        <div ref={featuresTitleRef}>
          <h2 style={{
            fontSize: "clamp(32px, 4vw, 44px)",
            fontWeight: "800",
            textAlign: "center",
            marginBottom: "60px",
            color: "#1e293b",
            letterSpacing: "-0.02em",
            lineHeight: "1.2",
            opacity: featuresTitleVisible ? 1 : 0,
            transform: featuresTitleVisible ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.8s ease-out, transform 0.8s ease-out"
          }}>
            Your itinerary and your map in one view
          </h2>
          <p style={{
            fontSize: "18px",
            color: "#64748b",
            textAlign: "center",
            marginBottom: "60px",
            maxWidth: "600px",
            margin: "0 auto 60px",
            lineHeight: "1.7",
            fontWeight: "400",
            opacity: featuresTitleVisible ? 1 : 0,
            transform: featuresTitleVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s"
          }}>
            No more switching between different apps, tabs, and tools to keep track of your travel plans.
          </p>
        </div>

        <FeatureGrid featuresTitleVisible={featuresTitleVisible} />
      </section>

      {/* Testimonials Section */}
      <section style={{
        padding: "80px 24px",
        background: "rgba(248, 250, 252, 0.7)",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        <div ref={testimonialsTitleRef}>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 36px)",
            fontWeight: "800",
            textAlign: "center",
            marginBottom: "16px",
            color: "#1e293b",
            letterSpacing: "-0.02em",
            lineHeight: "1.2",
            opacity: testimonialsTitleVisible ? 1 : 0,
            transform: testimonialsTitleVisible ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.8s ease-out, transform 0.8s ease-out"
          }}>
            What travelers are saying
          </h2>
          <p style={{
            fontSize: "16px",
            color: "#64748b",
            textAlign: "center",
            marginBottom: "48px",
            opacity: testimonialsTitleVisible ? 1 : 0,
            transform: testimonialsTitleVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s"
          }}>
            Join thousands of travelers who are planning better trips with TripMate
          </p>
        </div>

        <TestimonialGrid testimonialsTitleVisible={testimonialsTitleVisible} />
      </section>

      {/* Pricing Section */}
      <section style={{
        padding: "80px 24px",
        background: "white"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{
              fontSize: "clamp(32px, 4vw, 40px)",
              fontWeight: "800",
              marginBottom: "16px",
              color: "#1e293b",
              letterSpacing: "-0.02em"
            }}>
              Start Free, Upgrade When Ready
            </h2>
            <p style={{
              fontSize: "18px",
              color: "#64748b",
              lineHeight: "1.6"
            }}>
              TripMate is free to use with core features. Premium includes unlimited trips and advanced features.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
            maxWidth: "900px",
            margin: "0 auto"
          }}>
            {/* Free Plan */}
            <div 
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "40px",
                border: "1px solid #e2e8f0",
                position: "relative",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.12)";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <h3 style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "12px",
                color: "#1e293b"
              }}>
                Free Plan
              </h3>
              <div style={{
                fontSize: "48px",
                fontWeight: "800",
                color: "#4f46e5",
                marginBottom: "8px",
                lineHeight: "1"
              }}>
                S$0
              </div>
              <p style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "32px"
              }}>
                Perfect for getting started
              </p>
              <ul style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                marginBottom: "32px"
              }}>
                <li style={{ padding: "12px 0", color: "#475569", fontSize: "15px", borderBottom: "1px solid #e2e8f0" }}>
                  Up to 2 trips per month
                </li>
                <li style={{ padding: "12px 0", color: "#475569", fontSize: "15px", borderBottom: "1px solid #e2e8f0" }}>
                  Photo & Video upload (100 MB per trip)
                </li>
                <li style={{ padding: "12px 0", color: "#475569", fontSize: "15px", borderBottom: "1px solid #e2e8f0" }}>
                  AI-powered Q&A (5 per trip)
                </li>
                <li style={{ padding: "12px 0", color: "#475569", fontSize: "15px", borderBottom: "1px solid #e2e8f0" }}>
                  Budget planning
                </li>
                <li style={{ padding: "12px 0", color: "#475569", fontSize: "15px", borderBottom: "1px solid #e2e8f0" }}>
                  Route optimization
                </li>
                <li style={{ padding: "12px 0", color: "#475569", fontSize: "15px", borderBottom: "1px solid #e2e8f0" }}>
                  Google Maps integration
                </li>
                <li style={{ padding: "12px 0", color: "#475569", fontSize: "15px" }}>
                  Slideshow generation
                </li>
              </ul>
              <p style={{
                fontSize: "12px",
                color: "#94a3b8",
                textAlign: "center",
                marginTop: "auto"
              }}>
                No credit card required • Always free
              </p>
            </div>

            {/* Premium Plan */}
            <div 
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "40px",
                border: "2px solid #4f46e5",
                position: "relative",
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.15)",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 16px 32px rgba(79, 70, 229, 0.25)";
                e.currentTarget.style.borderColor = "#4338ca";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.15)";
                e.currentTarget.style.borderColor = "#4f46e5";
              }}
            >
              <div style={{
                position: "absolute",
                top: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#4f46e5",
                color: "white",
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                POPULAR
              </div>
              <h3 style={{
                fontSize: "24px",
                fontWeight: "700",
                marginTop: "8px",
                marginBottom: "12px",
                color: "#1e293b"
              }}>
                Premium Plan
              </h3>
              <div style={{
                fontSize: "48px",
                fontWeight: "800",
                color: "#4f46e5",
                marginBottom: "8px",
                lineHeight: "1"
              }}>
                S$9.99<span style={{ fontSize: "18px", color: "#94a3b8", fontWeight: "400" }}>/month</span>
              </div>
              <p style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "32px"
              }}>
                For serious travelers
              </p>
              <ul style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                marginBottom: "32px"
              }}>
                <li style={{ padding: "12px 0", color: "#475569", fontSize: "15px", borderBottom: "1px solid #e2e8f0", fontWeight: "600" }}>
                  Everything in Free, plus:
                </li>
                <li style={{ padding: "12px 0", color: "#475569", fontSize: "15px", borderBottom: "1px solid #e2e8f0" }}>
                  Unlimited trips (no monthly limit)
                </li>
                <li style={{ padding: "12px 0", color: "#475569", fontSize: "15px", borderBottom: "1px solid #e2e8f0" }}>
                  Unlimited AI-powered Q&A
                </li>
                <li style={{ padding: "12px 0", color: "#475569", fontSize: "15px", borderBottom: "1px solid #e2e8f0" }}>
                  1GB Photo & Video uploads
                </li>
                <li style={{ padding: "12px 0", color: "#475569", fontSize: "15px" }}>
                  Export trip recap to MP4
                </li>
              </ul>
              <p style={{
                fontSize: "12px",
                color: "#94a3b8",
                textAlign: "center",
                marginTop: "auto"
              }}>
                S$9.99/month • Cancel anytime
              </p>
            </div>
          </div>

          <p style={{
            fontSize: "15px",
            color: "#64748b",
            textAlign: "center",
            marginTop: "40px",
            marginBottom: "32px"
          }}>
            Start with our free plan - upgrade anytime for more features.
          </p>
          <div style={{ textAlign: "center" }}>
            <button
              onClick={onGetStarted}
              style={{
                padding: "16px 40px",
                background: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: "600",
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(79, 70, 229, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.3)";
              }}
            >
              Get Premium
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "40px 24px",
        background: "rgba(79, 70, 229, 0.05)",
        color: "#475569",
        textAlign: "center",
        borderTop: "1px solid rgba(226, 232, 240, 0.5)"
      }}>
        <div style={{ 
          fontSize: "20px", 
          fontWeight: "800", 
          marginBottom: "16px", 
          color: "#4f46e5",
          letterSpacing: "-0.02em"
        }}>
          TripMate
        </div>
        <p style={{ fontSize: "15px", marginBottom: "24px", color: "#64748b" }}>
          Your all-in-one travel planning companion
        </p>
        <p style={{ fontSize: "13px", color: "#94a3b8" }}>
          © 2024 TripMate. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// Feature Grid Component with staggered animations
function FeatureGrid({ featuresTitleVisible }) {
  const [ref, isVisible] = useScrollAnimation();
  
  const features = [
    {
      icon: "🗺️",
      title: "Route Optimization",
      description: "Auto-arrange the best route for a smooth and efficient trip using advanced algorithms."
    },
    {
      icon: "📸",
      title: "Photo Memories",
      description: "Upload and organize photos. Create beautiful slideshows of your journey."
    },
    {
      icon: "🤖",
      title: "AI Assistant",
      description: "Ask questions about your destinations and get AI-powered insights."
    },
    {
      icon: "💰",
      title: "Budget Tracking",
      description: "Set budgets, track expenses, and get alerts when you exceed your spending limits."
    },
    {
      icon: "🎬",
      title: "Video Export",
      description: "Export your trip as a beautiful MP4 video recap with photos and route."
    },
    {
      icon: "✈️",
      title: "Smart Routing",
      description: "Intelligently chooses between driving and flying based on distance and efficiency."
    }
  ];

  return (
    <div 
      ref={ref}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "32px",
        marginTop: "60px"
      }}
    >
      {features.map((feature, idx) => {
        const shouldAnimate = isVisible || featuresTitleVisible;
        return (
          <div
            key={idx}
            style={{
              padding: "32px",
              background: "rgba(248, 250, 252, 0.6)",
              borderRadius: "16px",
              textAlign: "center",
              border: "1px solid rgba(226, 232, 240, 0.5)",
              opacity: shouldAnimate ? 1 : 0,
              transform: shouldAnimate ? "translateY(0) scale(1)" : "translateY(40px) scale(0.9)",
              transition: `opacity 0.6s ease-out ${idx * 0.1}s, transform 0.6s ease-out ${idx * 0.1}s`,
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(79, 70, 229, 0.15)";
              e.currentTarget.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: "20px",
                fontWeight: "700",
                marginBottom: "12px",
                color: "#1e293b",
                letterSpacing: "-0.01em",
                lineHeight: "1.3"
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: "15px",
                color: "#64748b",
                lineHeight: "1.7",
                fontWeight: "400"
              }}>
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    );
}

// Testimonial Grid Component with staggered animations
function TestimonialGrid({ testimonialsTitleVisible }) {
  const [ref, isVisible] = useScrollAnimation();
  
  const testimonials = [
    {
      name: "Sarah M.",
      text: "Planning my trip by having all the attractions already plugged into a map makes trip planning so much easier. All the features are a game-changer!"
    },
    {
      name: "Michael T.",
      text: "I love how I can save my trips and come back to add more photos later. The photo organization is exactly what I needed for my travel memories."
    },
    {
      name: "Emma L.",
      text: "The AI assistant helped me discover amazing places I never would have found. The premium features are totally worth it for serious travelers."
    }
  ];

  return (
    <div 
      ref={ref}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px"
      }}
    >
      {testimonials.map((testimonial, idx) => {
        const shouldAnimate = isVisible || testimonialsTitleVisible;
        return (
          <div
            key={idx}
            style={{
              padding: "32px",
              background: "rgba(255, 255, 255, 0.7)",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid rgba(226, 232, 240, 0.5)",
              opacity: shouldAnimate ? 1 : 0,
              transform: shouldAnimate ? "translateX(0) scale(1)" : `translateX(${idx % 2 === 0 ? '-40px' : '40px'}) scale(0.95)`,
              transition: `opacity 0.7s ease-out ${idx * 0.15}s, transform 0.7s ease-out ${idx * 0.15}s`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.12)";
              e.currentTarget.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
            }}
          >
              <div style={{
                display: "flex",
                gap: "8px",
                marginBottom: "16px"
              }}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: "#fbbf24", fontSize: "20px" }}>⭐</span>
                ))}
              </div>
              <p style={{
                fontSize: "16px",
                color: "#475569",
                lineHeight: "1.7",
                marginBottom: "16px",
                fontWeight: "400"
              }}>
                "{testimonial.text}"
              </p>
              <p style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#1e293b"
              }}>
                - {testimonial.name}
              </p>
            </div>
          );
        })}
      </div>
    );
}
