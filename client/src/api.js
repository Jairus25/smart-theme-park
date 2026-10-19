const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || body.detail || `Request to ${path} failed (${res.status})`);
  }
  return body;
}

export const api = {
  health: () => request("/health"),
  dashboard: () => request("/dashboard"),

  getVisitors: () => request("/visitors"),
  addVisitor: (data) => request("/visitors", { method: "POST", body: JSON.stringify(data) }),
  deleteVisitor: (personId) => request(`/visitors/${personId}`, { method: "DELETE" }),

  getRides: () => request("/rides"),
  addRide: (data) => request("/rides", { method: "POST", body: JSON.stringify(data) }),
  deleteRide: (rideId) => request(`/rides/${rideId}`, { method: "DELETE" }),
  updateRideStatus: (rideId, status) =>
    request(`/rides/${rideId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  getMaintenance: () => request("/maintenance"),
  getMaintenanceOptions: () => request("/maintenance/options"),
  addMaintenance: (data) => request("/maintenance", { method: "POST", body: JSON.stringify(data) }),
  completeMaintenance: (maintId) => request(`/maintenance/${maintId}/complete`, { method: "POST" }),

  getFeedback: () => request("/feedback"),
  getFeedbackOptions: () => request("/feedback/options"),
  addFeedback: (data) => request("/feedback", { method: "POST", body: JSON.stringify(data) }),

  getReports: () => request("/reports"),
};
