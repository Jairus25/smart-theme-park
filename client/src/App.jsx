import { useState } from "react";
import { Navigate, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Visitors from "./pages/Visitors.jsx";
import Rides from "./pages/Rides.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import Feedback from "./pages/Feedback.jsx";
import Reports from "./pages/Reports.jsx";
import BackgroundMedia from "./components/BackgroundMedia.jsx";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(() => sessionStorage.getItem("theme-park-role"));

  const handleLogin = (nextRole) => {
    sessionStorage.setItem("theme-park-role", nextRole);
    setRole(nextRole);
    navigate(nextRole === "visitor" ? "/rides" : "/");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("theme-park-role");
    setRole(null);
    navigate("/login");
  };

  if (!role) return <Login onLogin={handleLogin} />;
  if (location.pathname === "/login") return <Navigate to={role === "visitor" ? "/rides" : "/"} replace />;

  const visitorOnly = role === "visitor";
  const backgroundVideo = location.pathname === "/" || location.pathname === "/rides"
    ? "park-details.mp4"
    : "park-atmosphere.mp4";

  return (
    <>
      <BackgroundMedia source={backgroundVideo} />
      <NavBar role={role} onLogout={handleLogout} />
      <main className="content">
        <Routes>
          <Route path="/" element={visitorOnly ? <Navigate to="/rides" replace /> : <Dashboard />} />
          <Route path="/visitors" element={visitorOnly ? <Navigate to="/rides" replace /> : <Visitors />} />
          <Route path="/rides" element={<Rides visitorMode={visitorOnly} />} />
          <Route path="/maintenance" element={visitorOnly ? <Navigate to="/rides" replace /> : <Maintenance />} />
          <Route path="/feedback" element={<Feedback visitorMode={visitorOnly} />} />
          <Route path="/reports" element={visitorOnly ? <Navigate to="/rides" replace /> : <Reports />} />
          <Route path="*" element={<Navigate to={visitorOnly ? "/rides" : "/"} replace />} />
        </Routes>
      </main>
      
    </>
  );
}
