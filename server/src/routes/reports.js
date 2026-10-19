"use strict";

const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const participation = await db.query(`
      SELECT r.rideName, COUNT(p.participationId) AS visitorCount
      FROM theme_park.park.rides r
      LEFT JOIN theme_park.park.participations p ON p.rideId = r.rideId
      GROUP BY r.rideName
      ORDER BY visitorCount DESC
    `);

    const departments = await db.query(`
      SELECT d.deptName, COUNT(e.personId) AS employeeCount
      FROM theme_park.park.departments d
      JOIN theme_park.park.employees e ON e.deptId = d.deptId
      GROUP BY d.deptName
      HAVING COUNT(e.personId) > 0
      ORDER BY employeeCount DESC
    `);

    const aboveAverage = await db.query(`
      SELECT r.rideName, COUNT(p.participationId) AS rideCount,
             ROUND((SELECT RAW AVG(cnt) FROM (
                SELECT COUNT(*) AS cnt FROM theme_park.park.participations GROUP BY rideId
             ) AS sub)[0], 2) AS parkAverage
      FROM theme_park.park.rides r
      JOIN theme_park.park.participations p ON p.rideId = r.rideId
      GROUP BY r.rideName
      HAVING COUNT(p.participationId) > (SELECT RAW AVG(cnt) FROM (
                SELECT COUNT(*) AS cnt FROM theme_park.park.participations GROUP BY rideId
             ) AS sub)[0]
    `);

    const safety = await db.query(`
      SELECT r.rideName,
             (SELECT RAW COUNT(*) FROM theme_park.park.accidentReports ar WHERE ar.rideId = r.rideId)[0] AS accidents,
             (SELECT RAW COUNT(*) FROM theme_park.park.emergencyIncidents ei WHERE ei.rideId = r.rideId)[0] AS emergencies
      FROM theme_park.park.rides r
      WHERE EXISTS (SELECT 1 FROM theme_park.park.accidentReports ar WHERE ar.rideId = r.rideId)
         OR EXISTS (SELECT 1 FROM theme_park.park.emergencyIncidents ei WHERE ei.rideId = r.rideId)
    `);

    res.json({ participation, departments, aboveAverage, safety });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
