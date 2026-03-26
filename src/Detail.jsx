import { C } from "./supabase.js";
import { StatCard, SectionHeader, rupee, niceDate } from "./components.jsx";

const GRID = {
  invoice: "36px 130px 1fr 130px 100px 100px",
  petty: "36px 1fr 130px",
  salary: "36px 1fr 140px 80px 80px 100px 110px 110px 110px",
};

export default function Detail({ row, employees, onBack }) {
  const totalSalary = row.totalSalary;
  const profit = row.totalProfit;
  const profitColor = profit < 0 ? "var(--red)" : "var(--green)";

  return (
    <div className="slide-right">

      {/* ── Header ── */}
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <div className="detail-title-block">
          <div className="detail-eyebrow">Monthly Breakdown</div>
          <div className="detail-title"><span>{row.label}</span></div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="cards-grid" style={{ marginBottom: 36 }}>
        <StatCard label="Invoice" value={row.totalInvoice} color="var(--cyan)" delay={0} />
        <StatCard label="TDS" value={row.totalTDS} color="var(--red)" delay={.07} />
        <StatCard label="Petty Cash" value={row.totalPetty} color="var(--amber)" delay={.14} />
        <StatCard label="Salary" value={totalSalary} color="var(--purple)" delay={.21} />
        <StatCard label="Net Profit" value={profit} color={profitColor} neg={profit < 0} delay={.28} />
      </div>

      {/* ── Invoices ── */}
      <div className="detail-section">
        <SectionHeader title="Invoices" color="var(--cyan)"
          count={`${row.invoices.length} record${row.invoices.length !== 1 ? "s" : ""}`} />
        <div className="table-shell">
          <div className="table-scroll">
            <div className="table-head" style={{ display: "grid", gridTemplateColumns: GRID.invoice, minWidth: 740 }}>
              {[["#", "var(--text3)"], ["Invoice No.", "var(--cyan)"], ["Customer", "var(--cyan)"],
              ["Value", "var(--cyan)"], ["GST", "var(--blue)"], ["TDS", "var(--red)"]
              ].map(([h, c], i) => <div key={i} className="th" style={{ color: c }}>{h}</div>)}
            </div>
            {row.invoices.length === 0
              ? <div className="empty-state" style={{ padding: "28px 20px" }}>
                <div className="empty-title">No invoices this month</div>
              </div>
              : row.invoices.map((inv, i) => (
                <div key={inv[C.inv_id] ?? i} className="table-row fade-up"
                  style={{ gridTemplateColumns: GRID.invoice, minWidth: 740, animationDelay: `${i * .03}s` }}>
                  <div className="td" style={{ color: "var(--text3)", fontSize: 12, fontFamily: "var(--mono)" }}>{i + 1}</div>
                  <div className="td" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--blue)", fontWeight: 500 }}>
                    {inv[C.inv_number] || "—"}
                  </div>
                  <div className="td">
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>
                      {inv._cust && inv._cust !== "—" ? inv._cust : "—"}
                    </div>
                  </div>
                  <div className="td" style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--cyan)", fontWeight: 600 }}>
                    {rupee(inv[C.inv_value])}
                  </div>
                  <div className="td" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>
                    {rupee(inv[C.inv_gst])}
                  </div>
                  <div className="td" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--red)" }}>
                    {rupee(inv[C.inv_tds])}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* ── Petty Cash ── */}
      <div className="detail-section">
        <SectionHeader title="Petty Cash" color="var(--amber)"
          count={`${row.pettyRows.length} entries · ${rupee(row.totalPetty)}`} />
        <div className="table-shell">
          <div className="table-head" style={{ display: "grid", gridTemplateColumns: GRID.petty, minWidth: "unset" }}>
            {[["#", "var(--text3)"], ["Payment Type", "var(--amber)"], ["Amount", "var(--amber)"]].map(([h, c], i) => (
              <div key={i} className="th" style={{ color: c }}>{h}</div>
            ))}
          </div>
          {row.pettyRows.length === 0
            ? <div style={{ padding: "22px 18px", color: "var(--text3)", fontSize: 13 }}>No petty cash records this month.</div>
            : row.pettyRows.map((r, i) => (
              <div key={r.id ?? i} className="table-row fade-up"
                style={{ gridTemplateColumns: GRID.petty, minWidth: "unset", animationDelay: `${i * .025}s` }}>
                <div className="td" style={{ color: "var(--text3)", fontSize: 12, fontFamily: "var(--mono)" }}>{i + 1}</div>
                <div className="td" style={{ color: "var(--text)", fontSize: 13 }}>{r[C.petty_type]}</div>
                <div className="td" style={{ fontFamily: "var(--mono)", color: "var(--amber)", fontWeight: 600 }}>
                  {rupee(r[C.petty_amount])}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── Employee Salaries ── */}
      <div className="detail-section">
        <SectionHeader title="Employee Salaries" color="var(--purple)"
          count={`${row.salRows.length} entries · ${rupee(totalSalary)}`} />
        <div className="table-shell">
          <div className="table-scroll">
            <div className="table-head" style={{ display: "grid", gridTemplateColumns: GRID.salary, minWidth: 920 }}>
              {[["#", "var(--text3)"], ["Name", "var(--purple)"], ["Designation", "var(--purple)"],
              ["Basic", "var(--blue)"], ["HRA", "var(--blue)"], ["Spl Allow", "var(--amber)"],
              ["Earnings", "var(--green)"], ["Deductions", "var(--red)"], ["Net Pay", "var(--purple)"]
              ].map(([h, c], i) => <div key={i} className="th" style={{ color: c }}>{h}</div>)}
            </div>
            {row.salRows.length === 0
              ? <div style={{ padding: "22px 18px", color: "var(--text3)", fontSize: 13 }}>No salary records this month.</div>
              : row.salRows.map((sRow, i) => {
                const empIdentifier = String(sRow[C.sal_employee] || "").trim();
                const emp = employees.find(e =>
                  String(e[C.emp_name]).trim() === empIdentifier ||
                  String(e[C.emp_id]).trim() === empIdentifier
                ) || {};

                return (
                  <div key={sRow[C.sal_id] ?? i} className="table-row fade-up"
                    style={{ gridTemplateColumns: GRID.salary, minWidth: 920, animationDelay: `${i * .03}s` }}>
                    <div className="td" style={{ color: "var(--text3)", fontSize: 12, fontFamily: "var(--mono)" }}>{i + 1}</div>
                    <div className="td">
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>
                        {emp[C.emp_name] || sRow[C.sal_employee] || "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{emp[C.emp_location] || ""}</div>
                    </div>
                    <div className="td" style={{ fontSize: 12, color: "var(--text2)" }}>{emp[C.emp_desig] || "—"}</div>
                    <div className="td" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--blue)" }}>
                      {rupee(sRow[C.sal_basic])}
                    </div>
                    <div className="td" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--blue)" }}>
                      {rupee(sRow[C.sal_hra])}
                    </div>
                    <div className="td" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--amber)" }}>
                      {rupee(sRow[C.sal_special])}
                    </div>
                    <div className="td" style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--green)", fontWeight: 600 }}>
                      {rupee(sRow[C.sal_total_earn])}
                    </div>
                    <div className="td" style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--red)", fontWeight: 600 }}>
                      {rupee(sRow[C.sal_total_deduct])}
                    </div>
                    <div className="td" style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--purple)", fontWeight: 600 }}>
                      {rupee(sRow[C.sal_net_pay] || sRow[C.sal_amount])}
                    </div>
                  </div>
                );
              })
            }
            <div className="table-footer" style={{ gridTemplateColumns: "1fr 130px", minWidth: "unset" }}>
              <div className="footer-label">Total Salary Outflow</div>
              <div className="footer-value" style={{ color: "var(--purple)" }}>{rupee(totalSalary)}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}