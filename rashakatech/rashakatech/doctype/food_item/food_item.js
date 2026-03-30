frappe.ui.form.on('Food Item', {
    refresh(frm) { },
    serving_size_g(frm) {
        if (frm.doc.serving_size_g && frm.doc.calories_per_100g) {
            let ratio = frm.doc.serving_size_g / 100.0;
            let msg = `
                <b>Calculated Values for ${frm.doc.serving_size_g}g:</b><br/>
                Calories: ${(frm.doc.calories_per_100g * ratio).toFixed(2)}<br/>
                Protein: ${((frm.doc.protein_per_100g || 0) * ratio).toFixed(2)}g<br/>
                Carbs: ${((frm.doc.carbs_per_100g || 0) * ratio).toFixed(2)}g<br/>
                Fat: ${((frm.doc.fat_per_100g || 0) * ratio).toFixed(2)}g
            `;
            frappe.msgprint(msg);
        }
    }
});
