import frappe
from frappe.model.document import Document

class MealPlan(Document):
    def before_save(self):
        total_cal = 0
        total_pro = 0
        total_carb = 0
        total_fat = 0
        
        for item in self.get('meal_items'):
            if item.food_item and item.quantity_grams:
                food = frappe.get_doc('Food Item', item.food_item)
                ratio = item.quantity_grams / 100.0
                item_cal = (food.calories_per_100g or 0) * ratio
                item_pro = (food.protein_per_100g or 0) * ratio
                item_carb = (food.carbs_per_100g or 0) * ratio
                item_fat = (food.fat_per_100g or 0) * ratio
                
                item.calories = item_cal
                item.protein_g = item_pro
                item.carbs_g = item_carb
                item.fat_g = item_fat
                
                total_cal += item_cal
                total_pro += item_pro
                total_carb += item_carb
                total_fat += item_fat
                
        self.total_calories_actual = total_cal
        self.total_protein_actual = total_pro
        self.total_carbs_actual = total_carb
        self.total_fat_actual = total_fat
