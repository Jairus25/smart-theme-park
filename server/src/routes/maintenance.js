"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");

const router = express.Router();

// GET /api/maintenance -- maintenance jobs with ride name + assigned staff
// names resolved via UNNEST of the embedded assignments array
router.get("/", async (req, res, next) => {
  try {
    const rows = await db.query(`
      SELECT m.maintId, r.rideName, m.maintType, m.description, m.status, m.cost,
             (SELECT RAW e.name
                FROM m.assignments asg
                JOIN theme_park.park.employees e ON e.personId = asg.employeeId) AS staff
      FROM theme_park.park.maintenance m
      JOIN theme_park.park.rides r ON r.rideId = m.rideId
      ORDER BY m.maintDate DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/options", async (req, res, next) => {
  try {
    const rides = await db.query(`SELECT r.rideId, r.rideName FROM theme_park.park.rides r ORDER BY r.rideName`);
    const employees = await db.query(`SELECT e.personId, e.name FROM theme_park.park.employees e ORDER BY e.name`);
    res.json({ rides, employees });
  } catch (err) {
    next(err);
  }
});

// POST /api/maintenance -- log a job, embed the staff assignment, and flip
// the ride to UNDER_MAINTENANCE in the same request (two documents touched,
// no cross-document transaction here for simplicity -- see README for the
// trade-off this implies compared to a relational COMMIT).
router.post("/", async (req, res, next) => {
  try {
    const { rideId, employeeId, maintType, description, cost } = req.body;
    if (!rideId || !employeeId) return res.status(400).json({ error: "rideId and employeeId are required" });

    const maintId = `M${uuidv4().slice(0, 6).toUpperCase()}`;
    const maintCol = await db.collection("maintenance");
    await maintCol.insert(`maintenance::${maintId}`, {
      maintId,
      rideId,
      maintType: maintType || "CORRECTIVE",
      description: description || "",
      status: "IN_PROGRESS",
      cost: Number(cost) || 0,
      maintDate: new Date().toISOString().slice(0, 10),
      assignments: [{ employeeId, hours: 0, action: description || "" }],
    });

    const rideCol = await db.collection("rides");
    const couchbase = require("couchbase");
    await rideCol.mutateIn(`ride::${rideId}`, [couchbase.MutateInSpec.upsert("operationalStatus", "UNDER_MAINTENANCE")]);

    res.status(201).json({ maintId, message: `Maintenance ${maintId} logged and ride marked UNDER_MAINTENANCE.` });
  } catch (err) {
    next(err);
  }
});

// POST /api/maintenance/:maintId/complete -- mirrors the relational
// procedure's logic: close this job, then only restore the ride to
// OPERATIONAL if no other open job remains against it.
router.post("/:maintId/complete", async (req, res, next) => {
  try {
    const { maintId } = req.params;
    const couchbase = require("couchbase");

    const maintCol = await db.collection("maintenance");
    const doc = await maintCol.get(`maintenance::${maintId}`);
    const rideId = doc.content.rideId;

    await maintCol.mutateIn(`maintenance::${maintId}`, [couchbase.MutateInSpec.upsert("status", "COMPLETED")]);

    const openJobs = await db.query(
      `SELECT RAW COUNT(*) FROM theme_park.park.maintenance m WHERE m.rideId = $rideId AND m.status != "COMPLETED"`,
      { parameters: { rideId } }
    );
    if ((openJobs[0] || 0) === 0) {
      const rideCol = await db.collection("rides");
      await rideCol.mutateIn(`ride::${rideId}`, [couchbase.MutateInSpec.upsert("operationalStatus", "OPERATIONAL")]);
    }

    res.json({ message: `Maintenance ${maintId} marked COMPLETED.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
