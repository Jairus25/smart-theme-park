"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");

const router = express.Router();

// GET /api/rides -- rides with participation count + sensor health array
router.get("/", async (req, res, next) => {
  try {
    const rows = await db.query(`
      SELECT r.rideId, r.rideName, r.rideType, r.location, r.operationalStatus,
             (SELECT RAW COUNT(*) FROM theme_park.park.participations p WHERE p.rideId = r.rideId)[0] AS participation,
             (SELECT RAW s.healthStatus FROM theme_park.park.sensors s WHERE s.rideId = r.rideId) AS sensorHealth
      FROM theme_park.park.rides r
      ORDER BY r.rideName
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/rides -- add a new ride document
router.post("/", async (req, res, next) => {
  try {
    const { rideName, rideType, location, minHeight, duration } = req.body;
    if (!rideName) return res.status(400).json({ error: "rideName is required" });

    const rideId = (req.body.rideId && req.body.rideId.trim()) || `R${uuidv4().slice(0, 4).toUpperCase()}`;
    const col = await db.collection("rides");
    await col.insert(`ride::${rideId}`, {
      rideId,
      rideName,
      rideType: rideType || "FAMILY",
      location: location || "",
      minHeight: Number(minHeight) || 0,
      duration: Number(duration) || 0,
      operationalStatus: "OPERATIONAL",
    });
    res.status(201).json({ rideId, message: `Ride '${rideName}' added with ID ${rideId}.` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/rides/:rideId -- remove the ride and documents that reference it
router.delete("/:rideId", async (req, res, next) => {
  try {
    const { rideId } = req.params;
    const rideRows = await db.query(
      `SELECT RAW META(r).id FROM theme_park.park.rides r WHERE r.rideId = $rideId`,
      { parameters: { rideId } }
    );
    if (!rideRows.length) return res.status(404).json({ error: `Ride ${rideId} was not found.` });

    for (const collectionName of ["sensors", "participations", "feedback", "maintenance"]) {
      await db.query(
        `DELETE FROM theme_park.park.${collectionName} WHERE rideId = $rideId`,
        { parameters: { rideId } }
      );
    }

    const col = await db.collection("rides");
    await col.remove(rideRows[0]);
    res.json({ message: `Ride ${rideId} and related records removed.` });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/rides/:rideId/status -- update operationalStatus field only
// (a partial update -- Couchbase supports sub-document mutation so the
// whole document doesn't need to be read-modified-written for one field).
router.patch("/:rideId/status", async (req, res, next) => {
  try {
    const { rideId } = req.params;
    const { status } = req.body;
    const col = await db.collection("rides");
    await col.mutateIn(`ride::${rideId}`, [couchbaseUpsertSpec("operationalStatus", status)]);
    res.json({ message: `Ride ${rideId} status set to ${status}.` });
  } catch (err) {
    next(err);
  }
});

// Small helper kept local so this file has no extra top-level import noise
// for a single use -- couchbase.MutateInSpec.upsert(path, value)
function couchbaseUpsertSpec(path, value) {
  // Lazily require here to keep the dependency explicit at the call site.
  const couchbase = require("couchbase");
  return couchbase.MutateInSpec.upsert(path, value);
}

module.exports = router;
