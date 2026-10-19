export default function MetricCard({ label, value, tone = "default", detail }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value ?? "—"}</div>
      {detail && <div className="metric-detail">{detail}</div>}
    </article>
  );
}
