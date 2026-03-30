frappe.ready(function () {
    const chartData = JSON.parse(document.getElementById('session-chart-data')?.textContent || '{}');

    if (chartData.labels && chartData.labels.length > 0) {
        initWeightPerSession(chartData);
        initComplianceChart(chartData);
    }

    // Accordion session cards
    document.querySelectorAll('.session-card-header').forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.session-card');
            const body = card.querySelector('.session-card-body');
            const isOpen = card.classList.contains('open');

            document.querySelectorAll('.session-card.open').forEach(c => {
                c.classList.remove('open');
                c.querySelector('.session-card-body').style.maxHeight = '0';
            });

            if (!isOpen) {
                card.classList.add('open');
                body.style.maxHeight = body.scrollHeight + 'px';
            }
        });
    });

    // Compliance score bars
    document.querySelectorAll('.compliance-bar-fill').forEach(bar => {
        const pct = bar.dataset.pct || 0;
        setTimeout(() => { bar.style.width = pct + '%'; }, 500);
    });
});

function initWeightPerSession(d) {
    const ctx = document.getElementById('weightSessionChart')?.getContext('2d');
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, 'rgba(0,212,255,0.3)');
    grad.addColorStop(1, 'rgba(0,212,255,0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: d.labels,
            datasets: [{
                label: 'الوزن (كجم)',
                data: d.weight,
                borderColor: '#00d4ff',
                backgroundColor: grad,
                borderWidth: 2.5,
                pointBackgroundColor: '#00d4ff',
                pointBorderColor: '#040b14',
                pointBorderWidth: 2,
                pointRadius: 6,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(4,11,20,0.9)', borderColor: '#00d4ff', borderWidth: 1,
                    titleColor: '#00d4ff', bodyColor: '#c8e6f0',
                    callbacks: { label: c => ` ${c.parsed.y} كجم` }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)', font: { family: 'Tajawal' } } },
                y: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)', font: { family: 'Tajawal' } } }
            }
        }
    });
}

function initComplianceChart(d) {
    const ctx = document.getElementById('complianceChart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: d.labels,
            datasets: [{
                label: 'نسبة الالتزام %',
                data: d.compliance,
                backgroundColor: d.compliance.map(v =>
                    v >= 80 ? 'rgba(0,255,136,0.7)' : v >= 60 ? 'rgba(245,200,66,0.7)' : 'rgba(255,77,109,0.7)'
                ),
                borderRadius: 5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(4,11,20,0.9)', borderColor: '#00d4ff', borderWidth: 1, titleColor: '#00d4ff', bodyColor: '#c8e6f0' } },
            scales: {
                x: { grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)' } },
                y: { max: 100, grid: { color: 'rgba(0,212,255,0.06)' }, ticks: { color: 'rgba(200,230,240,0.5)', callback: v => v + '%' } }
            }
        }
    });
}
