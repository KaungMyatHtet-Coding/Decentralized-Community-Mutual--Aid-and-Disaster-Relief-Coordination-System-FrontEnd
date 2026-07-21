
import { useState } from "react";

// ─── Skeleton Loader Primitives ───────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div
    className={`skeleton-pulse ${className}`}
    style={{
      background: "linear-gradient(90deg, #1e293b 25%, #263348 50%, #1e293b 75%)",
      backgroundSize: "200% 100%",
      borderRadius: "6px",
      animation: "shimmer 1.6s infinite",
    }}
  />
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, color }) => (
  <div style={styles.statCard}>
    <div style={{ ...styles.statIcon, background: color }}>{icon}</div>
    <div>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
    </div>
  </div>
);

const StockBadge = ({ status }) => {
  const colors = {
    "In Stock": { bg: "#052e16", color: "#4ade80", border: "#166534" },
    "Low Stock": { bg: "#431407", color: "#fb923c", border: "#9a3412" },
    "Out of Stock": { bg: "#3b0764", color: "#e879f9", border: "#7e22ce" },
  };
  const style = colors[status] || colors["In Stock"];
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {status}
    </span>
  );
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockStock = {
  id: "STK-00421",
  name: "Emergency Food Ration Pack",
  category: "Food & Nutrition",
  sku: "FNP-2024-ERF",
  status: "Low Stock",
  quantity: 38,
  threshold: 50,
  maxCapacity: 500,
  unitCost: 12.5,
  totalValue: 475.0,
  location: "Warehouse B — Shelf 3C",
  lastUpdated: "May 27, 2026 · 3:41 PM",
  description:
    "High-calorie, ready-to-eat emergency ration packs designed for disaster relief. Each pack contains 3,600 kcal and essential micronutrients for 3-day survival.",
  transactions: [
    { date: "May 27", type: "Dispatched", qty: -20, ref: "AID-1042", by: "Ko Aung" },
    { date: "May 25", type: "Received", qty: +100, ref: "PO-2089", by: "Ma Thida" },
    { date: "May 22", type: "Dispatched", qty: -45, ref: "AID-1031", by: "Ko Aung" },
    { date: "May 18", type: "Adjustment", qty: -3, ref: "ADJ-0091", by: "Admin" },
    { date: "May 14", type: "Received", qty: +200, ref: "PO-2041", by: "Ma Thida" },
  ],
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StockDetailsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading] = useState(false); // toggle to true to preview skeleton
  const stock = mockStock;

  const fillPercent = Math.round((stock.quantity / stock.maxCapacity) * 100);

  return (
    <div style={styles.page}>
      <style>{globalStyles}</style>

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => window.history.back()}>
            ← Back
          </button>
          <div>
            <div style={styles.breadcrumb}>Admin / Store / Stock Details</div>
            {isLoading ? (
              <Skeleton style={{ width: 260, height: 28, marginTop: 6 }} />
            ) : (
              <h1 style={styles.pageTitle}>{stock.name}</h1>
            )}
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.btnOutline}>Export</button>
          <button style={styles.btnOutline}>Adjust Stock</button>
          <button style={styles.btnPrimary}>+ Restock</button>
        </div>
      </div>

      {/* ── Meta Row ── */}
      <div style={styles.metaRow}>
        {isLoading ? (
          <>
            <Skeleton style={{ width: 80, height: 22 }} />
            <Skeleton style={{ width: 120, height: 22 }} />
            <Skeleton style={{ width: 100, height: 22 }} />
          </>
        ) : (
          <>
            <StockBadge status={stock.status} />
            <span style={styles.metaChip}>📦 {stock.id}</span>
            <span style={styles.metaChip}>🗂 {stock.category}</span>
            <span style={styles.metaChip}>🏷 SKU: {stock.sku}</span>
            <span style={styles.metaChip}>🕐 Updated: {stock.lastUpdated}</span>
          </>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div style={styles.statsGrid}>
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Skeleton key={i} style={{ height: 90, borderRadius: 12 }} />
          ))
        ) : (
          <>
            <StatCard label="Current Quantity" value={`${stock.quantity} units`} icon="📦" color="#1d4ed8" />
            <StatCard label="Reorder Threshold" value={`${stock.threshold} units`} icon="⚠️" color="#b45309" />
            <StatCard label="Unit Cost" value={`$${stock.unitCost.toFixed(2)}`} icon="💵" color="#065f46" />
            <StatCard label="Total Value" value={`$${stock.totalValue.toFixed(2)}`} icon="💰" color="#6b21a8" />
          </>
        )}
      </div>

      {/* ── Stock Level Bar ── */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>Stock Level</span>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>
            {stock.quantity} / {stock.maxCapacity} units
          </span>
        </div>
        {isLoading ? (
          <Skeleton style={{ height: 16, borderRadius: 8 }} />
        ) : (
          <>
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${fillPercent}%`,
                  background:
                    fillPercent < 20
                      ? "#ef4444"
                      : fillPercent < 40
                      ? "#f97316"
                      : "#22c55e",
                }}
              />
              {/* Threshold marker */}
              <div
                style={{
                  ...styles.thresholdMarker,
                  left: `${(stock.threshold / stock.maxCapacity) * 100}%`,
                }}
              />
            </div>
            <div style={styles.progressLabels}>
              <span style={{ color: "#64748b", fontSize: 12 }}>0</span>
              <span style={{ color: "#f97316", fontSize: 12 }}>
                ⚠ Threshold ({stock.threshold})
              </span>
              <span style={{ color: "#64748b", fontSize: 12 }}>{stock.maxCapacity}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={styles.tabs}>
        {["overview", "transactions", "settings"].map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "overview" && (
        <div style={styles.twoCol}>
          {/* Details card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Item Details</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>
              {isLoading ? <Skeleton style={{ height: 60 }} /> : stock.description}
            </p>
            <div style={styles.detailGrid}>
              {[
                ["Location", stock.location],
                ["Category", stock.category],
                ["SKU", stock.sku],
                ["Max Capacity", `${stock.maxCapacity} units`],
              ].map(([k, v]) => (
                <div key={k} style={styles.detailRow}>
                  <span style={styles.detailKey}>{k}</span>
                  {isLoading ? (
                    <Skeleton style={{ width: 120, height: 16 }} />
                  ) : (
                    <span style={styles.detailVal}>{v}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity mini */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Recent Activity</h3>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {isLoading
                ? [1, 2, 3].map((i) => (
                    <Skeleton key={i} style={{ height: 48, borderRadius: 8 }} />
                  ))
                : stock.transactions.slice(0, 4).map((tx, i) => (
                    <div key={i} style={styles.txRow}>
                      <div
                        style={{
                          ...styles.txDot,
                          background: tx.qty > 0 ? "#22c55e" : "#f97316",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={styles.txType}>{tx.type}</span>
                        <span style={styles.txRef}> · {tx.ref}</span>
                      </div>
                      <span
                        style={{
                          ...styles.txQty,
                          color: tx.qty > 0 ? "#4ade80" : "#fb923c",
                        }}
                      >
                        {tx.qty > 0 ? "+" : ""}
                        {tx.qty}
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Transaction History</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Date", "Type", "Qty Change", "Reference", "By"].map((h) => (
                  <th key={h} style={styles.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [1, 2, 3, 4].map((i) => (
                    <tr key={i}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <td key={j} style={styles.td}>
                          <Skeleton style={{ height: 16, width: "80%" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : stock.transactions.map((tx, i) => (
                    <tr key={i} style={styles.tableRow}>
                      <td style={styles.td}>{tx.date}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 12,
                            background:
                              tx.type === "Received"
                                ? "#052e16"
                                : tx.type === "Dispatched"
                                ? "#431407"
                                : "#1e293b",
                            color:
                              tx.type === "Received"
                                ? "#4ade80"
                                : tx.type === "Dispatched"
                                ? "#fb923c"
                                : "#94a3b8",
                          }}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          color: tx.qty > 0 ? "#4ade80" : "#fb923c",
                          fontWeight: 600,
                        }}
                      >
                        {tx.qty > 0 ? "+" : ""}
                        {tx.qty}
                      </td>
                      <td style={styles.td}>{tx.ref}</td>
                      <td style={styles.td}>{tx.by}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "settings" && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Stock Settings</h3>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>
            Manage reorder thresholds, location, and item metadata.
          </p>
          <div style={styles.settingsGrid}>
            {[
              { label: "Item Name", placeholder: stock.name },
              { label: "SKU", placeholder: stock.sku },
              { label: "Category", placeholder: stock.category },
              { label: "Storage Location", placeholder: stock.location },
              { label: "Reorder Threshold", placeholder: stock.threshold },
              { label: "Max Capacity", placeholder: stock.maxCapacity },
            ].map(({ label, placeholder }) => (
              <div key={label} style={styles.formGroup}>
                <label style={styles.formLabel}>{label}</label>
                <input
                  style={styles.formInput}
                  defaultValue={placeholder}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            <button style={styles.btnPrimary}>Save Changes</button>
            <button style={styles.btnOutline}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0f1a",
    color: "#e2e8f0",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding: "28px 32px",
    maxWidth: 1200,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 12,
  },
  headerLeft: { display: "flex", alignItems: "flex-start", gap: 16 },
  backBtn: {
    background: "transparent",
    border: "1px solid #1e293b",
    color: "#64748b",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    marginTop: 4,
    transition: "all 0.2s",
  },
  breadcrumb: { fontSize: 12, color: "#475569", marginBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  headerActions: { display: "flex", gap: 8, flexWrap: "wrap" },
  btnPrimary: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "8px 18px",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "background 0.2s",
  },
  btnOutline: {
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid #1e293b",
    padding: "8px 18px",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.2s",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  metaChip: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 6,
    padding: "3px 10px",
    fontSize: 12,
    color: "#64748b",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
  },
  statLabel: { fontSize: 11, color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" },
  statValue: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: "2px 0 0" },
  card: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 16,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: "#cbd5e1", margin: 0 },
  progressTrack: {
    height: 10,
    background: "#1e293b",
    borderRadius: 999,
    overflow: "visible",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.6s ease",
  },
  thresholdMarker: {
    position: "absolute",
    top: -4,
    width: 2,
    height: 18,
    background: "#f97316",
    borderRadius: 2,
    transform: "translateX(-50%)",
  },
  progressLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 6,
  },
  tabs: {
    display: "flex",
    gap: 4,
    borderBottom: "1px solid #1e293b",
    marginBottom: 16,
  },
  tab: {
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#64748b",
    padding: "10px 18px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.2s",
    marginBottom: -1,
  },
  tabActive: {
    color: "#3b82f6",
    borderBottomColor: "#3b82f6",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  detailGrid: { marginTop: 16, display: "flex", flexDirection: "column", gap: 10 },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1e293b",
    paddingBottom: 8,
  },
  detailKey: { fontSize: 13, color: "#64748b" },
  detailVal: { fontSize: 13, color: "#cbd5e1", fontWeight: 500 },
  txRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#111827",
    borderRadius: 8,
    padding: "10px 12px",
  },
  txDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  txType: { fontSize: 13, color: "#e2e8f0", fontWeight: 500 },
  txRef: { fontSize: 12, color: "#475569" },
  txQty: { fontSize: 14, fontWeight: 700, marginLeft: "auto" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 16 },
  th: {
    textAlign: "left",
    fontSize: 11,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: "8px 12px",
    borderBottom: "1px solid #1e293b",
  },
  td: {
    padding: "12px 12px",
    fontSize: 13,
    color: "#94a3b8",
    borderBottom: "1px solid #0f172a",
  },
  tableRow: { transition: "background 0.15s" },
  settingsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginTop: 16,
  },
  formGroup: { display: "flex", flexDirection: "column", gap: 5 },
  formLabel: { fontSize: 12, color: "#64748b", fontWeight: 500 },
  formInput: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 7,
    color: "#e2e8f0",
    padding: "8px 12px",
    fontSize: 13,
    outline: "none",
    transition: "border-color 0.2s",
  },
};

const globalStyles = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0a0f1a; }
`;

