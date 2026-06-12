const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { db } = require('../db');

router.get('/:id/export', async (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).send('Event not found');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Data Entry App';
    workbook.created = new Date();

    // ── Baseline Sheet ──
    const baselineRecords = db.prepare(`
      SELECT r.*, o.name as operator_name
      FROM baseline_records r
      JOIN operators o ON r.operator_id = o.id
      WHERE r.event_id = ?
      ORDER BY r.created_at
    `).all(req.params.id);

    if (baselineRecords.length > 0) {
      const ws = workbook.addWorksheet('Baseline');
      ws.addRow(['Subject ID', 'Height (cm)', 'Weight (kg)', 'BMI', 'Waist Circumference (cm)', 'Hip Circumference (cm)', 'Grip Strength (kg)', 'Operator', 'Recorded At']);
      baselineRecords.forEach(r => {
        ws.addRow([r.subject_id, r.height, r.weight, r.bmi, r.waist_circumference, r.hip_circumference, r.grip_strength, r.operator_name, r.created_at]);
      });
      styleHeader(ws);
    }

    // ── Pyrocks Sheet ──
    const pyrocksRecords = db.prepare(`
      SELECT r.*, o.name as operator_name
      FROM pyrocks_records r
      JOIN operators o ON r.operator_id = o.id
      WHERE r.event_id = ?
      ORDER BY r.created_at
    `).all(req.params.id);

    if (pyrocksRecords.length > 0) {
      const ws = workbook.addWorksheet('Pyrocks');
      ws.addRow(['Subject ID', 'Risk', 'Operator', 'Recorded At']);
      pyrocksRecords.forEach(r => {
        ws.addRow([r.subject_id, r.risk, r.operator_name, r.created_at]);
      });
      styleHeader(ws);
    }

    // ── DonuTech Sheet ──
    const donutechRecords = db.prepare(`
      SELECT r.*, o.name as operator_name
      FROM donutech_records r
      JOIN operators o ON r.operator_id = o.id
      WHERE r.event_id = ?
      ORDER BY r.created_at
    `).all(req.params.id);

    if (donutechRecords.length > 0) {
      const ws = workbook.addWorksheet('DonuTech');
      ws.addRow(['Subject ID', 'Blood Pressure', 'Heart Rate', 'Blood Glucose', 'Time Since Last Meal', 'Remarks', 'Operator', 'Recorded At']);
      donutechRecords.forEach(r => {
        ws.addRow([r.subject_id, r.blood_pressure, r.heart_rate, r.blood_glucose, r.time_since_last_meal, r.remarks, r.operator_name, r.created_at]);
      });
      styleHeader(ws);
    }

    // ── SG Sheet ──
    const sgRecords = db.prepare(`
      SELECT r.*, o.name as operator_name
      FROM sg_records r
      JOIN operators o ON r.operator_id = o.id
      WHERE r.event_id = ?
      ORDER BY r.created_at
    `).all(req.params.id);

    if (sgRecords.length > 0) {
      const ws = workbook.addWorksheet('SG');
      ws.addRow(['S/N', 'Subject ID', 'HbA1C', 'Total Cholesterol', 'HDL', 'TRIG', 'LDL', 'Glucose (DonuTech)', 'HbA1C Equip No.', 'Cholesterol Equip No.', 'Remarks', 'Operator', 'Recorded At']);
      sgRecords.forEach(r => {
        ws.addRow([r.serial_number, r.subject_id, r.hba1c, r.total_cholesterol, r.hdl, r.trig, r.ldl, r.glucose_donutech, r.hba1c_equip_no, r.cholesterol_equip_no, r.remarks, r.operator_name, r.created_at]);
      });
      styleHeader(ws);
    }

    // Set response
    const safeName = event.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_data.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).send('Export failed: ' + err.message);
  }
});

function styleHeader(ws) {
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.columns.forEach(col => {
    if (col) col.width = 20;
  });
}

module.exports = router;
