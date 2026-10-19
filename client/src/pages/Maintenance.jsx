import { useEffect, useState } from "react";
import { ClipboardPlus, Filter } from "lucide-react";
import { api } from "../api.js";
import Flash from "../components/Flash.jsx";
import PageHeader from "../components/PageHeader.jsx";

const MAINT_TYPES = ["PREVENTIVE", "CORRECTIVE", "INSPECTION"];

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [options, setOptions] = useState({ rides: [], employees: [] });
  const [flash, setFlash] = useState(null);
  const [view, setView] = useState("OPEN");
  const [form, setForm] = useState({ rideId: "", employeeId: "", maintType: "PREVENTIVE", description: "", cost: 0 });

  const load = () => {
    api.getMaintenance().then(setRecords).catch((err) => setFlash({ type: "error", message: err.message }));
    api.getMaintenanceOptions().then(setOptions).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const visibleRecords = view === "ALL" ? records : records.filter((record) => record.status !== "COMPLETED");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await api.addMaintenance(form);
      setFlash({ type: "success", message: result.message });
      setForm({ rideId: "", employeeId: "", maintType: "PREVENTIVE", description: "", cost: 0 });
      load();
    } catch (err) {
      setFlash({ type: "error", message: err.message });
    }
  };

  const handleComplete = async (maintId) => {
    try {
      const result = await api.completeMaintenance(maintId);
      setFlash({ type: "success", message: result.message });
      load();
    } catch (err) {
      setFlash({ type: "error", message: err.message });
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Reliability desk" title="Maintenance" description="Keep open work visible and return attractions to service with confidence." action={<button className="ghost-button" onClick={() => document.querySelector(".maintenance-form")?.scrollIntoView({ behavior: "smooth" })}><ClipboardPlus size={16} /> Log maintenance</button>} />
      <Flash {...flash} onClose={() => setFlash(null)} />

      <div className="table-toolbar"><label className="filter-field"><Filter size={16} /><span>View</span><select value={view} onChange={(e) => setView(e.target.value)} aria-label="Filter maintenance records"><option value="OPEN">Open work</option><option value="ALL">All records</option></select></label><span className="hint">{visibleRecords.length} records</span></div>
      <table className="data-table">
        <thead>
          <tr><th>ID</th><th>Ride</th><th>Type</th><th>Description</th><th>Status</th><th>Cost</th><th>Staff</th><th></th></tr>
        </thead>
        <tbody>
          {visibleRecords.map((m) => (
            <tr key={m.maintId}>
              <td>{m.maintId}</td>
              <td>{m.rideName}</td>
              <td>{m.maintType}</td>
              <td>{m.description}</td>
              <td><span className={`badge badge-${m.status?.toLowerCase()}`}>{m.status}</span></td>
              <td>₹{Number(m.cost).toFixed(2)}</td>
              <td>{(m.staff || []).join(", ")}</td>
              <td>
                {m.status !== "COMPLETED" && (
                  <button className="btn-secondary" onClick={() => handleComplete(m.maintId)}>Mark Complete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Log New Maintenance</h2>
      <form className="form-grid maintenance-form" onSubmit={handleSubmit}>
        <label>Ride
          <select required value={form.rideId} onChange={(e) => setForm({ ...form, rideId: e.target.value })}>
            <option value="" disabled>Select a ride</option>
            {options.rides.map((r) => <option key={r.rideId} value={r.rideId}>{r.rideName}</option>)}
          </select>
        </label>
        <label>Assigned Employee
          <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
            <option value="" disabled>Select an employee</option>
            {options.employees.map((e) => <option key={e.personId} value={e.personId}>{e.name}</option>)}
          </select>
        </label>
        <label>Type
          <select value={form.maintType} onChange={(e) => setForm({ ...form, maintType: e.target.value })}>
            {MAINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>Description
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label>Cost (₹)
          <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        </label>
        <button type="submit" className="btn-primary">Log Maintenance</button>
      </form>
      <p className="hint">Logging a job sets the ride to <strong>UNDER_MAINTENANCE</strong>; completing the last open job on a ride flips it back to <strong>OPERATIONAL</strong>.</p>
    </div>
  );
}
