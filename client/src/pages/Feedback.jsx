import { useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { api } from "../api.js";
import Flash from "../components/Flash.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function Feedback({ visitorMode = false }) {
  const [records, setRecords] = useState([]);
  const [options, setOptions] = useState({ visitors: [], rides: [] });
  const [flash, setFlash] = useState(null);
  const [form, setForm] = useState({ visitorId: "", rideId: "", rating: "5", comments: "" });

  const load = () => {
    api.getFeedback().then(setRecords).catch((err) => setFlash({ type: "error", message: err.message }));
    api.getFeedbackOptions().then(setOptions).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.addFeedback(form);
      setFlash({ type: "success", message: "Feedback recorded." });
      setForm({ visitorId: "", rideId: "", rating: "5", comments: "" });
      load();
    } catch (err) {
      setFlash({ type: "error", message: err.message });
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Guest voice" title="Customer feedback" description={visitorMode ? "Read what guests are saying about the park's rides." : "See what guests are saying about the experiences that matter most."} action={!visitorMode && <button className="ghost-button" onClick={() => document.querySelector(".feedback-form")?.scrollIntoView({ behavior: "smooth" })}><MessageSquarePlus size={16} /> Add feedback</button>} />
      <Flash {...flash} onClose={() => setFlash(null)} />

      <table className="data-table">
        <thead><tr><th>ID</th><th>Visitor</th><th>Ride</th><th>Rating</th><th>Comments</th><th>Date</th></tr></thead>
        <tbody>
          {records.length ? records.map((f) => (
            <tr key={f.feedbackId}>
              <td>{f.feedbackId}</td>
              <td>{f.visitor}</td>
              <td>{f.ride}</td>
              <td>{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</td>
              <td>{f.comments}</td>
              <td>{f.feedbackDate}</td>
            </tr>
          )) : <tr><td colSpan="6"><div className="empty-state">No feedback has been recorded yet.</div></td></tr>}
        </tbody>
      </table>

      {!visitorMode && <><h2>Add Feedback</h2>
      <form className="form-grid feedback-form" onSubmit={handleSubmit}>
        <label>Visitor
          <select required value={form.visitorId} onChange={(e) => setForm({ ...form, visitorId: e.target.value })}>
            <option value="" disabled>Select a visitor</option>
            {options.visitors.map((v) => <option key={v.personId} value={v.personId}>{v.name}</option>)}
          </select>
        </label>
        <label>Ride
          <select required value={form.rideId} onChange={(e) => setForm({ ...form, rideId: e.target.value })}>
            <option value="" disabled>Select a ride</option>
            {options.rides.map((r) => <option key={r.rideId} value={r.rideId}>{r.rideName}</option>)}
          </select>
        </label>
        <label>Rating (1-5)
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label>Comments
          <input value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
        </label>
        <button type="submit" className="btn-primary">Submit Feedback</button>
      </form></>}
    </div>
  );
}
