import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Autocomplete,
  Polyline,
  Marker,
} from "@react-google-maps/api";
import PhotoManager from "./PhotoManager";
import Slideshow from "./Slideshow";
import AIChat from "./AIChat";
import ExportButton from "./ExportButton";

const containerStyle = {
  width: "100%",
  height: "60vh",
  borderRadius: "12px",
  overflow: "hidden",
};
const defaultCenter = { lat: 1.3521, lng: 103.8198 }; // Singapore

export default function TripPlanner({ token, user, tripId, onBack }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const [tripName, setTripName] = useState("");
  const [tripDescription, setTripDescription] = useState("");
  const [tripBudget, setTripBudget] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  // Ensure currentTripId is always a number or null
  const [currentTripId, setCurrentTripId] = useState(
    tripId && typeof tripId === 'number' ? tripId : 
    tripId && typeof tripId === 'object' && tripId.id ? tripId.id :
    tripId && !isNaN(Number(tripId)) ? Number(tripId) : null
  );
  const [origin, setOrigin] = useState({ name: "", lat: "", lng: "", country: "" });
  const [originAutocomplete, setOriginAutocomplete] = useState(null);
  const [locations, setLocations] = useState([{ name: "", lat: "", lng: "", country: "" }]);
  const [autocompleteRefs, setAutocompleteRefs] = useState([]);
  const [directions, setDirections] = useState(null);
  const [airportDirections, setAirportDirections] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [routeMode, setRouteMode] = useState("DRIVING");
  const [flightPaths, setFlightPaths] = useState([]);
  const [airportMarkers, setAirportMarkers] = useState([]);
  const [travelPreference, setTravelPreference] = useState("auto");
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [photos, setPhotos] = useState({});
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: "", description: "", amount: "" });
  const [isEnded, setIsEnded] = useState(false);
  const mapRef = useRef(null);
  const [mapKey, setMapKey] = useState(0);

  const loadTripPhotos = useCallback(async (id) => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/photos/trip/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const photosList = res.data.photos;
      const photosByLocation = {};
      photosList.forEach(photo => {
        if (!photosByLocation[photo.location_name]) {
          photosByLocation[photo.location_name] = [];
        }
        photosByLocation[photo.location_name].push(photo);
      });
      setPhotos(photosByLocation);
    } catch (err) {
      console.error("Error loading photos:", err);
    }
  }, [token]);

  const loadTrip = useCallback(async (id) => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const trip = res.data.trip;
      setTripName(trip.name);
      setTripDescription(trip.description || "");
      setTripBudget(trip.budget ? trip.budget.toString() : "");
      setTripStartDate(trip.start_date ? trip.start_date.split('T')[0] : "");
      // Ensure trip.id is converted to a number
      setCurrentTripId(trip.id ? Number(trip.id) : null);
      setTravelPreference(trip.travel_preference || "auto");
      setTotalDistance(trip.total_distance_km || 0);
      setRouteMode(trip.route_mode || "DRIVING");
      
      // Store initial state for comparison
      const initialData = {
        name: trip.name,
        description: trip.description || "",
        budget: trip.budget ? trip.budget.toString() : "",
        startDate: trip.start_date ? trip.start_date.split('T')[0] : "",
        travelPreference: trip.travel_preference || "auto"
      };
      setLastSavedData(JSON.stringify(initialData));
      setHasUnsavedChanges(false);
      
      if (trip.origin) {
        setOrigin(trip.origin);
      }
      // Ensure destinations is always an array
      if (trip.destinations) {
        const destinations = Array.isArray(trip.destinations) ? trip.destinations : [];
        setLocations(destinations.length > 0 ? destinations : [{ name: "", lat: "", lng: "", country: "" }]);
      }
      // Ensure optimized_route is always an array
      const route = Array.isArray(trip.optimized_route) ? trip.optimized_route : [];
      setOptimizedRoute(route);
      
      if (route.length > 0) {
        const hasAirports = route.some(loc => loc.type === "airport");
        if (hasAirports) {
          renderMixedRoute(route);
        } else {
          renderDrivingRoute(route);
        }
      }

      // Load photos
      loadTripPhotos(id);
      
      // Load budget data
      loadBudgetData(id);
    } catch (err) {
      console.error("Error loading trip:", err);
    }
  }, [token, loadTripPhotos]);

  // Load existing trip if tripId provided
  useEffect(() => {
    // Normalize tripId to a number
    const normalizedTripId = tripId && typeof tripId === 'number' ? tripId : 
                             tripId && typeof tripId === 'object' && tripId.id ? tripId.id :
                             tripId && !isNaN(Number(tripId)) ? Number(tripId) : null;
    
    if (normalizedTripId && token) {
      setCurrentTripId(normalizedTripId);
      loadTrip(normalizedTripId);
    } else if (!tripId) {
      // Reset if no tripId provided (new trip)
      setCurrentTripId(null);
      setTripName("");
      setTripDescription("");
      setTripBudget("");
      setTripStartDate("");
      setLastSavedData(null);
      setHasUnsavedChanges(false);
    }
  }, [tripId, token, loadTrip]);

  const clearMap = () => {
    setDirections(null);
    setAirportDirections(null);
    setFlightPaths([]);
    setAirportMarkers([]);
    setTotalDistance(0);
    setRouteMode("DRIVING");
    setOrigin({ name: "", lat: "", lng: "", country: "" });
    setLocations([{ name: "", lat: "", lng: "", country: "" }]);
    setOptimizedRoute([]);
    setPhotos({});
    setMapKey(prev => prev + 1);

    if (mapRef.current) {
      mapRef.current.panTo(defaultCenter);
      mapRef.current.setZoom(3);
    }
  };

  const onOriginChanged = () => {
    const place = originAutocomplete.getPlace();
    if (place && place.geometry) {
      const country = getCountry(place);
      setOrigin({
        name: place.name,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        country,
      });
      checkForUnsavedChanges();
    }
  };

  const onPlaceChanged = (index) => {
    const place = autocompleteRefs[index].getPlace();
    if (place && place.geometry) {
      const country = getCountry(place);
      const safeLocations = Array.isArray(locations) ? locations : [];
      const updated = [...safeLocations];
      updated[index] = {
        name: place.name,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        country,
      };
      setLocations(updated);
      checkForUnsavedChanges();
    }
  };

  const getCountry = (place) => {
    const comp = place.address_components?.find((c) =>
      c.types.includes("country")
    );
    return comp ? comp.long_name : "";
  };

  const addLocation = () => {
    const safeLocations = Array.isArray(locations) ? locations : [];
    setLocations([...safeLocations, { name: "", lat: "", lng: "", country: "" }]);
    checkForUnsavedChanges();
  };

  const removeLocation = (index) => {
    const safeLocations = Array.isArray(locations) ? locations : [];
    setLocations(safeLocations.filter((_, i) => i !== index));
    checkForUnsavedChanges();
  };

  const checkForUnsavedChanges = () => {
    if (!lastSavedData) {
      setHasUnsavedChanges(true);
      return;
    }
    
    const currentData = {
      name: tripName,
      description: tripDescription,
      budget: tripBudget,
      startDate: tripStartDate,
      travelPreference: travelPreference
    };
    
    const currentDataStr = JSON.stringify(currentData);
    setHasUnsavedChanges(currentDataStr !== lastSavedData);
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to leave? Your changes will be lost.")) {
        return;
      }
    }
    if (onBack) {
      onBack();
    }
  };

  const loadBudgetData = async (tripId) => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/budget/trip/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudgetData(res.data);
      setBudgetItems(res.data.items || []);
    } catch (err) {
      console.error("Error loading budget:", err);
    }
  };

  const addExpense = async () => {
    if (!newExpense.category || !newExpense.amount) {
      alert("Please fill in category and amount");
      return;
    }

    try {
      await axios.post(`http://127.0.0.1:5000/api/budget/trip/${currentTripId}`, {
        category: newExpense.category,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewExpense({ category: "", description: "", amount: "" });
      loadBudgetData(currentTripId);
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Failed to add expense");
    }
  };

  const deleteExpense = async (itemId) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/api/budget/item/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadBudgetData(currentTripId);
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  const endTrip = async () => {
    if (!window.confirm("Are you sure you want to end this trip? This action cannot be undone.")) {
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await axios.put(`http://127.0.0.1:5000/api/trips/${currentTripId}`, {
        end_date: today
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEnded(true);
      alert("Trip ended successfully!");
      // Navigate back to trip history
      if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error("Error ending trip:", err);
      alert("Failed to end trip");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tripName.trim()) {
      alert("Please enter a trip name");
      return;
    }

    if (!tripStartDate) {
      alert("Please enter a trip start date");
      return;
    }

    const safeLocations = Array.isArray(locations) ? locations : [];
    const cleaned = safeLocations.filter((l) => l.name && l.lat && l.lng);
    if (!origin.name || cleaned.length < 1) {
      alert("Please enter an origin and at least one destination.");
      return;
    }

    setLoading(true);

    try {
      // Validate that origin and destinations have coordinates
      if (!origin.lat || !origin.lng) {
        alert("Please select a valid starting point from the autocomplete suggestions.");
        setLoading(false);
        return;
      }

      for (const dest of cleaned) {
        if (!dest.lat || !dest.lng) {
          alert("Please select valid destinations from the autocomplete suggestions.");
          setLoading(false);
          return;
        }
      }

      // Plan the route
      const planRes = await axios.post("http://127.0.0.1:5000/api/trip-planner/plan", {
        origin: {
          name: origin.name,
          lat: parseFloat(origin.lat),
          lng: parseFloat(origin.lng),
          country: origin.country || ""
        },
        destinations: cleaned.map(dest => ({
          name: dest.name,
          lat: parseFloat(dest.lat),
          lng: parseFloat(dest.lng),
          country: dest.country || ""
        })),
        preference: travelPreference,
      });

      const { optimized_route, total_distance_km } = planRes.data;
      setTotalDistance(total_distance_km);
      
      // Ensure optimized_route is always an array
      const route = Array.isArray(optimized_route) ? optimized_route : [];
      setOptimizedRoute(route);

      const hasAirports = route.some(loc => loc.type === "airport");
      const routeModeValue = hasAirports ? "MIXED" : "DRIVING";
      setRouteMode(routeModeValue);
      
      if (hasAirports) {
        renderMixedRoute(route);
      } else {
        renderDrivingRoute(route);
      }

      // Save trip to database (only if authenticated)
      if (token) {
        const tripData = {
          name: tripName,
          description: tripDescription,
          origin: {
            name: origin.name,
            lat: origin.lat,
            lng: origin.lng,
            country: origin.country || ""
          },
          destinations: cleaned.map(dest => ({
            name: dest.name,
            lat: dest.lat,
            lng: dest.lng,
            country: dest.country || ""
          })),
          optimized_route: route,
          total_distance_km,
          route_mode: routeModeValue,
          travel_preference: travelPreference,
          budget: tripBudget ? parseFloat(tripBudget) : null,
          start_date: tripStartDate || null
        };

        try {
          // Ensure currentTripId is a number before using it
          const tripIdNum = currentTripId ? Number(currentTripId) : null;
          
          if (tripIdNum && !isNaN(tripIdNum)) {
            // Update existing trip
            await axios.put(`http://127.0.0.1:5000/api/trips/${tripIdNum}`, tripData, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setHasUnsavedChanges(false);
            setLastSavedData(JSON.stringify(tripData));
            // Reload budget data to reflect the updated initial budget
            loadBudgetData(tripIdNum);
            alert("Trip updated successfully!");
          } else {
            // Create new trip
            const saveRes = await axios.post("http://127.0.0.1:5000/api/trips/", tripData, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const newTripId = saveRes.data.trip.id ? Number(saveRes.data.trip.id) : null;
            setCurrentTripId(newTripId);
            setHasUnsavedChanges(false);
            setLastSavedData(JSON.stringify(tripData));
            // Load budget data for the newly created trip
            if (newTripId) {
              loadBudgetData(newTripId);
            }
            alert("Trip saved successfully!");
          }
        } catch (saveErr) {
          console.error("Error saving trip:", saveErr);
          let errorMsg = "Trip planned successfully, but could not save.";
          
          if (saveErr.response) {
            if (saveErr.response.status === 401) {
              errorMsg = "Authentication failed. Please sign in again to save trips.";
            } else if (saveErr.response.data?.error) {
              errorMsg = `Error saving trip: ${saveErr.response.data.error}`;
            } else {
              errorMsg = `Error saving trip: ${saveErr.response.status} ${saveErr.response.statusText}`;
            }
          } else if (saveErr.message) {
            errorMsg = `Error saving trip: ${saveErr.message}`;
          }
          
          alert(errorMsg);
        }
      } else {
        alert("Trip planned successfully! Sign in to save your trip.");
      }
    } catch (err) {
      console.error("Error planning/saving trip:", err);
      
      let errorMessage = "Failed to plan trip. ";
      
      if (!err.response) {
        errorMessage += "Cannot connect to server. Make sure the backend is running on http://127.0.0.1:5000";
      } else if (err.response.status === 400) {
        errorMessage += err.response.data?.error || "Invalid request. Please check your inputs.";
      } else if (err.response.status === 500) {
        errorMessage += "Server error: " + (err.response.data?.error || "Internal server error");
      } else {
        errorMessage += err.response.data?.error || "Unknown error occurred";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderDrivingRoute = (route) => {
    const waypoints = route.slice(1, -1).map((loc) => ({
      location: { lat: loc.lat, lng: loc.lng },
      stopover: true,
    }));

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: route[0],
        destination: route[route.length - 1],
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
        } else {
          console.error("Error fetching directions:", status);
        }
      }
    );
  };

  const renderMixedRoute = (route) => {
    const directionsService = new window.google.maps.DirectionsService();
    const airportMarkers = [];
    const flightPaths = [];
    const drivingSegments = [];

    const airports = route.filter(loc => loc.type === "airport");
    
    for (let i = 0; i < airports.length - 1; i++) {
      flightPaths.push({
        originAirport: airports[i],
        destAirport: airports[i + 1],
      });
    }

    let currentDrivingSegment = [];
    for (let i = 0; i < route.length; i++) {
      const loc = route[i];
      
      if (loc.type === "airport") {
        airportMarkers.push(loc);
        
        if (currentDrivingSegment.length > 0) {
          currentDrivingSegment.push(loc);
          drivingSegments.push([...currentDrivingSegment]);
          currentDrivingSegment = [];
        }
      } else {
        if (currentDrivingSegment.length === 0 && i > 0 && route[i-1].type === "airport") {
          currentDrivingSegment = [route[i-1], loc];
        } else {
          currentDrivingSegment.push(loc);
        }
      }
    }
    
    if (currentDrivingSegment.length > 1) {
      drivingSegments.push(currentDrivingSegment);
    }

    drivingSegments.forEach((segment, idx) => {
      if (segment.length >= 2) {
        const waypoints = segment.slice(1, -1).map((loc) => ({
          location: { lat: loc.lat, lng: loc.lng },
          stopover: true,
        }));

        directionsService.route(
          {
            origin: segment[0],
            destination: segment[segment.length - 1],
            waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK" && result) {
              if (idx === 0) {
                setDirections(result);
              } else {
                setAirportDirections(result);
              }
            } else {
              console.error(`Error fetching directions for segment ${idx}:`, status);
            }
          }
        );
      }
    });

    setFlightPaths(flightPaths);
    setAirportMarkers(airportMarkers);
  };

  // Ensure optimizedRoute is always an array before using filter
  const safeOptimizedRoute = Array.isArray(optimizedRoute) ? optimizedRoute : [];
  // Ensure locations is always an array before using filter
  const safeLocations = Array.isArray(locations) ? locations : [];
  const allRouteLocations = safeOptimizedRoute.length > 0 
    ? safeOptimizedRoute.filter(loc => !loc.type || loc.type !== "airport")
    : [origin, ...safeLocations.filter(l => l.name && l.lat && l.lng)];

  if (!isLoaded) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        fontSize: "18px",
        color: "#64748b"
      }}>
        Loading Google Maps...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
      {onBack && (
        <button
          onClick={handleBackClick}
          style={{
            marginBottom: "24px",
            padding: "10px 20px",
            background: "white",
            color: "#4f46e5",
            border: "1px solid #4f46e5",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#4f46e5";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.color = "#4f46e5";
          }}
        >
          ← Back to Trips
        </button>
      )}

      <div style={{ 
        background: "white", 
        borderRadius: "16px", 
        padding: "32px", 
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        border: "1px solid #f1f5f9"
      }}>
        <h1 style={{ 
          fontSize: "24px", 
          fontWeight: "800", 
          marginBottom: "8px",
          color: "#0f172a",
          letterSpacing: "-0.02em",
          lineHeight: "1.2"
        }}>
          {currentTripId ? "Edit Trip" : "Plan New Trip"}
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "13px", 
              fontWeight: "600",
              color: "#475569"
            }}>
              Trip Name
            </label>
            <input
              type="text"
              value={tripName}
              onChange={(e) => {
                setTripName(e.target.value);
                checkForUnsavedChanges();
              }}
              placeholder="e.g., Summer Europe Adventure"
              required
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  fontSize: "15px",
                  background: "white",
                  transition: "all 0.2s ease",
                  outline: "none",
                  fontFamily: "inherit"
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
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "13px", 
              fontWeight: "600",
              color: "#475569"
            }}>
              Description <span style={{ fontWeight: "400", fontSize: "12px", color: "#94a3b8" }}>(optional)</span>
            </label>
            <textarea
              value={tripDescription}
              onChange={(e) => {
                setTripDescription(e.target.value);
                checkForUnsavedChanges();
              }}
              placeholder="Add a description for your trip..."
              rows={3}
              style={{
                width: "100%",
                maxWidth: "600px",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                fontSize: "15px",
                background: "white",
                transition: "all 0.2s ease",
                outline: "none",
                fontFamily: "inherit",
                resize: "vertical"
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
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "13px", 
              fontWeight: "600",
              color: "#475569"
            }}>
              Starting Budget <span style={{ fontWeight: "400", fontSize: "12px", color: "#94a3b8" }}>(optional)</span>
            </label>
            <input
              type="number"
              value={tripBudget}
              onChange={(e) => {
                setTripBudget(e.target.value);
                checkForUnsavedChanges();
              }}
              placeholder="Enter your starting budget..."
              min="0"
              step="0.01"
              style={{
                width: "100%",
                maxWidth: "600px",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                fontSize: "15px",
                background: "white",
                transition: "all 0.2s ease",
                outline: "none",
                fontFamily: "inherit"
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
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "13px", 
              fontWeight: "600",
              color: "#475569"
            }}>
              Trip Start Date
            </label>
            <input
              type="date"
              value={tripStartDate}
              required
              onChange={(e) => {
                setTripStartDate(e.target.value);
                checkForUnsavedChanges();
              }}
              style={{
                width: "100%",
                maxWidth: "600px",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                fontSize: "15px",
                background: "white",
                transition: "all 0.2s ease",
                outline: "none",
                fontFamily: "inherit"
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
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "10px", 
              fontSize: "13px", 
              fontWeight: "600",
              color: "#475569"
            }}>
              Travel Preference
            </label>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { value: "auto", label: "Auto", icon: "🚗✈️" },
                { value: "driving", label: "Driving", icon: "🚗" },
                { value: "flying", label: "Flying", icon: "✈️" }
              ].map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: `1px solid ${travelPreference === option.value ? "#4f46e5" : "#e2e8f0"}`,
                    background: travelPreference === option.value ? "#4f46e5" : "white",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: travelPreference === option.value ? "white" : "#64748b",
                    transition: "all 0.2s ease",
                    flex: "1",
                    minWidth: "120px",
                    justifyContent: "center"
                  }}
                  onMouseEnter={(e) => {
                    if (travelPreference !== option.value) {
                      e.currentTarget.style.borderColor = "#4f46e5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (travelPreference !== option.value) {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="preference"
                    value={option.value}
                    checked={travelPreference === option.value}
                    onChange={(e) => {
                      setTravelPreference(e.target.value);
                      checkForUnsavedChanges();
                    }}
                    style={{ marginRight: "8px", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "16px", marginRight: "6px" }}>{option.icon}</span>
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "13px", 
              fontWeight: "600",
              color: "#475569"
            }}>
              Starting Point
            </label>
            <Autocomplete
              onLoad={(ref) => setOriginAutocomplete(ref)}
              onPlaceChanged={onOriginChanged}
            >
              <input
                type="text"
                placeholder="Enter your starting location..."
                defaultValue={origin.name}
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  fontSize: "15px",
                  background: "white",
                  transition: "all 0.2s ease",
                  outline: "none",
                  fontFamily: "inherit"
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
            </Autocomplete>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "8px"
            }}>
              <label style={{ 
                fontSize: "13px", 
                fontWeight: "600",
                color: "#475569"
              }}>
                Destinations
              </label>
              <button
                type="button"
                onClick={addLocation}
                style={{
                  padding: "8px 16px",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#475569",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#4f46e5";
                  e.currentTarget.style.background = "#4f46e5";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#475569";
                }}
              >
                + Add Destination
              </button>
            </div>
            {(Array.isArray(locations) ? locations : []).map((loc, index) => {
              const safeLocations = Array.isArray(locations) ? locations : [];
              return (
              <div key={index} style={{ 
                marginBottom: "12px", 
                display: "flex", 
                gap: "8px",
                alignItems: "center"
              }}>
                <Autocomplete
                  onLoad={(ref) => {
                    const newRefs = [...autocompleteRefs];
                    newRefs[index] = ref;
                    setAutocompleteRefs(newRefs);
                  }}
                  onPlaceChanged={() => onPlaceChanged(index)}
                >
                  <input
                    type="text"
                    placeholder={`Destination ${index + 1}...`}
                    defaultValue={safeLocations[index]?.name || ""}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      fontSize: "15px",
                      background: "white",
                      transition: "all 0.2s ease",
                      outline: "none",
                      fontFamily: "inherit"
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
                </Autocomplete>
                {Array.isArray(locations) && locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLocation(index)}
                    style={{
                      padding: "10px 16px",
                      background: "white",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fef2f2";
                      e.currentTarget.style.borderColor = "#fca5a5";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = "#fecaca";
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={clearMap}
              style={{
                padding: "10px 20px",
                background: "white",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#4f46e5";
                e.currentTarget.style.background = "#4f46e5";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              Clear
            </button>
          </div>
        </form>

        {totalDistance > 0 && (
          <div style={{
            marginTop: "20px",
            padding: "12px 16px",
            background: "#f8fafc",
            borderRadius: "10px",
            fontSize: "13px",
            color: "#64748b",
            border: "1px solid #e2e8f0"
          }}>
            {routeMode === "DRIVING" && `Total Distance: ${totalDistance.toFixed(1)} km`}
            {routeMode === "MIXED" && `Mixed Route: ${totalDistance.toFixed(1)} km`}
          </div>
        )}
      </div>

      {Array.isArray(optimizedRoute) && optimizedRoute.length > 0 && (
        <div style={{ 
          background: "white", 
          borderRadius: "16px", 
          padding: "24px", 
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #f1f5f9"
        }}>
          <GoogleMap
            key={mapKey}
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={3}
            onLoad={(map) => (mapRef.current = map)}
            options={{
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            }}
          >
            {airportDirections && (routeMode === "MIXED") && (
              <DirectionsRenderer directions={airportDirections} />
            )}

            {flightPaths.map((flightPath, idx) => (
              <Polyline
                key={idx}
                path={[
                  { lat: flightPath.originAirport.lat, lng: flightPath.originAirport.lng },
                  { lat: flightPath.destAirport.lat, lng: flightPath.destAirport.lng },
                ]}
                options={{
                  strokeColor: "#1E90FF",
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                  icons: [
                    {
                      icon: {
                        path: "M 0,-1 0,1",
                        strokeOpacity: 1,
                        scale: 4,
                      },
                      offset: "0",
                      repeat: "20px",
                    },
                  ],
                }}
              />
            ))}

            {directions && (routeMode === "DRIVING" || routeMode === "MIXED") && (
              <DirectionsRenderer directions={directions} />
            )}

            {airportMarkers.map((a, i) => (
              <Marker
                key={i}
                position={{ lat: a.lat, lng: a.lng }}
                label={{ text: "✈️", fontSize: "16px" }}
                title={a.name}
              />
            ))}
          </GoogleMap>
        </div>
      )}

      {optimizedRoute.length > 0 && currentTripId && (
        <>
          <PhotoManager
            locations={allRouteLocations}
            onPhotosUpdate={setPhotos}
            tripId={currentTripId}
            token={token}
          />

          {Object.keys(photos).length > 0 && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              marginTop: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center"
            }}>
              <button
                onClick={() => setShowSlideshow(true)}
                style={{
                  padding: "12px 32px",
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600"
                }}
              >
                🎬 View Slideshow
              </button>
            </div>
          )}

          {/* Budget Tracking Section */}
          {currentTripId && (
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              marginTop: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #f1f5f9"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px"
              }}>
                <h3 style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#1e293b",
                  margin: 0
                }}>
                  Budget Tracker
                </h3>
                {isEnded && (
                  <span style={{
                    padding: "6px 12px",
                    background: "#f1f5f9",
                    color: "#64748b",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    Trip Ended
                  </span>
                )}
              </div>

              {budgetData && (
                <>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "16px",
                    marginBottom: "24px"
                  }}>
                    <div style={{
                      padding: "20px",
                      background: "#f8fafc",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0"
                    }}>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>
                        Initial Budget
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>
                        ${budgetData.initial_budget?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                      </div>
                    </div>
                    <div style={{
                      padding: "20px",
                      background: "#f8fafc",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0"
                    }}>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>
                        Total Spent
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: "700", color: budgetData.exceeded ? "#dc2626" : "#1e293b" }}>
                        ${budgetData.total_spent?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                      </div>
                    </div>
                    <div style={{
                      padding: "20px",
                      background: budgetData.exceeded ? "#fef2f2" : "#f0fdf4",
                      borderRadius: "12px",
                      border: `1px solid ${budgetData.exceeded ? "#fecaca" : "#bbf7d0"}`
                    }}>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>
                        Remaining
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: "700", color: budgetData.exceeded ? "#dc2626" : "#16a34a" }}>
                        ${budgetData.remaining?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                      </div>
                    </div>
                  </div>

                  {!isEnded && (
                    <div style={{
                      padding: "20px",
                      background: "#f8fafc",
                      borderRadius: "12px",
                      marginBottom: "24px",
                      border: "1px solid #e2e8f0"
                    }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "16px" }}>
                        Add Expense
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr auto", gap: "12px", alignItems: "end" }}>
                        <div>
                          <input
                            type="text"
                            placeholder="Category (e.g., Food, Transport)"
                            value={newExpense.category}
                            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              fontSize: "14px",
                              background: "white"
                            }}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Description (optional)"
                            value={newExpense.description}
                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              fontSize: "14px",
                              background: "white"
                            }}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Amount"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                            min="0"
                            step="0.01"
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              fontSize: "14px",
                              background: "white"
                            }}
                          />
                        </div>
                        <button
                          onClick={addExpense}
                          style={{
                            padding: "10px 20px",
                            background: "#4f46e5",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {budgetItems.length > 0 && (
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "12px" }}>
                        Expenses
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {budgetItems.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              padding: "14px 16px",
                              background: "#fafafa",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "2px" }}>
                                {item.category}
                              </div>
                              {item.description && (
                                <div style={{ fontSize: "12px", color: "#64748b" }}>
                                  {item.description}
                                </div>
                              )}
                              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                                {new Date(item.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                                ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              {!isEnded && (
                                <button
                                  onClick={() => deleteExpense(item.id)}
                                  style={{
                                    padding: "6px 10px",
                                    background: "transparent",
                                    border: "none",
                                    color: "#dc2626",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    borderRadius: "6px",
                                    transition: "background 0.2s"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#fee2e2";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                  }}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <AIChat locations={allRouteLocations} photos={photos} token={token} user={user} />

          <ExportButton
            locations={allRouteLocations}
            photos={photos}
            routeData={{ optimizedRoute, totalDistance, routeMode }}
            token={token}
            user={user}
          />
        </>
      )}
      

      {showSlideshow && (
        <Slideshow photos={photos} onClose={() => setShowSlideshow(false)} />
      )}

      {/* Action Buttons at Bottom */}
      <div style={{
        position: "sticky",
        bottom: 0,
        background: "white",
        padding: "16px 24px",
        marginTop: "24px",
        borderRadius: "16px 16px 0 0",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
        borderTop: "1px solid #f1f5f9",
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        flexWrap: "wrap",
        zIndex: 10
      }}>
        <button
          type="button"
          onClick={(e) => handleSubmit(e)}
          disabled={loading}
          style={{
            padding: "12px 32px",
            background: loading ? "#cbd5e1" : "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            minWidth: "160px"
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "#4338ca";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          {loading ? "Planning..." : currentTripId ? "💾 Update Trip" : (token ? "✨ Plan & Save Trip" : "🗺️ Plan Trip")}
        </button>
        {currentTripId && !isEnded && (
          <button
            type="button"
            onClick={endTrip}
            style={{
              padding: "12px 24px",
              background: "#fee2e2",
              color: "#dc2626",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fecaca";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            End Trip
          </button>
        )}
        {currentTripId && (
          <button
            type="button"
            onClick={handleBackClick}
            style={{
              padding: "12px 24px",
              background: "white",
              color: "#4f46e5",
              border: "1px solid #4f46e5",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.color = "#4f46e5";
            }}
          >
            ← Back to Trips
          </button>
        )}
      </div>
    </div>
  );
}
