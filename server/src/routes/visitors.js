"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");

const router = express.Router();

// GET /api/visitors -- every visitor plus a live ticket count (N1QL JOIN)
router.get("/", async (req, res, next) => {
  try {
    const rows = await db.query(`
      SELECT v.personId, v.name, v.email, v.phone, v.membershipNo,
             v.loyaltyPoints, COUNT(t.ticketId) AS ticketCount
      FROM theme_park.park.visitors v
      LEFT JOIN theme_park.park.tickets t ON t.visitorId = v.personId
      GROUP BY v.personId, v.name, v.email, v.phone, v.membershipNo, v.loyaltyPoints
      ORDER BY v.name
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/visitors -- register a new visitor document
router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone, membershipNo } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }
    const personId = (req.body.personId && req.body.personId.trim()) || `P${uuidv4().slice(0, 6).toUpperCase()}`;
    const col = await db.collection("visitors");
    await col.insert(`visitor::${personId}`, {
      type: "visitor",
      personId,
      name,
      email,
      phone: phone || "",
      membershipNo: membershipNo || null,
      loyaltyPoints: 0,
    });
    res.status(201).json({ personId, message: `Visitor '${name}' registered with ID ${personId}.` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/visitors/:personId -- also removes their tickets, reservations
// and participations (Couchbase has no cascade -- unlike SQL's ON DELETE
// CASCADE or even Neo4j's DETACH DELETE, a document store deletes exactly
// the document you name, so the app layer has to clean up referencing
// documents itself).
router.delete("/:personId", async (req, res, next) => {
  try {
    const { personId } = req.params;

    const ticketRows = await db.query(
      `SELECT RAW META(t).id FROM theme_park.park.tickets t WHERE t.visitorId = $personId`,
      { parameters: { personId } }
    );
    for (const ticketKey of ticketRows) {
      const ticketId = ticketKey.split("::")[1];
      const resvRows = await db.query(
        `SELECT RAW META(r).id FROM theme_park.park.reservations r WHERE r.ticketId = $ticketId`,
        { parameters: { ticketId } }
      );
      for (const resvKey of resvRows) {
        await db.query(`DELETE FROM theme_park.park.reservations USE KEYS $k`, { parameters: { k: resvKey } });
      }
      const partRows = await db.query(
        `SELECT RAW META(p).id FROM theme_park.park.participations p WHERE p.ticketId = $ticketId`,
        { parameters: { ticketId } }
      );
      for (const partKey of partRows) {
        await db.query(`DELETE FROM theme_park.park.participations USE KEYS $k`, { parameters: { k: partKey } });
      }
      await db.query(`DELETE FROM theme_park.park.tickets USE KEYS $k`, { parameters: { k: ticketKey } });
    }

    const col = await db.collection("visitors");
    await col.remove(`visitor::${personId}`);

    res.json({ message: `Visitor ${personId} and related tickets/reservations removed.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
