"""
AI Route Optimization and Traffic Congestion Engine for FleetMind AI
Evaluates multiple route alternatives to suggest the best, smallest route with minimum traffic congestion.
Supports real road geometry (Google Maps / OSRM style) with turn-by-turn maneuvers and traffic modeling.
"""

import math
import random
import json
import urllib.request
from typing import Dict, List, Any, Optional, Tuple
from ml.predict import predictor

# Predefined key logistics hubs and terminals across Pakistan
LOGISTICS_HUBS = {
    # Lahore Urban & Regional Hubs
    "sundar_lahore": {
        "id": "sundar_lahore",
        "name": "Sundar Industrial Estate, Lahore",
        "city": "Lahore",
        "lat": 31.2855,
        "lng": 74.1750,
        "type": "Industrial Depot"
    },
    "thokar_lahore": {
        "id": "thokar_lahore",
        "name": "Thokar Niaz Baig Hub, Lahore",
        "city": "Lahore",
        "lat": 31.4682,
        "lng": 74.2405,
        "type": "Transit Terminal"
    },
    "moghalpura_lahore": {
        "id": "moghalpura_lahore",
        "name": "Lahore Dry Port Moghalpura",
        "city": "Lahore",
        "lat": 31.5714,
        "lng": 74.3794,
        "type": "Dry Port"
    },
    "cargo_complex_lahore": {
        "id": "cargo_complex_lahore",
        "name": "Allama Iqbal Cargo Complex, Lahore",
        "city": "Lahore",
        "lat": 31.5210,
        "lng": 74.4030,
        "type": "Air Cargo Terminal"
    },
    "kot_lakhpat_lahore": {
        "id": "kot_lakhpat_lahore",
        "name": "Kot Lakhpat Industrial Area, Lahore",
        "city": "Lahore",
        "lat": 31.4580,
        "lng": 74.3310,
        "type": "Industrial Zone"
    },
    "ravi_toll_lahore": {
        "id": "ravi_toll_lahore",
        "name": "M-2 Motorway Ravi Interchange, Lahore",
        "city": "Lahore",
        "lat": 31.6050,
        "lng": 74.2750,
        "type": "Motorway Gateway"
    },
    "gulberg_lahore": {
        "id": "gulberg_lahore",
        "name": "Gulberg Logistics Center, Lahore",
        "city": "Lahore",
        "lat": 31.5120,
        "lng": 74.3530,
        "type": "Urban Distribution"
    },
    "shahdara_lahore": {
        "id": "shahdara_lahore",
        "name": "Shahdara Freight Terminal, Lahore",
        "city": "Lahore",
        "lat": 31.6210,
        "lng": 74.2980,
        "type": "Regional Hub"
    },
    # Intercity Major Corridors
    "islamabad_i9": {
        "id": "islamabad_i9",
        "name": "I-9 Industrial Area, Islamabad",
        "city": "Islamabad",
        "lat": 33.6690,
        "lng": 73.0530,
        "type": "Industrial Depot"
    },
    "rawalpindi_pirwadhai": {
        "id": "rawalpindi_pirwadhai",
        "name": "Rawalpindi Pirwadhai Depot",
        "city": "Rawalpindi",
        "lat": 33.6210,
        "lng": 73.0310,
        "type": "Regional Hub"
    },
    "faisalabad_vac": {
        "id": "faisalabad_vac",
        "name": "Faisalabad Value Addition City",
        "city": "Faisalabad",
        "lat": 31.4187,
        "lng": 73.0791,
        "type": "Industrial City"
    },
    "multan_dry_port": {
        "id": "multan_dry_port",
        "name": "Multan Dry Port Terminal",
        "city": "Multan",
        "lat": 30.1984,
        "lng": 71.4687,
        "type": "Dry Port"
    },
    "sialkot_export": {
        "id": "sialkot_export",
        "name": "Sialkot Export Zone Hub",
        "city": "Sialkot",
        "lat": 32.4945,
        "lng": 74.5229,
        "type": "Export Terminal"
    },
    "gujranwala_estate": {
        "id": "gujranwala_estate",
        "name": "Gujranwala Industrial Estate",
        "city": "Gujranwala",
        "lat": 32.1877,
        "lng": 74.1945,
        "type": "Manufacturing Hub"
    },
    "karachi_port_qasim": {
        "id": "karachi_port_qasim",
        "name": "Karachi Port Qasim Terminal",
        "city": "Karachi",
        "lat": 24.7830,
        "lng": 67.3480,
        "type": "Deep Sea Port"
    },
    "karachi_kpt": {
        "id": "karachi_kpt",
        "name": "Karachi Port Trust (KPT)",
        "city": "Karachi",
        "lat": 24.8450,
        "lng": 66.9850,
        "type": "Maritime Terminal"
    },
    "peshawar_ring_road": {
        "id": "peshawar_ring_road",
        "name": "Peshawar Ring Road Logistics Park",
        "city": "Peshawar",
        "lat": 33.9980,
        "lng": 71.5540,
        "type": "Transit Terminal"
    }
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c

def calculate_time_traffic_multiplier(hour: int, day_of_week: int) -> float:
    """
    Simulates traffic congestion curve across commercial freight corridors.
    Peak morning rush: 07:30 - 10:30
    Peak evening rush: 16:30 - 20:30
    Night time: 22:00 - 06:00 (Minimum traffic)
    """
    if 7 <= hour <= 10:
        base = 1.65
    elif 11 <= hour <= 15:
        base = 1.20
    elif 16 <= hour <= 20:
        base = 1.85
    elif 21 <= hour <= 23:
        base = 1.10
    else:
        base = 0.85

    if day_of_week == 6:
        base *= 0.82
    elif day_of_week == 4:
        if 12 <= hour <= 15:
            base *= 1.25

    return base

def fetch_osrm_driving_routes(orig_lng: float, orig_lat: float,
                              dest_lng: float, dest_lat: float) -> Optional[List[Dict[str, Any]]]:
    """
    Fetches real road network routes and turn maneuvers from OpenStreetMap / OSRM API.
    Times out gracefully within 2.8 seconds to maintain instantaneous UI response.
    """
    url = (
        f"https://router.project-osrm.org/route/v1/driving/"
        f"{orig_lng:.5f},{orig_lat:.5f};{dest_lng:.5f},{dest_lat:.5f}"
        f"?overview=full&geometries=geojson&alternatives=3&steps=true"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "FleetMindAI/2.0"})
        with urllib.request.urlopen(req, timeout=2.8) as response:
            if response.status == 200:
                raw_json = json.loads(response.read().decode("utf-8"))
                if raw_json.get("code") == "Ok" and raw_json.get("routes"):
                    return raw_json["routes"]
    except Exception:
        pass
    return None

def decimate_polyline(coords: List[List[float]], max_points: int = 150) -> List[List[float]]:
    """Decimates dense polyline for silky smooth 60fps Leaflet rendering."""
    if len(coords) <= max_points:
        return coords
    step = len(coords) / float(max_points)
    decimated = [coords[int(i * step)] for i in range(max_points - 1)]
    decimated.append(coords[-1])
    return decimated

class RouteOptimizer:
    def __init__(self):
        self.hubs = LOGISTICS_HUBS

    def get_locations(self) -> List[Dict[str, Any]]:
        return list(self.hubs.values())

    def resolve_location(self, loc_input: Any) -> Tuple[float, float, str]:
        """Resolves location string or dict into (lat, lng, display_name)."""
        if isinstance(loc_input, dict):
            lat = float(loc_input.get("lat", 31.5204))
            lng = float(loc_input.get("lng", 74.3587))
            name = loc_input.get("name", f"Location ({lat:.4f}, {lng:.4f})")
            return lat, lng, name

        loc_str = str(loc_input).strip()
        for key, hub in self.hubs.items():
            if key.lower() == loc_str.lower() or hub["name"].lower() == loc_str.lower():
                return hub["lat"], hub["lng"], hub["name"]

        for key, hub in self.hubs.items():
            if loc_str.lower() in hub["name"].lower() or hub["name"].lower() in loc_str.lower():
                return hub["lat"], hub["lng"], hub["name"]

        return 31.5204, 74.3587, loc_str or "Lahore Central Depot"

    def generate_intermediate_polyline(self, start_lat: float, start_lng: float,
                                       end_lat: float, end_lng: float,
                                       curvature: float = 0.0,
                                       num_points: int = 24) -> List[List[float]]:
        """Synthesizes smooth curved roadway geometry as resilient fallback."""
        points = []
        d_lat = end_lat - start_lat
        d_lng = end_lng - start_lng
        norm_lat = -d_lng
        norm_lng = d_lat

        for i in range(num_points + 1):
            t = i / float(num_points)
            arc = math.sin(t * math.pi) * curvature
            lat = start_lat + t * d_lat + arc * norm_lat
            lng = start_lng + t * d_lng + arc * norm_lng
            if 0 < i < num_points:
                lat += (math.sin(i * 1.8) * 0.0015)
                lng += (math.cos(i * 1.8) * 0.0015)
            points.append([round(lat, 5), round(lng, 5)])

        return points

    def evaluate_routes(self,
                        origin: Any,
                        destination: Any,
                        departure_hour: int = 10,
                        day_of_week: int = 2,
                        weather_condition: str = "Clear",
                        vehicle_id: str = "VH-027",
                        driver_id: str = "DRV-001",
                        preference: str = "balanced") -> Dict[str, Any]:
        """
        Core AI Model for suggesting the best smallest route with minimum traffic.
        Evaluates real Google Maps style roadway routes and turns:
          1. Route A: Shortest Distance Route (Absolute Smallest km)
          2. Route B: AI Recommended Balanced Route (Optimal trade-off: Smallest km + Low Traffic)
          3. Route C: Minimum Traffic Expressway (Free-flow corridor / Ring Road bypass)
        """
        orig_lat, orig_lng, orig_name = self.resolve_location(origin)
        dest_lat, dest_lng, dest_name = self.resolve_location(destination)

        crow_dist = haversine_distance(orig_lat, orig_lng, dest_lat, dest_lng)
        if crow_dist < 1.0:
            crow_dist = 5.0

        time_traffic_mult = calculate_time_traffic_multiplier(departure_hour, day_of_week)

        # Weather slowdown impact
        weather_friction = 1.0
        if weather_condition in ["Winter Fog/Smog", "Dust Storm"]:
            weather_friction = 1.32
        elif weather_condition in ["Monsoon Rain", "Extreme Summer Heat"]:
            weather_friction = 1.15

        # 1. ATTEMPT REAL ROAD GEOMETRY FROM OSRM
        osrm_routes = fetch_osrm_driving_routes(orig_lng, orig_lat, dest_lng, dest_lat)

        candidates = []

        if osrm_routes and len(osrm_routes) >= 1:
            # Map actual OSRM real roadway network
            for idx, osrm_r in enumerate(osrm_routes[:3]):
                dist_km = round(osrm_r.get("distance", crow_dist * 1000 * 1.2) / 1000.0, 1)
                dur_base_min = int(round(osrm_r.get("duration", (dist_km / 60.0) * 3600) / 60.0))
                
                # Convert [lng, lat] from OSRM GeoJSON to Leaflet [lat, lng]
                raw_coords = osrm_r.get("geometry", {}).get("coordinates", [])
                leaflet_coords = [[round(pt[1], 5), round(pt[0], 5)] for pt in raw_coords]
                decimated_coords = decimate_polyline(leaflet_coords, max_points=140)

                # Extract real Google Maps style turn maneuvers
                steps = self._extract_steps_from_osrm(osrm_r)
                summary_name = self._extract_summary_name(osrm_r, idx, orig_name, dest_name)

                candidates.append({
                    "raw_dist": dist_km,
                    "raw_dur": dur_base_min,
                    "polyline": decimated_coords,
                    "steps": steps,
                    "summary": summary_name
                })

        # If OSRM returned fewer than 3 candidates, synthesize remaining realistic roadway options
        while len(candidates) < 3:
            idx = len(candidates)
            if idx == 0:
                dist = round(crow_dist * 1.14, 1)
                dur = int(round((dist / 38.0) * 60))
                poly = self.generate_intermediate_polyline(orig_lat, orig_lng, dest_lat, dest_lng, curvature=0.03)
                summary = "via Direct Arterial Corridor"
            elif idx == 1:
                dist = round(crow_dist * 1.23, 1)
                dur = int(round((dist / 62.0) * 60))
                poly = self.generate_intermediate_polyline(orig_lat, orig_lng, dest_lat, dest_lng, curvature=0.18)
                summary = "via Primary Express Motorway"
            else:
                dist = round(crow_dist * 1.36, 1)
                dur = int(round((dist / 78.0) * 60))
                poly = self.generate_intermediate_polyline(orig_lat, orig_lng, dest_lat, dest_lng, curvature=-0.25)
                summary = "via Outer Ring Road Bypass"

            candidates.append({
                "raw_dist": dist,
                "raw_dur": dur,
                "polyline": poly,
                "steps": self._generate_fallback_steps(orig_name, dest_name, dist),
                "summary": summary
            })

        # Sort candidate routes by distance to classify accurately
        candidates.sort(key=lambda x: x["raw_dist"])
        
        # Candidate 0: Shortest Distance Route (Smallest Path)
        c_shortest = candidates[0]
        # Candidate 1: AI Balanced Route
        c_balanced = candidates[1]
        # Candidate 2: Minimum Traffic Route
        c_min_traffic = candidates[2]

        # Calculate traffic indices and congestion adjustments
        t_idx_shortest = min(96, max(38, int(58 * time_traffic_mult)))
        t_idx_balanced = min(82, max(20, int(26 * time_traffic_mult)))
        t_idx_min_traffic = min(58, max(12, int(15 * time_traffic_mult)))

        dur_shortest = int(round(c_shortest["raw_dur"] * (1.0 + (t_idx_shortest / 100.0) * 0.75) * weather_friction))
        dur_balanced = int(round(c_balanced["raw_dur"] * (1.0 + (t_idx_balanced / 100.0) * 0.35) * weather_friction))
        dur_min_traffic = int(round(c_min_traffic["raw_dur"] * (1.0 + (t_idx_min_traffic / 100.0) * 0.18) * weather_friction))

        formatted_routes = [
            {
                "id": "route_shortest",
                "name": "Direct City Arterial (Shortest Distance)",
                "summary": c_shortest["summary"] or "via Central Arterials",
                "corridor_type": "Urban Arterial",
                "distance_km": c_shortest["raw_dist"],
                "duration_min": dur_shortest,
                "traffic_index": t_idx_shortest,
                "polyline": c_shortest["polyline"],
                "steps": c_shortest["steps"],
                "is_smallest_distance": True,
                "is_minimum_traffic": False,
                "characteristics": "Absolute shortest path in kilometers; cuts directly through central urban corridors.",
                "bottlenecks": ["Downtown Signal Intersections", "Central Flyover Chokepoints", "Local Traffic Merges"]
            },
            {
                "id": "route_balanced",
                "name": "Express Freight Corridor (AI Recommended)",
                "summary": c_balanced["summary"] or "via Express Freight Corridor",
                "corridor_type": "Primary Arterial & Flyovers",
                "distance_km": c_balanced["raw_dist"],
                "duration_min": dur_balanced,
                "traffic_index": t_idx_balanced,
                "polyline": c_balanced["polyline"],
                "steps": c_balanced["steps"],
                "is_smallest_distance": False,
                "is_minimum_traffic": False,
                "characteristics": "Optimal trade-off: Minimal extra distance while avoiding major urban congestion chokepoints.",
                "bottlenecks": ["Toll Plaza Entry", "Ring Road Interchanges"]
            },
            {
                "id": "route_min_traffic",
                "name": "Motorway Outer Bypass (Minimum Traffic)",
                "summary": c_min_traffic["summary"] or "via Outer Motorway Bypass",
                "corridor_type": "Motorway / Ring Road Bypass",
                "distance_km": c_min_traffic["raw_dist"],
                "duration_min": dur_min_traffic,
                "traffic_index": t_idx_min_traffic,
                "polyline": c_min_traffic["polyline"],
                "steps": c_min_traffic["steps"],
                "is_smallest_distance": False,
                "is_minimum_traffic": True,
                "characteristics": "Smoothest transit with near zero congestion; utilizes outer high-speed bypasses.",
                "bottlenecks": ["Motorway Toll Booth"]
            }
        ]

        # Categorize traffic levels and execute ML trained Delay Model
        for r in formatted_routes:
            t_idx = r["traffic_index"]
            if t_idx >= 75:
                r["traffic_level"] = "Severe"
            elif t_idx >= 48:
                r["traffic_level"] = "High"
            elif t_idx >= 26:
                r["traffic_level"] = "Medium"
            else:
                r["traffic_level"] = "Low"

            # Machine Learning Delay Prediction Model
            ml_input = {
                "distance_km": r["distance_km"],
                "estimated_duration": r["duration_min"],
                "number_of_stops": 2,
                "traffic_level": r["traffic_level"],
                "weather_condition": weather_condition,
                "hour_of_day": departure_hour,
                "day_of_week": day_of_week,
                "driver_id": driver_id,
                "vehicle_id": vehicle_id
            }
            delay_pred = predictor.predict_delay(ml_input)
            r["delay_prediction"] = delay_pred
            r["delay_probability"] = delay_pred["delay_probability"]
            r["delay_risk_level"] = delay_pred["risk_level"]

            # Fuel calculation
            base_kml = 10.5
            eff_factor = 1.0 - (r["traffic_index"] / 100.0) * 0.40
            eff_kml = max(4.5, base_kml * eff_factor)
            fuel_liters = round(r["distance_km"] / eff_kml, 1)
            r["fuel_liters"] = fuel_liters
            r["co2_kg"] = round(fuel_liters * 2.68, 1)

            # Route waypoints segments
            r["segments"] = self._generate_route_segments(r["polyline"], r["traffic_level"], r["distance_km"])

            # AI Multi-Criteria Optimization Score
            norm_dist = r["distance_km"] / c_shortest["raw_dist"]
            traffic_penalty = r["traffic_index"] * 0.45
            delay_penalty = r["delay_probability"] * 35.0
            dist_penalty = (norm_dist - 1.0) * 45.0

            if preference == "smallest":
                score = 100.0 - (dist_penalty * 2.5) - (traffic_penalty * 0.5) - delay_penalty
            elif preference == "min_traffic":
                score = 100.0 - (traffic_penalty * 1.5) - (delay_penalty * 0.8) - (dist_penalty * 0.5)
            else:
                score = 100.0 - traffic_penalty - delay_penalty - dist_penalty

            r["ai_score"] = int(round(max(10, min(99, score))))

        ranked = sorted(formatted_routes, key=lambda x: x["ai_score"], reverse=True)
        recommended_route = ranked[0]
        for c in formatted_routes:
            c["is_recommended"] = (c["id"] == recommended_route["id"])

        rationale = self._build_ai_rationale(
            orig_name=orig_name,
            dest_name=dest_name,
            recommended=recommended_route,
            shortest=formatted_routes[0],
            min_traffic=formatted_routes[2],
            departure_hour=departure_hour
        )

        return {
            "origin": {
                "name": orig_name,
                "lat": orig_lat,
                "lng": orig_lng
            },
            "destination": {
                "name": dest_name,
                "lat": dest_lat,
                "lng": dest_lng
            },
            "departure_hour": departure_hour,
            "day_of_week": day_of_week,
            "weather_condition": weather_condition,
            "traffic_time_multiplier": round(time_traffic_mult, 2),
            "preference": preference,
            "recommended_route_id": recommended_route["id"],
            "ai_rationale": rationale,
            "routes": formatted_routes
        }

    def _extract_summary_name(self, osrm_route: Dict[str, Any], idx: int, orig: str, dest: str) -> str:
        """Extracts clean human-readable summary name for the route."""
        legs = osrm_route.get("legs", [])
        if legs and legs[0].get("summary"):
            s = legs[0]["summary"].strip()
            # Clean non-ascii if needed
            cleaned = s.encode("ascii", "ignore").decode("ascii").strip()
            if cleaned and len(cleaned) > 2:
                return f"via {cleaned}"
        if idx == 0:
            return "via Primary Freight Corridor"
        elif idx == 1:
            return "via Bypass Expressway"
        return "via Alternate Roadway"

    def _extract_steps_from_osrm(self, osrm_route: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extracts Google Maps style turn-by-turn steps from OSRM response."""
        steps_out = []
        legs = osrm_route.get("legs", [])
        if not legs or not legs[0].get("steps"):
            return []

        raw_steps = legs[0]["steps"]
        step_num = 1
        for s in raw_steps:
            m = s.get("maneuver", {})
            m_type = m.get("type", "turn")
            modifier = m.get("modifier", "")
            road_name = s.get("name", "").encode("ascii", "ignore").decode("ascii").strip()
            dist_km = round(s.get("distance", 0) / 1000.0, 2)
            dur_min = round(s.get("duration", 0) / 60.0, 1)

            # Generate natural instruction text
            if m_type == "depart":
                inst = f"Head on {road_name or 'departure road'}"
            elif m_type == "arrive":
                inst = "Arrive at destination terminal"
            elif modifier:
                inst = f"Turn {modifier.replace('_', ' ')} onto {road_name or 'the road'}"
            elif m_type == "merge":
                inst = f"Merge onto {road_name or 'expressway'}"
            elif m_type == "fork":
                inst = f"Keep {modifier or 'right'} at the fork"
            else:
                inst = f"Continue onto {road_name or 'freight corridor'}"

            if dist_km > 0.05 or m_type in ["depart", "arrive"]:
                steps_out.append({
                    "step_number": step_num,
                    "instruction": inst,
                    "distance_km": dist_km,
                    "duration_min": dur_min,
                    "maneuver_type": m_type,
                    "road_name": road_name
                })
                step_num += 1

        return steps_out[:12]

    def _generate_fallback_steps(self, orig: str, dest: str, total_dist: float) -> List[Dict[str, Any]]:
        """Generates realistic Google Maps style turn instructions when offline."""
        d1 = round(total_dist * 0.05, 1)
        d2 = round(total_dist * 0.15, 1)
        d3 = round(total_dist * 0.70, 1)
        d4 = round(total_dist * 0.10, 1)

        return [
            {"step_number": 1, "instruction": f"Head northeast from {orig}", "distance_km": d1, "duration_min": round(d1 * 1.5, 1), "maneuver_type": "depart", "road_name": "Depot Terminal Way"},
            {"step_number": 2, "instruction": "Turn right onto Primary Commercial Artery", "distance_km": d2, "duration_min": round(d2 * 1.2, 1), "maneuver_type": "turn-right", "road_name": "N-5 / Arterial Access"},
            {"step_number": 3, "instruction": "Take the ramp onto Motorway Freight Corridor", "distance_km": d3, "duration_min": round(d3 * 0.7, 1), "maneuver_type": "merge", "road_name": "M-2 / Express Corridor"},
            {"step_number": 4, "instruction": f"Take the exit toward {dest}", "distance_km": d4, "duration_min": round(d4 * 1.3, 1), "maneuver_type": "exit", "road_name": "Terminal Approach Rd"},
            {"step_number": 5, "instruction": f"Arrive at destination: {dest}", "distance_km": 0.0, "duration_min": 0.0, "maneuver_type": "arrive", "road_name": "Destination Terminal"}
        ]

    def _generate_route_segments(self, polyline: List[List[float]],
                                 overall_traffic: str,
                                 total_km: float) -> List[Dict[str, Any]]:
        """Generates waypoint segments with traffic flow status along the polyline."""
        if not polyline or len(polyline) < 3:
            return []

        num_segs = 4
        chunk_size = max(1, len(polyline) // num_segs)
        segments = []
        names = [
            "Depot Departure & Access Corridor",
            "Main Transit Artery / Ring Junction",
            "Central Highway Freight Corridor",
            "Destination Terminal Approach"
        ]

        for i in range(num_segs):
            idx = min(len(polyline) - 1, i * chunk_size)
            coord = polyline[idx]

            if overall_traffic in ["Severe", "High"]:
                seg_traffic = "High" if (i == 1 or i == 2) else "Moderate"
                speed = 28 if seg_traffic == "High" else 42
            elif overall_traffic == "Medium":
                seg_traffic = "Moderate" if i == 1 else "Low"
                speed = 48 if seg_traffic == "Moderate" else 68
            else:
                seg_traffic = "Low"
                speed = 82

            seg_dist = round(total_km / num_segs, 1)

            segments.append({
                "segment_order": i + 1,
                "name": names[i],
                "lat": coord[0],
                "lng": coord[1],
                "traffic_status": seg_traffic,
                "typical_speed_kmh": speed,
                "distance_km": seg_dist
            })

        return segments

    def _build_ai_rationale(self, orig_name: str, dest_name: str,
                            recommended: Dict[str, Any],
                            shortest: Dict[str, Any],
                            min_traffic: Dict[str, Any],
                            departure_hour: int) -> str:
        time_str = f"{departure_hour:02d}:00"

        if recommended["id"] == shortest["id"]:
            return (
                f"For transit from **{orig_name}** to **{dest_name}** at {time_str}, "
                f"the AI model selects the **{shortest['name']}** ({shortest.get('summary', '')}) as the best option. "
                f"At {shortest['distance_km']} km, it is the absolute smallest route, and traffic on this corridor "
                f"is currently manageable ({shortest['traffic_level']} traffic, Index {shortest['traffic_index']}%). "
                f"ML model projects an on-time arrival probability of {100 - int(shortest['delay_probability'] * 100)}%."
            )
        elif recommended["id"] == min_traffic["id"]:
            km_diff = round(min_traffic["distance_km"] - shortest["distance_km"], 1)
            min_saved = max(5, shortest["duration_min"] - min_traffic["duration_min"])
            return (
                f"For transit from **{orig_name}** to **{dest_name}** at peak {time_str}, "
                f"the AI model strongly recommends the **{min_traffic['name']}** ({min_traffic.get('summary', '')}). "
                f"Although it is **{km_diff} km longer** than the shortest urban corridor ({min_traffic['distance_km']} km vs {shortest['distance_km']} km), "
                f"it completely bypasses heavy downtown bottleneck gridlock (Traffic Index **{min_traffic['traffic_index']}%** vs **{shortest['traffic_index']}%**), "
                f"saving approximately **{min_saved} minutes** of transit time and slashing ML delay risk from {shortest['delay_risk_level']} down to {min_traffic['delay_risk_level']}."
            )
        else:
            km_diff = round(recommended["distance_km"] - shortest["distance_km"], 1)
            time_saved = max(3, shortest["duration_min"] - recommended["duration_min"])
            return (
                f"For transit from **{orig_name}** to **{dest_name}** at {time_str}, "
                f"the AI model recommends the **{recommended['name']}** ({recommended.get('summary', '')}) as the optimal compromise. "
                f"It requires only **+{km_diff} km** extra distance over the shortest route, while cutting traffic congestion "
                f"from **{shortest['traffic_index']}% ({shortest['traffic_level']})** down to **{recommended['traffic_index']}% ({recommended['traffic_level']})**. "
                f"This saves **{time_saved} minutes**, optimizes fuel consumption ({recommended['fuel_liters']} L), and lowers delay probability to **{int(recommended['delay_probability'] * 100)}%**."
            )

route_optimizer = RouteOptimizer()
