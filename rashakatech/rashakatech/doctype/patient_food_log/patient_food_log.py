import frappe
from frappe.model.document import Document

class PatientFoodLog(Document):
    def before_save(self):
        for item in self.get("patient_food_log_items", []):
            if item.food_item and item.qty and not item.calories:
                food = frappe.get_doc('Food Item', item.food_item)
                if food.calories_per_100g:
                    item.calories = (food.calories_per_100g / 100.0) * item.qty
