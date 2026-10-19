import { useEffect, useState } from "react";
import { Filter, Plus } from "lucide-react";
import { api } from "../api.js";
import Flash from "../components/Flash.jsx";
import PageHeader from "../components/PageHeader.jsx";

const RIDE_TYPES = ["THRILL", "FAMILY", "WATER", "SHOW", "KIDDIE"];
const STATUSES = ["OPERATIONAL", "UNDER_MAINTENANCE", "CLOSED"];

export default function Rides({ visitorMode = false }) {
  const [rides, setRides] = useState([]);
  const [flash, setFlash] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState({ rideId: "", rideName: "", rideType: "FAMILY", location: "", minHeight: 0, duration: 5 });

  const load = () => api.getRides().then(setRides).catch((err) => setFlash({ type: "error", message: err.message }));

  useEffect(() => { load(); }, []);

  const visibleRides = statusFilter === "ALL" ? rides : rides.filter((ride) => ride.operationalStatus === statusFilter);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await api.addRide(form);
      setFlash({ type: "success", message: result.message });
      setForm({ rideId: "", rideName: "", rideType: "FAMILY", location: "", minHeight: 0, duration: 5 });
      load();
    } catch (err) {
      setFlash({ type: "error", message: err.message });
    }
  };

  const handleStatusChange = async (rideId, status) => {
    try {
      const result = await api.updateRideStatus(rideId, status);
      setFlash({ type: "success", message: result.message });
      load();
    } catch (err) {
      setFlash({ type: "error", message: err.message });
    }
  };

  const handleDelete = async (rideId, rideName) => {
    if (!window.confirm(`Delete ${rideName} and its related records?`)) return;
    try {
      const result = await api.deleteRide(rideId);
      setFlash({ type: "success", message: result.message });
      load();
    } catch (err) {
      setFlash({ type: "error", message: err.message });
    }
  };

  return (
    <div>
      <PageHeader eyebrow={visitorMode ? "Plan your day" : "Attraction control"} title="Rides / attractions" description={visitorMode ? "Check ride details and current operating status before you head out." : "Watch every attraction's operating state, sensor health, and throughput."} action={!visitorMode && <button className="ghost-button" onClick={() => document.querySelector(".ride-form")?.scrollIntoView({ behavior: "smooth" })}><Plus size={16} /> Add ride</button>} />
      <Flash {...flash} onClose={() => setFlash(null)} />

      <div className="table-toolbar"><label className="filter-field"><Filter size={16} /><span>Show</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter rides by status"><option value="ALL">All rides</option>{STATUSES.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}</select></label><span className="hint">{visibleRides.length} attractions</span></div>
      <table className="data-table">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Type</th><th>Location</th><th>Participation</th>{!visitorMode && <th>Sensor Health</th>}<th>Status</th>{!visitorMode && <th>Update</th>}{!visitorMode && <th>Delete</th>}</tr>
        </thead>
        <tbody>
          {visibleRides.map((r) => (
            <tr key={r.rideId}>
              <td>{r.rideId}</td>
              <td>{r.rideName}</td>
              <td>{r.rideType}</td>
              <td>{r.location}</td>
              <td>{r.participation}</td>
              {!visitorMode && <td>
                {(r.sensorHealth || []).filter(Boolean).map((h) => (
                  <span key={h} className={`badge badge-${h.toLowerCase()}`}>{h}</span>
                ))}
              </td>}
              <td><span className={`badge badge-${r.operationalStatus?.toLowerCase()}`}>{r.operationalStatus}</span></td>
              {!visitorMode && <td>
                <select
                  defaultValue={r.operationalStatus}
                  onChange={(e) => handleStatusChange(r.rideId, e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>}
              {!visitorMode && <td><button className="btn-danger" onClick={() => handleDelete(r.rideId, r.rideName)}>Delete</button></td>}
            </tr>
          ))}
        </tbody>
      </table>

      {!visitorMode && <><h2>Add New Ride</h2>
      <form className="form-grid ride-form" onSubmit={handleSubmit}>
        <label>Ride ID (optional)
          <input value={form.rideId} onChange={(e) => setForm({ ...form, rideId: e.target.value })} placeholder="auto-generated if blank" />
        </label>
        <label>Name
          <input required value={form.rideName} onChange={(e) => setForm({ ...form, rideName: e.target.value })} />
        </label>
        <label>Type
          <select value={form.rideType} onChange={(e) => setForm({ ...form, rideType: e.target.value })}>
            {RIDE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>Location
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </label>
        <label>Min Height (cm)
          <input type="number" value={form.minHeight} onChange={(e) => setForm({ ...form, minHeight: e.target.value })} />
        </label>
        <label>Duration (min)
          <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
        </label>
        <button type="submit" className="btn-primary">Add Ride</button>
      </form></>}
    </div>
  );
}
