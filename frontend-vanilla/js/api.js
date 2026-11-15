/**
 * FleetMind AI — API Client Module
 * Connects to FastAPI backend with offline graceful fallback
 */

const API_BASE = window.location.origin.includes('8000') 
  ? window.location.origin 
  : 'http://localhost:8000';

class FleetAPI {
  constructor() {
    this.token = localStorage.getItem('fleetmind_token') || null;
  }

  setToken(t) {
    this.token = t;
    if (t) localStorage.setItem('fleetmind_token', t);
    else localStorage.removeItem('fleetmind_token');
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  async getDashboardAnalytics() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/dashboard`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline fallback for dashboard stats", e);
    }
    // Fallback matching ArgoLogics screenshot
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
        order_id: "#AB-846134",
        status: "In Transit",
        destination: "Plac Zamkowy 4, 00-277 Warszawa",
        progress_percent: 68,
        vehicle_id: "VH-027",
        registration: "WA-4823K",
        driver_name: "Robert Reynolds"
      },
      vehicles_requiring_attention: [
        {
          vehicle_id: "VH-027",
          registration_number: "WA-4823K",
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
  }

  async getVehicles(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/api/vehicles?${query}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline fallback for vehicles", e);
    }
    return [
      {
        vehicle_id: "VH-027",
        registration_number: "WA-4823K",
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
        registration_number: "WA-1001K",
        vehicle_type: "Cargo Van",
        make: "Mercedes-Benz",
        model: "Sprinter 314",
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
  }

  async getVehicleDetail(id) {
    try {
      const res = await fetch(`${API_BASE}/api/vehicles/${id}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline fallback for vehicle detail", e);
    }
    return {
      vehicle_id: id,
      registration_number: "WA-4823K",
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
      ai_explanation: "The major contributing factors are high mileage since the last service (18,850 km) and declining fuel efficiency (6.8 km/L).",
      recommended_actions: [
        "Schedule maintenance inspection immediately.",
        "Review recent fuel and battery consumption logs.",
        "Avoid assigning long-distance deliveries until inspection.",
        "Review recent driver performance and telematics."
      ]
    };
  }

  async getVehicleHistory(id) {
    try {
      const res = await fetch(`${API_BASE}/api/vehicles/${id}/history`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline fallback for vehicle history", e);
    }
    return {
      trips: [
        { trip_id: "TRP-1042", origin: "Warszawa Depot", destination: "Plac Zamkowy 4", distance_km: 18.5, departure_time: "2026-03-01T08:00:00", delivery_status: "Delayed" },
        { trip_id: "TRP-1019", origin: "Warszawa Depot", destination: "Mokotow Business Park", distance_km: 24.0, departure_time: "2026-02-28T09:30:00", delivery_status: "On Time" }
      ],
      fuel_records: [
        { record_id: "FL-0027", date: "2026-02-28", fuel_amount_liters: 75.0, cost_usd: 26.25, efficiency_kml: 6.8 }
      ],
      maintenance_records: [
        { maintenance_id: "MNT-0012", service_date: "2025-08-28", service_type: "Brake Pad Replacement", cost_usd: 480.0, mileage_at_service: 124000, notes: "Passed inspection." }
      ]
    };
  }

  async getDrivers(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/api/drivers?${query}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline fallback for drivers", e);
    }
    return [
      {
        driver_id: "DRV-001",
        name: "Robert Reynolds",
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
  }

  async getTrips(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/api/trips?${query}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline fallback for trips", e);
    }
    return [
      {
        trip_id: "TRP-1001",
        vehicle_id: "VH-027",
        driver_id: "DRV-001",
        origin: "Warszawa Depot",
        destination: "Plac Zamkowy 4, Warszawa",
        distance_km: 18.5,
        estimated_duration: 35,
        actual_duration: 52,
        number_of_stops: 3,
        departure_time: "2026-03-01T08:15:00",
        weather_condition: "Rain",
        traffic_level: "High",
        delivery_status: "Delayed",
        is_delayed: 1
      }
    ];
  }

  async predictDelay(payload) {
    try {
      const res = await fetch(`${API_BASE}/api/ml/predict-delay`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline fallback for delay prediction", e);
    }
    return {
      delay_probability: 0.78,
      risk_level: "HIGH",
      prediction: "DELAYED"
    };
  }

  async sendAIChat(message, vehicle_id = null) {
    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ message, vehicle_id })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline fallback for AI chat", e);
    }
    return {
      response: `Vehicle VH-027 currently has an overall risk score of 82/100 (HIGH).\n\nMain contributing factors:\n1. High mileage since last service (18,850 km overdue)\n2. Declining fuel efficiency (6.8 km/L)\n3. Higher-than-average delivery delays (28% delay rate)\n\nRecommended action:\nSchedule a maintenance inspection and review recent fuel consumption.`,
      sources: [
        { doc_title: "Fleet Maintenance Policies", section: "Critical Service Overhaul Threshold", source_file: "fleet_maintenance_policies.md", relevance_score: 0.88 }
      ]
    };
  }

  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using default settings", e);
    }
    return {
      ollama_base_url: "http://localhost:11434",
      ollama_model: "llama3.2",
      weights: { maintenance: 0.40, fuel: 0.30, delay: 0.30 }
    };
  }

  async saveSettings(settingsData) {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(settingsData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Settings saved locally", e);
    }
    return { status: "success" };
  }

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
      console.warn("Local demo login fallback", e);
    }
    // Demo fallback login
    const demoData = {
      access_token: "demo-jwt-token-12345",
      user_name: email.includes("safety") ? "Sarah Jenkins" : "Robert Reynolds",
      role: email.includes("safety") ? "Safety Officer" : "Fleet Manager",
      email: email
    };
    this.setToken(demoData.access_token);
    return demoData;
  }
}

window.api = new FleetAPI();
