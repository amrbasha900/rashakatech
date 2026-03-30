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
    context.title = f"{_('الجلسات')} | {_('مركز رشاقة')}"

    user_email = frappe.session.user
    patient = frappe.db.get_value("Patient", {"email": user_email}, ["name","patient_name"], as_dict=True)
    if not patient:
        context.patient = None
        return

    context.patient = patient

    # All sessions
    sessions = frappe.db.sql("""
        SELECT ps.name, ps.session_number, ps.session_date, ps.session_type,
               ps.weight_this_session, ps.weight_change, ps.total_loss_to_date,
               ps.compliance_score, ps.counseling_notes, ps.next_session_goals,
               ps.protocol_adjustments, ps.next_session_date,
               wlp.program_name
        FROM `tabProgram Session` ps
        LEFT JOIN `tabWeight Loss Program` wlp ON wlp.name = ps.program
        WHERE ps.patient = %s
        ORDER BY ps.session_date DESC
    """, patient.name, as_dict=True)
    context.sessions = sessions
    context.sessions_count = len(sessions)

    today = frappe.utils.today()
    context.past_sessions = [s for s in sessions if str(s.session_date) <= today]
    context.upcoming_sessions = [s for s in sessions if str(s.session_date) > today]

    # Chart: weight per session
    chart_sessions = list(reversed([s for s in sessions if s.weight_this_session]))[:15]
    context.session_chart = json.dumps({
        "labels": [f"{_('جلسة')} {s.session_number or i+1}" for i, s in enumerate(chart_sessions)],
        "weight": [float(s.weight_this_session) for s in chart_sessions],
        "compliance": [int(s.compliance_score or 0) for s in chart_sessions],
    })

    # Summary stats
    if context.past_sessions:
        avg_compliance = sum(int(s.compliance_score or 0) for s in context.past_sessions) / len(context.past_sessions)
        context.avg_compliance = round(avg_compliance)
    else:
        context.avg_compliance = 0

    context.latest_session = sessions[0] if sessions else {}
