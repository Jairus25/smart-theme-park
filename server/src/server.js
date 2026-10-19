"use strict";

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const visitorsRouter = require("./routes/visitors");
const ridesRouter = require("./routes/rides");
const maintenanceRouter = require("./routes/maintenance");
const feedbackRouter = require("./routes/feedback");
const reportsRouter = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Simple request log -- helpful when demoing live in a viva so you can show
// each click on the React side causing a request here.
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get("/api/health", async (req, res) => {
  try {
    await db.ping();
    res.json({ status: "ok", couchbase: "connected", bucket: db.BUCKET_NAME, scope: db.SCOPE_NAME });
  } catch (err) {
    res.status(500).json({ status: "error", detail: err.message });
  }
});

app.get("/api/dashboard", async (req, res, next) => {
  try {
    const [visitors] = await db.query(`SELECT RAW COUNT(*) FROM theme_park.park.visitors`);
    const [rides] = await db.query(`SELECT RAW COUNT(*) FROM theme_park.park.rides`);
    const [employees] = await db.query(`SELECT RAW COUNT(*) FROM theme_park.park.employees`);
    const [tickets] = await db.query(`SELECT RAW COUNT(*) FROM theme_park.park.tickets`);
    const [openMaintenance] = await db.query(
      `SELECT RAW COUNT(*) FROM theme_park.park.maintenance m WHERE m.status != "COMPLETED"`
    );
    const rideStatus = await db.query(`
      SELECT r.rideId, r.rideName, r.rideType, r.operationalStatus AS status
      FROM theme_park.park.rides r ORDER BY r.rideName
    `);
    res.json({ stats: { visitors, rides, employees, tickets, openMaintenance }, rideStatus });
  } catch (err) {
    next(err);
  }
});

app.use("/api/visitors", visitorsRouter);
app.use("/api/rides", ridesRouter);
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/reports", reportsRouter);

// Centralized error handler -- every route above calls next(err) on
// failure, which lands here instead of each route writing its own
// try/catch response body.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Theme Park API listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
