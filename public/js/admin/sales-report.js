/**
 * sales-report.js — URBANTIQ Admin Sales Analytics
 * Handles data fetching, filtering, and exporting (PDF/Excel).
 */

document.addEventListener("DOMContentLoaded", () => {
  const filterForm = document.getElementById("reportFilterForm");
  const reportBody = document.getElementById("salesReportBody");
  const exportPdfBtn = document.getElementById("exportPdfBtn");

  // Summary Card Els
  const statSales = document.getElementById("statOverallSales");
  const statOrders = document.getElementById("statTotalOrders");
  const statDiscounts = document.getElementById("statTotalDiscounts");

  let currentReportData = [];

  // ============================================================
  //  1. DATA FETCHING
  // ============================================================
  async function fetchReport(params = "") {
    try {
      // Clear current view
      reportBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Generating report...</td></tr>`;

      const response = await fetch(`/api/admin/sales-report-data?${params}`);
      const data = await response.json();

      if (!data.success) throw new Error(data.message);

      currentReportData = data.report;
      renderStats(data.stats);
      renderTable(data.report);

    } catch (error) {
      console.error("Report Fetch Error:", error);
      reportBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Error: ${error.message}</td></tr>`;
    }
  }

  function renderStats(stats) {
    statSales.textContent = `₹${stats.totalSales.toLocaleString("en-IN")}`;
    statOrders.textContent = stats.totalOrders.toLocaleString("en-IN");
    statDiscounts.textContent = `₹${stats.totalDiscount.toLocaleString("en-IN")}`;
  }

  function renderTable(report) {
    if (!report || report.length === 0) {
      reportBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No sales found for this range</td></tr>`;
      return;
    }

    reportBody.innerHTML = report.map(row => {
      const date = new Date(row._id).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      });
      return `
        <tr>
          <td>${date}</td>
          <td>${row.orderCount}</td>
          <td class="fw-600">₹${row.grossSales.toLocaleString("en-IN")}</td>
          <td class="text-danger">-₹${row.discounts.toLocaleString("en-IN")}</td>
          <td class="fw-600 text-success">₹${row.netSales.toLocaleString("en-IN")}</td>
        </tr>
      `;
    }).join("");
  }

  // ============================================================
  //  2. FILTERING
  // ============================================================
  filterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const period = document.getElementById("period").value;

    const params = new URLSearchParams();
    if (period) params.append("period", period);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    fetchReport(params.toString());
  });

  // Handle Period dropdown logic (disable dates if pre-defined period is selected)
  document.getElementById("period").addEventListener("change", function() {
    const isCustom = this.value === "";
    document.getElementById("startDate").disabled = !isCustom;
    document.getElementById("endDate").disabled = !isCustom;
    if (!isCustom) {
       document.getElementById("startDate").value = "";
       document.getElementById("endDate").value = "";
    }
  });

  // ============================================================
  //  3. EXPORT LOGIC
  // ============================================================

  // PDF EXPORT
  exportPdfBtn.addEventListener("click", () => {
    if (currentReportData.length === 0) return alert("Nothing to export");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.text("URBANTIQ Sales Report", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    // Stats
    doc.setTextColor(0);
    doc.text(`Total Sales: ${statSales.textContent}`, 14, 40);
    doc.text(`Total Orders: ${statOrders.textContent}`, 14, 46);
    doc.text(`Total Discounts: ${statDiscounts.textContent}`, 14, 52);

    const tableColumn = ["Date", "Orders", "Gross Sales", "Discounts", "Net Sales"];
    const tableRows = [];

    currentReportData.forEach(row => {
      tableRows.push([
        row._id,
        row.orderCount,
        `INR ${row.grossSales}`,
        `INR ${row.discounts}`,
        `INR ${row.netSales}`
      ]);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: 'grid',
      headStyles: { fillColor: [17, 24, 39] } // Match admin dark theme
    });

    doc.save(`URBANTIQ_Sales_Report_${Date.now()}.pdf`);
  });

  // Initial Fetch
  fetchReport("period=Monthly");

  // Auth Sync (Generic for Admin topbars)
  fetchAdminProfile();
});

async function fetchAdminProfile() {
    try {
        const res = await fetch("/api/admin/profile");
        const data = await res.json();
        if (data.success && data.admin) {
            const admin = data.admin;
            const fullName = `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email;
            document.querySelectorAll(".topbar-user-name").forEach(el => el.textContent = fullName);
            const initials = fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
            document.querySelectorAll(".topbar-user-avatar, .sidebar-user-avatar").forEach(el => el.textContent = initials);
            document.querySelectorAll(".sidebar-user-name").forEach(el => el.textContent = fullName);
        }
    } catch (_) {}
}
