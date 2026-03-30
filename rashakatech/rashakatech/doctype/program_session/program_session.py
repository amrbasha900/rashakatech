import frappe
from frappe.model.document import Document

class ProgramSession(Document):
    def before_save(self):
        if not self.patient:
            return

        # Fetch previous session
        last_session = frappe.get_all('Program Session', 
            filters={'patient': self.patient, 'name': ['!=', self.name]}, 
            order_by='session_date desc', 
            limit=1,
            fields=['weight_this_session']
        )
        if last_session and last_session[0].weight_this_session:
            self.weight_last_session = last_session[0].weight_this_session
            if self.weight_this_session:
                self.weight_change = self.weight_this_session - self.weight_last_session

        # Fetch initial session
        initial_session = frappe.get_all('Program Session', 
            filters={'patient': self.patient, 'name': ['!=', self.name]}, 
            order_by='session_date asc', 
            limit=1,
            fields=['weight_this_session']
        )
        if initial_session and initial_session[0].weight_this_session and self.weight_this_session:
            self.total_loss_to_date = initial_session[0].weight_this_session - self.weight_this_session
