"""
What-If Fleet Simulator API Endpoint
Allows fleet managers to test operational interventions before executing them.
Simulates risk shift, delay likelihood, fleet utilization, and fuel costs.
Outputs are explicitly labeled as projected simulations, not actual operational outcomes.
"""

from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import datetime

from backend.database import get_db
from backend.models import Vehicle, Driver, Trip, FuelRecord
from backend.services.ml_service import ml_service

router = APIRouter(prefix="/api/simulator", tags=["What-If Fleet Simulator"])

@router.get("/scenarios")
def get_preset_scenarios():
    """Returns curated operational scenarios ready for single-click simulation."""
    return [
        {
            "id": "remove_high_risk",
            "name": "De-risk Tomorrow: Remove High-Risk Vehicle (VH-027)",
            "description": "Simulate taking VH-027 (risk 82/100) offline and redistributing trips to the most optimal active unit.",
            "default_params": {
                "target_vehicle_id": "VH-027",
                "alternative_vehicle_id": "auto",
                "volume_change_pct": 0,
                "weather_condition": "Clear",
                "traffic_level": "Medium"
            }
        },
        {
            "id": "volume_surge_20",
            "name": "Peak Demand: +20% Daily Trip Volume Surge",
            "description": "Simulate network stress when freight dispatch jumps by 20% across primary Pakistani corridors.",
            "default_params": {
                "target_vehicle_id": None,
                "alternative_vehicle_id": None,
                "volume_change_pct": 20,
                "weather_condition": "Clear",
                "traffic_level": "High"
            }
        },
        {
            "id": "send_to_maintenance",
            "name": "Depot Recall: Dispatch Overdue Units for Maintenance",
            "description": "Simulate grounding all vehicles with > 12,000 km since last service for preventative tune-up.",
            "default_params": {
                "target_vehicle_id": "VH-027",
                "alternative_vehicle_id": "auto",
                "volume_change_pct": 0,
                "weather_condition": "Clear",
                "traffic_level": "Medium"
            }
        },
        {
            "id": "winter_fog_contingency",
            "name": "Weather Contingency: Punjab Winter Smog / Dense Fog",
            "description": "Simulate severe weather disruption (M-2/M-4 speed caps) and calculate cascading delivery delay probabilities.",
            "default_params": {
                "target_vehicle_id": None,
                "alternative_vehicle_id": None,
                "volume_change_pct": 0,
                "weather_condition": "Fog",
                "traffic_level": "Severe"
            }
        }
    ]

@router.get("/alternatives/{vehicle_id}")
def get_alternative_vehicles(vehicle_id: str, db: Session = Depends(get_db)):
    """Recommends best available replacement vehicles based on low risk, same type, and availability."""
    target = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    candidates = db.query(Vehicle).filter(
        Vehicle.vehicle_id != vehicle_id,
        Vehicle.current_status == "Active"
    ).all()

    scored = []
    for c in candidates:
        risk = ml_service.predict_vehicle_risk(c.vehicle_id)
        type_match = 1.0 if c.vehicle_type == target.vehicle_type else 0.7
        fuel_match = 1.0 if c.fuel_type == target.fuel_type else 0.85
        kms_since = max(0, c.mileage - c.service_mileage)

        # Suitability score (higher is better)
        suitability = round((100 - risk["risk_score"]) * 0.6 + (type_match * 25) + (fuel_match * 15), 1)

        scored.append({
            "vehicle_id": c.vehicle_id,
            "registration_number": c.registration_number,
            "make_model": f"{c.make} {c.model}",
            "vehicle_type": c.vehicle_type,
            "fuel_type": c.fuel_type,
            "risk_score": risk["risk_score"],
            "risk_level": risk["risk_level"],
            "kms_since_service": kms_since,
            "suitability_score": suitability,
            "is_best_alternative": False
        })

    scored.sort(key=lambda x: x["suitability_score"], reverse=True)
    if scored:
        scored[0]["is_best_alternative"] = True

    return {
        "target_vehicle": {
            "vehicle_id": target.vehicle_id,
            "make_model": f"{target.make} {target.model}",
            "vehicle_type": target.vehicle_type,
            "fuel_type": target.fuel_type
        },
        "recommended_alternatives": scored[:5]
    }

@router.post("/run")
def run_fleet_simulation(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Executes What-If simulation.
    Compares current baseline vs. simulated outcome across delay rate, utilization, and fleet risk.
    """
    scenario_type = payload.get("scenario_type", "custom")
    target_v_id = payload.get("target_vehicle_id")
    alt_v_id = payload.get("alternative_vehicle_id")
    vol_change_pct = float(payload.get("volume_change_pct", 0))
    weather = payload.get("weather_condition", "Clear")
    traffic = payload.get("traffic_level", "Medium")

    vehicles = db.query(Vehicle).all()
    total_vehicles = len(vehicles)
    active_vehicles = sum(1 for v in vehicles if v.current_status == "Active")

    # 1. BASELINE METRICS
    baseline_delays_pct = 7.6
    baseline_avg_delay_mins = 34.5
    baseline_utilization = round((active_vehicles / max(1, total_vehicles)) * 100, 1)

    all_risks = [ml_service.predict_vehicle_risk(v.vehicle_id)["risk_score"] for v in vehicles]
    baseline_avg_risk = round(sum(all_risks) / max(1, len(all_risks)), 1)
    baseline_fuel_cost = 16357600.0  # Monthly fleet fuel expenditure in PKR (~58,420 L @ 280 PKR/L)

    # 2. RUN SIMULATION LOGIC
    sim_active_vehicles = active_vehicles
    sim_delays_pct = baseline_delays_pct
    sim_avg_delay_mins = baseline_avg_delay_mins
    sim_avg_risk = baseline_avg_risk
    sim_fuel_cost = baseline_fuel_cost

    explanation_points = []
    selected_alternative = None

    # Auto resolve alternative if requested
    if target_v_id and (alt_v_id == "auto" or not alt_v_id):
        alts = get_alternative_vehicles(target_v_id, db)["recommended_alternatives"]
        if alts:
            alt_v_id = alts[0]["vehicle_id"]
            selected_alternative = alts[0]

    if target_v_id:
        target_veh = db.query(Vehicle).filter(Vehicle.vehicle_id == target_v_id).first()
        target_risk = ml_service.predict_vehicle_risk(target_v_id) if target_veh else {"risk_score": 50}

        if scenario_type in ["remove_high_risk", "send_to_maintenance", "custom"]:
            # Removing high risk unit drops fleet risk and eliminates its high delay contribution
            risk_drop = (target_risk["risk_score"] - baseline_avg_risk) / max(1, total_vehicles)
            sim_avg_risk = max(10.0, round(baseline_avg_risk - risk_drop * 1.5, 1))

            if selected_alternative:
                explanation_points.append(
                    f"Trips for {target_v_id} ({target_risk['risk_score']}/100 Risk) reallocated to {alt_v_id} "
                    f"({selected_alternative['risk_score']}/100 Risk), preserving dispatch capacity."
                )
                sim_delays_pct = max(3.5, round(baseline_delays_pct - 1.4, 1))
                sim_avg_delay_mins = max(18.0, round(baseline_avg_delay_mins - 5.2, 1))
            else:
                # Removed without replacement
                sim_active_vehicles -= 1
                sim_delays_pct = round(baseline_delays_pct + 0.8, 1)
                explanation_points.append(
                    f"Unit {target_v_id} grounded without direct substitute. Overall fleet risk drops, "
                    f"but remaining units absorb additional freight load."
                )

    # Volume change simulation
    if vol_change_pct != 0:
        vol_ratio = 1.0 + (vol_change_pct / 100.0)
        sim_delays_pct = round(sim_delays_pct * (1.0 + (vol_change_pct / 100.0) * 0.45), 1)
        sim_avg_delay_mins = round(sim_avg_delay_mins * (1.0 + (vol_change_pct / 100.0) * 0.35), 1)
        sim_fuel_cost = round(baseline_fuel_cost * vol_ratio, 2)
        sim_utilization = min(98.5, round(baseline_utilization * (1.0 + (vol_change_pct / 100.0) * 0.2), 1))
        explanation_points.append(
            f"Volume shift of {vol_change_pct:+.0f}% projects delivery delay frequency to change from "
            f"{baseline_delays_pct}% to {sim_delays_pct}%."
        )
    else:
        sim_utilization = round((sim_active_vehicles / max(1, total_vehicles)) * 100, 1)

    # Environmental weather impact
    if weather in ["Rain", "Snow", "Fog", "Storm"]:
        weather_penalty = 2.8 if weather == "Fog" else 1.9
        sim_delays_pct = round(sim_delays_pct + weather_penalty, 1)
        sim_avg_delay_mins = round(sim_avg_delay_mins + 9.5, 1)
        explanation_points.append(
            f"Adverse weather condition ('{weather}') introduces mandatory speed deceleration on intercity corridors (M-2/N-5)."
        )

    # Traffic impact
    if traffic in ["High", "Severe"]:
        traffic_penalty = 3.2 if traffic == "Severe" else 1.6
        sim_delays_pct = round(sim_delays_pct + traffic_penalty, 1)
        explanation_points.append(
            f"High urban congestion window expands transit duration estimates by ~{round(traffic_penalty * 6)} minutes."
        )

    # Calculate Deltas
    delta_delays = round(sim_delays_pct - baseline_delays_pct, 1)
    delta_risk = round(sim_avg_risk - baseline_avg_risk, 1)
    delta_util = round(sim_utilization - baseline_utilization, 1)
    delta_fuel = round(sim_fuel_cost - baseline_fuel_cost, 2)

    summary_text = (
        f"Simulated operational reconfiguration indicates an estimated net {abs(delta_delays):.1f}% "
        f"{'reduction' if delta_delays < 0 else 'increase'} in delay frequency, with average fleet risk shifting by "
        f"{delta_risk:+.1f} points. Fleet utilization settles at {sim_utilization}%."
    )

    return {
        "is_simulation": True,
        "disclaimer": "DISCLAIMER: Projected outputs are simulated analytical estimates based on ML models and historical fleet baselines. These figures are not recorded operational history.",
        "simulated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "scenario_type": scenario_type,
        "inputs": {
            "target_vehicle_id": target_v_id,
            "alternative_vehicle_id": alt_v_id,
            "volume_change_pct": vol_change_pct,
            "weather_condition": weather,
            "traffic_level": traffic
        },
        "selected_alternative": selected_alternative,
        "before": {
            "on_time_rate_pct": round(100.0 - baseline_delays_pct, 1),
            "delay_rate_pct": baseline_delays_pct,
            "avg_delay_minutes": baseline_avg_delay_mins,
            "fleet_utilization_pct": baseline_utilization,
            "average_risk_score": baseline_avg_risk,
            "monthly_fuel_cost_usd": baseline_fuel_cost,
            "monthly_fuel_cost_pkr": baseline_fuel_cost,
            "active_fleet_count": active_vehicles
        },
        "after": {
            "on_time_rate_pct": round(100.0 - sim_delays_pct, 1),
            "delay_rate_pct": sim_delays_pct,
            "avg_delay_minutes": sim_avg_delay_mins,
            "fleet_utilization_pct": sim_utilization,
            "average_risk_score": sim_avg_risk,
            "monthly_fuel_cost_usd": sim_fuel_cost,
            "monthly_fuel_cost_pkr": sim_fuel_cost,
            "active_fleet_count": sim_active_vehicles
        },
        "delta": {
            "delay_rate_pct": delta_delays,
            "risk_score": delta_risk,
            "utilization_pct": delta_util,
            "monthly_fuel_cost_usd": delta_fuel,
            "monthly_fuel_cost_pkr": delta_fuel
        },
        "currency": "PKR",
        "explanation": summary_text,
        "detailed_reasons": explanation_points
    }
