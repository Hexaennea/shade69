import { useState, useEffect, useCallback } from "react";
import "./styles.css";
import { sbFetch, C, toMonthKey, toMonthLabel } from "./supabase.js";
import Dashboard from "./Dashboard.jsx";
import Detail from "./Detail.jsx";

export default function App() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoices, projects, customers, emps, allPetty, allSalaries, allReceivedPayments] = await Promise.all([
        sbFetch("invoice", `select=*&order=${C.inv_date}.desc`),
        sbFetch("project", `select=*`),
        sbFetch("customer", `select=*`),
        sbFetch("employee", `select=*`),
        sbFetch("petty_cash", `select=*`),
        sbFetch("salary", `select=*`),
        sbFetch("received_payments", `select=*`),
      ]);

      // ── STEP 1: Build custMap ──────────────────────────────────────────
      const custMap = {};
      customers.forEach(c => {
        const id = c[C.cust_id];
        const nm = c[C.cust_name];
        if (id != null) custMap[String(id).trim()] = String(nm || "").trim() || "—";
      });

      // ── STEP 2: Build projMap ──────────────────────────────────────────
      const projMap = {};
      projects.forEach(p => {
        if (p[C.proj_id] == null) return;

        const key = String(p[C.proj_id]).trim();
        const custIdVal = p[C.proj_customer] != null
          ? String(p[C.proj_customer]).trim()
          : null;
        const custName = custIdVal
          ? (custMap[custIdVal] || null)
          : null;

        if (!projMap[key]) {
          projMap[key] = { name: p[C.proj_name] || "—", customers: [] };
        }
        if (p[C.proj_name] && projMap[key].name === "—") {
          projMap[key].name = String(p[C.proj_name]).trim();
        }
        if (custName && !projMap[key].customers.includes(custName)) {
          projMap[key].customers.push(custName);
        }
      });

      // ── STEP 3: Group received payments by invoice ID ──────────────────────
      const paymentsByInvoice = {};
      allReceivedPayments.forEach(payment => {
        const invId = payment[C.recv_invoice_id];
        if (invId) {
          if (!paymentsByInvoice[invId]) paymentsByInvoice[invId] = [];
          paymentsByInvoice[invId].push(payment);
        }
      });

      // ── STEP 4: Annotate invoices with received payments ──────────────────────
      const annotated = invoices.map(inv => {
        const projId = inv[C.inv_project_id] != null
          ? String(inv[C.inv_project_id]).trim()
          : null;
        const proj = projId ? (projMap[projId] || {}) : {};
        const custList = proj.customers && proj.customers.length
          ? proj.customers.join(", ")
          : "—";

        const invId = inv[C.inv_id];
        const payments = paymentsByInvoice[invId] || [];
        const totalReceived = payments.reduce((sum, p) => sum + Number(p[C.recv_amount] || 0), 0);

        return {
          ...inv,
          _proj: proj.name || "—",
          _cust: custList,
          _payments: payments,
          _totalReceived: totalReceived
        };
      });

      // group invoices by month
      const byMonth = {};
      annotated.forEach(inv => {
        const k = toMonthKey(inv[C.inv_date]);
        if (!k) return;
        if (!byMonth[k]) byMonth[k] = [];
        byMonth[k].push(inv);
      });

      // group petty cash by month using payment_date
      const pettyByMonth = {};
      allPetty.forEach(r => {
        let monthKey = null;

        if (r[C.petty_payment_date]) {
          monthKey = toMonthKey(r[C.petty_payment_date]);
        } else if (r[C.petty_month]) {
          monthKey = r[C.petty_month];
        }

        if (!monthKey) return;
        if (!pettyByMonth[monthKey]) pettyByMonth[monthKey] = [];
        pettyByMonth[monthKey].push(r);
      });

      // group salaries by month
      const salaryByMonth = {};
      allSalaries.forEach(r => {
        const k = toMonthKey(r[C.sal_date]);
        if (!k) return;
        if (!salaryByMonth[k]) salaryByMonth[k] = [];
        salaryByMonth[k].push(r);
      });

      const monthKeys = new Set([
        ...Object.keys(byMonth),
        ...Object.keys(pettyByMonth),
        ...Object.keys(salaryByMonth),
      ]);

      // build month rows
      const monthRows = Array.from(monthKeys)
        .sort((a, b) => b.localeCompare(a))
        .map(key => {
          const list = byMonth[key] || [];
          const pettyRows = pettyByMonth[key] || [];
          const salRows = salaryByMonth[key] || [];

          const totalInvoice = list.reduce((s, i) => s + Number(i[C.inv_value] || 0), 0);
          const totalReceived = list.reduce((s, i) => s + Number(i._totalReceived || 0), 0);
          const totalGST = list.reduce((s, i) => s + Number(i[C.inv_gst] || 0), 0);
          const totalTDS = list.reduce((s, i) => s + Number(i[C.inv_tds] || 0), 0);

          // Outstanding = Invoice + GST - TDS - Received
          const totalOutstanding = totalInvoice + totalGST - totalTDS - totalReceived;

          const totalPetty = pettyRows.reduce((s, r) => s + Number(r[C.petty_amount] || 0), 0);
          const totalSalary = salRows.reduce((s, r) => s + Number(r[C.sal_amount] || 0), 0);

          // Total Profit = Total Net Profit - Petty Cash - Salary
          const totalNetProfit = totalInvoice - totalTDS;
          const totalProfit = totalNetProfit - totalPetty - totalSalary;

          const latestDate = list.reduce((d, i) => {
            const nd = new Date(i[C.inv_date]);
            return nd > d ? nd : d;
          }, new Date(0)).toISOString();

          return {
            key, label: toMonthLabel(key),
            invoices: list, pettyRows, salRows,
            totalInvoice, totalReceived, totalOutstanding, totalGST, totalTDS, totalPetty,
            totalSalary, totalNetProfit, totalProfit, latestDate,
          };
        });

      setRows(monthRows);
      setEmployees(emps);

      setSelected(prev => {
        if (!prev) return null;
        const fresh = monthRows.find(r => r.key === prev.key);
        return fresh || prev;
      });

    } catch (err) {
      setError(err.message);
      setRows([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = employees.filter(e => !e[C.emp_disc]).length;

  return (
    <div className="page-shell">
      <div className="sticky-header">
        <header style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div>
            <div className="header-eyebrow">
              <div className="live-dot" />
              <span className="eyebrow-text">Dashboard</span>
            </div>
            <h1 className="header-title">
              {selected ? selected.label : "Work Order Profit"}
            </h1>
            {!loading && !error && !selected && (
              <div className="header-meta">
                <span className="meta-chip">
                  <span className="meta-dot" style={{ background: "var(--purple)" }} />
                  {activeCount} employee{activeCount !== 1 ? "s" : ""}
                </span>
                <span className="meta-chip">
                  <span className="meta-dot" style={{ background: "var(--blue)" }} />
                  {rows.length} month{rows.length !== 1 ? "s" : ""} tracked
                </span>
              </div>
            )}
          </div>
          <div className="header-actions">
            {selected && (
              <button className="back-btn" onClick={() => setSelected(null)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Dashboard
              </button>
            )}
            <button className="refresh-btn" onClick={load} title="Refresh">
              {loading
                ? <span className="spinner" style={{ width: 14, height: 14 }} />
                : "↻"}
            </button>
          </div>
        </header>
      </div>

      {selected
        ? <Detail key={selected.key} row={selected} employees={employees} onBack={() => setSelected(null)} />
        : <Dashboard rows={rows} employees={employees} loading={loading} error={error} onRetry={load} onSelectMonth={setSelected} />
      }
    </div>
  );
}