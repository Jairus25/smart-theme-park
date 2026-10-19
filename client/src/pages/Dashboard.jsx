import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { api } from "../api.js";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [rides, setRides] = useState([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    setRefreshing(true);
    setError("");
    api.dashboard()
      .then((data) => {
        setStats(data.stats);
        setRides(data.rideStatus);
      })
      .catch((err) => setError(err.message))
      .finally(() => setRefreshing(false));
  };

  useEffect(() => { load(); }, []);

  const operational = rides.filter((ride) => ride.status === "OPERATIONAL").length;
  const maintenance = rides.filter((ride) => ride.status === "UNDER_MAINTENANCE").length;
  const closed = rides.filter((ride) => ride.status === "CLOSED").length;
  const rideTotal = rides.length || 1;

  return (
    <div>
      <PageHeader
        eyebrow="Park pulse / live overview"
        title="Good day at the park."
        description="A quick read on visitors, attractions, and the work keeping every experience moving."
        action={<button className="ghost-button" onClick={load} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "spin" : ""} /> {refreshing ? "Refreshing" : "Refresh data"}</button>}
      />

      {error && <div className="flash flash-error">{error} — check /api/health and your server/.env.</div>}

      {stats && (
        <div className="stat-grid">
          <MetricCard label="Visitors today" value={stats.visitors} detail="Active guest records" />
          <MetricCard label="Attractions" value={stats.rides} detail={`${operational} operational`} />
          <MetricCard label="Team members" value={stats.employees} detail="Across park departments" />
          <MetricCard label="Tickets issued" value={stats.tickets} detail="Current ticket records" />
          <MetricCard label="Open maintenance" value={stats.openMaintenance} detail="Needs attention" tone="warn" />
        </div>
      )}

      <div className="dashboard-grid">
        <section className="surface">
          <div className="surface-heading"><h2>Ride status</h2><span className="hint"><Activity size={14} /> {rides.length} tracked</span></div>
          {rides.length ? <table className="data-table">
            <thead><tr><th>Ride</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>{rides.map((r) => <tr key={r.rideId}><td>{r.rideName}</td><td>{r.rideType}</td><td><span className={`badge badge-${r.status?.toLowerCase()}`}>{r.status}</span></td></tr>)}</tbody>
          </table> : <div className="empty-state">Ride status will appear when the API is connected.</div>}
        </section>
        <section className="surface status-panel">
          <div className="surface-heading"><h2>Park readiness</h2></div>
          <StatusBar label="Operational" count={operational} total={rideTotal} />
          <StatusBar label="Maintenance" count={maintenance} total={rideTotal} tone="warn" />
          <StatusBar label="Closed" count={closed} total={rideTotal} tone="danger" />
          <p className="hint">Status is calculated from the current ride register.</p>
        </section>
      </div>

      <p className="hint">Connection check: <a href="/api/health" target="_blank" rel="noreferrer">/api/health</a></p>
    </div>
  );
}

function StatusBar({ label, count, total, tone = "" }) {
  return <div className="status-row"><strong>{label}</strong><div className="status-bar"><span className={`status-bar-${tone}`} style={{ width: `${(count / total) * 100}%` }} /></div><span className="hint">{count}</span></div>;
}
