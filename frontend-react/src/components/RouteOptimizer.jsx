import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Navigation, Zap, Clock, ShieldCheck, AlertTriangle, 
  Fuel, CheckCircle2, ChevronRight, Compass, ArrowRight,
  TrendingUp, RefreshCw, Send, Layers, Sun, Moon, Globe,
  MapPin, CornerUpRight, CornerDownRight, ArrowUpRight,
  ArrowUp, Check, ChevronDown, ListFilter
} from 'lucide-react';
import { api } from '../api';

export default function RouteOptimizer({ onTripDispatched }) {
  const [locations, setLocations] = useState([]);
  const [origin, setOrigin] = useState("Sundar Industrial Estate, Lahore");
  const [destination, setDestination] = useState("I-9 Industrial Area, Islamabad");
  const [departureHour, setDepartureHour] = useState(10);
  const [dayOfWeek, setDayOfWeek] = useState(2);
  const [weather, setWeather] = useState("Clear");
  const [preference, setPreference] = useState("balanced"); // balanced, smallest, min_traffic
  const [vehicleId, setVehicleId] = useState("VH-027");
  const [driverId, setDriverId] = useState("DRV-001");

  // Google Maps Style Tile Theme: 'dark' (Google Dark Mode), 'light' (Google Maps Street), 'satellite' (Satellite)
  const getInitialStyle = () => {
    if (typeof document !== 'undefined') {
      const theme = document.documentElement.getAttribute('data-theme');
      if (theme === 'light') return 'light';
    }
    return 'dark';
  };
  const [mapStyle, setMapStyle] = useState(getInitialStyle);
  const [showTrafficColoring, setShowTrafficColoring] = useState(true);
  const [showDirectionsDrawer, setShowDirectionsDrawer] = useState(false);

  const [loading, setLoading] = useState(false);
  const [optimizationData, setOptimizationData] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [dispatchStatus, setDispatchStatus] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const polylinesLayerGroupRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const chipsLayerGroupRef = useRef(null);

  // Load locations on mount
  useEffect(() => {
    api.getRouteLocations().then(locs => {
      if (locs && locs.length > 0) {
        setLocations(locs);
      }
    });
    handleOptimize("Sundar Industrial Estate, Lahore", "I-9 Industrial Area, Islamabad", 10, "balanced");
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [31.5204, 74.3587],
      zoom: 10,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Layer groups for clean management
    polylinesLayerGroupRef.current = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    chipsLayerGroupRef.current = L.layerGroup().addTo(map);

    const initStyle = getInitialStyle();
    updateTileLayer(initStyle, map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Tile Layer smoothly between Google Dark, Google Light (Street), and Google Satellite (NO API KEY REQUIRED)
  const updateTileLayer = (style, map) => {
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    let subdomains = ['mt0', 'mt1', 'mt2', 'mt3'];
    let tileClassName = '';
    let maxZoom = 20;

    if (style === 'dark') {
      // Genuine Google Maps in High-Contrast Dark Mode (NO API KEY REQUIRED)
      url = 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      tileClassName = 'gmaps-dark-mode-tiles';
    } else if (style === 'light') {
      // Genuine Google Maps Street / Light Mode (NO API KEY REQUIRED)
      url = 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      tileClassName = 'gmaps-light-mode-tiles';
    } else if (style === 'satellite') {
      // Genuine Google Maps Hybrid Satellite & Aerial Imagery with Roads (NO API KEY REQUIRED)
      url = 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      tileClassName = '';
    }

    tileLayerRef.current = L.tileLayer(url, {
      maxZoom,
      subdomains,
      className: tileClassName,
      attribution: '&copy; Google Maps'
    }).addTo(map);
  };

  const handleMapStyleChange = (style) => {
    setMapStyle(style);
    if (mapInstanceRef.current) {
      updateTileLayer(style, mapInstanceRef.current);
    }
  };

  // Update Map Polylines, Floating ETA Chips, and Pins
  useEffect(() => {
    if (!mapInstanceRef.current || !optimizationData || !optimizationData.routes) return;

    const map = mapInstanceRef.current;
    polylinesLayerGroupRef.current.clearLayers();
    markersLayerGroupRef.current.clearLayers();
    chipsLayerGroupRef.current.clearLayers();

    const activeId = selectedRouteId || optimizationData.recommended_route_id;
    const allBounds = [];

    // Google Maps Style Start Pin (A) & Destination Pin (B)
    const createGooglePin = (type, label) => {
      const isStart = type === 'start';
      return L.divIcon({
        className: 'gmaps-custom-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              width: 32px; height: 32px;
              background: ${isStart ? '#10b981' : '#ea4335'};
              border: 3px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 14px rgba(0,0,0,0.45);
              display: flex; align-items: center; justify-content: center;
            ">
              <span style="
                transform: rotate(45deg);
                font-weight: 800;
                font-size: 13px;
                color: #ffffff;
                font-family: -apple-system, Roboto, sans-serif;
              ">${isStart ? 'A' : 'B'}</span>
            </div>
            <div style="
              margin-top: 4px;
              background: rgba(15, 23, 42, 0.9);
              border: 1px solid rgba(255,255,255,0.2);
              color: #ffffff;
              font-size: 11px;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 12px;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">${label}</div>
          </div>
        `,
        iconSize: [32, 54],
        iconAnchor: [16, 44]
      });
    };

    if (optimizationData.origin) {
      const origPt = [optimizationData.origin.lat, optimizationData.origin.lng];
      allBounds.push(origPt);
      L.marker(origPt, {
        icon: createGooglePin('start', 'Depot (Start)')
      }).bindPopup(`<strong>Origin:</strong> ${optimizationData.origin.name}`).addTo(markersLayerGroupRef.current);
    }

    if (optimizationData.destination) {
      const destPt = [optimizationData.destination.lat, optimizationData.destination.lng];
      allBounds.push(destPt);
      L.marker(destPt, {
        icon: createGooglePin('end', 'Destination')
      }).bindPopup(`<strong>Destination:</strong> ${optimizationData.destination.name}`).addTo(markersLayerGroupRef.current);
    }

    // Render Routes in Google Maps Navigation Hierarchy
    // 1. Draw Inactive Routes First (so Active sits on top)
    const inactiveRoutes = optimizationData.routes.filter(r => r.id !== activeId);
    const activeRoute = optimizationData.routes.find(r => r.id === activeId) || optimizationData.routes[0];

    const renderRouteLine = (route, isActive) => {
      if (!route.polyline || route.polyline.length === 0) return;

      // Google Maps Route Colors
      // Active: Google Blue (#1a73e8) or segmented live traffic colors
      // Casing: Crisp white (#ffffff) in Light/Satellite, dark navy (#0f172a) in Dark
      let primaryColor = '#1a73e8';
      let casingColor = (mapStyle === 'dark') ? '#0f172a' : '#ffffff';
      let casingWeight = isActive ? 9 : 7;
      let lineWeight = isActive ? 5.5 : 4.5;
      let opacity = isActive ? 1.0 : 0.65;

      if (!isActive) {
        // Inactive Google Maps Alternate Grey
        primaryColor = (mapStyle === 'dark') ? '#64748b' : '#94a3b8';
      }

      // 1. Signature Google Maps Background Casing Border
      L.polyline(route.polyline, {
        color: casingColor,
        weight: casingWeight,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(polylinesLayerGroupRef.current);

      // 2. Foreground Polyline with Google Maps Traffic Flow
      if (isActive && showTrafficColoring && route.segments && route.segments.length > 0 && route.polyline.length >= 8) {
        // Render multi-segment Google Maps traffic flow (Green / Orange / Red)
        const totalPts = route.polyline.length;
        const numSegs = route.segments.length;
        const chunkSize = Math.floor(totalPts / numSegs);

        for (let sIdx = 0; sIdx < numSegs; sIdx++) {
          const startIdx = sIdx * chunkSize;
          const endIdx = (sIdx === numSegs - 1) ? totalPts : Math.min(totalPts, (sIdx + 1) * chunkSize + 1);
          const segSlice = route.polyline.slice(startIdx, endIdx);
          if (segSlice.length < 2) continue;

          const segMeta = route.segments[sIdx];
          let segColor = '#1a73e8'; // Google Blue
          if (segMeta.traffic_status === 'Severe' || segMeta.traffic_status === 'High') {
            segColor = '#ea4335'; // Congestion Red
          } else if (segMeta.traffic_status === 'Moderate') {
            segColor = '#f59e0b'; // Moderate Amber
          } else {
            segColor = route.is_recommended ? '#00c853' : '#1a73e8'; // Google Fast Flow Green
          }

          const segPoly = L.polyline(segSlice, {
            color: segColor,
            weight: lineWeight,
            opacity: 1.0,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(polylinesLayerGroupRef.current);

          segPoly.on('click', () => setSelectedRouteId(route.id));
        }
      } else {
        // Uniform Google Navigation Blue or Alternate Grey
        const polyline = L.polyline(route.polyline, {
          color: primaryColor,
          weight: lineWeight,
          opacity,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(polylinesLayerGroupRef.current);

        polyline.on('click', () => setSelectedRouteId(route.id));
      }

      // Google Maps Floating ETA Pill Marker on Midpoint of Polyline
      const midIdx = Math.floor(route.polyline.length / 2);
      const midCoord = route.polyline[midIdx];

      if (midCoord) {
        const timeHours = (route.duration_min >= 60) 
          ? `${Math.floor(route.duration_min / 60)} hr ${route.duration_min % 60} min` 
          : `${route.duration_min} min`;

        const chipHtml = isActive ? `
          <div style="
            background: #1a73e8;
            color: #ffffff;
            padding: 5px 10px;
            border-radius: 18px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(26, 115, 232, 0.45), 0 2px 6px rgba(0,0,0,0.3);
            border: 2px solid #ffffff;
            cursor: pointer;
            display: flex; align-items: center; gap: 4px;
          ">
            <span>🚗</span> <strong>${timeHours}</strong> • ${route.distance_km} km
            ${route.is_recommended ? '<span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 4px; font-size: 9px; margin-left: 2px;">Fastest</span>' : ''}
          </div>
        ` : `
          <div style="
            background: ${mapStyle === 'dark' ? '#1e293b' : '#ffffff'};
            color: ${mapStyle === 'dark' ? '#cbd5e1' : '#475569'};
            padding: 4px 8px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            border: 1px solid ${mapStyle === 'dark' ? '#334155' : '#cbd5e1'};
            cursor: pointer;
            display: flex; align-items: center; gap: 3px;
          ">
            <span>+${Math.max(0, route.duration_min - activeRoute.duration_min)}m</span> • ${route.distance_km} km
          </div>
        `;

        const chipMarker = L.marker(midCoord, {
          icon: L.divIcon({
            className: 'gmaps-chip-pin',
            html: chipHtml,
            iconSize: [140, 28],
            iconAnchor: [70, 14]
          })
        }).addTo(chipsLayerGroupRef.current);

        chipMarker.on('click', () => {
          setSelectedRouteId(route.id);
        });
      }

      if (isActive) {
        route.polyline.forEach(pt => allBounds.push(pt));
      }
    };

    // Draw inactives first, then active on top
    inactiveRoutes.forEach(r => renderRouteLine(r, false));
    if (activeRoute) renderRouteLine(activeRoute, true);

    if (allBounds.length > 1) {
      map.fitBounds(allBounds, { padding: [55, 55], maxZoom: 13 });
    }
  }, [optimizationData, selectedRouteId, mapStyle, showTrafficColoring]);

  const handleOptimize = async (customOrig, customDest, customHour, customPref) => {
    setLoading(true);
    setDispatchStatus(null);
    try {
      const reqPayload = {
        origin: customOrig || origin,
        destination: customDest || destination,
        departure_hour: customHour !== undefined ? customHour : departureHour,
        day_of_week: dayOfWeek,
        weather_condition: weather,
        vehicle_id: vehicleId,
        driver_id: driverId,
        preference: customPref || preference
      };

      const res = await api.optimizeRoute(reqPayload);
      setOptimizationData(res);
      setSelectedRouteId(res.recommended_route_id);
    } catch (err) {
      console.error("Optimization failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (route) => {
    if (!route || !optimizationData) return;
    setLoading(true);
    setDispatchStatus("Dispatching route to fleet unit...");

    try {
      const payload = {
        origin: optimizationData.origin.name,
        destination: optimizationData.destination.name,
        distance_km: route.distance_km,
        estimated_duration: route.duration_min,
        traffic_level: route.traffic_level,
        weather_condition: weather,
        vehicle_id: vehicleId,
        driver_id: driverId,
        route_name: route.name
      };

      const res = await api.dispatchRoute(payload);
      setDispatchStatus(`✓ ${res.message} (Trip ID: ${res.trip_id})`);
      if (onTripDispatched) onTripDispatched(res);
    } catch (e) {
      setDispatchStatus(`Dispatch failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const activeRoute = optimizationData?.routes?.find(r => r.id === (selectedRouteId || optimizationData.recommended_route_id)) 
                      || optimizationData?.routes?.[0];

  const firstStep = activeRoute?.steps?.[0] || { instruction: "Head toward primary freight corridor", distance_km: 1.2, maneuver_type: "depart" };

  const getManeuverIcon = (type) => {
    switch (type) {
      case 'depart':
      case 'straight':
        return <ArrowUp size={22} color="#ffffff" />;
      case 'turn-right':
        return <CornerUpRight size={22} color="#ffffff" />;
      case 'turn-left':
        return <CornerDownRight size={22} color="#ffffff" />;
      case 'merge':
      case 'fork':
        return <ArrowUpRight size={22} color="#ffffff" />;
      case 'arrive':
        return <MapPin size={22} color="#ffffff" />;
      default:
        return <CornerUpRight size={22} color="#ffffff" />;
    }
  };

  return (
    <div className="route-optimizer-container">
      {/* Header Bar */}
      <div className="route-header-card saas-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div className="badge-glow-icon">
                <Compass size={20} color="#00d084" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Google Maps Navigation & AI Minimum Traffic Optimizer
              </h2>
              <span className="pill-badge badge-active" style={{ fontSize: '11px' }}>
                Real Roadway Network + ML Model #3
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Live real-world roadway routes with <strong>Google Maps style navigation</strong>, turn maneuvers, and AI traffic minimization.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={() => handleOptimize()}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
              {loading ? 'Calculating Routes...' : 'Re-calculate Routes'}
            </button>
          </div>
        </div>

        {/* Search & Configuration Bar */}
        <div className="route-inputs-grid" style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label className="input-label">Origin Logistics Hub (A)</label>
            <select 
              className="select-pill" 
              style={{ width: '100%' }}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            >
              {locations.length > 0 ? (
                locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))
              ) : (
                <option value="Sundar Industrial Estate, Lahore">Sundar Industrial Estate, Lahore</option>
              )}
            </select>
          </div>

          <div>
            <label className="input-label">Destination Terminal (B)</label>
            <select 
              className="select-pill" 
              style={{ width: '100%' }}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {locations.length > 0 ? (
                locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))
              ) : (
                <option value="I-9 Industrial Area, Islamabad">I-9 Industrial Area, Islamabad</option>
              )}
            </select>
          </div>

          <div>
            <label className="input-label">Routing Priority</label>
            <select 
              className="select-pill" 
              style={{ width: '100%', borderColor: 'var(--primary)' }}
              value={preference}
              onChange={(e) => {
                setPreference(e.target.value);
                handleOptimize(null, null, null, e.target.value);
              }}
            >
              <option value="balanced">⚡ Google Recommended (Best ETA & Low Traffic)</option>
              <option value="smallest">📏 Smallest Route (Shortest Distance km)</option>
              <option value="min_traffic">🟢 Minimum Traffic (Free-Flow Expressway)</option>
            </select>
          </div>

          <div>
            <label className="input-label">
              Departure Time: <strong>{departureHour}:00</strong> {departureHour >= 7 && departureHour <= 10 ? '🔥 Peak Rush' : (departureHour >= 16 && departureHour <= 20 ? '🔥 Peak Rush' : '🟢 Clear')}
            </label>
            <input 
              type="range" 
              min="0" 
              max="23" 
              value={departureHour} 
              onChange={(e) => setDepartureHour(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)', marginTop: '8px' }}
            />
          </div>

          <div>
            <label className="input-label">Weather Impact</label>
            <select 
              className="select-pill" 
              style={{ width: '100%' }}
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
            >
              <option value="Clear">Clear</option>
              <option value="Winter Fog/Smog">Winter Fog/Smog (High Friction)</option>
              <option value="Monsoon Rain">Monsoon Rain</option>
              <option value="Extreme Summer Heat">Extreme Summer Heat</option>
            </select>
          </div>

          <div>
            <label className="input-label">Fleet Unit</label>
            <select 
              className="select-pill" 
              style={{ width: '100%' }}
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="VH-027">VH-027 (Volvo FL Electric)</option>
              <option value="VH-001">VH-001 (Hino 300 Series)</option>
              <option value="VH-014">VH-014 (Isuzu NPR 71)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Map + Route Decision Split View */}
      <div className="route-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '20px', marginBottom: '20px' }}>
        
        {/* Interactive Google Maps Style Leaflet Container */}
        <div className="saas-card" style={{ padding: '0', position: 'relative', overflow: 'hidden', minHeight: '480px', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-light)' }}>
          
          {/* Map DOM */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '480px' }} />

          {/* Floating Google Maps Style Navigation Header Banner */}
          {activeRoute && (
            <div className="gmaps-nav-banner">
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 10px rgba(16, 185, 129, 0.45)' }}>
                {getManeuverIcon(firstStep.maneuver_type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="gmaps-step-sub" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.5px' }}>
                  Next Step • {firstStep.distance_km} km
                </div>
                <div className="gmaps-step-text" style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {firstStep.instruction}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#00d084' }}>
                  {activeRoute.duration_min} min
                </div>
                <div className="gmaps-step-sub" style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {activeRoute.distance_km} km
                </div>
              </div>
            </div>
          )}

          {/* Top-Right Google Maps Tile Style Switcher */}
          <div className="gmaps-style-switcher">
            <button 
              className={`gmaps-style-btn ${mapStyle === 'dark' ? 'active' : ''}`}
              onClick={() => handleMapStyleChange('dark')}
              title="Google Maps Dark / Night Mode"
            >
              <Moon size={13} /> Dark
            </button>
            <button 
              className={`gmaps-style-btn ${mapStyle === 'light' ? 'active' : ''}`}
              onClick={() => handleMapStyleChange('light')}
              title="Google Maps Street / Light Mode"
            >
              <Sun size={13} /> Light
            </button>
            <button 
              className={`gmaps-style-btn ${mapStyle === 'satellite' ? 'active' : ''}`}
              onClick={() => handleMapStyleChange('satellite')}
              title="Google Earth / Satellite Aerial Imagery"
            >
              <Globe size={13} /> Satellite
            </button>
          </div>

          {/* Google Traffic Heat Bar Indicator */}
          <div className="gmaps-traffic-indicator">
            <button 
              onClick={() => setShowTrafficColoring(!showTrafficColoring)}
              style={{
                background: showTrafficColoring ? 'rgba(0, 200, 83, 0.2)' : 'transparent',
                border: showTrafficColoring ? '1px solid #00c853' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '2px 8px',
                color: showTrafficColoring ? '#00e676' : '#94a3b8',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Toggle Live Google Maps Traffic Flow on Route"
            >
              <span>🚦</span> Traffic {showTrafficColoring ? 'ON' : 'OFF'}
            </button>
            <div className="gmaps-traffic-bar">
              <span className="dot-green" title="Fast Flow" />
              <span className="dot-orange" title="Moderate Flow" />
              <span className="dot-red" title="Congested Flow" />
            </div>
            <span style={{ fontSize: '10px', color: activeRoute?.traffic_index >= 60 ? '#ef4444' : '#10b981', fontWeight: 800 }}>
              {activeRoute?.traffic_level || 'Normal'}
            </span>
          </div>

          {/* Map Zoom Controls */}
          <div className="map-action-controls" style={{ right: '16px', bottom: '16px' }}>
            <button className="map-ctrl-btn" onClick={() => mapInstanceRef.current?.zoomIn()}>+</button>
            <button className="map-ctrl-btn" onClick={() => mapInstanceRef.current?.zoomOut()}>−</button>
          </div>
        </div>

        {/* AI Model Verdict & Active Route Insights */}
        <div className="saas-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={18} color="var(--primary)" />
                <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>AI Routing Decision</strong>
              </div>
              {activeRoute && (
                <span className={`pill-badge ${activeRoute.is_recommended ? 'badge-active' : 'badge-blue'}`}>
                  {activeRoute.is_recommended ? '★ AI TOP CHOICE' : 'ALTERNATIVE'}
                </span>
              )}
            </div>

            {/* AI Natural Language Rationale */}
            {optimizationData && (
              <div className="ai-rationale-box">
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-text)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                  AI Routing Rationale & Trade-Off Analysis:
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5', margin: 0 }}>
                  {optimizationData.ai_rationale}
                </p>
              </div>
            )}

            {/* Active Route Key Metrics Grid */}
            {activeRoute && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {activeRoute.name}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {activeRoute.summary || 'via Primary Highway'}
                  </span>
                </div>

                <div className="route-metrics-grid">
                  <div className="metric-pill-box">
                    <div className="metric-label">Total Distance</div>
                    <div className="metric-val" style={{ color: activeRoute.is_smallest_distance ? 'var(--primary-text)' : 'inherit' }}>
                      {activeRoute.distance_km} km
                    </div>
                    {activeRoute.is_smallest_distance && (
                      <span className="badge-sub-tiny badge-low">Smallest Path</span>
                    )}
                  </div>

                  <div className="metric-pill-box">
                    <div className="metric-label">Estimated Time</div>
                    <div className="metric-val">{activeRoute.duration_min} min</div>
                    <span className="badge-sub-tiny">
                      ~{(activeRoute.duration_min / 60).toFixed(1)} hrs
                    </span>
                  </div>

                  <div className="metric-pill-box">
                    <div className="metric-label">Traffic Index</div>
                    <div className="metric-val" style={{ color: activeRoute.traffic_index >= 70 ? '#ef4444' : (activeRoute.traffic_index >= 45 ? '#f59e0b' : '#059669') }}>
                      {activeRoute.traffic_index}%
                    </div>
                    <span className={`badge-sub-tiny ${activeRoute.traffic_index < 35 ? 'badge-low' : (activeRoute.traffic_index < 65 ? 'badge-medium' : 'badge-high')}`}>
                      {activeRoute.traffic_level} Congestion
                    </span>
                  </div>

                  <div className="metric-pill-box">
                    <div className="metric-label">ML Delay Risk</div>
                    <div className="metric-val" style={{ color: activeRoute.delay_risk_level === 'HIGH' ? '#ef4444' : '#059669' }}>
                      {Math.round(activeRoute.delay_probability * 100)}%
                    </div>
                    <span className={`badge-sub-tiny ${activeRoute.delay_risk_level === 'HIGH' ? 'badge-high' : 'badge-low'}`}>
                      {activeRoute.delay_risk_level} Risk
                    </span>
                  </div>
                </div>

                {/* Turn-by-Turn Directions Toggle */}
                {activeRoute.steps && activeRoute.steps.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <button 
                      onClick={() => setShowDirectionsDrawer(!showDirectionsDrawer)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--bg-card-subtle)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ListFilter size={14} color="var(--primary)" />
                        Turn-by-Turn Driving Steps ({activeRoute.steps.length})
                      </span>
                      <ChevronDown size={14} style={{ transform: showDirectionsDrawer ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>

                    {showDirectionsDrawer && (
                      <div className="gmaps-steps-list">
                        {activeRoute.steps.map((st, i) => (
                          <div key={i} className="gmaps-step-item">
                            <span className="step-num">{st.step_number}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '12px' }}>
                                {st.instruction}
                              </div>
                              {st.road_name && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {st.road_name}
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                              {st.distance_km} km
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            {dispatchStatus && (
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> {dispatchStatus}
              </div>
            )}
            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px' }}
              onClick={() => handleDispatch(activeRoute)}
              disabled={loading || !activeRoute}
            >
              <Send size={16} /> Dispatch This Route to Fleet ({vehicleId})
            </button>
          </div>
        </div>
      </div>

      {/* 3-Candidate Comparison Cards Deck */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--primary)" />
          Candidate Routes Comparison (Click card or route line on map to inspect)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {optimizationData?.routes?.map(route => {
            const isSelected = (route.id === (selectedRouteId || optimizationData.recommended_route_id));
            let badgeText = "Candidate Route";
            let badgeClass = "badge-blue";

            if (route.is_recommended) {
              badgeText = "★ AI Recommended";
              badgeClass = "badge-active";
            } else if (route.is_smallest_distance) {
              badgeText = "📏 Smallest Distance";
              badgeClass = "badge-medium";
            } else if (route.is_minimum_traffic) {
              badgeText = "🟢 Minimum Traffic";
              badgeClass = "badge-low";
            }

            return (
              <div 
                key={route.id}
                className={`saas-card route-card-selectable ${isSelected ? 'route-card-active' : ''}`}
                onClick={() => setSelectedRouteId(route.id)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span className={`pill-badge ${badgeClass}`} style={{ fontSize: '11px' }}>
                    {badgeText}
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: route.ai_score >= 80 ? 'var(--primary-text)' : 'inherit' }}>
                    {route.ai_score} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/100</span>
                  </div>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {route.name}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--primary-text)', fontWeight: 600, marginBottom: '6px' }}>
                  {route.summary || 'via Highway'}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  {route.characteristics}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
                  <div style={{ background: 'var(--bg-canvas)', padding: '6px 8px', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Distance</span>
                    <strong style={{ fontSize: '14px', color: route.is_smallest_distance ? 'var(--primary-text)' : 'inherit' }}>
                      {route.distance_km} km
                    </strong>
                  </div>
                  <div style={{ background: 'var(--bg-canvas)', padding: '6px 8px', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Duration</span>
                    <strong style={{ fontSize: '14px' }}>{route.duration_min} min</strong>
                  </div>
                  <div style={{ background: 'var(--bg-canvas)', padding: '6px 8px', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Traffic Index</span>
                    <strong style={{ fontSize: '14px', color: route.traffic_index >= 70 ? '#ef4444' : '#059669' }}>
                      {route.traffic_index}% ({route.traffic_level})
                    </strong>
                  </div>
                  <div style={{ background: 'var(--bg-canvas)', padding: '6px 8px', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Delay Risk</span>
                    <strong style={{ fontSize: '14px', color: route.delay_risk_level === 'HIGH' ? '#ef4444' : '#059669' }}>
                      {Math.round(route.delay_probability * 100)}% ({route.delay_risk_level})
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Est. Fuel: {route.fuel_liters} L
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? 'var(--primary-text)' : 'var(--text-secondary)' }}>
                    {isSelected ? '✓ Selected' : 'Click to inspect'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
