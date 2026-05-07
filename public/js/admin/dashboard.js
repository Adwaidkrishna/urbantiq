/**
 * dashboard.js — URBANTIQ Admin Analytics
 * Fetches real data from /api/admin/dashboard/stats and renders
 * all cards, Chart.js graphs, recent orders table, and low-stock list.
 */

/* ──────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────── */
const fmt = (n) =>
  n >= 1_00_00_000
    ? `₹${(n / 1_00_00_000).toFixed(2)}Cr`
    : n >= 1_00_000
    ? `₹${(n / 1_00_000).toFixed(2)}L`
    : n >= 1_000
    ? `₹${(n / 1_000).toFixed(1)}K`
    : `₹${n.toFixed(2)}`;

const pct = (val) => {
  if (val === null || val === undefined) return { text: "--", positive: true };
  const num = parseFloat(val);
  return { text: `${num > 0 ? "+" : ""}${num}%`, positive: num >= 0 };
};

const statusBadge = (status) => {
  const map = {
    Pending:          { cls: "badge-pending",    label: "Pending" },
    Confirmed:        { cls: "badge-processing", label: "Confirmed" },
    Shipped:          { cls: "badge-processing", label: "Shipped" },
    Delivered:        { cls: "badge-delivered",  label: "Delivered" },
    Cancelled:        { cls: "badge-cancelled",  label: "Cancelled" },
    "Return Requested":{ cls: "badge-low-stock", label: "Return Req." },
    Returned:         { cls: "badge-out-of-stock","label": "Returned" },
  };
  const d = map[status] || { cls: "badge-pending", label: status };
  return `<span class="status-badge ${d.cls}">${d.label}</span>`;
};

/* ──────────────────────────────────────────────
   STAT CARD RENDER
────────────────────────────────────────────── */
function populateCard(elementId, value, growth, prefix = "") {
  const card = document.getElementById(elementId);
  if (!card) return;
  const valEl   = card.querySelector(".stat-card-value");
  const subEl   = card.querySelector(".stat-card-sub");
  if (valEl) valEl.textContent = prefix + value;
  if (subEl && growth !== undefined) {
    const g = pct(growth);
    subEl.textContent = `${g.text} from last month`;
    subEl.className   = `stat-card-sub ${g.positive ? "text-success" : "text-danger"}`;
  }
}

/* ──────────────────────────────────────────────
   INSIGHT STRIP
────────────────────────────────────────────── */
function updateInsightStrip(data, filter) {
  // We aggregate the chosen period's total orders and revenue from chart slices
  const revisions = {
    today:  1,
    week:   7,
    month:  30,
    year:   365,
  };
  const slices = { today: 1, week: 7, month: 30, year: 12 };
  const take = Math.min(slices[filter] || 1, data.chart.revenue.length);
  const revArr = data.chart.revenue.slice(-take);
  const ordArr = data.chart.orders.slice(-take);
  const totalRev = revArr.reduce((a, b) => a + b, 0);
  const totalOrd = ordArr.reduce((a, b) => a + b, 0);
  const avgDay   = take > 0 ? totalRev / (take === 1 ? 1 : take * 30) : 0;
  const conv     = data.stats.totalCustomers > 0 ? ((totalOrd / data.stats.totalCustomers) * 100).toFixed(1) : "0.0";

  const el = (id) => document.getElementById(id);
  if (el("metric-revenue"))   el("metric-revenue").textContent   = fmt(totalRev);
  if (el("metric-orders"))    el("metric-orders").textContent    = totalOrd.toLocaleString("en-IN");
  if (el("metric-conversion"))el("metric-conversion").textContent= conv + "%";
  if (el("metric-avg"))       el("metric-avg").textContent       = fmt(avgDay);
}

/* ──────────────────────────────────────────────
   CHART.JS SETUP
────────────────────────────────────────────── */
let salesChartInstance = null;

function buildChartData(filter, rawLabels, rawRevenue, rawOrders) {
  const take = { today: 1, week: 7, month: 1, year: 12 }[filter] || 12;
  return {
    labels:  rawLabels.slice(-take),
    revenue: rawRevenue.slice(-take),
    orders:  rawOrders.slice(-take),
  };
}

function renderSalesChart(labels, revenue, orders) {
  const ctx = document.getElementById("salesChart");
  if (!ctx) return;

  const gradientRevenue = ctx.getContext("2d").createLinearGradient(0, 0, 0, 340);
  gradientRevenue.addColorStop(0, "rgba(0, 102, 204, 0.25)");
  gradientRevenue.addColorStop(1, "rgba(0, 102, 204, 0.0)");

  if (salesChartInstance) salesChartInstance.destroy();

  salesChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue (₹)",
          data: revenue,
          borderColor: "#0066cc",
          backgroundColor: gradientRevenue,
          fill: true,
          tension: 0.45,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#0066cc",
          yAxisID: "y",
        },
        {
          label: "Orders",
          data: orders,
          borderColor: "#ff9f00",
          backgroundColor: "rgba(255, 159, 0, 0.08)",
          fill: false,
          tension: 0.45,
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#ff9f00",
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            borderRadius: 4,
            useBorderRadius: true,
            color: "#6b7280",
            font: { family: "'Inter', sans-serif", size: 12 },
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: "#1a1a2e",
          titleColor: "#fff",
          bodyColor: "#d1d5db",
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: (ctx) =>
              ctx.datasetIndex === 0
                ? `  Revenue: ${fmt(ctx.raw)}`
                : `  Orders:  ${ctx.raw}`,
          },
        },
      },
      scales: {
        x: {
          grid:  { display: false },
          ticks: { color: "#9ca3af", font: { size: 11 } },
          border: { display: false },
        },
        y: {
          position: "left",
          grid:  { color: "rgba(0,0,0,0.05)", drawBorder: false },
          ticks: {
            color: "#9ca3af",
            font: { size: 11 },
            callback: (v) => fmt(v),
          },
          border: { display: false },
        },
        y1: {
          position: "right",
          grid: { display: false },
          ticks: { color: "#9ca3af", font: { size: 11 } },
          border: { display: false },
        },
      },
    },
  });
}

/* ──────────────────────────────────────────────
   DONUT CHART – Order Status
────────────────────────────────────────────── */
let donutChartInstance = null;

function renderStatusDonut(breakdown) {
  const ctx = document.getElementById("statusDonutChart");
  if (!ctx) return;

  const labels = Object.keys(breakdown);
  const values = Object.values(breakdown);
  const colors = ["#0066cc","#22c55e","#ff9f00","#ef4444","#8b5cf6","#06b6d4","#f59e0b","#64748b"];

  if (donutChartInstance) donutChartInstance.destroy();

  donutChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: "#fff",
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            color: "#6b7280",
            font: { size: 11 },
            padding: 10,
          },
        },
        tooltip: {
          backgroundColor: "#1a1a2e",
          titleColor: "#fff",
          bodyColor: "#d1d5db",
          callbacks: {
            label: (ctx) => `  ${ctx.label}: ${ctx.raw}`,
          },
        },
      },
    },
  });
}

/* ──────────────────────────────────────────────
   PAYMENT SPLIT BAR CHART
────────────────────────────────────────────── */
let paymentChartInstance = null;

function renderPaymentChart(split) {
  const ctx = document.getElementById("paymentSplitChart");
  if (!ctx) return;

  if (paymentChartInstance) paymentChartInstance.destroy();

  paymentChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["COD", "Online", "Wallet"],
      datasets: [{
        label: "Orders",
        data: [split.COD || 0, split.Online || 0, split.Wallet || 0],
        backgroundColor: ["#f59e0b80", "#0066cc80", "#22c55e80"],
        borderColor:     ["#f59e0b",   "#0066cc",   "#22c55e"],
        borderWidth: 1.5,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1a1a2e",
          titleColor: "#fff",
          bodyColor: "#d1d5db",
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#9ca3af", font: { size: 12 } },
          border: { display: false },
        },
        y: {
          grid: { color: "rgba(0,0,0,0.06)" },
          ticks: { color: "#9ca3af", font: { size: 11 }, stepSize: 1 },
          border: { display: false },
          beginAtZero: true,
        },
      },
    },
  });
}

/* ──────────────────────────────────────────────
   TREND BADGE
────────────────────────────────────────────── */
function updateTrendBadge(growthPct) {
  const badge = document.getElementById("trend-badge");
  const val   = document.getElementById("trend-value");
  if (!badge || !val) return;
  const g = pct(growthPct);
  val.textContent   = g.text;
  badge.className   = `analytics-trend-badge ${g.positive ? "positive" : "negative"}`;
}

/* ──────────────────────────────────────────────
   RECENT ORDERS TABLE
────────────────────────────────────────────── */
function renderRecentOrders(orders) {
  const tbody = document.querySelector("#recentOrdersTable tbody");
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center td-secondary py-4">No orders yet</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map((o) => {
    const date = new Date(o.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
    return `
      <tr>
        <td class="fw-600">#${o._id.toString().slice(-6).toUpperCase()}</td>
        <td>${o.user?.name || "—"}</td>
        <td class="td-secondary">${date}</td>
        <td>${statusBadge(o.orderStatus)}</td>
        <td class="fw-600">₹${o.finalAmount?.toLocaleString("en-IN")}</td>
      </tr>`;
  }).join("");
}

/* ──────────────────────────────────────────────
   LOW STOCK TABLE
────────────────────────────────────────────── */
function renderLowStock(items) {
  const tbody = document.querySelector("#lowStockTable tbody");
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center td-secondary py-4">All stocked up!</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const badgeClass = item.stock === 0  ? "badge-out-of-stock"
                    :  item.stock <= 2   ? "badge-cancelled"
                    :                     "badge-low-stock";
    const label = item.stock === 0 ? "Out of Stock" : `${item.stock} left`;
    return `
      <tr>
        <td>
          <div class="fw-600" style="font-size:0.85rem">${item.name}</div>
          <div class="td-secondary" style="font-size:0.75rem">${item.color} · ${item.size}</div>
        </td>
        <td><span class="status-badge ${badgeClass}">${label}</span></td>
      </tr>`;
  }).join("");
}

/* ──────────────────────────────────────────────
   SKELETON TOGGLE
────────────────────────────────────────────── */
function hideSkeleton() {
  document.querySelectorAll(".skeleton").forEach(el => {
    el.classList.remove("skeleton");
  });
  document.querySelectorAll(".dashboard-loading").forEach(el => {
    el.style.display = "none";
  });
  document.querySelectorAll(".dashboard-loaded").forEach(el => {
    el.style.display = "";
  });
}

/* ──────────────────────────────────────────────
   MAIN BOOTSTRAP
────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  let dashData = null;
  let currentFilter = "month";

  /* ── Fetch Stats ── */
  try {
    const res  = await fetch("/api/admin/dashboard/stats");
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    dashData = json;
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    document.getElementById("dashboardError")?.style.setProperty("display", "block");
    return;
  }

  /* ── Populate Stat Cards ── */
  const { stats } = dashData;

  populateCard("cardRevenue",   fmt(stats.totalRevenue),            stats.revenueGrowth);
  populateCard("cardOrders",    stats.totalOrders.toLocaleString("en-IN"),  stats.ordersGrowth);
  populateCard("cardCustomers", stats.totalCustomers.toLocaleString("en-IN"), stats.customersGrowth);
  populateCard("cardProducts",  stats.totalProducts.toLocaleString("en-IN"), null);

  /* ── Charts ── */
  const { labels, revenue, orders } = dashData.chart;
  const chartData = buildChartData(currentFilter, labels, revenue, orders);
  renderSalesChart(chartData.labels, chartData.revenue, chartData.orders);
  renderStatusDonut(dashData.orderStatusBreakdown);
  renderPaymentChart(dashData.paymentSplit);

  /* ── Insight Strip ── */
  updateInsightStrip(dashData, currentFilter);
  updateTrendBadge(stats.revenueGrowth);

  /* ── Tables ── */
  renderRecentOrders(dashData.recentOrders);
  renderLowStock(dashData.lowStock);

  /* ── Remove skeleton shimmer from stat cards ── */
  ["cardRevenue","cardOrders","cardCustomers","cardProducts"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("skeleton");
  });

  /* ── Chart Filter Buttons ── */
  document.querySelectorAll(".chart-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chart-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;

      const cd = buildChartData(currentFilter, labels, revenue, orders);
      renderSalesChart(cd.labels, cd.revenue, cd.orders);
      updateInsightStrip(dashData, currentFilter);
    });
  });

  /* ── Topbar admin name ── */
  try {
    const profileRes  = await fetch("/api/admin/profile");
    const profileData = await profileRes.json();
    if (profileData.success && profileData.admin) {
      const admin = profileData.admin;
      const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.email;
      document.querySelectorAll(".topbar-user-name").forEach(el => el.textContent = fullName);
      const initials = fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      document.querySelectorAll(".topbar-user-avatar, .sidebar-user-avatar").forEach(el => el.textContent = initials);
      document.querySelectorAll(".sidebar-user-name").forEach(el => el.textContent = fullName);
    }
  } catch (_) { /* silently skip */ }
});
