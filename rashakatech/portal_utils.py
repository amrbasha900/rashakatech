import frappe

def get_portal_context(context):
    """Common context setup for patient portal pages."""
    # 1. Handle Language Transfer / Toggle
    preferred_lang = frappe.local.form_dict.get('lang') or frappe.request.cookies.get('preferred_lang')
    
    if preferred_lang and preferred_lang in ['ar', 'en']:
        frappe.local.lang = preferred_lang
        # Set cookie if it was a query param
        if frappe.local.form_dict.get('lang'):
            frappe.local.cookie_manager.set_cookie('preferred_lang', preferred_lang)
    else:
        # Default to Arabic if not set
        frappe.local.lang = 'ar'
    
    context.lang = frappe.local.lang
    context.is_rtl = (frappe.local.lang == 'ar')
    
    # 2. Branding (Company Name and Logo)
    # Fetch the last recorded company as requested
    last_companies = frappe.get_all('Company', fields=['company_name', 'company_logo'], order_by='creation desc', limit=1)
    
    if last_companies:
        context.company_name = last_companies[0].company_name
        context.company_logo = last_companies[0].company_logo
    else:
        context.company_name = "RASHAKATECH"
        context.company_logo = None

    # 3. Force Hide Frappe Elements
    context.no_header = 1
    context.no_sidebar = 1
    context.show_sidebar = 0
    context.hide_navbar = 1
    context.hide_footer = 1
    
    return context
