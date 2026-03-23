import { C } from "./supabase.js";
import { StatCard, SkeletonRows, SectionHeader, rupee, niceDate } from "./components.jsx";

// ─── Column layout ────────────────────────────────────────────────────────────
const MAIN_GRID = "140px 1fr 106px 134px 118px 118px 128px";

const COL_HEADERS = [
  ["Month",        "var(--cyan)"  ],
  ["Invoice",      "var(--cyan)"  ],
  ["TDS",          "var(--red)"   ],
  ["Payment Date", "var(--blue)"  ],
  ["Petty Cash",   "var(--amber)" ],
  ["Salary",       "var(--purple)"],
  ["Total Profit", "var(--green)" ],
];

export default function Dashboard({ rows, employees, loading, error, onRetry, onSelectMonth }) {

  const T = rows.reduce((a, m) => ({
    inv:    a.inv    + m.totalInvoice,
    tds:    a.tds    + m.totalTDS,
    petty:  a.petty  + m.totalPetty,
    sal:    a.sal    + m.totalSalary,
    profit: a.profit + m.totalProfit,
  }), { inv: 0, tds: 0, petty: 0, sal: 0, profit: 0 });

  const activeCount = employees.filter(e => !e[C.emp_disc]).length;

  return (
    <>
      {/* ── Error banner ── */}
      {error && (
        <div className="error-banner fade-up">
          <div className="error-icon">⚠️</div>
          <div>
            <div className="error-title">Could not load data</div>
            <div className="error-msg">{error}</div>
            <button className="retry-btn" onClick={onRetry}>Try Again</button>
          </div>
        </div>
      )}

      {/* ── Summary cards ── */}
      {!error && (
        <div className="cards-grid">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="stat-card" style={{ minHeight: 106 }}>
                  <div className="skeleton" style={{ width: "48%", marginBottom: 14 }} />
                  <div className="skeleton" style={{ width: "72%" }} />
                </div>
              ))
            : <>
                <StatCard label="Total Invoice"    value={T.inv}    color="var(--cyan)"   delay={0}   />
                <StatCard label="Total TDS"        value={T.tds}    color="var(--red)"    delay={.07} />
                <StatCard label="Total Petty Cash" value={T.petty}  color="var(--amber)"  delay={.14} />
                <StatCard label="Salary Outflow"   value={T.sal}    color="var(--purple)" delay={.21} />
                <StatCard label="Total Profit"     value={T.profit}
                  color={T.profit < 0 ? "var(--red)" : "var(--green)"}
                  neg={T.profit < 0} delay={.28} />
              </>
          }
        </div>
      )}

      {/* ── Monthly table ── */}
      {!error && (
        <div className="table-shell fade-up" style={{ animationDelay: ".22s" }}>

          {/* caption bar */}
          <div className="table-caption">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="live-dot" style={{ background: "var(--blue)", boxShadow: "0 0 8px var(--blue)" }} />
              <span className="table-caption-title">Monthly Summary</span>
            </div>
            {!loading && rows.length > 0 && (
              <span style={{ fontSize: 11, color: "var(--text3)" }}>
                {rows.length} month{rows.length !== 1 ? "s" : ""} · {activeCount} active employee{activeCount !== 1 ? "s" : ""}
              </span>
            )}
            <div className="table-caption-formula" style={{ marginLeft: "auto" }}>
              Profit = Invoice − TDS − Petty − Salary
            </div>
          </div>

          <div className="table-scroll">
            {/* header row */}
            <div className="table-head" style={{ gridTemplateColumns: MAIN_GRID, minWidth: 920 }}>
              {COL_HEADERS.map(([label, color], i) => (
                <div key={i} className="th" style={{ color }}>{label}</div>
              ))}
            </div>

            {/* data rows */}
            {loading
              ? <SkeletonRows cols={7} rows={5} />
              : rows.length === 0
                ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <div className="empty-title">No invoice data found</div>
                    <div className="empty-sub">Check RLS policies · column names in supabase.js</div>
                  </div>
                )
                : rows.map((m, i) => (
                  <div
                    key={m.key}
                    className="table-row clickable fade-up"
                    style={{ gridTemplateColumns: MAIN_GRID, minWidth: 920, animationDelay: `${i * .05}s` }}
                    onClick={() => onSelectMonth(m)}
                  >
                    <div className="td">
                      <span className="month-badge">
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                        {m.label}
                      </span>
                    </div>
                    <div className="td" style={{ fontFamily: "var(--mono)", color: "var(--cyan)", fontWeight: 600 }}>
                      {rupee(m.totalInvoice)}
                    </div>
                    <div className="td" style={{ fontFamily: "var(--mono)", color: "var(--red)" }}>
                      {rupee(m.totalTDS)}
                    </div>
                    <div className="td" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--blue)" }}>
                      {niceDate(m.latestDate)}
                    </div>
                    <div className="td" style={{ fontFamily: "var(--mono)", color: "var(--amber)", fontWeight: 600 }}>
                      {rupee(m.totalPetty)}
                    </div>
                    <div className="td" style={{ fontFamily: "var(--mono)", color: "var(--purple)", fontWeight: 600 }}>
                      {rupee(m.totalSalary)}
                    </div>
                    <div className="td" style={{
                      fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14,
                      color: m.totalProfit < 0 ? "var(--red)" : "var(--green)",
                    }}>
                      {m.totalProfit < 0 ? "−" : ""}{rupee(m.totalProfit)}
                    </div>
                  </div>
                ))
            }

            {/* grand totals footer */}
            {!loading && rows.length > 0 && (
              <div className="table-footer" style={{ gridTemplateColumns: MAIN_GRID, minWidth: 920 }}>
                <div className="footer-label">Grand Total</div>
                <div className="footer-value" style={{ color: "var(--cyan)" }}>{rupee(T.inv)}</div>
                <div className="footer-value" style={{ color: "var(--red)" }}>{rupee(T.tds)}</div>
                <div className="footer-value" style={{ color: "var(--text3)" }}>—</div>
                <div className="footer-value" style={{ color: "var(--amber)" }}>{rupee(T.petty)}</div>
                <div className="footer-value" style={{ color: "var(--purple)" }}>{rupee(T.sal)}</div>
                <div className="footer-value" style={{ fontSize: 15, color: T.profit < 0 ? "var(--red)" : "var(--green)" }}>
                  {T.profit < 0 ? "−" : ""}{rupee(T.profit)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="hint-footer">Click any row to drill into details</div>
    </>
  );
}