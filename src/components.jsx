// ─── Shared UI Components ────────────────────────────────────────────────────

export const rupee = (n) =>
  (n == null || n === "") ? "—" :
    "₹" + Math.abs(Number(n) || 0).toLocaleString("en-IN");

export const niceDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
export function StatCard({ label, value, color = "var(--cyan)", neg = false, count = false, delay = 0 }) {
  return (
    <div
      className="stat-card fade-up"
      style={{ "--card-color": color, animationDelay: `${delay}s` }}
    >
      <div className="card-label">{label}</div>
      <div className={`card-value${neg ? " negative" : ""}`}>
        {count ? value : (neg ? "−" : "") + rupee(value)}
      </div>
      <div className="card-bar" />
    </div>
  );
}

// ─── Skeleton Rows ────────────────────────────────────────────────────────────
export function SkeletonRows({ cols = 7, rows = 5 }) {
  const widths = [55, 75, 50, 62, 52, 52, 60];
  return Array.from({ length: rows }).map((_, i) => (
    <div key={i} className="table-row" style={{ gridTemplateColumns: "140px 1fr 106px 134px 118px 118px 128px", minWidth: 920 }}>
      {Array.from({ length: cols }).map((_, j) => (
        <div key={j} className="td">
          <div
            className="skeleton"
            style={{ width: `${widths[j % widths.length]}%`, animationDelay: `${(i + j) * .05}s` }}
          />
        </div>
      ))}
    </div>
  ));
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, color, count }) {
  return (
    <div className="section-header">
      <div className="section-accent" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
      <span className="section-title" style={{ color }}>{title}</span>
      {count !== undefined && <span className="section-count">{count}</span>}
    </div>
  );
}