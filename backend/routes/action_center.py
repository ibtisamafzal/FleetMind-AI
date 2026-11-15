"""
Fleet Action Center API Router
Converts AI telemetry insights and risk alerts into actionable operational tasks.
Manages status transitions (Pending, In Progress, Completed), audit timestamps,
priority levels, assignees, and auto-syncing from current Fleet Risk alerts.
"""

from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import datetime

from backend.database import get_db
from backend.models import ActionItem, Vehicle, Driver
from backend.services.ml_service import ml_service

router = APIRouter(prefix="/api/action-center", tags=["Fleet Action Center"])

def ensure_initial_seed_actions(db: Session):
    """Seed initial operational tasks if the table is empty."""
    if db.query(ActionItem).count() == 0:
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        initial_actions = [
            ActionItem(
                action_id="ACT-001",
                title="Immediate Diagnostic Inspection: Unit VH-027",
                description="Overdue for preventative maintenance by +18,850 km. Operational Risk: 82/100 (HIGH). Immediate mechanical recall to Thokar Niaz Baig depot.",
                category="Maintenance",
                priority="Critical",
                status="Pending",
                vehicle_id="VH-027",
                driver_id=None,
                assigned_to="Maintenance Supervisor",
                created_at=now_str,
                updated_at=now_str,
                resolution_notes=None
            ),
            ActionItem(
                action_id="ACT-002",
                title="Investigate Fuel Variance (-22.8% Drop): Unit VH-054",
                description="Karachi Hub urban route telemetry indicates abnormal fuel burn and extended stationary engine idling.",
                category="Fuel Anomaly",
                priority="High",
                status="In Progress",
                vehicle_id="VH-054",
                driver_id=None,
                assigned_to="Fuel Auditing Officer",
                created_at=now_str,
                updated_at=now_str,
                resolution_notes="Diagnostic scan in progress at Port Qasim depot."
            ),
            ActionItem(
                action_id="ACT-003",
                title="Mountain Descent Safety Refresher: Driver DRV-007",
                description="Telematics logged speed of 98 km/h on M-2 Motorway Salt Range gradient (advisory limit: 70 km/h). Assign mandatory downhill braking refresher.",
                category="Driver Training",
                priority="Medium",
                status="Pending",
                vehicle_id=None,
                driver_id="DRV-007",
                assigned_to="Safety Training Manager",
                created_at=now_str,
                updated_at=now_str,
                resolution_notes=None
            ),
            ActionItem(
                action_id="ACT-004",
                title="Coolant & Thermostat Telemetry Inspection: Unit VH-042",
                description="Live IoT stream flagged engine temperature reaching 104°C near Gojra Interchange on M-4. Verify radiator flow rate.",
                category="Maintenance",
                priority="High",
                status="Pending",
                vehicle_id="VH-042",
                driver_id=None,
                assigned_to="Workshop Technical Lead",
                created_at=now_str,
                updated_at=now_str,
                resolution_notes=None
            ),
            ActionItem(
                action_id="ACT-005",
                title="Brake System Certification: Unit VH-001",
                description="Pre-trip inspection check conducted following emergency braking telemetry event on N-5 Kamoke bypass.",
                category="Safety",
                priority="Medium",
                status="Completed",
                vehicle_id="VH-001",
                driver_id="DRV-002",
                assigned_to="Senior Inspector",
                created_at=now_str,
                updated_at=now_str,
                resolution_notes="Air brake pressure certified at 105 psi. Pads within nominal thickness. Cleared for intercity dispatch."
            )
        ]
        db.add_all(initial_actions)
        db.commit()

@router.get("/actions")
def get_actions(
    status: Optional[str] = Query(None, description="Filter by status: Pending, In Progress, Completed"),
    priority: Optional[str] = Query(None, description="Filter by priority: Critical, High, Medium, Low"),
    category: Optional[str] = Query(None, description="Filter by category"),
    vehicle_id: Optional[str] = Query(None, description="Filter by vehicle"),
    db: Session = Depends(get_db)
):
    ensure_initial_seed_actions(db)

    query = db.query(ActionItem)
    if status and isinstance(status, str) and status != "All":
        query = query.filter(ActionItem.status == status)
    if priority and isinstance(priority, str) and priority != "All":
        query = query.filter(ActionItem.priority == priority)
    if category and isinstance(category, str) and category != "All":
        query = query.filter(ActionItem.category == category)
    if vehicle_id and isinstance(vehicle_id, str):
        query = query.filter(ActionItem.vehicle_id == vehicle_id)

    actions = query.order_by(ActionItem.created_at.desc()).all()

    # Calculate status counts
    all_items = db.query(ActionItem).all()
    pending_count = sum(1 for a in all_items if a.status == "Pending")
    in_progress_count = sum(1 for a in all_items if a.status == "In Progress")
    completed_count = sum(1 for a in all_items if a.status == "Completed")
    critical_count = sum(1 for a in all_items if a.priority == "Critical" and a.status != "Completed")

    return {
        "stats": {
            "total_actions": len(all_items),
            "pending": pending_count,
            "in_progress": in_progress_count,
            "completed": completed_count,
            "critical_unresolved": critical_count
        },
        "actions": [
            {
                "action_id": a.action_id,
                "title": a.title,
                "description": a.description,
                "category": a.category,
                "priority": a.priority,
                "status": a.status,
                "vehicle_id": a.vehicle_id,
                "driver_id": a.driver_id,
                "assigned_to": a.assigned_to,
                "created_at": a.created_at,
                "updated_at": a.updated_at,
                "resolution_notes": a.resolution_notes
            }
            for a in actions
        ]
    }

@router.post("/actions")
def create_action(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    title = payload.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Action title is required")

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    count = db.query(ActionItem).count() + 1
    action_id = f"ACT-{count:03d}"

    action = ActionItem(
        action_id=action_id,
        title=title,
        description=payload.get("description", ""),
        category=payload.get("category", "General"),
        priority=payload.get("priority", "Medium"),
        status=payload.get("status", "Pending"),
        vehicle_id=payload.get("vehicle_id"),
        driver_id=payload.get("driver_id"),
        assigned_to=payload.get("assigned_to", "Fleet Operations Team"),
        created_at=now_str,
        updated_at=now_str,
        resolution_notes=payload.get("resolution_notes")
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    return {
        "success": True,
        "message": f"Action task {action.action_id} created successfully.",
        "action": action
    }

@router.patch("/actions/{action_id}")
def update_action(action_id: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    action = db.query(ActionItem).filter(ActionItem.action_id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    if "status" in payload:
        action.status = payload["status"]
    if "priority" in payload:
        action.priority = payload["priority"]
    if "assigned_to" in payload:
        action.assigned_to = payload["assigned_to"]
    if "resolution_notes" in payload:
        action.resolution_notes = payload["resolution_notes"]

    action.updated_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    db.commit()

    return {
        "success": True,
        "message": f"Action task {action_id} updated.",
        "action": {
            "action_id": action.action_id,
            "status": action.status,
            "priority": action.priority,
            "updated_at": action.updated_at,
            "resolution_notes": action.resolution_notes
        }
    }

@router.post("/auto-sync-alerts")
def auto_sync_from_risk_radar(db: Session = Depends(get_db)):
    """Scans fleet risk scores and automatically generates actionable tasks for unhandled high-risk units."""
    vehicles = db.query(Vehicle).all()
    created_count = 0
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

    for v in vehicles:
        risk = ml_service.predict_vehicle_risk(v.vehicle_id)
        kms_since = max(0, v.mileage - v.service_mileage)

        # Check if an open action already exists for this vehicle
        existing = db.query(ActionItem).filter(
            ActionItem.vehicle_id == v.vehicle_id,
            ActionItem.status.in_(["Pending", "In Progress"])
        ).first()

        if not existing and (risk["risk_score"] >= 70 or kms_since >= 15000):
            count = db.query(ActionItem).count() + 1
            act_id = f"ACT-{count:03d}"
            
            prio = "Critical" if risk["risk_score"] >= 75 else "High"
            cat = "Maintenance" if risk["maintenance_risk"] > risk["fuel_risk"] else "Fuel Anomaly"

            new_act = ActionItem(
                action_id=act_id,
                title=f"Review High Risk Alert: Unit {v.vehicle_id} ({v.make} {v.model})",
                description=f"Automated risk radar trigger: Composite risk score is {risk['risk_score']}/100. Kms since service: {kms_since:,.0f} km. Immediate operational review required.",
                category=cat,
                priority=prio,
                status="Pending",
                vehicle_id=v.vehicle_id,
                driver_id=None,
                assigned_to="Fleet Operations Supervisor",
                created_at=now_str,
                updated_at=now_str,
                resolution_notes=None
            )
            db.add(new_act)
            created_count += 1

    db.commit()
    return {
        "success": True,
        "new_actions_created": created_count,
        "message": f"Risk radar synchronization complete. Generated {created_count} new operational tasks."
    }
