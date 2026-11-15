import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { Search, ChevronDown, Compass, Moon, Sun, Globe } from 'lucide-react';

export default function LeafletDarkMap() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const navigate = useNavigate();

  const getInitialStyle = () => {
    if (typeof document !== 'undefined') {
      const theme = document.documentElement.getAttribute('data-theme');
      if (theme === 'light') return 'light';
    }
    return 'dark';
  };

  const [mapStyle, setMapStyle] = useState(getInitialStyle);

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

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Lahore, Pakistan logistics hub
    const lahoreCoords = [31.5204, 74.3587];
    const map = L.map(mapContainerRef.current, {
      center: lahoreCoords,
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    const initStyle = getInitialStyle();
    updateTileLayer(initStyle, map);

    // Custom Neon Mint Pin Marker Icon
    const createPinIcon = (isVehicle = false) => {
      return L.divIcon({
        className: 'custom-fleet-pin',
        html: `
          <div style="
            width: 34px; height: 34px;
            background: #ffffff;
            border: 2px solid #00d084;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 15px rgba(0, 208, 132, 0.6);
            cursor: pointer;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              ${isVehicle 
                ? '<rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>' 
                : '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>'}
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
    };

    const fleetLocations = [
      { coords: [31.2855, 74.1750], title: "Unit VH-027 (LEA-4823)", status: "Active • In Transit", sub: "Sundar Industrial Estate, Lahore", isVehicle: true, vId: "VH-027" },
      { coords: [31.4682, 74.2405], title: "Order #PK-846134", status: "Priority Delivery", sub: "Thokar Niaz Baig Hub", isVehicle: false },
      { coords: [31.5714, 74.3794], title: "Unit VH-001 (LEA-1001)", status: "Active", sub: "Moghalpura Dry Port Terminal", isVehicle: true, vId: "VH-001" },
      { coords: [31.6050, 74.2750], title: "Unit VH-014 (LEA-1014)", status: "Dispatched", sub: "M-2 Motorway Ravi Interchange", isVehicle: true, vId: "VH-014" },
      { coords: [31.4815, 74.3160], title: "Order #PK-901248", status: "In Transit", sub: "Kot Lakhpat Industrial Area", isVehicle: false },
      { coords: [31.5210, 74.4030], title: "Unit VH-042 (LEA-1042)", status: "Active", sub: "Allama Iqbal Cargo Complex", isVehicle: true, vId: "VH-042" }
    ];

    fleetLocations.forEach(loc => {
      const marker = L.marker(loc.coords, { icon: createPinIcon(loc.isVehicle) }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
          <div style="font-weight: 800; font-size: 13px; color: #111827;">${loc.title}</div>
          <div style="font-size: 11px; color: #00d084; font-weight: 700; margin: 2px 0;">${loc.status}</div>
          <div style="font-size: 11px; color: #64748b;">${loc.sub}</div>
          ${loc.vId ? `<button id="btn-inspect-${loc.vId}" style="margin-top: 6px; padding: 4px 8px; background: #00d084; border: none; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 600; cursor: pointer;">Inspect Telemetry</button>` : ''}
        </div>
      `);

      marker.on('popupopen', () => {
        if (loc.vId) {
          const btn = document.getElementById(`btn-inspect-${loc.vId}`);
          if (btn) btn.onclick = () => navigate(`/vehicles/${loc.vId}`);
        }
      });
    });

    // Google Maps double-cased polyline representing active Pakistan freight corridor
    const routePoints = [
      [31.2855, 74.1750],
      [31.4682, 74.2405],
      [31.6050, 74.2750]
    ];
    // Casing
    L.polyline(routePoints, {
      color: '#ffffff',
      weight: 6,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Google Blue inner line
    L.polyline(routePoints, {
      color: '#1a73e8',
      weight: 4,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [navigate]);

  return (
    <section className="map-hero-card">
      {/* Floating Search and Filter Bar */}
      <div className="map-floating-bar">
        <div className="map-search-pill">
          <Search size={16} color="#64748b" />
          <input type="text" defaultValue="Lahore, Pakistan" placeholder="Search route, city, or depot..." />
        </div>

        <div className="map-sort-pill" onClick={() => navigate('/trips')}>
          <span>Sort by</span>
          <strong style={{ color: 'var(--text-main)' }}>In Transit</strong>
          <ChevronDown size={14} />
        </div>

        {/* Google Maps Style Switcher */}
        <div className="gmaps-style-switcher" style={{ position: 'static' }}>
          <button 
            className={`gmaps-style-btn ${mapStyle === 'dark' ? 'active' : ''}`}
            onClick={() => handleMapStyleChange('dark')}
            title="Google Dark Mode"
          >
            <Moon size={12} /> Dark
          </button>
          <button 
            className={`gmaps-style-btn ${mapStyle === 'light' ? 'active' : ''}`}
            onClick={() => handleMapStyleChange('light')}
            title="Google Light / Street Mode"
          >
            <Sun size={12} /> Light
          </button>
          <button 
            className={`gmaps-style-btn ${mapStyle === 'satellite' ? 'active' : ''}`}
            onClick={() => handleMapStyleChange('satellite')}
            title="Satellite View"
          >
            <Globe size={12} /> Satellite
          </button>
        </div>

        <button 
          className="btn-primary" 
          onClick={() => navigate('/trips')}
          style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          title="Open AI Route & Minimum Traffic Optimizer"
        >
          <Compass size={14} /> AI Route Optimizer
        </button>
      </div>

      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} className="leaflet-map-box" />

      {/* Floating Zoom & Controls */}
      <div className="map-action-controls">
        <button 
          className="map-ctrl-btn" 
          onClick={() => mapInstanceRef.current?.zoomIn()} 
          title="Zoom In"
        >
          +
        </button>
        <button 
          className="map-ctrl-btn" 
          onClick={() => mapInstanceRef.current?.zoomOut()} 
          title="Zoom Out"
        >
          −
        </button>
      </div>
    </section>
  );
}
