import frappe
from rashakatech.portal_utils import get_portal_context
from frappe import _

def get_context(context):
    get_portal_context(context)
    
    if frappe.session.user == "Guest":
        frappe.local.flags.redirect_location = "/login"
        raise frappe.Redirect

    context.no_cache = 1
    context.show_sidebar = False
    context.title = f"{_('خطة الغذاء')} | {_('مركز رشاقة')}"

    user_email = frappe.session.user
    patient = frappe.db.get_value("Patient", {"email": user_email}, ["name","patient_name"], as_dict=True)
    if not patient:
        context.patient = None
        return

    context.patient = patient

    # Active meal plan
    meal_plan = frappe.db.get_value(
        "Meal Plan",
        {"patient": patient.name, "status": "Active"},
        ["name", "plan_name", "plan_type", "phase",
         "total_calories_target", "protein_target_g", "carbs_target_g", "fat_target_g",
         "total_calories_actual", "total_protein_actual", "total_carbs_actual", "total_fat_actual",
         "start_date", "end_date"],
        order_by="modified desc",
        as_dict=True
    )
    context.meal_plan = meal_plan

    if meal_plan:
        # Get meal items grouped by meal time
        items = frappe.db.sql("""
            SELECT mpi.meal_time, mpi.food_name, mpi.food_item,
                   mpi.quantity_grams, mpi.calories, mpi.protein_g,
                   mpi.carbs_g, mpi.fat_g, mpi.notes
            FROM `tabMeal Plan Item` mpi
            WHERE mpi.parent = %s
            ORDER BY FIELD(mpi.meal_time,
                'Breakfast','Mid-Morning Snack','Lunch','Afternoon Snack','Dinner','Before Bed')
        """, meal_plan.name, as_dict=True)

        # Group by meal time
        from collections import defaultdict
        grouped = defaultdict(list)
        for item in items:
            grouped[item.meal_time].append(item)

        context.meal_groups = dict(grouped)
        context.meal_order = ['Breakfast','Mid-Morning Snack','Lunch','Afternoon Snack','Dinner','Before Bed']

        meal_names_ar = {
            'Breakfast': 'الإفطار',
            'Mid-Morning Snack': 'وجبة خفيفة صباحية',
            'Lunch': 'الغداء',
            'Afternoon Snack': 'وجبة خفيفة مسائية',
            'Dinner': 'العشاء',
            'Before Bed': 'قبل النوم'
        }
        meal_icons = {
            'Breakfast': '🌅',
            'Mid-Morning Snack': '🍎',
            'Lunch': '🍽️',
            'Afternoon Snack': '🥜',
            'Dinner': '🌙',
            'Before Bed': '💤'
        }
        context.meal_names_ar = meal_names_ar
        context.meal_icons = meal_icons

        # Macros for chart
        context.macros_chart = {
            "labels": ["بروتين", "كربوهيدرات", "دهون"],
            "data": [
                float(meal_plan.total_protein_actual or 0),
                float(meal_plan.total_carbs_actual or 0),
                float(meal_plan.total_fat_actual or 0)
            ]
        }
