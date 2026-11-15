"""
Database Seeding Script for FleetMind AI
Populates the database from generated synthetic CSV files and creates default users.
"""

import os
import sys
import hashlib
import pandas as pd
from sqlalchemy.orm import Session

# Ensure root directory is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import engine, Base, SessionLocal
from backend.models import Vehicle, Driver, Trip, FuelRecord, Maintenance, User

DATA_DIR = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")), "ml", "data")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def seed_database(force: bool = False):
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    
    try:
        v_count = db.query(Vehicle).count()
        if v_count > 0 and not force:
            print(f"Database already populated ({v_count} vehicles found). Skipping seed.")
            return

        if force:
            print("Force re-seeding database. Clearing existing tables...")
            db.query(Trip).delete()
            db.query(FuelRecord).delete()
            db.query(Maintenance).delete()
            db.query(Driver).delete()
            db.query(Vehicle).delete()
            db.query(User).delete()
            db.commit()

        print(f"Loading CSV datasets from {DATA_DIR}...")
        
        # 1. Vehicles
        veh_csv = os.path.join(DATA_DIR, "vehicles.csv")
        if os.path.exists(veh_csv):
            v_df = pd.read_csv(veh_csv)
            vehicles = [Vehicle(**row.to_dict()) for _, row in v_df.iterrows()]
            db.bulk_save_objects(vehicles)
            print(f"Seeded {len(vehicles)} vehicles.")

        # 2. Drivers
        drv_csv = os.path.join(DATA_DIR, "drivers.csv")
        if os.path.exists(drv_csv):
            d_df = pd.read_csv(drv_csv)
            drivers = [Driver(**row.to_dict()) for _, row in d_df.iterrows()]
            db.bulk_save_objects(drivers)
            print(f"Seeded {len(drivers)} drivers.")

        # 3. Trips
        trp_csv = os.path.join(DATA_DIR, "trips.csv")
        if os.path.exists(trp_csv):
            t_df = pd.read_csv(trp_csv)
            # handle NaN actual_durations
            t_df["actual_duration"] = t_df["actual_duration"].fillna(0)
            t_df["arrival_time"] = t_df["arrival_time"].fillna("")
            trips = [Trip(**row.to_dict()) for _, row in t_df.iterrows()]
            db.bulk_save_objects(trips)
            print(f"Seeded {len(trips)} trips.")

        # 4. Fuel Records
        fl_csv = os.path.join(DATA_DIR, "fuel_records.csv")
        if os.path.exists(fl_csv):
            f_df = pd.read_csv(fl_csv)
            fuel = [FuelRecord(**row.to_dict()) for _, row in f_df.iterrows()]
            db.bulk_save_objects(fuel)
            print(f"Seeded {len(fuel)} fuel records.")

        # 5. Maintenance Records
        mnt_csv = os.path.join(DATA_DIR, "maintenance.csv")
        if os.path.exists(mnt_csv):
            m_df = pd.read_csv(mnt_csv)
            maint = [Maintenance(**row.to_dict()) for _, row in m_df.iterrows()]
            db.bulk_save_objects(maint)
            print(f"Seeded {len(maint)} maintenance records.")

        # 6. Default Users (Pakistani Fleet Operations Team)
        users = [
            User(
                email="manager@fleetmind.ai",
                full_name="Tariq Mehmood",
                hashed_password=hash_password("fleetmind123"),
                role="Fleet Manager"
            ),
            User(
                email="safety@fleetmind.ai",
                full_name="Sarah Khan",
                hashed_password=hash_password("fleetmind123"),
                role="Safety Officer"
            ),
            User(
                email="admin@fleetmind.ai",
                full_name="System Administrator (Pakistan Hub)",
                hashed_password=hash_password("admin123"),
                role="Admin"
            )
        ]
        db.add_all(users)
        db.commit()
        print("Seeded default demo users (manager@fleetmind.ai, safety@fleetmind.ai, admin@fleetmind.ai).")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force=True)
