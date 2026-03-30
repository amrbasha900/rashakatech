frappe.ready(function () {
    // Animate KPI counters
    document.querySelectorAll('.kpi-value[data-val]').forEach(el => {
        const target = parseFloat(el.dataset.val);
        const isFloat = el.dataset.val.includes('.');
        animateCounter(el, target, isFloat);
    });

    // Weight & Fat Chart
    const weightData = JSON.parse(document.getElementById('weight-data')?.textContent || '[]');
    if (weightData.length > 0) {
        initWeightChart(weightData);
        initFatMuscleChart(weightData);
    }

    // Calorie ring
    const todayCal = parseFloat(document.getElementById('today-cal-val')?.textContent || 0);
    const targetCal = parseFloat(document.getElementById('target-cal-val')?.textContent || 2000);
    if (document.getElementById('calRingChart')) {
        initCalorieRing(todayCal, targetCal);
    }

    // Water ring
    const waterMl = parseFloat(document.getElementById('water-ml-val')?.textContent || 0);
    const targetWater = parseFloat(document.getElementById('target-water-val')?.textContent || 2500);
    if (document.getElementById('waterRingChart')) {
        initWaterRing(waterMl, targetWater);
    }

    // Progress bar
    const lostKg = parseFloat(document.querySelector('.progress-lost')?.dataset.val || 0);
    const totalKg = parseFloat(document.querySelector('.progress-total')?.dataset.val || 1);
    const pct = Math.min(Math.round((lostKg / totalKg) * 100), 100);
    const bar = document.querySelector('.goal-bar-fill');
    if (bar) {
        setTimeout(() => { bar.style.width = pct + '%'; }, 500);
        document.querySelector('.goal-pct').textContent = pct + '%';
    }

    // Scan line animation
    setInterval(() => {
        document.querySelectorAll('.scan-line').forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight; // reflow
            el.style.animation = '';
        });
    }, 4000);
});

function animateCounter(el, target, isFloat) {
    const duration = 1200;
    const start = performance.now();
    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = target * ease;
        el.textContent = isFloat ? current.toFixed(1) : Math.round(current);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function initWeightChart(data) {
    const labels = data.map(d => d.date ? d.date.substring(5) : '');
    const weights = data.map(d => d.weight || 0);

    const ctx = document.getElementById('weightChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'الوزن (كجم)',
                data: weights,
                borderColor: '#00d4ff',
                backgroundColor: gradient,
                borderWidth: 2.5,
                pointBackgroundColor: '#00d4ff',
                pointBorderColor: '#040b14',
                pointBorderWidth: 2,
                pointRadius: 5,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(4, 11, 20, 0.9)',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    titleColor: '#00d4ff',
                    bodyColor: '#c8e6f0',
                    callbacks: {
                        label: ctx => ` ${ctx.parsed.y} كجم`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(0,212,255,0.06)' },
                    ticks: { color: 'rgba(200,230,240,0.5)', font: { family: 'Tajawal', size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(0,212,255,0.06)' },
                    ticks: { color: 'rgba(200,230,240,0.5)', font: { family: 'Tajawal', size: 11 } }
                }
            }
        }
    });
}

function initFatMuscleChart(data) {
    const labels = data.map(d => d.date ? d.date.substring(5) : '');
    const fat = data.map(d => d.fat || 0);
    const muscle = data.map(d => d.muscle || 0);

    const ctx = document.getElementById('fatMuscleChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'دهون %',
                    data: fat,
                    backgroundColor: 'rgba(255, 100, 100, 0.7)',
                    borderRadius: 4
                },
                {
                    label: 'عضلات كجم',
                    data: muscle,
                    backgroundColor: 'rgba(0, 255, 136, 0.7)',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#c8e6f0', font: { family: 'Tajawal' } }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)' } },
                y: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)' } }
            }
        }
    });
}

function initCalorieRing(today, target) {
    const pct = Math.min(Math.round((today / target) * 100), 100);
    const ctx = document.getElementById('calRingChart').getContext('2d');
    const remaining = target - today;
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [today, Math.max(remaining, 0)],
                backgroundColor: ['#f5c842', 'rgba(255,255,255,0.06)'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '78%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        }
    });
    document.getElementById('cal-pct-text').textContent = pct + '%';
}

function initWaterRing(ml, target) {
    const ctx = document.getElementById('waterRingChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [ml, Math.max(target - ml, 0)],
                backgroundColor: ['#00d4ff', 'rgba(255,255,255,0.06)'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '78%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        }
    });
    document.getElementById('water-pct-text').textContent = Math.round((ml / target) * 100) + '%';
}
