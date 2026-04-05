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
        {"enabled": 1, "name": login_id},
        "name",
    )
    if user_by_name_or_email:
        return user_by_name_or_email

    user_by_email = frappe.db.get_value(
        "User",
        {"enabled": 1, "email": login_id},
        "name",
    )
    if user_by_email:
        return user_by_email

    user_by_username = frappe.db.sql(
        """
        SELECT name
        FROM `tabUser`
        WHERE enabled = 1
          AND username = %s
        LIMIT 1
        """,
        login_id,
    )
    if user_by_username:
        return user_by_username[0][0]

    return None
