const express = require('express');
const methodOverride = require('method-override');
const path = require('path');
const { db, initialize } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.BIND_HOST || '0.0.0.0';

// Initialize database
initialize();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', require('./routes/events'));
app.use('/operators', require('./routes/operators'));
app.use('/events', require('./routes/records'));
app.use('/events', require('./routes/export'));

// Health check endpoint for K8s probes
app.get('/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: err.message });
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`📋 Data Entry App running at http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});
