import frappe
from frappe.model.document import Document

class BodyCompositionAssessment(Document):
    def before_save(self):
        if not self.assessment_id:
            self.assessment_id = self.name

        self.calculate_bmi()
        self.calculate_whr()
        self.calculate_bmr_tdee()
        
    def calculate_bmi(self):
        if self.weight_kg and self.height_cm:
            height_m = self.height_cm / 100.0
            self.bmi = self.weight_kg / (height_m ** 2)
            
            if self.bmi < 18.5:
                self.bmi_category = "Underweight"
            elif 18.5 <= self.bmi < 25:
                self.bmi_category = "Normal"
            elif 25 <= self.bmi < 30:
                self.bmi_category = "Overweight"
            elif 30 <= self.bmi < 35:
                self.bmi_category = "Obese I"
            elif 35 <= self.bmi < 40:
                self.bmi_category = "Obese II"
            else:
                self.bmi_category = "Obese III"

    def calculate_whr(self):
        if self.waist_cm and self.hip_cm and self.hip_cm > 0:
            self.waist_hip_ratio = self.waist_cm / self.hip_cm
            
    def calculate_bmr_tdee(self):
        if self.weight_kg and self.height_cm and self.patient_age and self.gender:
            if self.gender == "Male":
                self.bmr_calculated = (10 * self.weight_kg) + (6.25 * self.height_cm) - (5 * self.patient_age) + 5
            elif self.gender == "Female":
                self.bmr_calculated = (10 * self.weight_kg) + (6.25 * self.height_cm) - (5 * self.patient_age) - 161
                
            if self.bmr_calculated and self.activity_factor:
                factors = {
                    "Sedentary": 1.2,
                    "Lightly Active": 1.375,
                    "Moderately Active": 1.55,
                    "Very Active": 1.725
                }
                factor = factors.get(self.activity_factor, 1.2)
                self.tdee_calculated = self.bmr_calculated * factor
