import frappe
import json
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
    context.title = f"{_('سجل الأكل')} | {_('مركز رشاقة')}"

    user_email = frappe.session.user
    patient = frappe.db.get_value("Patient", {"email": user_email}, ["name","patient_name"], as_dict=True)
    if not patient:
        context.patient = None
        return

    context.patient = patient

    # Today's logs
    today = frappe.utils.today()
    context.today = today

    today_logs_docs = frappe.get_all(
        "Patient Food Log",
        filters={"patient": patient.name, "log_date": today},
        fields=["name", "meal_time", "hunger_level", "mood", "water_intake_ml", "exercise_done", "exercise_description", "notes"],
        order_by="FIELD(meal_time,'Breakfast','Mid-Morning','Lunch','Afternoon Snack','Dinner')"
    )
    today_logs = []
    today_calories = 0
    today_water = sum(float(l.water_intake_ml or 0) for l in today_logs_docs)

    for l in today_logs_docs:
        items = frappe.get_all(
            "Patient Food Log Items",
            filters={"parent": l["name"]},
            fields=[
                "food_item", 
                "food_item.food_name_ar as food_name",
                "food_description", 
                "qty", 
                "unit", 
                "calories"
            ],
            order_by="`tabPatient Food Log Items`.idx asc"
        )
        l_cals = sum(float(i.calories or 0) for i in items)
        today_calories += l_cals
        l["food_items"] = items
        l["estimated_calories"] = l_cals
        today_logs.append(l)

    context.today_logs = today_logs
    context.today_calories = today_calories
    context.today_water = today_water

    # Active protocol for targets
    protocol = frappe.db.get_value(
        "Nutrition Protocol",
        {"patient": patient.name, "status": "Active"},
        ["daily_calories_target", "water_liters", "meal_frequency"],
        as_dict=True
    )
    context.protocol = protocol or {"daily_calories_target": 2000, "water_liters": 2.5}

    # Last 14 days calorie trend
    trend = frappe.db.sql("""
        SELECT log_date, SUM(total_cal) as total_cal, SUM(water_intake_ml) as total_water
        FROM (
            SELECT p.log_date, p.name, MAX(p.water_intake_ml) as water_intake_ml, SUM(IFNULL(c.calories, 0)) as total_cal
            FROM `tabPatient Food Log` p
            LEFT JOIN `tabPatient Food Log Items` c ON c.parent = p.name
            WHERE p.patient = %s AND p.log_date >= DATE_SUB(%s, INTERVAL 14 DAY)
            GROUP BY p.name
        ) as daily_logs
        GROUP BY log_date
        ORDER BY log_date ASC
    """, (patient.name, today), as_dict=True)
    context.trend_data = json.dumps({
        "dates": [str(t.log_date) for t in trend],
        "calories": [float(t.total_cal or 0) for t in trend],
        "water": [float(t.total_water or 0) for t in trend],
        "target": float(protocol.daily_calories_target if protocol else 2000)
    })

    # Food items for dropdown
    food_items = frappe.db.sql("""
        SELECT name, food_name_ar, food_name_en, calories_per_100g,
               protein_per_100g, carbs_per_100g, fat_per_100g
        FROM `tabFood Item`
        ORDER BY food_name_ar
        LIMIT 200
    """, as_dict=True)
    context.food_items_json = json.dumps(food_items)

    context.meal_times = ['Breakfast', 'Mid-Morning', 'Lunch', 'Afternoon Snack', 'Dinner']
    context.meal_times_ar = {
        'Breakfast': _('الإفطار'), 'Mid-Morning': _('خفيفة صباح'),
        'Lunch': _('الغداء'), 'Afternoon Snack': _('خفيفة مساء'), 'Dinner': _('العشاء')
    }
    context.mood_icons = {'Happy': '😊', 'Stressed': '😰', 'Tired': '😴', 'Anxious': '😟', 'Normal': '😐'}


@frappe.whitelist()
def save_food_log(meal_time, items_json="[]", water_intake_ml=None, hunger_level=None, mood=None, exercise_done=0, exercise_description=None, notes=None):
    user_email = frappe.session.user
    patient = frappe.db.get_value("Patient", {"email": user_email}, "name")
    if not patient:
        frappe.throw(_("المريض غير موجود"))

    doc = frappe.new_doc("Patient Food Log")
    doc.patient = patient
    doc.log_date = frappe.utils.today()
    doc.meal_time = meal_time

    if water_intake_ml: doc.water_intake_ml = float(water_intake_ml)
    if hunger_level: doc.hunger_level = hunger_level
    if mood: doc.mood = mood
    doc.exercise_done = int(exercise_done)
    if exercise_description: doc.exercise_description = exercise_description
    if notes: doc.notes = notes

    import json
    items = json.loads(items_json)
    for idx, item in enumerate(items, 1):
        doc.append("patient_food_log_items", {
            "idx": idx,
            "food_item": item.get("food_item"),
            "food_description": item.get("food_description"),
            "unit": item.get("unit") or "grams",
            "qty": float(item.get("qty") or 0),
            "calories": float(item.get("calories") or 0)
        })

    doc.insert(ignore_permissions=True)

    return {"message": _("تم الحفظ"), "name": doc.name}


@frappe.whitelist()
def delete_log(log_name):
    user_email = frappe.session.user
    patient = frappe.db.get_value("Patient", {"email": user_email}, "name")
    log_patient = frappe.db.get_value("Patient Food Log", log_name, "patient")
    if log_patient != patient:
        frappe.throw(_("غير مصرح"))
    frappe.delete_doc("Patient Food Log", log_name, ignore_permissions=True)
    return {"message": _("تم الحذف")}
