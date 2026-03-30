import frappe
from frappe.model.document import Document

class BodyMeasurementLog(Document):
    def validate(self):
        if self.patient and self.log_date:
            exists = frappe.db.exists('Body Measurement Log', {
                'patient': self.patient,
                'log_date': self.log_date,
                'name': ['!=', self.name]
            })
            if exists:
                frappe.throw(f"A Body Measurement Log already exists for patient {self.patient} on {self.log_date}")
