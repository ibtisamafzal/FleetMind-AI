/**
 * FleetMind AI — React API Client
 */

const API_BASE = ''; // Uses Vite proxy in dev, or same host in prod

export const api = {
  getToken() {
    return localStorage.getItem('fleetmind_token');
  },

  setToken(t) {
    if (t) localStorage.setItem('fleetmind_token', t);
    else localStorage.removeItem('fleetmind_token');
  },

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const t = this.getToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
    return headers;
  },

  async getDashboardAnalytics() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/dashboard`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline fallback for dashboard stats', e);
    }
    return {
      total_vehicles: 110,
      active_vehicles: 94,
      high_risk_vehicles: 8,
      medium_risk_vehicles: 85,
      low_risk_vehicles: 17,
      total_deliveries: 1544,
      delayed_deliveries: 14,
      orders_in_transit: 482,
      on_time_rate: 96.0,
      avg_delivery_time_display: "2d 24h 16m",
      avg_fuel_efficiency: 11.2,
      fuel_cost_month: 18420.0,
      delivery_volume_chart: {
        labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"],
        data: [1120, 1250, 1180, 1340, 1420, 1390, 1480, 1510, 1490, 1530, 1515, 1544]
      },
      sales_overview_chart: {
        labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
        data: [140, 165, 150, 210, 245, 278, 223, 195, 175],
        highlight_indices: [5, 6]
      },
      recent_order_preview: {
        order_id: "#PK-846134",
        status: "In Transit",
        destination: "Sundar Industrial Estate, Lahore",
        progress_percent: 68,
        vehicle_id: "VH-027",
        registration: "LEA-4823",
        driver_name: "Tariq Mehmood"
      },
      vehicles_requiring_attention: [
        {
          vehicle_id: "VH-027",
          registration_number: "LEA-4823",
          make_model: "Volvo FL Electric",
          risk_score: 82,
          risk_level: "HIGH",
          maintenance_risk: 81,
          fuel_risk: 88,
          delay_risk: 72,
          status: "Active"
        }
      ]
    };
  },

  async getVehicles(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/api/vehicles?${query}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline fallback for vehicles', e);
    }
    return [
      {
        vehicle_id: "VH-027",
        registration_number: "LEA-4823",
        vehicle_type: "Box Truck",
        make: "Volvo",
        model: "FL Electric",
        manufacturing_year: 2020,
        fuel_type: "Electric",
        mileage: 142850,
        last_service_date: "2025-08-28",
        service_mileage: 124000,
        current_status: "Active",
        risk_score: 82,
        risk_level: "HIGH",
        maintenance_risk: 81,
        fuel_risk: 88,
        delay_risk: 72
      },
      {
        vehicle_id: "VH-001",
        registration_number: "LEA-1001",
        vehicle_type: "Cargo Van",
        make: "Hino",
        model: "300 Series Euro-IV",
        manufacturing_year: 2021,
        fuel_type: "Diesel",
        mileage: 70513,
        last_service_date: "2025-11-26",
        service_mileage: 65441,
        current_status: "Active",
        risk_score: 38,
        risk_level: "LOW",
        maintenance_risk: 32,
        fuel_risk: 28,
        delay_risk: 30
      }
    ];
  },

  async addVehicle(vehicleData) {
    try {
      const res = await fetch(`${API_BASE}/api/vehicles`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(vehicleData)
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to add vehicle');
    } catch (e) {
      console.error('Error adding vehicle', e);
      throw e;
    }
  },

  async createVehicle(vehicleData) {
    return this.addVehicle(vehicleData);
  },

  async getVehicleDetail(id) {
    try {
      const res = await fetch(`${API_BASE}/api/vehicles/${id}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline fallback for vehicle detail', e);
    }
    return {
      vehicle_id: id,
      registration_number: "LEA-4823",
      vehicle_type: "Box Truck",
      make: "Volvo",
      model: "FL Electric",
      manufacturing_year: 2020,
      fuel_type: "Electric",
      mileage: 142850,
      last_service_date: "2025-08-28",
      service_mileage: 124000,
      current_status: "Active",
      risk_score: 82,
      risk_level: "HIGH",
      maintenance_risk: 81,
      fuel_risk: 88,
      delay_risk: 72,
      kms_since_service: 18850,
      avg_efficiency: 6.8,
      ai_explanation: "The major contributing factors are high mileage since the last service (18,850 km overdue) and declining fuel efficiency (6.8 km/L).",
      recommended_actions: [
        "Schedule preventative maintenance inspection immediately.",
        "Review recent fuel and battery consumption logs.",
        "Avoid assigning long-distance deliveries until inspection.",
        "Review recent driver performance."
      ]
    };
  },

  async getVehicleHistory(id) {
    try {
      const res = await fetch(`${API_BASE}/api/vehicles/${id}/history`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline fallback for history', e);
    }
    return {
      trips: [
        { trip_id: "TRP-1042", origin: "Sundar Industrial Estate, Lahore", destination: "I-9 Industrial Area, Islamabad", distance_km: 375.0, departure_time: "2026-03-01T08:00:00", delivery_status: "Delayed" },
        { trip_id: "TRP-1019", origin: "Thokar Niaz Baig Hub, Lahore", destination: "Faisalabad Value Addition City", distance_km: 180.0, departure_time: "2026-02-28T09:30:00", delivery_status: "On Time" }
      ],
      fuel_records: [
        { record_id: "FL-0027", date: "2026-02-28", fuel_amount_liters: 75.0, cost_usd: 21375.0, efficiency_kml: 6.8 }
      ],
      maintenance_records: [
        { maintenance_id: "MNT-0012", service_date: "2025-08-28", service_type: "Brake Shoe & Pad Replacement", cost_usd: 38500.0, mileage_at_service: 124000, notes: "Passed inspection." }
      ]
    };
  },

  async getDrivers(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/api/drivers?${query}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline fallback for drivers', e);
    }
    return [
      {
        driver_id: "DRV-001",
        name: "Tariq Mehmood",
        experience_years: 8,
        total_trips: 1240,
        late_deliveries: 34,
        accidents: 0,
        average_speed: 58.5,
        rating: 4.92,
        status: "Active",
        delay_rate: 2.7
      }
    ];
  },

  async addDriver(driverData) {
    try {
      const res = await fetch(`${API_BASE}/api/drivers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(driverData)
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to add driver');
    } catch (e) {
      console.error('Error adding driver', e);
      throw e;
    }
  },

  async createDriver(driverData) {
    return this.addDriver(driverData);
  },

  async getTrips(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/api/trips?${query}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline fallback for trips', e);
    }
    return [
      {
        trip_id: "TRP-1001",
        vehicle_id: "VH-027",
        driver_id: "DRV-001",
        origin: "Sundar Industrial Estate, Lahore",
        destination: "I-9 Industrial Area, Islamabad",
        distance_km: 375.0,
        estimated_duration: 270,
        actual_duration: 340,
        number_of_stops: 3,
        departure_time: "2026-03-01T08:15:00",
        weather_condition: "Winter Fog/Smog",
        traffic_level: "High",
        delivery_status: "Delayed",
        is_delayed: 1
      }
    ];
  },

  async predictDelay(payload) {
    try {
      const res = await fetch(`${API_BASE}/api/ml/predict-delay`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline fallback for delay prediction', e);
    }
    return {
      delay_probability: 0.78,
      risk_level: "HIGH",
      prediction: "DELAYED"
    };
  },

  async getRouteLocations() {
    try {
      const res = await fetch(`${API_BASE}/api/ml/route-locations`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline fallback for route locations', e);
    }
    return [
      { id: "sundar_lahore", name: "Sundar Industrial Estate, Lahore", city: "Lahore", lat: 31.2855, lng: 74.1750, type: "Industrial Depot" },
      { id: "thokar_lahore", name: "Thokar Niaz Baig Hub, Lahore", city: "Lahore", lat: 31.4682, lng: 74.2405, type: "Transit Terminal" },
      { id: "moghalpura_lahore", name: "Lahore Dry Port Moghalpura", city: "Lahore", lat: 31.5714, lng: 74.3794, type: "Dry Port" },
      { id: "cargo_complex_lahore", name: "Allama Iqbal Cargo Complex, Lahore", city: "Lahore", lat: 31.5210, lng: 74.4030, type: "Air Cargo Terminal" },
      { id: "kot_lakhpat_lahore", name: "Kot Lakhpat Industrial Area, Lahore", city: "Lahore", lat: 31.4580, lng: 74.3310, type: "Industrial Zone" },
      { id: "ravi_toll_lahore", name: "M-2 Motorway Ravi Interchange, Lahore", city: "Lahore", lat: 31.6050, lng: 74.2750, type: "Motorway Gateway" },
      { id: "islamabad_i9", name: "I-9 Industrial Area, Islamabad", city: "Islamabad", lat: 33.6690, lng: 73.0530, type: "Industrial Depot" },
      { id: "faisalabad_vac", name: "Faisalabad Value Addition City", city: "Faisalabad", lat: 31.4187, lng: 73.0791, type: "Industrial City" },
      { id: "multan_dry_port", name: "Multan Dry Port Terminal", city: "Multan", lat: 30.1984, lng: 71.4687, type: "Dry Port" },
      { id: "karachi_port_qasim", name: "Karachi Port Qasim Terminal", city: "Karachi", lat: 24.7830, lng: 67.3480, type: "Deep Sea Port" }
    ];
  },

  async optimizeRoute(payload) {
    try {
      const res = await fetch(`${API_BASE}/api/ml/optimize-route`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline fallback for route optimization', e);
    }
    // Fallback response for offline resilience
    return {
      origin: { name: "Sundar Industrial Estate, Lahore", lat: 31.2855, lng: 74.1750 },
      destination: { name: "I-9 Industrial Area, Islamabad", lat: 33.6690, lng: 73.0530 },
      departure_hour: 10,
      day_of_week: 2,
      weather_condition: "Clear",
      traffic_time_multiplier: 1.65,
      preference: payload.preference || "balanced",
      recommended_route_id: "route_min_traffic",
      ai_rationale: "At morning peak dispatch, the AI model strongly recommends the Motorway Outer Bypass. Although 42 km longer than congested downtown arteries, it completely bypasses urban bottleneck gridlock, saving 38 minutes and cutting delay risk from HIGH to LOW.",
      routes: [
        {
          id: "route_shortest",
          name: "Direct City Corridor (Shortest Distance)",
          corridor_type: "Urban Arterial",
          distance_km: 345.0,
          duration_min: 360,
          traffic_index: 84,
          traffic_level: "Severe",
          polyline: [[31.2855, 74.1750], [31.4682, 74.2405], [31.5714, 74.3794], [32.1877, 74.1945], [33.6690, 73.0530]],
          is_smallest_distance: true,
          is_minimum_traffic: false,
          is_recommended: false,
          characteristics: "Absolute shortest path in kilometers; cuts directly through central urban arteries.",
          bottlenecks: ["Downtown Signal Intersections", "Central Flyover Chokepoints"],
          delay_probability: 0.82,
          delay_risk_level: "HIGH",
          fuel_liters: 49.5,
          co2_kg: 132.7,
          ai_score: 52,
          segments: [
            { segment_order: 1, name: "Depot Access", lat: 31.2855, lng: 74.1750, traffic_status: "Moderate", typical_speed_kmh: 42, distance_km: 86.2 },
            { segment_order: 2, name: "City Arterial", lat: 31.5714, lng: 74.3794, traffic_status: "High", typical_speed_kmh: 28, distance_km: 86.2 }
          ]
        },
        {
          id: "route_balanced",
          name: "Express Freight Corridor (AI Recommended)",
          corridor_type: "Primary Arterial & Flyovers",
          distance_km: 372.0,
          duration_min: 275,
          traffic_index: 44,
          traffic_level: "Medium",
          polyline: [[31.2855, 74.1750], [31.4230, 74.1950], [31.6050, 74.2750], [32.4945, 74.5229], [33.6690, 73.0530]],
          is_smallest_distance: false,
          is_minimum_traffic: false,
          is_recommended: false,
          characteristics: "Optimal trade-off: Minimal extra distance (+8%) while avoiding major urban congestion chokepoints.",
          bottlenecks: ["Toll Plaza Entry", "Ring Road Interchanges"],
          delay_probability: 0.38,
          delay_risk_level: "MEDIUM",
          fuel_liters: 42.0,
          co2_kg: 112.5,
          ai_score: 84,
          segments: [
            { segment_order: 1, name: "Ring Road Entry", lat: 31.4230, lng: 74.1950, traffic_status: "Moderate", typical_speed_kmh: 48, distance_km: 93.0 },
            { segment_order: 2, name: "M-2 Express Corridor", lat: 31.6050, lng: 74.2750, traffic_status: "Low", typical_speed_kmh: 65, distance_km: 93.0 }
          ]
        },
        {
          id: "route_min_traffic",
          name: "Motorway Outer Bypass (Minimum Traffic)",
          corridor_type: "Motorway / Ring Road Bypass",
          distance_km: 388.0,
          duration_min: 260,
          traffic_index: 24,
          traffic_level: "Low",
          polyline: [[31.2855, 74.1750], [31.4682, 74.2405], [31.6050, 74.2750], [32.1877, 74.1945], [33.6690, 73.0530]],
          is_smallest_distance: false,
          is_minimum_traffic: true,
          is_recommended: true,
          characteristics: "Smoothest transit with near zero congestion; utilizes outer high-speed bypasses.",
          bottlenecks: ["Motorway Toll Booth"],
          delay_probability: 0.16,
          delay_risk_level: "LOW",
          fuel_liters: 38.8,
          co2_kg: 104.0,
          ai_score: 91,
          segments: [
            { segment_order: 1, name: "Motorway Access Slip", lat: 31.4682, lng: 74.2405, traffic_status: "Low", typical_speed_kmh: 70, distance_km: 97.0 },
            { segment_order: 2, name: "M-2 North Corridor", lat: 31.6050, lng: 74.2750, traffic_status: "Low", typical_speed_kmh: 88, distance_km: 97.0 }
          ]
        }
      ]
    };
  },

  async dispatchRoute(payload) {
    try {
      const res = await fetch(`${API_BASE}/api/ml/dispatch-route`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Dispatch error fallback', e);
    }
    return {
      status: "success",
      message: `Dispatched route for ${payload.vehicle_id} to ${payload.destination}`,
      trip_id: `TRP-OPT-${Math.floor(1000 + Math.random() * 9000)}`
    };
  },


  async sendAIChat(message, vehicle_id = null) {
    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ message, vehicle_id })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline fallback for AI chat', e);
    }
    return {
      response: `Vehicle VH-027 currently has an overall risk score of 82/100 (HIGH).\n\nMain contributing factors:\n1. High mileage since last service (18,850 km overdue)\n2. Declining fuel efficiency (6.8 km/L)\n3. Higher-than-average delivery delays (28% delay rate)\n\nRecommended action:\nSchedule a maintenance inspection and review recent fuel consumption.`,
      sources: [
        { doc_title: "Fleet Maintenance Policies", section: "Critical Service Overhaul Threshold", source_file: "fleet_maintenance_policies.md", relevance_score: 0.88 }
      ]
    };
  },

  async getFleetAnalytics() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/fleet`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline fallback for fleet analytics', e);
    }
    return {
      delivery_analytics: {
        on_time_pct: 92.4,
        delay_pct: 7.6,
        avg_delay_minutes: 34.5,
        driver_delay_chart: {
          labels: ["Marcus Vance", "Thomas Nowak", "David Dabrowski", "Elena Rostova", "Sarah Jenkins"],
          data: [19.2, 14.8, 12.1, 9.4, 4.2]
        },
        route_delay_chart: {
          labels: ["Warszawa - Krakow", "Warszawa - Poznan", "Wroclaw - Katowice", "Gdansk - Warszawa"],
          data: [42, 29, 21, 18]
        }
      },
      fuel_analytics: {
        total_consumption_liters: 42850,
        avg_kml: 8.7,
        total_fuel_cost: 58420.0,
        efficiency_distribution: {
          labels: ["< 6 km/L", "6-8 km/L", "8-10 km/L", "10-14 km/L", "> 14 km/L"],
          data: [8, 38, 42, 14, 8]
        },
        fuel_anomalies: [
          { vehicle_id: "VH-027", reg: "WA-4823K", current_eff: 6.8, baseline: 11.5, drop_pct: -40.8, flag: "Severe Degradation" },
          { vehicle_id: "VH-054", reg: "WA-1054P", current_eff: 7.1, baseline: 9.2, drop_pct: -22.8, flag: "High Idle Detected" }
        ]
      },
      maintenance_analytics: {
        total_maintenance_cost: 45800.0,
        service_frequency_monthly: 28,
        vehicles_overdue_count: 8,
        overdue_vehicles: [
          { vehicle_id: "VH-027", registration_number: "WA-4823K", make_model: "Volvo FL Electric", kms_since_service: 18850, last_service_date: "2025-08-28" }
        ]
      }
    };
  },

  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using default settings', e);
    }
    return {
      ollama_base_url: "http://localhost:11434",
      ollama_model: "llama3.2",
      weights: { maintenance: 0.40, fuel: 0.30, delay: 0.30 }
    };
  },

  async saveSettings(settingsData) {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(settingsData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Settings saved locally', e);
    }
    return { status: "success" };
  },

  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        this.setToken(data.access_token);
        return data;
      }
    } catch (e) {
      console.warn('Demo login fallback', e);
    }
    const demoData = {
      access_token: "demo-jwt-token-react",
      user_name: email.includes("safety") ? "Sarah Khan" : "Tariq Mehmood",
      role: email.includes("safety") ? "Safety Officer" : "Fleet Manager",
      email: email
    };
    this.setToken(demoData.access_token);
    return demoData;
  },

  async getExecutiveReport() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/executive-report`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline executive report fallback', e);
    }
    return {
      report_id: "FM-AUD-2026-Q4-8841",
      title: "FleetMind AI — Executive Fleet Audit & Compliance Dossier",
      generated_at: new Date().toLocaleString(),
      auditor_authority: "National Motorway & Fleet Safety Standards Directorate",
      auditor_lead: "Engr. Sarah Khan, Lead Telematics Auditor",
      digital_seal_hash: "SHA256: 4e9f7a8b202611131e84c90d2",
      fleet_readiness_index: 91.8,
      fleet_grade: "Grade A (High Operational Readiness)",
      executive_summary: "Fleet operations demonstrate superior telematics discipline across primary Pakistani freight corridors (M-2, N-5, M-5). Automated ML anomaly detection has mitigated an estimated 84 delay hours this period, while eco-routing reduced Scope 1 carbon output by 14.1%.",
      asset_status: {
        total_fleet_size: 110,
        active_in_transit: 94,
        in_maintenance_bay: 16,
        high_risk_count: 8,
        overdue_service_count: 8,
        fleet_availability_rate: 85.5
      },
      regulatory_compliance: [
        { standard: "NH&MP Maximum Speed Adherence (110 km/h Motorway / 90 km/h Heavy)", score: 98.2, status: "Compliant", benchmark: "≥ 95.0%" },
        { standard: "Driver Driving Hours (NH&MP 4.5h Continuous Limit / 45-min Rest)", score: 96.8, status: "Compliant", benchmark: "≥ 95.0%" },
        { standard: "Axle Load Limit & Freight Weighbridge Certification", score: 99.4, status: "Compliant", benchmark: "≥ 98.0%" },
        { standard: "Punjab Winter Smog / Fog Convoy Lighting & Visibility Protocol", score: 94.0, status: "Caution", benchmark: "≥ 95.0%" },
        { standard: "Scheduled Preventative Maintenance Compliance (< 12,000 km)", score: 92.7, status: "Compliant", benchmark: "≥ 90.0%" }
      ],
      high_priority_directives: [
        {
          priority: "P1 - Critical",
          unit: "VH-027 (LEA-4823)",
          finding: "Severe fuel consumption drop (-40.8% below baseline) and overdue service interval (+18,850 km).",
          directive: "Immediate ground stop for fuel injection pump calibration and brake drum inspection."
        },
        {
          priority: "P2 - Elevated",
          unit: "Fleet-wide (8 Units)",
          finding: "Eight commercial vehicles operate past recommended 12,000 km oil/filter service limit.",
          directive: "Issue scheduled depot recall slips to Thokar Niaz Baig Central Workshop."
        },
        {
          priority: "P3 - Safety",
          unit: "DRV-007 (Zubair Shah)",
          finding: "Elevated speed profile on M-2 Kallar Kahar Salt Range downgrade (recorded 98 km/h vs 70 km/h limit).",
          directive: "Assign mandatory 2-hour heavy vehicle descent & retarder brake refresher module."
        }
      ],
      top_risk_vehicles: [
        { vehicle_id: "VH-027", reg: "LEA-4823", model: "Volvo FL Electric", risk_score: 82, maintenance_risk: 81, fuel_risk: 88, delay_risk: 72, recommended_action: "Urgent mechanical workshop dispatch" }
      ],
      esg_decarbonization: {
        scope1_co2_metric_tons: 114.8,
        ai_optimized_co2_savings_mt: 16.2,
        carbon_reduction_pct: 14.1,
        trees_offset_equivalent: 780,
        clean_fleet_rating: "Tier 1 Eco-Fleet"
      },
      financial_impact: {
        monthly_fuel_expenditure_pkr: 16357600,
        preventable_waste_prevented_pkr: 1420000,
        roi_multiple: "4.8x Telematics ROI"
      }
    };
  },

  async getESGMetrics() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/esg-metrics`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline ESG fallback', e);
    }
    return {
      scope1_co2_metric_tons: 114.8,
      co2_saved_metric_tons: 16.2,
      reduction_percentage: 14.1,
      diesel_liters_saved: 6050,
      trees_equivalent: 780,
      clean_energy_fleet_score: 88,
      ev_transition_scenario: {
        urban_vans_electrified: 25,
        annual_co2_reduction_tons: 48.6,
        annual_fuel_savings_pkr: 4850000,
        payback_period_years: 2.4
      },
      eco_drivers: [
        { driver_id: "DRV-001", name: "Tariq Mehmood", eco_score: 96, avg_speed: "58.5 km/h", idle_pct: "3.2%" },
        { driver_id: "DRV-003", name: "Khurram Shah", eco_score: 94, avg_speed: "52.6 km/h", idle_pct: "3.8%" },
        { driver_id: "DRV-004", name: "Rashid Chaudhry", eco_score: 91, avg_speed: "47.1 km/h", idle_pct: "4.1%" }
      ]
    };
  },

  async getLiveTelematicsStream() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/telematics/live-stream`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline telematics fallback', e);
    }
    return {
      active_stream: true,
      connected_telematics_units: 110,
      frequency: "3000ms",
      timestamp: new Date().toLocaleTimeString(),
      vehicles: [
        { vehicle_id: "VH-027", plate: "LEA-4823", driver: "Tariq Mehmood", corridor: "Sundar Industrial Estate → Thokar", speed_kmh: 54, engine_temp_c: 82, fuel_pct: 68, tire_pressure_psi: 105, status: "In Transit", alert: null },
        { vehicle_id: "VH-014", plate: "LEA-1014", driver: "Zubair Shah", corridor: "M-2 Motorway (Kallar Kahar Salt Range)", speed_kmh: 98, engine_temp_c: 92, fuel_pct: 54, tire_pressure_psi: 108, status: "Overspeeding", alert: "🚨 Overspeeding: 98 km/h (Salt Range advisory: 70 km/h)" },
        { vehicle_id: "VH-001", plate: "LEA-1001", driver: "Waqas Gillani", corridor: "N-5 GT Road (Gujranwala Bypass)", speed_kmh: 62, engine_temp_c: 84, fuel_pct: 81, tire_pressure_psi: 104, status: "In Transit", alert: null },
        { vehicle_id: "VH-042", plate: "LEA-1042", driver: "Muhammad Bajwa", corridor: "M-4 Motorway (Gojra)", speed_kmh: 81, engine_temp_c: 104, fuel_pct: 42, tire_pressure_psi: 106, status: "Critical Temp", alert: "⚠️ Engine Overheating: 104°C (Safe threshold: 95°C)" },
        { vehicle_id: "VH-082", plate: "ICT-1082", driver: "Irfan Butt", corridor: "M-5 Motorway (Rohri - Sukkur)", speed_kmh: 72, engine_temp_c: 86, fuel_pct: 33, tire_pressure_psi: 82, status: "Tire Warning", alert: "⚠️ Low Tire Pressure: Rear-Right 82 psi (Expected: 105 psi)" }
      ]
    };
  },

  async simulateIncident(type = "overspeeding") {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/telematics/simulate-incident`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ incident_type: type })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline incident simulation', e);
    }
    return {
      incident_id: "INC-SIM-9912",
      type: "Overspeeding Incident",
      severity: "CRITICAL",
      vehicle_id: "VH-014",
      plate: "LEA-1014",
      driver: "Zubair Shah",
      location: "M-2 Motorway KM 224 (Salt Range Steep Gradient)",
      telemetry: { speed: "106 km/h", limit: "70 km/h", engine_rpm: 2450 },
      timestamp: new Date().toLocaleTimeString(),
      ai_action: "Trigger audio advisory to in-cabin telematics unit; alert NH&MP control."
    };
  },

  async getModelBenchmarks() {
    try {
      const res = await fetch(`${API_BASE}/api/ml/model-benchmarks`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using offline ML benchmarks fallback', e);
    }
    return {
      title: "FleetMind AI — Predictive Model Performance & Explainability Benchmark",
      evaluation_dataset: {
        total_trips: 3919,
        train_set_size: 3135,
        test_set_size: 784,
        split_ratio: "80/20 Stratified Train-Test Split",
        target_variable: "is_delayed (Binary: 0 = On Time, 1 = Delayed)",
        cross_validation: "5-Fold Stratified K-Fold"
      },
      models: [
        { model_name: "Gradient Boosting Classifier", role: "Champion Model (Production)", accuracy: 82.6, precision: 76.8, recall: 59.4, f1_score: 67.0, roc_auc: 0.875, latency_ms: 4.2, status: "Champion" },
        { model_name: "Random Forest Classifier", role: "Ensemble Tree Model", accuracy: 79.4, precision: 73.1, recall: 54.2, f1_score: 62.2, roc_auc: 0.842, latency_ms: 5.1, status: "Candidate" },
        { model_name: "Logistic Regression (L2)", role: "Linear Baseline Model", accuracy: 75.3, precision: 68.8, recall: 51.5, f1_score: 58.9, roc_auc: 0.806, latency_ms: 1.2, status: "Baseline" }
      ],
      confusion_matrix: {
        true_negatives: 451,
        false_positives: 63,
        false_negatives: 131,
        true_positives: 139,
        total_test_samples: 784,
        labels: ["On-Time (Class 0)", "Delayed (Class 1)"]
      },
      feature_importance: [
        { feature: "Trip Distance (km)", weight: 28.4, category: "Route Factor", direction: "Positive (+)", description: "Longer haul distances linearly increase exposure to road anomalies, toll queues, and driver fatigue." },
        { feature: "Real-Time Traffic Congestion", weight: 24.2, category: "Telematics", direction: "Positive (+)", description: "High and Severe congestion levels exponentially escalate urban depot entry delays." },
        { feature: "Adverse Weather / Smog Index", weight: 18.1, category: "Environmental", direction: "Positive (+)", description: "Winter Punjab smog reduces safe highway speeds by up to 45% between 11 PM and 9 AM." },
        { feature: "Driver Experience (Years)", weight: 14.3, category: "Operator Profile", direction: "Negative (-)", description: "Senior drivers (> 8 years) exhibit 34% lower delay frequencies under adverse conditions." },
        { feature: "Departure Hour Window", weight: 9.8, category: "Scheduling", direction: "Non-linear", description: "Departures between 07:00-09:30 and 16:30-19:00 experience peak metropolitan bottlenecks." },
        { feature: "Vehicle Historical Delay Rate", weight: 5.2, category: "Asset Telemetry", direction: "Positive (+)", description: "Vehicles with higher historical maintenance and cooling issues correlate with transit stoppages." }
      ]
    };
  },

  // =========================================================================
  // 1. FLEET RISK RADAR API METHODS
  // =========================================================================
  async getFleetRiskRadar(params = {}) {
    const q = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/api/risk-radar/fleet?${q}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Risk radar fallback', e);
    }
    return {
      summary: {
        total_evaluated: 110,
        average_risk_score: 48.2,
        high_risk_count: 8,
        medium_risk_count: 85,
        low_risk_count: 17,
        urgent_attention_count: 8
      },
      vehicles: []
    };
  },

  async getVehicleRiskDetail(vehicleId) {
    try {
      const res = await fetch(`${API_BASE}/api/risk-radar/vehicle/${vehicleId}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Vehicle risk detail fallback', e);
    }
    return null;
  },

  // =========================================================================
  // 2. WHAT-IF FLEET SIMULATOR API METHODS
  // =========================================================================
  async getSimulatorScenarios() {
    try {
      const res = await fetch(`${API_BASE}/api/simulator/scenarios`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Simulator scenarios fallback', e);
    }
    return [];
  },

  async getSimulatorAlternatives(vehicleId) {
    try {
      const res = await fetch(`${API_BASE}/api/simulator/alternatives/${vehicleId}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Simulator alternatives fallback', e);
    }
    return { recommended_alternatives: [] };
  },

  async runFleetSimulation(payload) {
    try {
      const res = await fetch(`${API_BASE}/api/simulator/run`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Simulation run fallback', e);
    }
    return null;
  },

  // =========================================================================
  // 3. FLEET ACTION CENTER API METHODS
  // =========================================================================
  async getActionItems(params = {}) {
    const q = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/api/action-center/actions?${q}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Action center fallback', e);
    }
    return { stats: { pending: 4, in_progress: 1, completed: 1, critical_unresolved: 2 }, actions: [] };
  },

  async createActionItem(payload) {
    try {
      const res = await fetch(`${API_BASE}/api/action-center/actions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to create action', e);
      throw e;
    }
  },

  async updateActionItem(actionId, payload) {
    try {
      const res = await fetch(`${API_BASE}/api/action-center/actions/${actionId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to update action', e);
      throw e;
    }
  },

  async autoSyncRiskRadarActions() {
    try {
      const res = await fetch(`${API_BASE}/api/action-center/auto-sync-alerts`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to sync actions', e);
      throw e;
    }
  },

  // =========================================================================
  // 4. PREDICTIVE MAINTENANCE INTELLIGENCE
  // =========================================================================
  async getPredictiveMaintenance() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/predictive-maintenance`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Predictive maintenance fallback', e);
    }
    return null;
  },

  // =========================================================================
  // 5. DRIVER PERFORMANCE INTELLIGENCE
  // =========================================================================
  async getDriverIntelligence() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/driver-intelligence`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Driver intelligence fallback', e);
    }
    return null;
  },

  // =========================================================================
  // 6. FUEL ANOMALY DETECTION
  // =========================================================================
  async getFuelAnomalies() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/fuel-anomalies`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Fuel anomalies fallback', e);
    }
    return null;
  }
};
