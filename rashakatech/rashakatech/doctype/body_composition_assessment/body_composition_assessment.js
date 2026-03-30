frappe.ui.form.on('Body Composition Assessment', {
    refresh(frm) { },
    weight_kg(frm) {
        preview_bmi(frm);
    },
    height_cm(frm) {
        preview_bmi(frm);
    }
});

function preview_bmi(frm) {
    if (frm.doc.weight_kg && frm.doc.height_cm) {
        let height_m = frm.doc.height_cm / 100.0;
        let bmi = frm.doc.weight_kg / (height_m * height_m);
        let category = "";
        let color = "";
        
        if (bmi < 18.5) {
            category = "Underweight";
            color = "blue";
        } else if (bmi >= 18.5 && bmi < 25) {
            category = "Normal";
            color = "green";
        } else if (bmi >= 25 && bmi < 30) {
            category = "Overweight";
            color = "orange";
        } else if (bmi >= 30 && bmi < 35) {
            category = "Obese I";
            color = "red";
        } else if (bmi >= 35 && bmi < 40) {
            category = "Obese II";
            color = "darkred";
        } else {
            category = "Obese III";
            color = "darkred";
        }
        
        frm.dashboard.set_headline(`
            <div class="row text-center">
                <div class="col-sm-6">
                    <h4>Calculated BMI</h4>
                    <h3>${bmi.toFixed(2)}</h3>
                </div>
                <div class="col-sm-6">
                    <h4>BMI Category</h4>
                    <h3 style="color:${color}">${category}</h3>
                </div>
            </div>
        `);
    }
}
