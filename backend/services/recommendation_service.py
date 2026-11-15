"""
AI Recommendation Engine for FleetMind AI
Generates contextual, actionable, and safety-compliant operational recommendations.
"""

from typing import List, Dict, Any

class RecommendationEngine:
    @staticmethod
    def generate_vehicle_recommendations(risk_data: Dict[str, Any], vehicle_info: Dict[str, Any] = None) -> List[str]:
        recommendations = []
        m_risk = risk_data.get("maintenance_risk", 0)
        f_risk = risk_data.get("fuel_risk", 0)
        d_risk = risk_data.get("delay_risk", 0)
        overall = risk_data.get("risk_score", 0)

        # Maintenance triggers
        if m_risk >= 70:
            recommendations.append("Schedule preventative maintenance diagnostics inspection within 48 hours.")
            recommendations.append("Restrict vehicle from long-distance dispatch routes (> 100 km) until certified.")
        elif m_risk >= 45:
            recommendations.append("Queue vehicle for standard fluid check and brake pad inspection at next scheduled depot stop.")

        # Fuel triggers
        if f_risk >= 65:
            recommendations.append("Review recent fuel consumption logs and conduct tire pressure sensor calibration.")
            recommendations.append("Check on-board diagnostics (OBD-II) for powertrain and thermal management warnings.")
        elif f_risk >= 45:
            recommendations.append("Monitor driver telematics for excessive idling and abrupt acceleration patterns.")

        # Delay triggers
        if d_risk >= 60:
            recommendations.append("Review route congestion history and avoid peak morning dispatch windows for this unit.")
            recommendations.append("Assign experienced driver (> 5 years experience) for next high-priority transit.")

        # High overall risk fallback
        if overall >= 75 and len(recommendations) < 3:
            recommendations.append("Conduct comprehensive multi-point vehicle safety inspection.")
            recommendations.append("Review driver trip logs and recent performance metrics.")

        if not recommendations:
            recommendations.append("Vehicle operating within optimal safety and efficiency parameters. Maintain standard service schedule.")

        return recommendations[:4]

recommendation_engine = RecommendationEngine()
