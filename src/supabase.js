// ─── Supabase Config ─────────────────────────────────────────────────────────
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// ─── Column Map — edit ONLY values here if your columns differ ───────────────
export const C = {
  // ── invoice table ──────────────────────────────────────────────────
  inv_id:         "id",
  inv_number:     "invoice_number",
  inv_value:      "invoice_value",
  inv_gst:        "gst",
  inv_tds:        "tds",
  inv_date:       "created_date",
  inv_project_id: "project_id",         // FK → project.project_id

  // ── project table ──────────────────────────────────────────────────
  proj_id:        "project_id",
  proj_name:      "project_name",
  proj_customer:  "customer_id",        // Supabase column stays "customer_id", sheet col is "Customer"

  // ── customer table ─────────────────────────────────────────────────
  cust_id:        "customer_id",        // sheet "ID" → COLUMN_OVERRIDES maps to customer_id
  cust_name:      "name",

  // ── employee table ─────────────────────────────────────────────────
  emp_id:         "employee_id",        // sheet "ID" → COLUMN_OVERRIDES maps to employee_id
  emp_name:       "name",
  emp_salary:     "monthly_salary",
  emp_basic:      "basic",
  emp_hra:        "hra",
  emp_desig:      "desgination",        // typo preserved from your schema
  emp_location:   "location",
  emp_disc:       "discontinued",
  emp_created_by: "created_by",
  emp_created_at: "created_date",

  // ── petty_cash table ───────────────────────────────────────────────
  petty_month:    "month",
  petty_type:     "payment_type",
  petty_amount:   "paid_amount",
};

// ─── Fetch helper ─────────────────────────────────────────────────────────────
export async function sbFetch(table, query = "") {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env");
  }
  const headers = {
    "apikey":        SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Accept":        "application/json",
    "Content-Type":  "application/json",
  };
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
  } catch {
    throw new Error("Network error — cannot reach Supabase.");
  }
  const text = await res.text();
  if (!res.ok) {
    if (text.trim().startsWith("<")) throw new Error("Wrong Supabase URL — received HTML. Check VITE_SUPABASE_URL.");
    let msg = `Failed to load "${table}" (HTTP ${res.status})`;
    try { const j = JSON.parse(text); msg = j.message || j.error || j.hint || msg; } catch {}
    throw new Error(msg);
  }
  try { return JSON.parse(text); }
  catch { throw new Error(`"${table}" returned unexpected data — check RLS policies.`); }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
export const toMonthKey = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const toMonthLabel = (k) => {
  if (!k) return "—";
  const [y, m] = k.split("-");
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1]} ${y}`;
};