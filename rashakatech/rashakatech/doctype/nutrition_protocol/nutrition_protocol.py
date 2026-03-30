import frappe
from frappe.model.document import Document

class NutritionProtocol(Document):
    def before_save(self):
        if self.current_weight_kg and self.target_weight_kg:
            self.total_target_loss_kg = self.current_weight_kg - self.target_weight_kg

    def validate(self):
        if self.protocol_type == "Weight Loss" and self.current_weight_kg and self.target_weight_kg:
            if self.target_weight_kg >= self.current_weight_kg:
                frappe.throw("Target weight must be less than current weight for Weight Loss protocol.")
