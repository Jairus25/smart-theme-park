import { useState } from "react";
import { LogIn, ShieldCheck, Ticket } from "lucide-react";

export default function Login({ onLogin }) {
  const [role, setRole] = useState("visitor");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = role === "visitor"
      ? { username: "visitor", password: "visitor123" }
      : { username: "admin", password: "admin123" };

    if (username.trim().toLowerCase() !== credentials.username || password !== credentials.password) {
      setError("Those credentials do not match this account.");
      return;
    }

    onLogin(role);
  };

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-intro">
          <span className="brand-mark">✦</span>
          <p className="eyebrow">Smart Theme Park</p>
          <h1>Welcome back.</h1>
          <p>Choose your access to explore the park experience or manage daily operations.</p>
        </div>
        <div className="role-switcher" aria-label="Choose account type">
          <button type="button" className={role === "visitor" ? "role-option selected" : "role-option"} onClick={() => { setRole("visitor"); setError(""); }}><Ticket size={18} /><span><strong>Visitor</strong><small>Rides and feedback</small></span></button>
          <button type="button" className={role === "operations" ? "role-option selected" : "role-option"} onClick={() => { setRole("operations"); setError(""); }}><ShieldCheck size={18} /><span><strong>Operations</strong><small>Full console access</small></span></button>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>Username<input required value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" /></label>
          <label>Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="btn-primary" type="submit"><LogIn size={16} /> Sign in</button>
          <p className="login-hint">{role === "visitor" ? <>Visitor demo: <strong>visitor</strong> / <strong>visitor123</strong></> : <>Operations demo: <strong>admin</strong> / <strong>admin123</strong></>}</p>
        </form>
      </section>
    </main>
  );
}