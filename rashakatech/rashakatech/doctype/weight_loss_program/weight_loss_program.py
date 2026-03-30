import frappe
from frappe.model.document import Document

class WeightLossProgram(Document):
    def validate(self):
        if self.price is not None and self.price <= 0:
            frappe.throw("Price must be greater than 0.")
