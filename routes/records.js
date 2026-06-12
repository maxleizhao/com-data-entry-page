const express = require('express');
const router = express.Router();
const { db } = require('../db');

// ─── Baseline ────────────────────────────────────────────────
router.get('/:id/forms/baseline', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).send('Event not found');
  const operators = db.prepare('SELECT * FROM operators WHERE project = ? ORDER BY name').all('baseline');
  const records = db.prepare(`
    SELECT r.*, o.name as operator_name
    FROM baseline_records r
    JOIN operators o ON r.operator_id = o.id
    WHERE r.event_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);
  res.render('forms/baseline', { event, operators, records });
});

router.post('/:id/forms/baseline', (req, res) => {
  const { operator_id, subject_id, height, weight, waist_circumference, hip_circumference, grip_strength } = req.body;
  db.prepare(`INSERT INTO baseline_records
    (event_id, operator_id, subject_id, height, weight, waist_circumference, hip_circumference, grip_strength)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, operator_id, subject_id, height, weight, waist_circumference, hip_circumference, grip_strength);
  res.redirect(`/events/${req.params.id}/forms/baseline`);
});

// ─── Pyrocks ─────────────────────────────────────────────────
router.get('/:id/forms/pyrocks', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).send('Event not found');
  const operators = db.prepare('SELECT * FROM operators WHERE project = ? ORDER BY name').all('pyrocks');
  const records = db.prepare(`
    SELECT r.*, o.name as operator_name
    FROM pyrocks_records r
    JOIN operators o ON r.operator_id = o.id
    WHERE r.event_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);
  res.render('forms/pyrocks', { event, operators, records });
});

router.post('/:id/forms/pyrocks', (req, res) => {
  const { operator_id, subject_id, risk } = req.body;
  db.prepare('INSERT INTO pyrocks_records (event_id, operator_id, subject_id, risk) VALUES (?, ?, ?, ?)')
    .run(req.params.id, operator_id, subject_id, risk);
  res.redirect(`/events/${req.params.id}/forms/pyrocks`);
});

// ─── DonuTech ────────────────────────────────────────────────
router.get('/:id/forms/donutech', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).send('Event not found');
  const operators = db.prepare('SELECT * FROM operators WHERE project = ? ORDER BY name').all('donutech');
  const records = db.prepare(`
    SELECT r.*, o.name as operator_name
    FROM donutech_records r
    JOIN operators o ON r.operator_id = o.id
    WHERE r.event_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);
  res.render('forms/donutech', { event, operators, records });
});

router.post('/:id/forms/donutech', (req, res) => {
  const { operator_id, subject_id, blood_pressure, heart_rate, blood_glucose, time_since_last_meal, remarks } = req.body;
  db.prepare(`INSERT INTO donutech_records
    (event_id, operator_id, subject_id, blood_pressure, heart_rate, blood_glucose, time_since_last_meal, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, operator_id, subject_id, blood_pressure, heart_rate, blood_glucose, time_since_last_meal, remarks || '');
  res.redirect(`/events/${req.params.id}/forms/donutech`);
});

// ─── SG ──────────────────────────────────────────────────────
router.get('/:id/forms/sg', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).send('Event not found');
  const operators = db.prepare('SELECT * FROM operators WHERE project = ? ORDER BY name').all('sg');
  const records = db.prepare(`
    SELECT r.*, o.name as operator_name
    FROM sg_records r
    JOIN operators o ON r.operator_id = o.id
    WHERE r.event_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);
  res.render('forms/sg', { event, operators, records });
});

router.post('/:id/forms/sg', (req, res) => {
  const {
    operator_id, serial_number, subject_id,
    hba1c, total_cholesterol, hdl, trig, ldl, glucose_donutech,
    hba1c_equip_no, cholesterol_equip_no, remarks
  } = req.body;
  db.prepare(`INSERT INTO sg_records
    (event_id, operator_id, serial_number, subject_id, hba1c, total_cholesterol, hdl, trig, ldl, glucose_donutech, hba1c_equip_no, cholesterol_equip_no, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, operator_id, serial_number, subject_id,
    hba1c, total_cholesterol, hdl, trig, ldl, glucose_donutech,
    hba1c_equip_no, cholesterol_equip_no, remarks || '');
  res.redirect(`/events/${req.params.id}/forms/sg`);
});

// ─── Delete records ─────────────────────────────────────────
router.delete('/:eventId/records/:table/:recordId', (req, res) => {
  const allowed = ['baseline_records', 'pyrocks_records', 'donutech_records', 'sg_records'];
  if (!allowed.includes(req.params.table)) return res.status(400).send('Invalid table');
  db.prepare(`DELETE FROM ${req.params.table} WHERE id = ?`).run(req.params.recordId);
  res.redirect(`/events/${req.params.eventId}`);
});

module.exports = router;
