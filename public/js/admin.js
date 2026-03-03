/**
 * URBANTIQ Admin Logic
 * Dedicated JS for all admin-side interactions.
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    /* ─── 1. LOGIN HANDLING ─── */
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const btn = document.getElementById('loginBtn');
            const btnText = document.getElementById('btnText');
            const btnSpinner = document.getElementById('btnSpinner');

            if (btn && btnText && btnSpinner) {
                // Show loading state
                btn.disabled = true;
                btnText.textContent = 'Authenticating...';
                btnSpinner.classList.remove('d-none');

                // Simulate a brief delay for "premium" feel
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 800);
            }
        });
    }

    /* ─── 2. SALES REPORT GENERATION ─── */
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function () {
            this.disabled = true;
            const originalText = this.innerHTML;
            this.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Generating Report...
            `;

            // Simulate report generation
            setTimeout(() => {
                this.disabled = false;
                this.innerHTML = originalText;
                alert('Sales report generated and downloaded successfully!');
            }, 1500);
        });
    }

    /* ─── 3. SALES REPORT TOGGLE (Transactions Page) ─── */
    const weeklySummary = document.getElementById('weeklySummary');
    const monthlySummary = document.getElementById('monthlySummary');
    const allTimeSummary = document.getElementById('allTimeSummary');
    const weeklyReportRadio = document.getElementById('weeklyReport');
    const monthlyReportRadio = document.getElementById('monthlyReport');
    const allTimeReportRadio = document.getElementById('allTimeReport');

    if (weeklyReportRadio && monthlyReportRadio && allTimeReportRadio) {
        const summaries = {
            'weeklyReport': weeklySummary,
            'monthlyReport': monthlySummary,
            'allTimeReport': allTimeSummary
        };

        [weeklyReportRadio, monthlyReportRadio, allTimeReportRadio].forEach(radio => {
            radio.addEventListener('change', function () {
                if (this.checked) {
                    // Hide all summaries
                    Object.values(summaries).forEach(s => s?.classList.add('d-none'));
                    // Show selected summary
                    summaries[this.id]?.classList.remove('d-none');
                }
            });
        });
    }

    /* ─── 4. DASHBOARD ANALYTICS (requires Chart.js) ─── */
    const salesChartCanvas = document.getElementById('salesChart');
    if (salesChartCanvas && typeof Chart !== 'undefined') {
        initDashboardAnalytics(salesChartCanvas);
    }

    function initDashboardAnalytics(canvas) {
        /* Dataset per time-filter */
        const datasets = {
            today: {
                labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
                values: [420, 680, 950, 1420, 1100, 1680, 2040, 1760, 980],
                summary: {
                    revenue: '$9,240', orders: '184', conversion: '3.8%',
                    avg: '$1,026', growth: '+6.2%', positive: true,
                    revChange: '+6.2%', ordChange: '+3.1%', convChange: '+0.2%', avgChange: '+6.2%'
                }
            },
            week: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                values: [4200, 6800, 5400, 7900, 9100, 11200, 8600],
                summary: {
                    revenue: '$53,200', orders: '1,042', conversion: '4.1%',
                    avg: '$7,600', growth: '+12.5%', positive: true,
                    revChange: '+12.5%', ordChange: '+7.4%', convChange: '+0.5%', avgChange: '+12.5%'
                }
            },
            month: {
                labels: ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23', '25', '27', '29', '31'],
                values: [3100, 4800, 3900, 6200, 7400, 5800, 8100, 9300, 7600, 11200, 10400, 12800, 9700, 13500, 11900, 14200],
                summary: {
                    revenue: '$124,563', orders: '3,840', conversion: '3.9%',
                    avg: '$4,018', growth: '+8.7%', positive: true,
                    revChange: '+8.7%', ordChange: '+4.2%', convChange: '+0.3%', avgChange: '+5.1%'
                }
            },
            year: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                values: [38000, 42000, 51000, 47000, 63000, 72000, 68000, 81000, 77000, 93000, 88000, 104000],
                summary: {
                    revenue: '$824,000', orders: '18,240', conversion: '4.3%',
                    avg: '$68,667', growth: '+22.4%', positive: true,
                    revChange: '+22.4%', ordChange: '+18.1%', convChange: '+0.8%', avgChange: '+22.4%'
                }
            }
        };

        let chart = null;
        let currentGradient = null;
        let gradientCtx = null;
        let gradientArea = null;

        function buildGradient(ctx, chartArea) {
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.28)');
            gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
            gradient.addColorStop(1, 'rgba(99, 102, 241, 0.00)');
            return gradient;
        }

        function initChart(filterKey) {
            const ctx = canvas.getContext('2d');
            const data = datasets[filterKey];

            if (chart) { chart.destroy(); }

            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Revenue',
                        data: data.values,
                        borderColor: '#6366F1',
                        borderWidth: 3,
                        fill: true,
                        backgroundColor: function (context) {
                            const chart = context.chart;
                            const { ctx: c, chartArea } = chart;
                            if (!chartArea) return 'transparent';
                            if (!currentGradient || gradientCtx !== c || gradientArea !== chartArea) {
                                currentGradient = buildGradient(c, chartArea);
                                gradientCtx = c;
                                gradientArea = chartArea;
                            }
                            return currentGradient;
                        },
                        tension: 0.45,
                        pointBackgroundColor: '#6366F1',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2.5,
                        pointRadius: 4,
                        pointHoverRadius: 8,
                        pointHoverBackgroundColor: '#6366F1',
                        pointHoverBorderColor: '#ffffff',
                        pointHoverBorderWidth: 3,
                        clip: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 700, easing: 'easeInOutCubic' },
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#0F172A',
                            titleColor: '#94A3B8',
                            bodyColor: '#F1F5F9',
                            footerColor: '#6366F1',
                            padding: { top: 10, right: 16, bottom: 10, left: 16 },
                            borderColor: '#1E293B',
                            borderWidth: 1,
                            cornerRadius: 10,
                            displayColors: false,
                            titleFont: { size: 11, weight: '500', family: 'inherit' },
                            bodyFont: { size: 15, weight: '700', family: 'inherit' },
                            callbacks: {
                                title: items => items[0].label,
                                label: item => {
                                    const val = item.raw;
                                    if (val >= 1000000) return '$' + (val / 1000000).toFixed(2) + 'M';
                                    if (val >= 1000) return '$' + (val / 1000).toFixed(1) + 'k';
                                    return '$' + val.toLocaleString();
                                },
                                footer: () => 'Click to view details →'
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            border: { display: false },
                            ticks: { color: '#94A3B8', font: { size: 11.5, family: 'inherit' }, maxRotation: 0, padding: 6 }
                        },
                        y: {
                            position: 'left',
                            grid: { color: 'rgba(241, 245, 249, 0.8)', lineWidth: 1 },
                            border: { display: false, dash: [4, 4] },
                            ticks: {
                                color: '#94A3B8',
                                font: { size: 11.5, family: 'inherit' },
                                padding: 10,
                                callback: value => {
                                    if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
                                    if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'k';
                                    return '$' + value;
                                }
                            }
                        }
                    }
                }
            });
        }

        function updateSummary(filterKey) {
            const s = datasets[filterKey].summary;
            const el = (id) => document.getElementById(id);

            if (el('metric-revenue')) el('metric-revenue').textContent = s.revenue;
            if (el('metric-orders')) el('metric-orders').textContent = s.orders;
            if (el('metric-conversion')) el('metric-conversion').textContent = s.conversion;
            if (el('metric-avg')) el('metric-avg').textContent = s.avg;

            setChange(el('insight-revenue-change'), s.revChange, s.positive);
            setChange(el('insight-orders-change'), s.ordChange, s.positive);
            setChange(el('insight-conv-change'), s.convChange, s.positive);
            setChange(el('insight-avg-change'), s.avgChange, s.positive);

            const badge = el('trend-badge');
            const trendVal = el('trend-value');
            if (badge && trendVal) {
                trendVal.textContent = s.growth;
                badge.className = 'analytics-trend-badge ' + (s.positive ? 'positive' : 'negative');
                const arrow = badge.querySelector('polyline');
                if (arrow) arrow.setAttribute('points', s.positive ? '18 15 12 9 6 15' : '6 9 12 15 18 9');
            }

            const subtitles = {
                today: 'Hourly revenue performance — Today',
                week: 'Daily revenue performance — This Week',
                month: 'Monthly revenue performance overview',
                year: 'Annual revenue performance — This Year'
            };
            const sub = document.querySelector('.analytics-subtitle');
            if (sub) sub.textContent = subtitles[filterKey] || subtitles.month;
        }

        function setChange(el, value, positive) {
            if (!el) return;
            el.textContent = value;
            el.className = 'insight-change ' + (positive ? 'positive' : 'negative');
        }

        function setupFilters() {
            const buttons = document.querySelectorAll('.chart-filter-btn');
            buttons.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    buttons.forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    const filter = btn.dataset.filter;
                    initChart(filter);
                    updateSummary(filter);
                });
            });
        }

        // Initialize
        initChart('month');
        updateSummary('month');
        setupFilters();
    }
});
