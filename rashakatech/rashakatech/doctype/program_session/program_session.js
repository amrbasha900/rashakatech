frappe.ui.form.on('Program Session', {
    refresh(frm) { },
    assessment(frm) {
        if (frm.doc.assessment) {
            frappe.db.get_value('Body Composition Assessment', frm.doc.assessment, 'weight_kg')
                .then(r => {
                    if (r && r.message && r.message.weight_kg) {
                        frm.set_value('weight_this_session', r.message.weight_kg);
                    }
                });
        }
    }
});
