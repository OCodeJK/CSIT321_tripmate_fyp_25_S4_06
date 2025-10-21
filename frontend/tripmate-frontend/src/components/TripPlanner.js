import React, { useState, useRef } from "react";
import axios from "axios";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Autocomplete,
  Polyline,
  Marker,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "80vh",
};
const defaultCenter = { lat: 1.3521, lng: 103.8198 }; // Singapore

export default function TripPlanner() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const [origin, setOrigin] = useState({ name: "", lat: "", lng: "", country: "" });
  const [originAutocomplete, setOriginAutocomplete] = useState(null);
  const [locations, setLocations] = useState([{ name: "", lat: "", lng: "", country: "" }]);
  const [autocompleteRefs, setAutocompleteRefs] = useState([]);
  const [directions, setDirections] = useState(null);
  const [airportDirections, setAirportDirections] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [routeMode, setRouteMode] = useState("DRIVING");
  const [flightPath, setFlightPath] = useState(null);
  const [airportMarkers, setAirportMarkers] = useState([]);
  const mapRef = useRef(null);
  const [mapKey, setMapKey] = useState(0);


  // 🗺️ Clear map function (now clears flight line + resets map view)
  const clearMap = () => {
    setDirections(null);
    setAirportDirections(null);
    setFlightPath(null);
    setAirportMarkers([]);
    setTotalDistance(0);
    setRouteMode("DRIVING");
    setOrigin({ name: "", lat: "", lng: "", country: "" });
    setLocations([{ name: "", lat: "", lng: "", country: "" }]);
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
    }
  };

  const onPlaceChanged = (index) => {
    const place = autocompleteRefs[index].getPlace();
    if (place && place.geometry) {
      const country = getCountry(place);
      const updated = [...locations];
      updated[index] = {
        name: place.name,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        country,
      };
      setLocations(updated);
    }
  };

  const getCountry = (place) => {
    const comp = place.address_components?.find((c) =>
      c.types.includes("country")
    );
    return comp ? comp.long_name : "";
  };

  const addLocation = () => {
    setLocations([...locations, { name: "", lat: "", lng: "", country: "" }]);
  };

  const removeLocation = (index) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  // const getNearestAirport = (country) => {
  //   const airports = {
  //     Singapore: { name: "Changi Airport (SIN)", lat: 1.3644, lng: 103.9915 },
  //     "United Kingdom": { name: "London Heathrow Airport (LHR)",lat: 51.47,lng: -0.4543, },
  //     Japan: { name: "Tokyo Haneda Airport (HND)", lat: 35.5494, lng: 139.7798 },
  //     Australia: { name: "Sydney Kingsford Smith Airport (SYD)", lat: -33.9399, lng: 151.1753, },
  //     USA: { name: "Los Angeles International Airport (LAX)", lat: 33.9416, lng: -118.4085, },
  //     "South Korea": { name: "Jeju International Airport (CJU)", lat: 33.5113, lng: 126.4930, }
  //   };
  //   return airports[country] || null;
  // };

  const getNearestAirport = async (lat, lng) => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/trip-planner/nearest-airport", { lat, lng });
      return res.data; // { name, lat, lng, iata }
    } catch (err) {
      console.error("Error fetching nearest airport:", err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleaned = locations.filter((l) => l.name && l.lat && l.lng);
    if (!origin.name || cleaned.length < 1) {
      alert("Please enter an origin and at least one destination.");
      return;
    }

    const isInternational = cleaned.some((loc) => loc.country !== origin.country);

    if (isInternational) {
      setRouteMode("INTERNATIONAL");
      const originAirport = await getNearestAirport(origin.lat, origin.lng);
      if (!originAirport) {
        alert("Airport not found near origin.");
        return;
      }

      // ✈️ Step 1: Fly to the first destination country
      const firstDest = cleaned[0];
      const destAirport = await getNearestAirport(firstDest.lat, firstDest.lng);
      if (!destAirport) {
        alert("Airport not found near first destination.");
        return;
      }

      const directionsService = new window.google.maps.DirectionsService();

      // 🏠 → ✈️ Drive to origin airport
      directionsService.route(
        {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: originAirport.lat, lng: originAirport.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            setAirportDirections(result);
          } else {
            console.error("Error driving to local airport:", status);
          }
        }
      );

      // ✈️ Flight (direct line between airports)
      setFlightPath({
        originAirport,
        destAirport,
      });

      // 🛬 Step 2: After landing → drive through all destinations in the same country
      const domesticWaypoints = cleaned.slice(0).map((loc) => ({
        location: { lat: loc.lat, lng: loc.lng },
        stopover: true,
      }));

      directionsService.route(
        {
          origin: { lat: destAirport.lat, lng: destAirport.lng },
          destination: domesticWaypoints[domesticWaypoints.length - 1].location,
          waypoints: domesticWaypoints.slice(0, -1),
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            setDirections(result);
          } else {
            console.error("Error driving within destination country:", status);
          }
        }
      );

      // 🛫 Airport markers
      setAirportMarkers([originAirport, destAirport]);

      // Flight distance
      const flightDist = getFlightDistance(
        originAirport.lat,
        originAirport.lng,
        destAirport.lat,
        destAirport.lng
      );
      setTotalDistance(flightDist);
      return;
    }

    // Local (domestic) trip logic
    const res = await axios.post("http://127.0.0.1:5000/api/trip-planner/plan", {
      origin,
      destinations: cleaned,
    });

    const { optimized_route, total_distance_km } = res.data;
    setTotalDistance(total_distance_km);
    setRouteMode("DRIVING");

    const waypoints = optimized_route.slice(1, -1).map((loc) => ({
      location: { lat: loc.lat, lng: loc.lng },
      stopover: true,
    }));

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: optimized_route[0],
        destination: optimized_route[optimized_route.length - 1],
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

  const getFlightDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  if (!isLoaded) return <div>Loading Google Maps...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>🌍 Trip Planner</h2>

      <form onSubmit={handleSubmit}>
        <h4>Starting Point (Origin)</h4>
        <Autocomplete
          onLoad={(ref) => setOriginAutocomplete(ref)}
          onPlaceChanged={onOriginChanged}
        >
          <input
            type="text"
            placeholder="Enter your starting location..."
            value={origin.name}
            onChange={(e) => setOrigin({ ...origin, name: e.target.value })}
            style={{ width: "300px" }}
          />
        </Autocomplete>

        <h4>Destinations</h4>
        {locations.map((loc, index) => (
          <div key={index} style={{ marginBottom: "10px", display: "flex" }}>
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
                placeholder="Enter destination..."
                value={locations[index].name}
                onChange={(e) => {
                  const updated = [...locations];
                  updated[index].name = e.target.value;
                  setLocations(updated);
                }}
                style={{ width: "300px", marginRight: "10px" }}
              />
            </Autocomplete>
            <button type="button" onClick={() => removeLocation(index)}>❌</button>
          </div>
        ))}
        <div style={{ marginTop: "10px" }}>
          <button type="button" onClick={addLocation}>➕ Add Destination</button>
          <button type="submit" style={{ marginLeft: "10px" }}>🚗 Plan Trip</button>
          <button
            type="button"
            onClick={clearMap}
            style={{
              marginLeft: "10px",
              backgroundColor: "#f87171",
              color: "white",
              border: "none",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            🧹 Clear Map
          </button>
        </div>
      </form>

      <p>
        {routeMode === "DRIVING" && totalDistance > 0 && `🚘 Total Driving Distance: ${totalDistance} km`}
        {routeMode === "INTERNATIONAL" && `✈️ Includes flight (~${totalDistance} km)`}
      </p>

      <GoogleMap
        key={mapKey}
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={3}
        onLoad={(map) => (mapRef.current = map)}
      >
        {airportDirections && routeMode === "INTERNATIONAL" && (
          <DirectionsRenderer directions={airportDirections} />
        )}

        {flightPath && (
          <Polyline
            path={[
              { lat: flightPath.originAirport.lat, lng: flightPath.originAirport.lng },
              { lat: flightPath.destAirport.lat, lng: flightPath.destAirport.lng },
            ]}
            options={{
              strokeColor: "#1E90FF",
              strokeOpacity: 0.8,
              strokeWeight: 2,
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
        )}

        {directions && <DirectionsRenderer directions={directions} />}

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
  );
}
