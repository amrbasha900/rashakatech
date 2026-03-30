import frappe
from rashakatech.portal_utils import get_portal_context
from frappe import _
no_cache = 1

def get_context(context):
    get_portal_context(context)
    
    # Redirect if already logged in
    if frappe.session.user != "Guest":
        frappe.local.flags.redirect_location = "/dashboard"
        raise frappe.Redirect

    context.no_cache = 1
    context.show_sidebar = False
    context.title = f"{_('تسجيل الدخول')} | {_('مركز رشاقة')}"
