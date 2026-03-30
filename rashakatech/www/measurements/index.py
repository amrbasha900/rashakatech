import frappe
from frappe import _
import json
from rashakatech.portal_utils import get_portal_context

no_cache = 1

def get_context(context):
    get_portal_context(context)
    
    if frappe.session.user == "Guest":
        frappe.local.flags.redirect_location = "/login"
        raise frappe.Redirect

    context.no_cache = 1
    context.show_sidebar = False
    context.title = f"{_('القياسات')} | {_('مركز رشاقة')}"

    user_email = frappe.session.user
    patient = frappe.db.get_value("Patient", {"email": user_email}, ["name","patient_name"], as_dict=True)
    if not patient:
        context.patient = None
        return

    context.patient = patient
    context.new_entry = frappe.request.args.get('new') == '1'

    # All measurement logs
    logs = frappe.db.sql("""
        SELECT log_date, weight_kg, body_fat_pct, muscle_mass_kg,
               waist_cm, hip_cm, notes, logged_by
        FROM `tabBody Measurement Log`
        WHERE patient = %s
        ORDER BY log_date DESC
        LIMIT 60
    """, patient.name, as_dict=True)
    context.logs = logs

    # All assessments for detailed view
    assessments = frappe.db.sql("""
        SELECT assessment_date as date, weight_kg, bmi, body_fat_percentage as fat,
               muscle_mass_kg as muscle, waist_cm, bmi_category,
               visceral_fat_level, blood_pressure_systolic, blood_pressure_diastolic
        FROM `tabBody Composition Assessment`
        WHERE patient = %s
        ORDER BY assessment_date DESC
        LIMIT 20
    """, patient.name, as_dict=True)
    context.assessments = assessments

    # Chart data (reversed for chronological order)
    chart_logs = list(reversed(logs[:30]))
    context.chart_data = json.dumps({
        "dates": [str(l.log_date) for l in chart_logs],
        "weight": [float(l.weight_kg or 0) for l in chart_logs],
        "fat": [float(l.body_fat_pct or 0) for l in chart_logs],
        "muscle": [float(l.muscle_mass_kg or 0) for l in chart_logs],
        "waist": [float(l.waist_cm or 0) for l in chart_logs],
    })

    # Stats summary
    if logs:
        latest = logs[0]
        oldest = logs[-1] if len(logs) > 1 else logs[0]
        context.latest = latest
        context.weight_change = round(float(latest.weight_kg or 0) - float(oldest.weight_kg or 0), 1)
        context.fat_change = round(float(latest.body_fat_pct or 0) - float(oldest.body_fat_pct or 0), 1)
        context.muscle_change = round(float(latest.muscle_mass_kg or 0) - float(oldest.muscle_mass_kg or 0), 1)
    else:
        context.latest = {}
        context.weight_change = 0
        context.fat_change = 0
        context.muscle_change = 0


@frappe.whitelist()
def save_measurement(weight_kg, body_fat_pct=None, muscle_mass_kg=None,
                     waist_cm=None, hip_cm=None, notes=None):
    user_email = frappe.session.user
    patient = frappe.db.get_value("Patient", {"email": user_email}, "name")
    if not patient:
        frappe.throw(_("المريض غير موجود"))

    today = frappe.utils.today()
    existing = frappe.db.get_value("Body Measurement Log", {"patient": patient, "log_date": today}, "name")
    if existing:
        doc = frappe.get_doc("Body Measurement Log", existing)
    else:
        doc = frappe.new_doc("Body Measurement Log")
        doc.patient = patient
        doc.log_date = today

    doc.weight_kg = float(weight_kg)
    if body_fat_pct: doc.body_fat_pct = float(body_fat_pct)
    if muscle_mass_kg: doc.muscle_mass_kg = float(muscle_mass_kg)
    if waist_cm: doc.waist_cm = float(waist_cm)
    if hip_cm: doc.hip_cm = float(hip_cm)
    if notes: doc.notes = notes
    doc.logged_by = "Patient"
    doc.save(ignore_permissions=True)

    return {"message": _("تم حفظ القياسات بنجاح")}
