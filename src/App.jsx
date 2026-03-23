import { useState, useEffect, useCallback } from "react";
import "./styles.css";
import { sbFetch, C, toMonthKey, toMonthLabel } from "./supabase.js";
import Dashboard from "./Dashboard.jsx";
import Detail    from "./Detail.jsx";

export default function App() {
  const [rows,      setRows]      = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [selected,  setSelected]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoices, projects, customers, emps, allPetty] = await Promise.all([
        sbFetch("invoice",    `select=*&order=${C.inv_date}.desc`),
        sbFetch("project",    `select=*`),
        sbFetch("customer",   `select=*`),
        sbFetch("employee",   `select=*`),
        sbFetch("petty_cash", `select=*`),
      ]);

      // ── STEP 1: Build custMap ──────────────────────────────────────────
      // customer table columns: customer_id (from sheet "ID"), name
      // custMap: { "C001": "Dhivya", "C002": "Siddharth", ... }
      const custMap = {};
      customers.forEach(c => {
        const id = c[C.cust_id];   // C.cust_id = "customer_id"
        const nm = c[C.cust_name]; // C.cust_name = "name"
        if (id != null) custMap[String(id).trim()] = String(nm || "").trim() || "—";
      });

      // ── STEP 2: Build projMap ──────────────────────────────────────────
      // project table columns: project_id (sheet "ID" → project_id),
      //                        project_name (sheet "Project name" → project_name),
      //                        customer_id (sheet "Customer" → COLUMN_OVERRIDES → customer_id)
      //
      // Flow: project.customer_id → custMap lookup → customer name
      //       "C001"              → custMap["C001"] → "Dhivya"
      const projMap = {};
      projects.forEach(p => {
        if (p[C.proj_id] == null) return;

        const key      = String(p[C.proj_id]).trim();          // project_id
        const custIdVal = p[C.proj_customer] != null            // "customer" column value
          ? String(p[C.proj_customer]).trim()
          : null;
        const custName  = custIdVal                             // look up name in custMap
          ? (custMap[custIdVal] || null)                        // null if not found → skip
          : null;

        if (!projMap[key]) {
          projMap[key] = { name: p[C.proj_name] || "—", customers: [] };
        }
        if (p[C.proj_name] && projMap[key].name === "—") {
          projMap[key].name = String(p[C.proj_name]).trim();
        }
        // add unique customer names only
        if (custName && !projMap[key].customers.includes(custName)) {
          projMap[key].customers.push(custName);
        }
      });

      // ── STEP 3: Annotate invoices ──────────────────────────────────────
      // Flow: invoice.project_id → projMap → customers[] joined as string
      const annotated = invoices.map(inv => {
        const projId   = inv[C.inv_project_id] != null
          ? String(inv[C.inv_project_id]).trim()
          : null;
        const proj     = projId ? (projMap[projId] || {}) : {};
        const custList = proj.customers && proj.customers.length
          ? proj.customers.join(", ")
          : "—";
        return { ...inv, _proj: proj.name || "—", _cust: custList };
      });
      // group invoices by month
      const byMonth = {};
      annotated.forEach(inv => {
        const k = toMonthKey(inv[C.inv_date]);
        if (!k) return;
        if (!byMonth[k]) byMonth[k] = [];
        byMonth[k].push(inv);
      });

      // group petty cash by month
      const pettyByMonth = {};
      allPetty.forEach(r => {
        const k = r[C.petty_month];
        if (!k) return;
        if (!pettyByMonth[k]) pettyByMonth[k] = [];
        pettyByMonth[k].push(r);
      });

      // active employees salary total
      const activeEmps = emps.filter(e => !e[C.emp_disc]);
      const monthlySal = activeEmps.reduce((s, e) => s + Number(e[C.emp_salary] || 0), 0);

      // build month rows
      const monthRows = Object.keys(byMonth)
        .sort((a, b) => b.localeCompare(a))
        .map(key => {
          const list         = byMonth[key];
          const pettyRows    = pettyByMonth[key] || [];
          const totalInvoice = list.reduce((s, i) => s + Number(i[C.inv_value]        || 0), 0);
          const totalTDS     = list.reduce((s, i) => s + Number(i[C.inv_tds]          || 0), 0);
          const totalPetty   = pettyRows.reduce((s, r) => s + Number(r[C.petty_amount] || 0), 0);
          const totalSalary  = monthlySal;
          const totalProfit  = totalInvoice - totalTDS - totalPetty - totalSalary;
          const latestDate   = list.reduce((d, i) => {
            const nd = new Date(i[C.inv_date]);
            return nd > d ? nd : d;
          }, new Date(0)).toISOString();
          return {
            key, label: toMonthLabel(key),
            invoices: list, pettyRows,
            totalInvoice, totalTDS, totalPetty,
            totalSalary, totalProfit, latestDate,
          };
        });

      setRows(monthRows);
      setEmployees(emps);

      // If a month is currently selected, refresh it from the new data
      // so the Detail page updates immediately without navigating away
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
      <header style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 36, gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <div className="header-eyebrow">
            <div className="live-dot" />
            <span className="eyebrow-text">Live · Supabase</span>
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {selected && (
            <button className="back-btn" onClick={() => setSelected(null)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
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

      {selected
        ? <Detail key={selected.key} row={selected} employees={employees} onBack={() => setSelected(null)} />
        : <Dashboard rows={rows} employees={employees} loading={loading} error={error} onRetry={load} onSelectMonth={setSelected} />
      }
    </div>
  );
}