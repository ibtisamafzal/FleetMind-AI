"""
Synthetic Dataset Generator for FleetMind AI MVP — Pakistan Fleet Operations
Generates realistic fleet operational data for Pakistan logistics:
- 110 commercial fleet vehicles (Hino, Isuzu, Master, Hyundai Shehzore, Suzuki Ravi, Volvo FL)
- 55 Pakistani fleet drivers
- 4,000 historical trips across key Pakistan logistics corridors (Karachi, Lahore, Islamabad, Multan, Faisalabad, Peshawar, Quetta, Sialkot)
- Realistic weather factors: Extreme Summer Heat, Winter Fog/Smog, Monsoon Rain, Dust Storm
- Fuel records (Diesel, Petrol, Electric)
- Preventative maintenance logs
"""

import os
import random
import datetime
import pandas as pd
import numpy as np

def generate_datasets(output_dir="ml/data", num_vehicles=110, num_drivers=55, num_trips=4000):
    os.makedirs(output_dir, exist_ok=True)
    random.seed(42)
    np.random.seed(42)

    # 1. VEHICLES IN PAKISTAN
    makes_models = [
        ("Hino", "300 Series Euro-IV", "Box Truck", "Diesel"),
        ("Isuzu", "NPR 71 Cargo", "Box Truck", "Diesel"),
        ("Hyundai", "Shehzore H-100", "Light Delivery", "Diesel"),
        ("Master", "Foton Forland", "Light Delivery", "Diesel"),
        ("Suzuki", "Ravi Urban Express", "Light Delivery", "Petrol"),
        ("FAW", "Tiger V Carrier", "Box Truck", "Diesel"),
        ("JAC", "Motors Sunray", "Cargo Van", "Diesel"),
        ("Isuzu", "FVR 34 Heavy", "Heavy Freight", "Diesel"),
        ("Hino", "500 Series Linehaul", "Heavy Freight", "Diesel"),
        ("Volvo", "FL Electric", "Box Truck", "Electric"),
    ]
    
    statuses = ["Active", "Active", "Active", "Active", "In Maintenance", "Idle"]

    # Pakistan City Prefixes for vehicle registration
    provinces = ["LEA", "KHI", "ICT", "FSD", "PMA", "MN", "SKT", "RWP", "QA", "HYD"]

    vehicles = []
    base_date = datetime.date(2026, 1, 1)

    for i in range(1, num_vehicles + 1):
        v_id = f"VH-{i:03d}"
        make, model, v_type, fuel_type = random.choice(makes_models)
        
        # Authentic Pakistani registration number: LEA-4823, KHI-1027, etc.
        prov = provinces[(i - 1) % len(provinces)]
        reg_num = 1000 + i
        reg = f"{prov}-{reg_num}"
        
        year = random.randint(2019, 2025)
        mileage = random.randint(15000, 240000)
        
        # mileage since last service
        kms_since_service = random.randint(500, 24000)
        service_mileage = max(0, mileage - kms_since_service)
        days_ago = random.randint(10, 180)
        last_service_date = base_date - datetime.timedelta(days=days_ago)
        
        # Spotlight Vehicle VH-027 (Lahore registered, high-risk overdue maintenance unit)
        if i == 27:
            v_id = "VH-027"
            reg = "LEA-4823"
            make = "Volvo"
            model = "FL Electric"
            v_type = "Box Truck"
            fuel_type = "Electric"
            mileage = 142850
            service_mileage = 124000  # 18,850 km overdue!
            last_service_date = base_date - datetime.timedelta(days=125)
            status = "Active"
        else:
            status = random.choice(statuses)

        vehicles.append({
            "vehicle_id": v_id,
            "registration_number": reg,
            "vehicle_type": v_type,
            "make": make,
            "model": model,
            "manufacturing_year": year,
            "fuel_type": fuel_type,
            "mileage": mileage,
            "last_service_date": last_service_date.isoformat(),
            "service_mileage": service_mileage,
            "current_status": status
        })

    vehicles_df = pd.DataFrame(vehicles)
    vehicles_df.to_csv(os.path.join(output_dir, "vehicles.csv"), index=False)
    print(f"Generated {len(vehicles_df)} Pakistani vehicles -> vehicles.csv")

    # 2. DRIVERS IN PAKISTAN
    first_names = [
        "Tariq", "Muhammad", "Imran", "Bilal", "Rashid", "Usman", "Babar", "Farhan",
        "Zeeshan", "Kamran", "Hamza", "Asad", "Abdul", "Sajid", "Naveed", "Waqas",
        "Arslan", "Khurram", "Shahbaz", "Rizwan", "Adnan", "Junaid", "Faizan", "Haris",
        "Zubair", "Umar", "Irfan", "Ahsan", "Sohail", "Fawad", "Noman", "Danish"
    ]
    last_names = [
        "Mehmood", "Ali", "Khan", "Ahmed", "Minhas", "Tariq", "Azam", "Akhtar",
        "Malik", "Rehman", "Shah", "Ullah", "Bhatti", "Chaudhry", "Abbasi", "Siddiqui",
        "Qureshi", "Butt", "Awan", "Dar", "Gillani", "Mughal", "Cheema", "Gujjar", "Bajwa"
    ]
    
    drivers = []
    for i in range(1, num_drivers + 1):
        d_id = f"DRV-{i:03d}"
        if i == 1:
            name = "Tariq Mehmood"
            exp = 8
            trips = 1240
            late = 34
            accidents = 0
            speed = 58.5
            rating = 4.92
            status = "Active"
        else:
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            exp = random.randint(1, 24)
            trips = random.randint(60, 1500)
            late = int(trips * random.uniform(0.02, 0.20))
            accidents = random.choice([0, 0, 0, 0, 0, 1, 1, 2])
            speed = round(random.uniform(45.0, 78.0), 1)
            rating = round(random.uniform(3.8, 5.0), 2)
            status = "Active" if random.random() > 0.07 else "On Leave"

        drivers.append({
            "driver_id": d_id,
            "name": name,
            "experience_years": exp,
            "total_trips": trips,
            "late_deliveries": late,
            "accidents": accidents,
            "average_speed": speed,
            "rating": rating,
            "status": status
        })

    drivers_df = pd.DataFrame(drivers)
    drivers_df.to_csv(os.path.join(output_dir, "drivers.csv"), index=False)
    print(f"Generated {len(drivers_df)} Pakistani drivers -> drivers.csv")

    # 3. TRIPS ACROSS PAKISTAN LOGISTICS HUBS
    routes_pakistan = [
        ("Sundar Industrial Estate, Lahore", "I-9 Industrial Area, Islamabad", 375.0, 270),
        ("Karachi Port Qasim Terminal", "Sundar Industrial Estate, Lahore", 1210.0, 1140),
        ("Thokar Niaz Baig Hub, Lahore", "Faisalabad Value Addition City", 180.0, 150),
        ("Multan Dry Port Terminal", "Sundar Industrial Estate, Lahore", 340.0, 260),
        ("Islamabad I-9 Terminal", "Peshawar Ring Road Logistics Park", 175.0, 135),
        ("Lahore Dry Port Moghalpura", "Sialkot Export Zone Hub", 130.0, 105),
        ("Karachi Port Trust (KPT)", "Korangi Industrial Area, Karachi", 22.0, 45),
        ("Karachi Port Qasim", "Hyderabad SITE Area", 160.0, 130),
        ("Faisalabad Industrial Estate", "Multan Logistics Terminal", 240.0, 190),
        ("Rawalpindi Pirwadhai Depot", "Chakwal Distribution Hub", 95.0, 85),
        ("Sukkur Logistics Junction", "Quetta Western Dry Port", 390.0, 360),
        ("Gwadar Free Zone Port", "Karachi Northern Bypass Depot", 630.0, 520),
        ("Gujranwala Industrial Estate", "Lahore Thokar Terminal", 85.0, 75),
        ("Peshawar Chamkani Hub", "Rawalpindi Pirwadhai Depot", 165.0, 130)
    ]

    # Weather conditions reflecting Pakistan climate
    weather_choices = ["Clear", "Monsoon Rain", "Winter Fog/Smog", "Extreme Summer Heat", "Dust Storm"]
    weather_weights = [0.45, 0.20, 0.18, 0.12, 0.05]

    traffic_choices = ["Low", "Medium", "High", "Severe"]
    traffic_weights = [0.22, 0.46, 0.24, 0.08]

    trips = []
    driver_ids = drivers_df["driver_id"].tolist()
    vehicle_ids = vehicles_df["vehicle_id"].tolist()
    
    start_dt = datetime.datetime(2025, 10, 1, 6, 0)

    for i in range(1, num_trips + 1):
        t_id = f"TRP-{1000 + i}"
        route = random.choice(routes_pakistan)
        origin, dest, base_dist, base_dur = route
        
        dist = round(base_dist * random.uniform(0.92, 1.12), 1)
        est_dur = int(base_dur * (dist / base_dist) * random.uniform(0.95, 1.05))
        stops = random.randint(1, 5)
        weather = random.choices(weather_choices, weights=weather_weights)[0]
        traffic = random.choices(traffic_choices, weights=traffic_weights)[0]
        
        d_id = random.choice(driver_ids)
        if random.random() < 0.04:
            v_id = "VH-027"
        else:
            v_id = random.choice(vehicle_ids)

        delay_factor = 0.08
        if traffic == "High":
            delay_factor += 0.28
        elif traffic == "Severe":
            delay_factor += 0.50
        
        # In Pakistan, Winter Fog/Smog on M-2/M-3 Motorways causes heavy delays
        if weather in ["Winter Fog/Smog", "Dust Storm"]:
            delay_factor += 0.35
        elif weather in ["Monsoon Rain", "Extreme Summer Heat"]:
            delay_factor += 0.16

        if stops > 3:
            delay_factor += (stops - 3) * 0.06

        if v_id == "VH-027":
            delay_factor += 0.25

        is_cancelled = random.random() < 0.018
        if is_cancelled:
            status = "Cancelled"
            act_dur = None
        else:
            is_delayed = random.random() < min(delay_factor, 0.88)
            if is_delayed:
                status = "Delayed"
                act_dur = int(est_dur * random.uniform(1.22, 1.85))
            else:
                status = "On Time"
                act_dur = int(est_dur * random.uniform(0.88, 1.05))

        dep_time = start_dt + datetime.timedelta(hours=random.randint(0, 3600), minutes=random.randint(0, 59))
        arr_time = (dep_time + datetime.timedelta(minutes=act_dur)) if act_dur else None

        trips.append({
            "trip_id": t_id,
            "vehicle_id": v_id,
            "driver_id": d_id,
            "origin": origin,
            "destination": dest,
            "distance_km": dist,
            "estimated_duration": est_dur,
            "actual_duration": act_dur if act_dur is not None else 0,
            "number_of_stops": stops,
            "departure_time": dep_time.isoformat(),
            "arrival_time": arr_time.isoformat() if arr_time else "",
            "weather_condition": weather,
            "traffic_level": traffic,
            "delivery_status": status,
            "is_delayed": 1 if status == "Delayed" else 0
        })

    trips_df = pd.DataFrame(trips)
    trips_df.to_csv(os.path.join(output_dir, "trips.csv"), index=False)
    print(f"Generated {len(trips_df)} Pakistani trips -> trips.csv")

    # 4. FUEL / CHARGING RECORDS (IN PKR)
    fuel_records = []
    rec_counter = 1
    for v in vehicles:
        v_id = v["vehicle_id"]
        f_type = v["fuel_type"]
        base_kml = 8.5 if f_type == "Diesel" else (18.0 if f_type == "Electric" else 11.0)
        
        if v_id == "VH-027":
            base_kml *= 0.72

        for r in range(random.randint(8, 20)):
            amount = round(random.uniform(40.0, 120.0), 1)
            # Realistic Pakistan fuel costs (PKR 285 per liter diesel, PKR 270 petrol, PKR 65 electricity per kWh equivalent)
            cost_per_unit = 285.0 if f_type == "Diesel" else (65.0 if f_type == "Electric" else 272.0)
            cost = round(amount * cost_per_unit, 2)
            eff = round(base_kml * random.uniform(0.85, 1.15), 2)
            odo = random.randint(15000, 220000)
            date_entry = base_date - datetime.timedelta(days=random.randint(1, 120))

            fuel_records.append({
                "record_id": f"FL-{rec_counter:04d}",
                "vehicle_id": v_id,
                "date": date_entry.isoformat(),
                "fuel_amount_liters": amount,
                "cost_usd": cost,  # Represents cost in PKR
                "odometer_km": odo,
                "efficiency_kml": eff
            })
            rec_counter += 1

    fuel_df = pd.DataFrame(fuel_records)
    fuel_df.to_csv(os.path.join(output_dir, "fuel_records.csv"), index=False)
    print(f"Generated {len(fuel_df)} Pakistani fuel logs -> fuel_records.csv")

    # 5. MAINTENANCE RECORDS (IN PKR)
    maint_types = [
        "Oil & Filter Service", "Brake Shoe & Pad Replacement", "Tire Alignment & Rotation",
        "Radiator & Coolant Flush", "Suspension Bushing & Leaf Spring Check",
        "Battery & Alternator Diagnostic", "Scheduled 50k Major Overhaul", "Fuel Injector Cleaning"
    ]
    maintenance_logs = []
    m_counter = 1
    for v in vehicles:
        v_id = v["vehicle_id"]
        num_services = random.randint(1, 6)
        if v_id == "VH-027":
            num_services = 2  # neglected service
        for _ in range(num_services):
            s_date = base_date - datetime.timedelta(days=random.randint(20, 450))
            stype = random.choice(maint_types)
            # Cost in PKR: PKR 18,000 to PKR 125,000
            cost = round(random.uniform(18000.0, 125000.0), 2)
            m_mileage = random.randint(12000, 160000)
            maintenance_logs.append({
                "maintenance_id": f"MNT-{m_counter:04d}",
                "vehicle_id": v_id,
                "service_date": s_date.isoformat(),
                "service_type": stype,
                "cost_usd": cost,  # Represents cost in PKR
                "mileage_at_service": m_mileage,
                "notes": f"Standard Pakistan Fleet SOP: {stype} completed."
            })
            m_counter += 1

    maint_df = pd.DataFrame(maintenance_logs)
    maint_df.to_csv(os.path.join(output_dir, "maintenance.csv"), index=False)
    print(f"Generated {len(maint_df)} Pakistani maintenance logs -> maintenance.csv")

if __name__ == "__main__":
    generate_datasets()
