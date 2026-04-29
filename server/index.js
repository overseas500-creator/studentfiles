import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sqlite3 from 'sqlite3';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// SQLite Connection
const dbPath = join(__dirname, '../school.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

// Initialize Tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      class_name TEXT NOT NULL,
      phone TEXT,
      student_number TEXT UNIQUE NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      teacher_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      violation_type TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id)
    )
  `);
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Students API
app.get('/api/students', (req, res) => {
  db.all('SELECT * FROM students', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/students', (req, res) => {
  const { name, grade, class_name, phone, student_number } = req.body;
  db.run(
    'INSERT INTO students (name, grade, class_name, phone, student_number) VALUES (?, ?, ?, ?, ?)',
    [name, grade, class_name, phone, student_number],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

app.post('/api/students/bulk', (req, res) => {
  const students = req.body;
  db.serialize(() => {
    const stmt = db.prepare('INSERT OR IGNORE INTO students (name, grade, class_name, phone, student_number) VALUES (?, ?, ?, ?, ?)');
    students.forEach(s => {
      stmt.run(s.name, s.grade, s.class_name, s.phone, s.student_number);
    });
    stmt.finalize((err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, count: students.length });
    });
  });
});

// Reports API
app.get('/api/reports', (req, res) => {
  const query = `
    SELECT r.*, s.name as student_name, s.grade, s.class_name, r.id as id
    FROM reports r 
    JOIN students s ON r.student_id = s.id 
    ORDER BY r.created_at DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/reports', (req, res) => {
  const { student_id, teacher_name, subject, violation_type, notes } = req.body;
  db.run(
    'INSERT INTO reports (student_id, teacher_name, subject, violation_type, notes) VALUES (?, ?, ?, ?, ?)',
    [student_id, teacher_name, subject, violation_type, notes],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// Statistics API
app.get('/api/stats', (req, res) => {
  db.all('SELECT violation_type, COUNT(*) as count FROM reports GROUP BY violation_type ORDER BY count DESC', [], (err, violationStats) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all('SELECT s.class_name, COUNT(*) as count FROM reports r JOIN students s ON r.student_id = s.id GROUP BY s.class_name', [], (err, classStats) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ violationStats, classStats });
    });
  });
});

// Serve Frontend
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

