frappe.ui.form.on('Nutrition Protocol', {
    refresh(frm) { },
    current_weight_kg(frm) {
        calculate_total_loss(frm);
    },
    target_weight_kg(frm) {
        calculate_total_loss(frm);
    }
});

function calculate_total_loss(frm) {
    if (frm.doc.current_weight_kg && frm.doc.target_weight_kg) {
        let loss = frm.doc.current_weight_kg - frm.doc.target_weight_kg;
        frm.set_value('total_target_loss_kg', loss);
        let msg = `<b>Total Target Loss Evaluation:</b><br/>You are aiming to lose ${loss.toFixed(2)} kg.`;
        if (loss < 0) {
            msg = `<b>Note:</b> The target weight is higher than current weight.`;
        }
        frappe.msgprint(msg);
    }
}
