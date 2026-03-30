frappe.ready(function () {
    // Macros Doughnut Chart
    const macrosData = JSON.parse(document.getElementById('macros-data')?.textContent || 'null');
    if (macrosData && document.getElementById('macrosChart')) {
        const ctx = document.getElementById('macrosChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: macrosData.labels,
                datasets: [{
                    data: macrosData.data,
                    backgroundColor: ['#00ff88', '#f5c842', '#ff4d6d'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                cutout: '70%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#c8e6f0',
                            font: { family: 'Tajawal', size: 12 },
                            padding: 16,
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(4,11,20,0.9)',
                        borderColor: '#00d4ff',
                        borderWidth: 1,
                        titleColor: '#00d4ff',
                        bodyColor: '#c8e6f0',
                        callbacks: {
                            label: ctx => ` ${ctx.parsed} جرام`
                        }
                    }
                }
            }
        });
    }

    // Calories progress bars animation
    document.querySelectorAll('.macro-bar-fill').forEach(bar => {
        const pct = bar.dataset.pct || 0;
        setTimeout(() => { bar.style.width = pct + '%'; }, 300);
    });

    // Accordion meal cards
    document.querySelectorAll('.meal-header').forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.meal-card');
            const body = card.querySelector('.meal-body');
            const isOpen = card.classList.contains('open');

            document.querySelectorAll('.meal-card.open').forEach(c => {
                c.classList.remove('open');
                c.querySelector('.meal-body').style.maxHeight = '0';
            });

            if (!isOpen) {
                card.classList.add('open');
                body.style.maxHeight = body.scrollHeight + 'px';
            }
        });
    });

    // Open first meal by default
    const firstCard = document.querySelector('.meal-card');
    if (firstCard) {
        firstCard.classList.add('open');
        const body = firstCard.querySelector('.meal-body');
        if (body) body.style.maxHeight = body.scrollHeight + 'px';
    }
});
