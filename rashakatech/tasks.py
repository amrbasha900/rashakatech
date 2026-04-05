import frappe
from frappe.utils import date_diff, now_datetime
from frappe import _

def daily_assessment_check():
    """
    Daily job to disable patients and users who haven't had a Body Composition Assessment in 15 days.
    """
    # Get active patients with an email
    patients = frappe.get_all("Patient", 
        filters={"status": "Active", "email": ["!=", ""]}, 
        fields=["name", "email", "patient_name"])
    
    count = 0
    for patient in patients:
        # Check latest Body Composition Assessment
        latest = frappe.get_all("Body Composition Assessment", 
            filters={"patient": patient.name, "docstatus": ["!=", 2]}, 
            fields=["creation"],
            order_by="creation desc",
            limit=1)
        
        should_disable = False
        if not latest:
            should_disable = True
        else:
            diff = date_diff(now_datetime(), latest[0].creation)
            if diff > 15:
                should_disable = True
        
        if should_disable:
            # Disable patient
            frappe.db.set_value("Patient", patient.name, "status", "Disabled")
            
            # Disable user associated with this email
            user_name = frappe.db.get_value("User", {"email": patient.email}, "name")
            if user_name:
                frappe.db.set_value("User", user_name, "enabled", 0)
                # Log the action in the user's timeline
                frappe.get_doc("User", user_name).add_comment("Comment", 
                    text=_("Disabled due to lack of Body Composition Assessment in the last 15 days."))
            
            count += 1
            
    if count > 0:
        frappe.db.commit()
    
    return count
