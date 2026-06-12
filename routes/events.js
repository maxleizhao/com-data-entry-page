const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Home - list all events
router.get('/', (req, res) => {
  const events = db.prepare('SELECT * FROM events ORDER BY created_at DESC').all();
  res.render('index', { events });
});

// Create event form
router.get('/events/new', (req, res) => {
  res.render('events/new');
});

// Create event
router.post('/events', (req, res) => {
  const { name, event_date } = req.body;
  db.prepare('INSERT INTO events (name, event_date) VALUES (?, ?)').run(name, event_date);
  res.redirect('/');
});

// View event detail
router.get('/events/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).send('Event not found');

  const operators = db.prepare('SELECT * FROM operators ORDER BY project, name').all();

  const baselineRecords = db.prepare(`
    SELECT r.*, o.name as operator_name
    FROM baseline_records r
    JOIN operators o ON r.operator_id = o.id
    WHERE r.event_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);

  const pyrocksRecords = db.prepare(`
    SELECT r.*, o.name as operator_name
    FROM pyrocks_records r
    JOIN operators o ON r.operator_id = o.id
    WHERE r.event_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);

  const donutechRecords = db.prepare(`
    SELECT r.*, o.name as operator_name
    FROM donutech_records r
    JOIN operators o ON r.operator_id = o.id
    WHERE r.event_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);

  const sgRecords = db.prepare(`
    SELECT r.*, o.name as operator_name
    FROM sg_records r
    JOIN operators o ON r.operator_id = o.id
    WHERE r.event_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);

  const counts = {
    baseline: baselineRecords.length,
    pyrocks: pyrocksRecords.length,
    donutech: donutechRecords.length,
    sg: sgRecords.length,
  };

  res.render('events/detail', {
    event,
    operators,
    baselineRecords,
    pyrocksRecords,
    donutechRecords,
    sgRecords,
    counts,
  });
});

// Close event (toggle status)
router.patch('/events/:id/toggle', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  const newStatus = event.status === 'active' ? 'closed' : 'active';
  db.prepare("UPDATE events SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(newStatus, req.params.id);
  res.redirect(`/events/${req.params.id}`);
});

// Delete event
router.delete('/events/:id', (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.redirect('/');
});

module.exports = router;
