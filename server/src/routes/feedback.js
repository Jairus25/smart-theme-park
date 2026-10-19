"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const rows = await db.query(`
      SELECT f.feedbackId, v.name AS visitor, r.rideName AS ride,
             f.rating, f.comments, f.feedbackDate
      FROM theme_park.park.feedback f
      JOIN theme_park.park.visitors v ON v.personId = f.visitorId
      JOIN theme_park.park.rides r    ON r.rideId = f.rideId
      ORDER BY f.feedbackDate DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/options", async (req, res, next) => {
  try {
    const visitors = await db.query(`SELECT v.personId, v.name FROM theme_park.park.visitors v ORDER BY v.name`);
    const rides = await db.query(`SELECT r.rideId, r.rideName FROM theme_park.park.rides r ORDER BY r.rideName`);
    res.json({ visitors, rides });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { visitorId, rideId, rating, comments } = req.body;
    if (!visitorId || !rideId || !rating) {
      return res.status(400).json({ error: "visitorId, rideId and rating are required" });
    }
    const feedbackId = `F${uuidv4().slice(0, 6).toUpperCase()}`;
    const col = await db.collection("feedback");
    await col.insert(`feedback::${feedbackId}`, {
      feedbackId,
      visitorId,
      rideId,
      rating: Number(rating),
      comments: comments || "",
      feedbackDate: new Date().toISOString().slice(0, 10),
    });
    res.status(201).json({ feedbackId, message: "Feedback recorded." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
