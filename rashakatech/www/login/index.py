import frappe
from rashakatech.portal_utils import get_portal_context
from frappe import _
from frappe.auth import authenticate_for_2factor, confirm_otp_token, should_run_2fa
no_cache = 1

def get_context(context):
    get_portal_context(context)
    
    # Redirect if already logged in
    if frappe.session.user != "Guest":
        user_type = frappe.db.get_value("User", frappe.session.user, "user_type")
        frappe.local.flags.redirect_location = "/app" if user_type == "System User" else "/dashboard"
        raise frappe.Redirect

    context.no_cache = 1
    context.show_sidebar = False
    context.title = f"{_('تسجيل الدخول')} | {_('مركز رشاقة')}"


@frappe.whitelist(allow_guest=True, methods=["POST"])
def portal_login(usr: str | None = None, pwd: str | None = None):
    """Login endpoint that supports both Website User and System User."""
    if not usr or not pwd:
        frappe.throw(_("Incomplete login details"), frappe.AuthenticationError)

    login_id = (usr or "").strip()
    resolved_user = _resolve_user_for_login(login_id) or login_id

    # Check for assessment-based disabling
    if resolved_user and resolved_user != "Guest":
        user_info = frappe.db.get_value("User", resolved_user, ["name", "enabled", "email"], as_dict=True)
        if user_info and not user_info.enabled:
            patient = frappe.db.get_value("Patient", {"email": user_info.email}, ["name"], as_dict=True)
            if patient:
                from frappe.utils import date_diff, now_datetime
                latest_bca = frappe.get_all("Body Composition Assessment", 
                    filters={"patient": patient.name, "docstatus": ["!=", 2]}, 
                    order_by="creation desc", limit=1)
                
                if not latest_bca or date_diff(now_datetime(), latest_bca[0].creation) > 15:
                    frappe.throw(_("يجب عليك مراجعة طبيبك") + " | " + _("You should review your doctor"), frappe.AuthenticationError)

    login_manager = frappe.local.login_manager
    login_manager.authenticate(user=resolved_user, pwd=pwd)

    if should_run_2fa(login_manager.user):
        authenticate_for_2factor(login_manager.user)
        if not confirm_otp_token(login_manager):
            return {"status": "pending_2fa"}

    frappe.form_dict.pop("pwd", None)
    login_manager.post_login()
    frappe.db.commit()

    user_type = frappe.db.get_value("User", login_manager.user, "user_type")
    redirect_to = "/app" if user_type == "System User" else "/dashboard"

    return {
        "status": "ok",
        "user": login_manager.user,
        "user_type": user_type,
        "redirect_to": redirect_to,
    }


def _resolve_user_for_login(login_id: str) -> str | None:
    if not login_id:
        return None

    user_by_name_or_email = frappe.db.get_value(
        "User",
        {"name": login_id},
        "name",
    )
    if user_by_name_or_email:
        return user_by_name_or_email

    user_by_email = frappe.db.get_value(
        "User",
        {"email": login_id},
        "name",
    )
    if user_by_email:
        return user_by_email

    user_by_username = frappe.db.sql(
        """
        SELECT name
        FROM `tabUser`
        WHERE username = %s
        LIMIT 1
        """,
        login_id,
    )
    if user_by_username:
        return user_by_username[0][0]

    return None
