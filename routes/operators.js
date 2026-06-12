const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Operator management page
router.get('/', (req, res) => {
  const operators = db.prepare('SELECT * FROM operators ORDER BY project, name').all();
  const events = db.prepare('SELECT id, name FROM events ORDER BY created_at DESC').all();
  res.render('operators/manage', { operators, events });
});

// Create operator
router.post('/', (req, res) => {
  const { name, project } = req.body;
  db.prepare('INSERT INTO operators (name, project) VALUES (?, ?)').run(name, project);
  res.redirect('/operators');
});

// Update operator
router.put('/:id', (req, res) => {
  const { name, project } = req.body;
  db.prepare('UPDATE operators SET name = ?, project = ? WHERE id = ?').run(name, project, req.params.id);
  res.redirect('/operators');
});

// Delete operator
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM operators WHERE id = ?').run(req.params.id);
  res.redirect('/operators');
});

module.exports = router;
