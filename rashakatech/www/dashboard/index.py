import frappe
from rashakatech.portal_utils import get_portal_context
from frappe import _

no_cache = 1

def get_context(context):
    get_portal_context(context)
    
    if frappe.session.user == "Guest":
        frappe.local.flags.redirect_location = "/login"
        raise frappe.Redirect

    context.no_cache = 1
    context.show_sidebar = False
    context.title = "لوحة التحكم | مركز رشاقة"

    patient = get_patient()
    if not patient:
        context.patient = {}
        context.latest_assessment = {}
        context.protocol = {}
        context.weight_history = []
        context.measurement_logs = []
        context.today_calories = 0
        context.today_water_ml = 0
        context.next_session = {}
        context.initial_weight = 0
        context.total_lost = 0
        context.sessions_count = 0
        return

    context.patient = patient

    # Latest body composition assessment
    latest = frappe.db.get_value(
        "Body Composition Assessment",
        {"patient": patient.name},
        ["weight_kg", "bmi", "body_fat_percentage", "muscle_mass_kg",
         "waist_cm", "assessment_date", "bmi_category", "visceral_fat_level"],
        order_by="assessment_date desc",
        as_dict=True
    )
    context.latest_assessment = latest or {}

    # Active nutrition protocol
    protocol = frappe.db.get_value(
        "Nutrition Protocol",
        {"patient": patient.name, "status": "Active"},
        ["protocol_name", "target_weight_kg", "current_weight_kg",
         "daily_calories_target", "water_liters", "protocol_type",
         "weekly_loss_target_kg", "total_target_loss_kg"],
        as_dict=True
    )
    context.protocol = protocol or {}

    # Weight history last 12 measurements
    weight_history = frappe.db.sql("""
        SELECT assessment_date as date, weight_kg as weight,
               body_fat_percentage as fat, muscle_mass_kg as muscle
        FROM `tabBody Composition Assessment`
        WHERE patient = %s
        ORDER BY assessment_date DESC
        LIMIT 12
    """, patient.name, as_dict=True)
    
    # Ensure dates are JSON serializable
    for row in weight_history:
        if row.date:
            row.date = row.date.strftime("%Y-%m-%d")

    context.weight_history = list(reversed(weight_history))

    # Body measurements history for chart
    measurement_logs = frappe.db.sql("""
        SELECT log_date as date, weight_kg as weight,
               body_fat_pct as fat, muscle_mass_kg as muscle
        FROM `tabBody Measurement Log`
        WHERE patient = %s
        ORDER BY log_date DESC
        LIMIT 30
    """, patient.name, as_dict=True)

    # Ensure dates are JSON serializable
    for row in measurement_logs:
        if row.date:
            row.date = row.date.strftime("%Y-%m-%d")

    context.measurement_logs = list(reversed(measurement_logs))

    # Today's food log summary
    today = frappe.utils.today()
    today_calories = frappe.db.sql("""
        SELECT COALESCE(SUM(estimated_calories), 0) as total
        FROM `tabPatient Food Log`
        WHERE patient = %s AND log_date = %s
    """, (patient.name, today), as_dict=True)
    context.today_calories = today_calories[0].total if today_calories else 0

    # Today's water intake
    today_water = frappe.db.sql("""
        SELECT COALESCE(SUM(water_intake_ml), 0) as total
        FROM `tabPatient Food Log`
        WHERE patient = %s AND log_date = %s
    """, (patient.name, today), as_dict=True)
    context.today_water_ml = today_water[0].total if today_water else 0

    # Next session
    next_session = frappe.db.get_value(
        "Program Session",
        {"patient": patient.name, "session_date": [">", today]},
        ["session_date", "session_type", "session_number"],
        order_by="session_date asc",
        as_dict=True
    )
    context.next_session = next_session or {}

    # Stats
    initial = frappe.db.get_value(
        "Body Composition Assessment",
        {"patient": patient.name},
        ["weight_kg", "assessment_date"],
        order_by="assessment_date asc",
        as_dict=True
    )
    context.initial_weight = initial.weight_kg if initial else 0
    context.total_lost = round((context.initial_weight - (latest.weight_kg if latest else context.initial_weight)), 1)
    context.sessions_count = frappe.db.count("Program Session", {"patient": patient.name})


def get_patient():
    user_email = frappe.session.user
    patient = frappe.db.get_value(
        "Patient",
        {"email": user_email},
        ["name", "patient_name", "sex", "dob"],
        as_dict=True
    )
    return patient
