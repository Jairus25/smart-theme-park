import { NavLink } from "react-router-dom";
import { BarChart3, LayoutDashboard, LogOut, MessageSquare, Settings, Ticket, Waves } from "lucide-react";

export default function NavBar({ role, onLogout }) {
  const linkClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");
  const operationsLinks = [
    ["/", "Dashboard", LayoutDashboard, true],
    ["/visitors", "Visitors", Ticket],
    ["/rides", "Rides", Waves],
    ["/maintenance", "Maintenance", Settings],
    ["/feedback", "Feedback", MessageSquare],
    ["/reports", "Reports", BarChart3],
  ];
  const links = role === "visitor" ? [["/rides", "Rides", Waves], ["/feedback", "Feedback", MessageSquare]] : operationsLinks;

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">✦</span> Smart Theme Park
        <span className="brand-subtitle">{role === "visitor" ? "Visitor access" : "Operations console"}</span>
      </div>
      <nav aria-label="Primary navigation">
        {links.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end} className={linkClass}>
            <span className="nav-icon"><Icon size={17} strokeWidth={2} /></span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="live-status"><span className="live-dot" />{role === "visitor" ? "Guest mode" : "Live operations"}<button className="logout-button" onClick={onLogout}><LogOut size={14} /> Sign out</button></div>
    </header>
  );
}
