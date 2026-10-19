import { useEffect, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { api } from "../api.js";
import Flash from "../components/Flash.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [flash, setFlash] = useState(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ personId: "", name: "", email: "", phone: "", membershipNo: "" });

  const load = () => api.getVisitors().then(setVisitors).catch((err) => setFlash({ type: "error", message: err.message }));

  useEffect(() => { load(); }, []);

  const visibleVisitors = visitors.filter((visitor) =>
    [visitor.personId, visitor.name, visitor.email, visitor.membershipNo]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await api.addVisitor(form);
      setFlash({ type: "success", message: result.message });
      setForm({ personId: "", name: "", email: "", phone: "", membershipNo: "" });
      load();
    } catch (err) {
      setFlash({ type: "error", message: err.message });
    }
  };

  const handleDelete = async (personId) => {
    if (!window.confirm(`Delete visitor ${personId} and all their tickets/reservations?`)) return;
    try {
      const result = await api.deleteVisitor(personId);
      setFlash({ type: "success", message: result.message });
      load();
    } catch (err) {
      setFlash({ type: "error", message: err.message });
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Guest register" title="Visitors" description="Keep the guest register tidy, searchable, and ready for the next interaction." action={<button className="ghost-button" onClick={() => document.querySelector(".visitor-form")?.scrollIntoView({ behavior: "smooth" })}><UserPlus size={16} /> Register visitor</button>} />
      <Flash {...flash} onClose={() => setFlash(null)} />

      <div className="table-toolbar"><label className="search-field"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, ID, email..." aria-label="Search visitors" /></label><span className="hint">{visibleVisitors.length} of {visitors.length} visitors</span></div>
      <table className="data-table">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Membership</th><th>Loyalty Pts</th><th>Tickets</th><th></th></tr>
        </thead>
        <tbody>
          {visibleVisitors.map((v) => (
            <tr key={v.personId}>
              <td>{v.personId}</td>
              <td>{v.name}</td>
              <td>{v.email}</td>
              <td>{v.phone}</td>
              <td>{v.membershipNo || "—"}</td>
              <td>{v.loyaltyPoints}</td>
              <td>{v.ticketCount}</td>
              <td><button className="btn-danger" onClick={() => handleDelete(v.personId)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Register New Visitor</h2>
      <form className="form-grid visitor-form" onSubmit={handleSubmit}>
        <label>Person ID (optional)
          <input value={form.personId} onChange={(e) => setForm({ ...form, personId: e.target.value })} placeholder="auto-generated if blank" />
        </label>
        <label>Name
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>Email
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>Phone
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <label>Membership No
          <input value={form.membershipNo} onChange={(e) => setForm({ ...form, membershipNo: e.target.value })} />
        </label>
        <button type="submit" className="btn-primary">Register Visitor</button>
      </form>
    </div>
  );
}
