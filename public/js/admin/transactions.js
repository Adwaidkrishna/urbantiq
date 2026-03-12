(function () {
    const weeklyBtn = document.getElementById('weeklyReport');
    const monthlyBtn = document.getElementById('monthlyReport');
    const allTimeBtn = document.getElementById('allTimeReport');

    const weeklySummary = document.getElementById('weeklySummary');
    const monthlySummary = document.getElementById('monthlySummary');
    const allTimeSummary = document.getElementById('allTimeSummary');

    const updateView = (selected) => {
        weeklySummary?.classList.add('d-none');
        monthlySummary?.classList.add('d-none');
        allTimeSummary?.classList.add('d-none');

        if (selected === 'weekly') weeklySummary?.classList.remove('d-none');
        if (selected === 'monthly') monthlySummary?.classList.remove('d-none');
        if (selected === 'alltime') allTimeSummary?.classList.remove('d-none');
    };

    weeklyBtn?.addEventListener('change', () => updateView('weekly'));
    monthlyBtn?.addEventListener('change', () => updateView('monthly'));
    allTimeBtn?.addEventListener('change', () => updateView('alltime'));

    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.admin-table tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => {
            alert('Generating financial report (Simulation)');
        });
    }
})();
