frappe.ready(function () {
    const rawData = JSON.parse(document.getElementById('chart-data')?.textContent || '{}');

    // Init all charts
    if (rawData.dates && rawData.dates.length > 0) {
        initWeightChart(rawData);
        initFatMuscleChart(rawData);
        initWaistChart(rawData);
    }



    // Animate change badges
    document.querySelectorAll('.change-val').forEach(el => {
        const val = parseFloat(el.dataset.val || 0);
        el.textContent = (val > 0 ? '+' : '') + val;
        el.className = 'change-val ' + (val < 0 ? 'neg' : val > 0 ? 'pos' : 'neu');
    });
});

function chartDefaults(ctx) {
    return {
        borderColor: 'rgba(0,212,255,0.3)',
        grid: { color: 'rgba(0,212,255,0.06)' },
        ticks: { color: 'rgba(200,230,240,0.5)', font: { family: 'Tajawal', size: 11 } }
    };
}

function tooltipDefaults() {
    return {
        backgroundColor: 'rgba(4,11,20,0.95)',
        borderColor: '#00d4ff',
        borderWidth: 1,
        titleColor: '#00d4ff',
        bodyColor: '#c8e6f0'
    };
}

function initWeightChart(d) {
    const ctx = document.getElementById('weightChart').getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 220);
    grad.addColorStop(0, 'rgba(0,212,255,0.25)');
    grad.addColorStop(1, 'rgba(0,212,255,0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: d.dates.map(x => x.substring(5)),
            datasets: [{
                data: d.weight,
                borderColor: '#00d4ff',
                backgroundColor: grad,
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
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { ...tooltipDefaults(), callbacks: { label: c => ` ${c.parsed.y} كجم` } } },
            scales: {
                x: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)', font: { family: 'Tajawal' } } },
                y: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)', font: { family: 'Tajawal' } } }
            }
        }
    });
}

function initFatMuscleChart(d) {
    const ctx = document.getElementById('fatMuscleChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: d.dates.map(x => x.substring(5)),
            datasets: [
                { label: 'دهون %', data: d.fat, borderColor: '#ff4d6d', backgroundColor: 'rgba(255,77,109,0.1)', borderWidth: 2, pointRadius: 4, tension: 0.4, fill: true },
                { label: 'عضلات كجم', data: d.muscle, borderColor: '#00ff88', backgroundColor: 'rgba(0,255,136,0.1)', borderWidth: 2, pointRadius: 4, tension: 0.4, fill: true }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#c8e6f0', font: { family: 'Tajawal' } } },
                tooltip: tooltipDefaults()
            },
            scales: {
                x: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)' } },
                y: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)' } }
            }
        }
    });
}

function initWaistChart(d) {
    if (!document.getElementById('waistChart')) return;
    const ctx = document.getElementById('waistChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: d.dates.map(x => x.substring(5)),
            datasets: [{
                label: 'محيط الخصر (سم)',
                data: d.waist,
                backgroundColor: 'rgba(245,200,66,0.6)',
                borderColor: '#f5c842',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: tooltipDefaults() },
            scales: {
                x: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)' } },
                y: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)' } }
            }
        }
    });
}
