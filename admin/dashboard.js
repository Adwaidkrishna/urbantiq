/**
 * URBANTIQ Admin Dashboard — Premium Analytics Chart
 * Chart.js v4 — smooth area chart, gradient fill, glow point, rich tooltip
 */

(function () {
    'use strict';

    /* ─── Dataset per time-filter ─── */
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

    /* ─── Premium gradient — rich indigo → transparent ─── */
    function buildGradient(ctx, chartArea) {
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.28)');   /* indigo-500 */
        gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.00)');
        return gradient;
    }

    /* ─── Chart instance ─── */
    let chart = null;
    let currentGradient = null;
    let gradientCtx = null;
    let gradientArea = null;

    function initChart(filterKey) {
        const canvas = document.getElementById('salesChart');
        if (!canvas) return;
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
                    /* Line */
                    borderColor: '#6366F1',
                    borderWidth: 3,
                    /* Fill with dynamic gradient */
                    fill: true,
                    backgroundColor: function (context) {
                        const chart = context.chart;
                        const { ctx: c, chartArea } = chart;
                        if (!chartArea) return 'transparent';
                        if (
                            !currentGradient ||
                            gradientCtx !== c ||
                            gradientArea !== chartArea
                        ) {
                            currentGradient = buildGradient(c, chartArea);
                            gradientCtx = c;
                            gradientArea = chartArea;
                        }
                        return currentGradient;
                    },
                    /* Smooth curve */
                    tension: 0.45,
                    /* Default points — small, invisible until hover */
                    pointBackgroundColor: '#6366F1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2.5,
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#6366F1',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3,
                    /* Clip so gradient doesn't overflow card */
                    clip: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 700,
                    easing: 'easeInOutCubic'
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
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
                            title: function (items) {
                                return items[0].label;
                            },
                            label: function (item) {
                                const val = item.raw;
                                if (val >= 1000000) return '$' + (val / 1000000).toFixed(2) + 'M';
                                if (val >= 1000) return '$' + (val / 1000).toFixed(1) + 'k';
                                return '$' + val.toLocaleString();
                            },
                            footer: function () {
                                return 'Click to view details →';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: {
                            color: '#94A3B8',
                            font: { size: 11.5, family: 'inherit' },
                            maxRotation: 0,
                            padding: 6
                        }
                    },
                    y: {
                        position: 'left',
                        grid: {
                            color: 'rgba(241, 245, 249, 0.8)',   /* very light slate */
                            lineWidth: 1
                        },
                        border: { display: false, dash: [4, 4] },
                        ticks: {
                            color: '#94A3B8',
                            font: { size: 11.5, family: 'inherit' },
                            padding: 10,
                            callback: function (value) {
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

    /* ─── Update insight strip + trend badge ─── */
    function updateSummary(filterKey) {
        const s = datasets[filterKey].summary;
        const el = (id) => document.getElementById(id);

        /* Insight strip values */
        if (el('metric-revenue')) el('metric-revenue').textContent = s.revenue;
        if (el('metric-orders')) el('metric-orders').textContent = s.orders;
        if (el('metric-conversion')) el('metric-conversion').textContent = s.conversion;
        if (el('metric-avg')) el('metric-avg').textContent = s.avg;

        /* Insight strip change indicators */
        setChange(el('insight-revenue-change'), s.revChange, s.positive);
        setChange(el('insight-orders-change'), s.ordChange, s.positive);
        setChange(el('insight-conv-change'), s.convChange, s.positive);
        setChange(el('insight-avg-change'), s.avgChange, s.positive);

        /* Trend badge */
        const badge = el('trend-badge');
        const trendVal = el('trend-value');
        if (badge && trendVal) {
            trendVal.textContent = s.growth;
            badge.className = 'analytics-trend-badge ' + (s.positive ? 'positive' : 'negative');
            /* Flip arrow SVG direction */
            const arrow = badge.querySelector('polyline');
            if (arrow) {
                arrow.setAttribute('points', s.positive ? '18 15 12 9 6 15' : '6 9 12 15 18 9');
            }
        }

        /* Update subtitle to reflect active period */
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

    /* ─── Filter button handler ─── */
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

    /* ─── Boot ─── */
    document.addEventListener('DOMContentLoaded', function () {
        initChart('month');
        updateSummary('month');
        setupFilters();
    });

})();
