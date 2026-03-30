frappe.ui.form.on('Meal Plan', {
    refresh(frm) {
        if (frm.doc.total_calories_actual) {
            update_dashboard(frm, frm.doc.total_calories_actual, frm.doc.total_protein_actual, frm.doc.total_carbs_actual, frm.doc.total_fat_actual);
        }
    }
});

frappe.ui.form.on('Meal Plan Item', {
    quantity_grams: function(frm, cdt, cdn) {
        recalculate_totals(frm);
    },
    food_item: function(frm, cdt, cdn) {
        recalculate_totals(frm);
    },
    meal_items_remove: function(frm) {
        recalculate_totals(frm);
    }
});

function update_dashboard(frm, cal, pro, carb, fat) {
    frm.dashboard.set_headline(`
        <div class="row text-center">
            <div class="col-xs-3"><h4>Calories</h4><p>${(cal || 0).toFixed(2)}</p></div>
            <div class="col-xs-3"><h4>Protein</h4><p>${(pro || 0).toFixed(2)}g</p></div>
            <div class="col-xs-3"><h4>Carbs</h4><p>${(carb || 0).toFixed(2)}g</p></div>
            <div class="col-xs-3"><h4>Fat</h4><p>${(fat || 0).toFixed(2)}g</p></div>
        </div>
    `);
}

function recalculate_totals(frm) {
    let total_cal = 0;
    let total_pro = 0;
    let total_carb = 0;
    let total_fat = 0;

    let promises = [];
    
    (frm.doc.meal_items || []).forEach(item => {
        if (item.food_item && item.quantity_grams) {
            promises.push(
                frappe.db.get_doc('Food Item', item.food_item).then(food => {
                    let ratio = item.quantity_grams / 100.0;
                    let item_cal = (food.calories_per_100g || 0) * ratio;
                    let item_pro = (food.protein_per_100g || 0) * ratio;
                    let item_carb = (food.carbs_per_100g || 0) * ratio;
                    let item_fat = (food.fat_per_100g || 0) * ratio;

                    frappe.model.set_value(item.doctype, item.name, 'calories', item_cal);
                    frappe.model.set_value(item.doctype, item.name, 'protein_g', item_pro);
                    frappe.model.set_value(item.doctype, item.name, 'carbs_g', item_carb);
                    frappe.model.set_value(item.doctype, item.name, 'fat_g', item_fat);

                    total_cal += item_cal;
                    total_pro += item_pro;
                    total_carb += item_carb;
                    total_fat += item_fat;
                })
            );
        }
    });

    Promise.all(promises).then(() => {
        frm.set_value('total_calories_actual', total_cal);
        frm.set_value('total_protein_actual', total_pro);
        frm.set_value('total_carbs_actual', total_carb);
        frm.set_value('total_fat_actual', total_fat);
        update_dashboard(frm, total_cal, total_pro, total_carb, total_fat);
    });
}
