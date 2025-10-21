from flask import Flask, request, jsonify
from flask_cors import CORS
import math, csv, heapq, itertools

app = Flask(__name__)
CORS(app)

# --- Haversine Distance ---
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (
        math.sin(dLat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dLon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# --- Load airports from dataset ---
# --- Load airports and filter only those used in routes ---
def load_airports_and_routes():
    # Step 1: Load all airports
    airports = {}
    with open("airports.dat", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            try:
                iata = row[4].strip()
                if not iata or len(iata) != 3:
                    continue
                name = row[1]
                lat, lng = float(row[6]), float(row[7])
                airports[iata] = {"name": name, "lat": lat, "lng": lng}
            except:
                continue

    # Step 2: Load routes and collect airports that have scheduled flights
    used_airports = set()
    graph = {}

    with open("routes.dat", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 5:
                continue
            src, dest = row[2].strip(), row[4].strip()
            if src in airports and dest in airports:
                used_airports.update([src, dest])
                d = haversine(
                    airports[src]["lat"], airports[src]["lng"],
                    airports[dest]["lat"], airports[dest]["lng"]
                )
                graph.setdefault(src, []).append((dest, d))

    # Step 3: Keep only airports that appear in routes
    filtered_airports = {code: info for code, info in airports.items() if code in used_airports}

    print(f"Loaded {len(filtered_airports)} commercial airports connected by routes.")
    return filtered_airports, graph

# --- Improved Dijkstra’s Algorithm ---
def dijkstra(graph, start, goal):
    pq = [(0, start, [start])]
    visited = set()

    while pq:
        (dist, node, path) = heapq.heappop(pq)
        if node == goal:
            return dist, path
        if node in visited:
            continue
        visited.add(node)

        for neighbor, weight in graph.get(node, []):
            if neighbor not in visited:
                heapq.heappush(pq, (dist + weight, neighbor, path + [neighbor]))

    # no route found
    return float("inf"), []



# --- Load global data once ---
print("Loading airports and routes...")
AIRPORTS, GRAPH = load_airports_and_routes()

# --- Find nearest airport given coordinates ---
def find_nearest_airport(lat, lng):
    nearest = None
    min_d = float("inf")
    for code, info in AIRPORTS.items():
        d = haversine(lat, lng, info["lat"], info["lng"])
        if d < min_d:
            min_d = d
            nearest = {"code": code, **info}
    return nearest

@app.route("/api/trip-planner/plan", methods=["POST"])
def plan_trip():
    data = request.get_json()
    origin = data.get("origin")
    destinations = data.get("destinations", [])

    if not origin or not destinations:
        return jsonify({"error": "Origin and at least one destination required"}), 400

    all_locations = [origin] + destinations
    n = len(all_locations)

    # --- Compute distance matrix ---
    dist_matrix = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                dist_matrix[i][j] = haversine(
                    all_locations[i]["lat"], all_locations[i]["lng"],
                    all_locations[j]["lat"], all_locations[j]["lng"]
                )

    # --- Optimize order (simple brute force for small sets) ---
    best_route = None
    min_distance = math.inf
    for perm in itertools.permutations(range(1, n)):
        route = [0] + list(perm)
        distance = sum(dist_matrix[route[i]][route[i + 1]] for i in range(len(route) - 1))
        if distance < min_distance:
            min_distance = distance
            best_route = route

    optimized_route = [all_locations[i] for i in best_route]

    # --- Add Dijkstra for long distances (> 500 km) ---
    final_route = []
    total_distance = 0

    for i in range(len(optimized_route) - 1):
        start = optimized_route[i]
        end = optimized_route[i + 1]
        dist = haversine(start["lat"], start["lng"], end["lat"], end["lng"])

        if dist > 500:
            dep_airport = find_nearest_airport(start["lat"], start["lng"])
            arr_airport = find_nearest_airport(end["lat"], end["lng"])

            dijkstra_dist, airport_path = dijkstra(GRAPH, dep_airport["code"], arr_airport["code"])

            # --- fallback to direct great-circle if no path ---
            if math.isinf(dijkstra_dist):
                print(f"[WARN] No route found between {dep_airport['code']} and {arr_airport['code']} → using direct distance.")
                dijkstra_dist = dist
                airport_path = [dep_airport["code"], arr_airport["code"]]

            segment = [
                start,
                {"name": dep_airport["name"], "lat": dep_airport["lat"], "lng": dep_airport["lng"], "type": "airport"},
            ]

            for code in airport_path[1:-1]:
                if code in AIRPORTS:
                    a = AIRPORTS[code]
                    segment.append({"name": a["name"], "lat": a["lat"], "lng": a["lng"], "type": "airport"})

            segment.append({
                "name": arr_airport["name"],
                "lat": arr_airport["lat"],
                "lng": arr_airport["lng"],
                "type": "airport",
            })
            segment.append(end)

            total_distance += dijkstra_dist
            final_route.extend(segment)
        else:
            final_route.extend([start, end])
            total_distance += dist

    # Remove duplicate consecutive nodes
    cleaned = []
    for loc in final_route:
        if not cleaned or loc["name"] != cleaned[-1]["name"]:
            cleaned.append(loc)

    return jsonify({
        "optimized_route": cleaned,
        "total_distance_km": round(total_distance, 2)
    })

@app.route('/api/trip-planner/nearest-airport', methods=['POST'])
def nearest_airport():
    data = request.get_json()
    lat, lng = data.get('lat'), data.get('lng')

    if lat is None or lng is None:
        return jsonify({"error": "Missing coordinates"}), 400

    airports, _ = load_airports_and_routes()  # Use your existing loader

    nearest = None
    min_dist = float('inf')
    for code, info in airports.items():
        d = haversine(lat, lng, info["lat"], info["lng"])
        if d < min_dist:
            min_dist = d
            nearest = {"name": info["name"], "lat": info["lat"], "lng": info["lng"], "iata": code}

    if not nearest:
        return jsonify({"error": "No airports found"}), 404

    return jsonify(nearest)

if __name__ == "__main__":
    print("Server starting... please wait.")
    app.run(debug=True)
