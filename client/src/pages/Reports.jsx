import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { api } from "../api.js";
import PageHeader from "../components/PageHeader.jsx";

export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getReports().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="flash flash-error">{error}</div>;
  if (!data) return <p>Loading reports…</p>;

  return (
    <div>
      <PageHeader eyebrow="Signals and patterns" title="Operational reports" description="Compare participation, staffing, and safety signals across the park." action={<a className="ghost-button" href="/api/reports" target="_blank" rel="noreferrer"><BarChart3 size={16} /> Open raw data</a>} />

      <div className="report-grid">
        <section className="report-card">
          <h2>Visitor Participation per Ride</h2>
          <table className="data-table small">
            <thead><tr><th>Ride</th><th>Visitors</th></tr></thead>
            <tbody>{data.participation.map((row) => <tr key={row.rideName}><td>{row.rideName}</td><td>{row.visitorCount}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="report-card">
          <h2>Employees per Department</h2>
          <table className="data-table small">
            <thead><tr><th>Department</th><th>Employees</th></tr></thead>
            <tbody>{data.departments.map((row) => <tr key={row.deptName}><td>{row.deptName}</td><td>{row.employeeCount}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="report-card">
          <h2>Above-Average Participation Rides</h2>
          <p className="hint">Park-wide average: {data.aboveAverage[0]?.parkAverage ?? "—"}</p>
          <table className="data-table small">
            <thead><tr><th>Ride</th><th>Count</th></tr></thead>
            <tbody>{data.aboveAverage.map((row) => <tr key={row.rideName}><td>{row.rideName}</td><td>{row.rideCount}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="report-card">
          <h2>Rides with Safety Events</h2>
          <table className="data-table small">
            <thead><tr><th>Ride</th><th>Accidents</th><th>Emergencies</th></tr></thead>
            <tbody>{data.safety.map((row) => <tr key={row.rideName}><td>{row.rideName}</td><td>{row.accidents}</td><td>{row.emergencies}</td></tr>)}</tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
