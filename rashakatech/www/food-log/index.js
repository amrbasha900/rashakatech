frappe.ready(function () {
    const foodItems = JSON.parse(document.getElementById('food-items-data')?.textContent || '[]');
    const trendData = JSON.parse(document.getElementById('trend-data')?.textContent || '{}');

    // Calorie trend chart
    if (trendData.dates && trendData.dates.length > 0) initTrendChart(trendData);

    // Food item autocomplete
    const foodSelect = document.getElementById('f-food');
    const qtyInput = document.getElementById('f-qty');
    const calInput = document.getElementById('f-calories');

    // Build datalist
    const dl = document.getElementById('food-list');
    foodItems.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.food_name_ar;
        opt.dataset.id = f.name;
        opt.textContent = `${f.calories_per_100g} kcal/100g`;
        dl.appendChild(opt);
    });

    // Auto-calc calories when food + qty change
    function calcCalories() {
        const selectedName = foodSelect.value;
        const food = foodItems.find(f => f.food_name_ar === selectedName || f.name === selectedName);
        if (food && qtyInput.value) {
            const cal = (parseFloat(food.calories_per_100g) / 100) * parseFloat(qtyInput.value);
            calInput.value = cal.toFixed(1);
        }
    }

    foodSelect.addEventListener('change', calcCalories);
    foodSelect.addEventListener('input', calcCalories);
    qtyInput.addEventListener('input', calcCalories);

    // Modal
    const modal = document.getElementById('log-modal');
    document.getElementById('open-modal-btn')?.addEventListener('click', () => {
        modal.classList.add('visible');
    });
    document.getElementById('close-modal')?.addEventListener('click', () => modal.classList.remove('visible'));
    modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('visible'); });

    // --- Multi-Item Logic ---
    let currentItems = [];
    const itemsListEl = document.getElementById('items-list');
    const totalCalEl = document.getElementById('total-meal-cal');
    const unitInput = document.getElementById('f-unit');
    const descInput = document.getElementById('f-desc');

    function renderItems() {
        itemsListEl.innerHTML = '';
        let totalCal = 0;
        currentItems.forEach((item, idx) => {
            totalCal += parseFloat(item.calories || 0);
            const row = document.createElement('div');
            row.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:0.6rem; border-radius:8px; border:1px solid rgba(255,255,255,0.05);";
            row.innerHTML = `
                <div>
                    <div style="font-size:0.85rem; font-weight:700; color:var(--text-bright);">${item.food_name_display || item.food_description || 'طعام'}</div>
                    <div style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">${item.qty} ${item.unit} | <span style="color:var(--gold)">${parseFloat(item.calories).toFixed(1)} kcal</span></div>
                </div>
                <button type="button" class="remove-item-btn" data-idx="${idx}" style="background:none; border:none; color:var(--red); font-size:1.2rem; cursor:pointer;">×</button>
            `;
            itemsListEl.appendChild(row);
        });
        totalCalEl.textContent = `${totalCal.toFixed(1)} kcal`;

        // Bind removes
        itemsListEl.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentItems.splice(parseInt(e.currentTarget.dataset.idx), 1);
                renderItems();
            });
        });
    }

    document.getElementById('add-item-btn')?.addEventListener('click', () => {
        const inputVal = foodSelect.value.trim();
        const matchedFood = foodItems.find(f => f.food_name_ar === inputVal || f.name === inputVal);

        const itemObj = {
            food_item: matchedFood ? matchedFood.name : null,
            food_name_display: matchedFood ? matchedFood.food_name_ar : (inputVal || null),
            food_description: descInput.value || null,
            qty: parseFloat(qtyInput.value) || 0,
            unit: unitInput.value || 'grams',
            calories: parseFloat(calInput.value) || 0
        };
        
        if (!itemObj.food_item && !itemObj.food_description) {
            frappe.show_alert({ message: 'الرجاء اختيار أو وصف طعام', indicator: 'orange' }, 3);
            return;
        }
        if (itemObj.qty <= 0) {
            frappe.show_alert({ message: 'الرجاء إدخال كمية صحيحة', indicator: 'orange' }, 3);
            return;
        }

        currentItems.push(itemObj);
        renderItems();

        // Clear inputs for next item
        foodSelect.value = '';
        descInput.value = '';
        qtyInput.value = '';
        calInput.value = '';
    });

    // Exercise UI
    const exerciseCheck = document.getElementById('f-exercise');
    const exerciseDescWrap = document.getElementById('exercise-desc-wrap');
    if (exerciseCheck && exerciseDescWrap) {
        exerciseCheck.addEventListener('change', function() {
            exerciseDescWrap.style.display = this.checked ? 'grid' : 'none';
        });
    }

    // Form submit
    document.getElementById('food-form')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (currentItems.length === 0) {
            frappe.show_alert({ message: 'الرجاء إضافة صنف واحد على الأقل للوجبة', indicator: 'red' }, 3);
            return;
        }

        const btn = document.getElementById('save-btn');
        btn.disabled = true; btn.textContent = 'جاري الحفظ...';

        try {
            await frappe.call({
                method: 'rashakatech.www.food-log.index.save_food_log',
                args: {
                    meal_time: document.getElementById('f-meal-time').value,
                    items_json: JSON.stringify(currentItems),
                    water_intake_ml: document.getElementById('f-water').value || null,
                    hunger_level: document.getElementById('f-hunger').value || null,
                    mood: document.getElementById('f-mood').value || null,
                    exercise_done: exerciseCheck?.checked ? 1 : 0,
                    exercise_description: document.getElementById('f-exercise-desc')?.value || null,
                    notes: document.getElementById('f-notes').value || null,
                }
            });
            frappe.show_alert({ message: '✓ تم تسجيل الوجبة', indicator: 'green' }, 3);
            modal.classList.remove('visible');
            setTimeout(() => location.reload(), 800);
        } catch {
            frappe.show_alert({ message: '✗ حدث خطأ', indicator: 'red' }, 3);
            btn.disabled = false; btn.textContent = 'حفظ الوجبة';
        }
    });

    // Delete log
    document.querySelectorAll('.delete-log-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            if (!confirm('هل تريد حذف هذا السجل؟')) return;
            try {
                await frappe.call({
                    method: 'rashakatech.www.food-log.index.delete_log',
                    args: { log_name: this.dataset.name }
                });
                this.closest('.log-item').remove();
                frappe.show_alert({ message: '✓ تم الحذف', indicator: 'green' }, 2);
            } catch {
                frappe.show_alert({ message: '✗ حدث خطأ', indicator: 'red' }, 2);
            }
        });
    });

    // Calorie ring animation
    const ring = document.getElementById('cal-ring');
    if (ring) {
        const pct = Math.min(parseFloat(ring.dataset.pct || 0), 100);
        const c = 2 * Math.PI * 45; // circumference r=45
        setTimeout(() => {
            ring.style.strokeDashoffset = c - (c * pct / 100);
        }, 400);
    }
});

function initTrendChart(d) {
    const ctx = document.getElementById('trendChart')?.getContext('2d');
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, 0, 180);
    grad.addColorStop(0, 'rgba(245,200,66,0.25)');
    grad.addColorStop(1, 'rgba(245,200,66,0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: d.dates.map(x => x.substring(5)),
            datasets: [
                {
                    label: 'السعرات',
                    data: d.calories,
                    borderColor: '#f5c842',
                    backgroundColor: grad,
                    borderWidth: 2.5,
                    pointRadius: 4,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'الهدف',
                    data: d.dates.map(() => d.target),
                    borderColor: 'rgba(0,212,255,0.4)',
                    borderWidth: 1.5,
                    borderDash: [6, 3],
                    pointRadius: 0,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#c8e6f0', font: { family: 'Tajawal' } } },
                tooltip: {
                    backgroundColor: 'rgba(4,11,20,0.9)',
                    borderColor: '#00d4ff', borderWidth: 1,
                    titleColor: '#00d4ff', bodyColor: '#c8e6f0',
                    callbacks: { label: c => ` ${c.parsed.y} سعرة` }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)' } },
                y: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)' } }
            }
        }
    });
}
