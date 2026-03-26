import { C } from "./supabase.js";
import { StatCard, SectionHeader, rupee, niceDate } from "./components.jsx";

// Evenly spaced grid columns - updated with Outstanding column
const GRID = {
  invoice: "minmax(40px, 60px) minmax(120px, 1fr) minmax(150px, 1.5fr) minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr)",
  petty: "minmax(40px, 60px) minmax(200px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr)",
  salary: "minmax(40px, 60px) minmax(150px, 1.2fr) minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(100px, 0.8fr) minmax(100px, 0.8fr) minmax(110px, 0.9fr) minmax(110px, 0.9fr) minmax(110px, 0.9fr) minmax(120px, 1fr)",
};

export default function Detail({ row, employees, onBack }) {
  const totalSalary = row.totalSalary;
  const totalGST = (row.invoices || []).reduce((sum, inv) => sum + Number(inv?.[C.inv_gst] || 0), 0);

  // Outstanding = Invoice + GST - TDS - Received
  const outstanding = row.totalInvoice + totalGST - row.totalTDS - row.totalReceived;

  // Invoice Profit (Net Profit) = Invoice Value - TDS
  const totalNetProfit = row.totalInvoice - row.totalTDS;

  // Total Profit = Total Net Profit - Petty Cash - Salary
  const totalProfit = totalNetProfit - (row.totalPetty || 0) - (row.totalSalary || 0);
  const profitColor = totalProfit < 0 ? "var(--red)" : "var(--green)";

  return (
    <div className="detail-page fade-in">

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

      {/* ── Summary cards (5 cards) ── */}
      <div className="cards-grid" style={{ marginBottom: 36 }}>
        <StatCard label="Invoice" value={row.totalInvoice} color="var(--cyan)" delay={0} />
        <StatCard label="Received Payment" value={row.totalReceived} color="var(--green)" delay={.07} />
        <StatCard label="Outstanding" value={outstanding} color="var(--maroon)" delay={.14} />  {/* Changed to maroon */}
        <StatCard label="Net Profit (Inv - TDS)" value={totalNetProfit} color="var(--purple)" delay={.21} />
        <StatCard label="Total Profit" value={totalProfit} color={profitColor} neg={totalProfit < 0} delay={.28} />
      </div>

      {/* ── Invoices Table with Outstanding column ── */}
      <div className="detail-section">
        <SectionHeader title="Invoices" color="var(--cyan)"
          count={`${row.invoices.length} record${row.invoices.length !== 1 ? "s" : ""}`} />
        <div className="table-shell">
          <div className="table-scroll">
            <div className="table-head" style={{ display: "grid", gridTemplateColumns: GRID.invoice, minWidth: 1100 }}>
              {[
                ["#", "var(--text3)"],
                ["Invoice No.", "var(--cyan)"],
                ["Customer", "var(--cyan)"],
                ["Value", "var(--cyan)"],
                ["GST", "var(--blue)"],
                ["TDS", "var(--red)"],
                ["Received", "var(--green)"],
                ["Outstanding", "var(--maroon)"],  // Changed to maroon
                ["Net Profit", "var(--purple)"]
              ].map(([h, c], i) => <div key={i} className="th" style={{ color: c, textAlign: "center", fontSize: "11px", fontWeight: 700 }}>{h}</div>)}
            </div>
            {row.invoices.length === 0
              ? <div className="empty-state" style={{ padding: "28px 20px" }}>
                <div className="empty-title">No invoices this month</div>
              </div>
              : row.invoices.map((inv, i) => {
                const invoiceValue = Number(inv?.[C.inv_value] || 0);
                const gst = Number(inv?.[C.inv_gst] || 0);
                const tds = Number(inv?.[C.inv_tds] || 0);
                const received = Number(inv._totalReceived || 0);

                // Outstanding = Invoice + GST - TDS - Received
                const outstandingAmount = invoiceValue + gst - tds - received;
                // Net Profit = Invoice Value - TDS
                const netProfit = invoiceValue - tds;

                return (
                  <div key={`${inv[C.inv_id] ?? "inv"}-${i}`} className="table-row fade-up"
                    style={{ gridTemplateColumns: GRID.invoice, minWidth: 1100, animationDelay: `${i * .03}s` }}>
                    <div className="td" style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, fontFamily: "var(--mono)" }}>{i + 1}</div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--blue)", fontWeight: 600 }}>
                      {inv[C.inv_number] || "—"}
                    </div>
                    <div className="td" style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>
                        {inv._cust && inv._cust !== "—" ? inv._cust : "—"}
                      </div>
                    </div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--cyan)", fontWeight: 700 }}>
                      {rupee(invoiceValue)}
                    </div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--text2)" }}>
                      {rupee(gst)}
                    </div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--red)", fontWeight: 600 }}>
                      {rupee(tds)}
                    </div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--green)", fontWeight: 700 }}>
                      {rupee(received)}
                    </div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--maroon)", fontWeight: 700 }}>  {/* Changed to maroon */}
                      {rupee(outstandingAmount)}
                    </div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: netProfit < 0 ? "var(--red)" : "var(--purple)", fontWeight: 800 }}>
                      {rupee(netProfit)}
                    </div>
                  </div>
                );
              })
            }

            {/* Totals footer */}
            {row.invoices.length !== 0 && (
              <div className="table-footer" style={{ gridTemplateColumns: GRID.invoice, minWidth: 1100 }}>
                <div className="footer-label" style={{ textAlign: "center", visibility: "hidden" }}>#</div>
                <div className="footer-label" style={{ textAlign: "center", visibility: "hidden" }}>Inv</div>
                <div className="footer-label" style={{ textAlign: "center" }}>Totals</div>
                <div className="footer-value" style={{ textAlign: "center", color: "var(--cyan)" }}>{rupee(row.totalInvoice)}</div>
                <div className="footer-value" style={{ textAlign: "center", color: "var(--blue)" }}>{rupee(totalGST)}</div>
                <div className="footer-value" style={{ textAlign: "center", color: "var(--red)" }}>{rupee(row.totalTDS)}</div>
                <div className="footer-value" style={{ textAlign: "center", color: "var(--green)" }}>{rupee(row.totalReceived)}</div>
                <div className="footer-value" style={{ textAlign: "center", color: "var(--maroon)" }}>{rupee(outstanding)}</div>  {/* Changed to maroon */}
                <div className="footer-value" style={{ textAlign: "center", color: "var(--purple)" }}>{rupee(totalNetProfit)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Petty Cash Table with even spacing ── */}
      <div className="detail-section">
        <SectionHeader title="Petty Cash" color="var(--amber)"
          count={`${row.pettyRows.length} entries · ${rupee(row.totalPetty)}`} />
        <div className="table-shell">
          <div className="table-head" style={{ display: "grid", gridTemplateColumns: GRID.petty, minWidth: "unset" }}>
            {[["#", "var(--text3)"], ["Type", "var(--amber)"], ["Payment Date", "var(--cyan)"], ["Amount", "var(--amber)"]]
              .map(([h, c], i) => (
                <div key={i} className="th" style={{ color: c, textAlign: "center", fontSize: "11px", fontWeight: 700 }}>{h}</div>
              ))}
          </div>
          {row.pettyRows.length === 0
            ? <div style={{ padding: "22px 18px", color: "var(--text3)", fontSize: 13 }}>No petty cash records this month.</div>
            : row.pettyRows.map((r, i) => (
              <div key={`${r[C.petty_id] ?? "petty"}-${i}`} className="table-row fade-up"
                style={{ gridTemplateColumns: GRID.petty, minWidth: "unset", animationDelay: `${i * .025}s` }}>
                <div className="td" style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, fontFamily: "var(--mono)" }}>{i + 1}</div>
                <div className="td" style={{ textAlign: "center", color: "var(--text)", fontSize: 13, fontWeight: 500 }}>
                  {r[C.petty_type] || "—"}
                </div>
                <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--cyan)", fontWeight: 500 }}>
                  {niceDate(r[C.petty_payment_date] || r[C.petty_created_date])}
                </div>
                <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", color: "var(--amber)", fontWeight: 700, fontSize: 13 }}>
                  {rupee(r[C.petty_amount])}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── Employee Salaries with even spacing ── */}
      <div className="detail-section">
        <SectionHeader title="Employee Salaries" color="var(--purple)"
          count={`${row.salRows.length} entries · ${rupee(totalSalary)}`} />
        <div className="table-shell">
          <div className="table-scroll">
            <div className="table-head" style={{ display: "grid", gridTemplateColumns: GRID.salary, minWidth: 1100 }}>
              {[
                ["#", "var(--text3)"],
                ["Name", "var(--purple)"],
                ["Designation", "var(--purple)"],
                ["Basic", "var(--blue)"],
                ["HRA", "var(--blue)"],
                ["Spl Allow", "var(--amber)"],
                ["Earnings", "var(--green)"],
                ["Deductions", "var(--red)"],
                ["Net Pay", "var(--purple)"],
                ["Payment Date", "var(--cyan)"]
              ].map(([h, c], i) => (
                <div key={i} className="th" style={{ color: c, textAlign: "center", fontSize: "11px", fontWeight: 700 }}>{h}</div>
              ))}
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
                  <div key={`${sRow[C.sal_id] ?? "sal"}-${i}`} className="table-row fade-up"
                    style={{ gridTemplateColumns: GRID.salary, minWidth: 1100, animationDelay: `${i * .03}s` }}>
                    <div className="td" style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, fontFamily: "var(--mono)" }}>{i + 1}</div>
                    <div className="td" style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>
                        {emp[C.emp_name] || sRow[C.sal_employee] || "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{emp[C.emp_location] || ""}</div>
                    </div>
                    <div className="td" style={{ textAlign: "center", fontSize: 12, color: "var(--text2)" }}>{emp[C.emp_desig] || "—"}</div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--blue)", fontWeight: 500 }}>
                      {rupee(sRow[C.sal_basic])}
                    </div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--blue)", fontWeight: 500 }}>
                      {rupee(sRow[C.sal_hra])}
                    </div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--amber)", fontWeight: 500 }}>
                      {rupee(sRow[C.sal_special])}
                    </div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--green)", fontWeight: 700 }}>
                      {rupee(sRow[C.sal_total_earn])}
                    </div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--red)", fontWeight: 700 }}>
                      {rupee(sRow[C.sal_total_deduct])}
                    </div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--purple)", fontWeight: 700 }}>
                      {rupee(sRow[C.sal_net_pay] || sRow[C.sal_amount])}
                    </div>
                    <div className="td" style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--cyan)", fontWeight: 500 }}>
                      {niceDate(sRow[C.sal_date])}
                    </div>
                  </div>
                );
              })
            }
            <div className="table-footer" style={{ gridTemplateColumns: "1fr 130px", minWidth: "unset" }}>
              <div className="footer-label" style={{ textAlign: "center" }}>Total Salary Outflow</div>
              <div className="footer-value" style={{ textAlign: "center", color: "var(--purple)", fontSize: 14, fontWeight: 700 }}>{rupee(totalSalary)}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}