import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// SQLite Connection
const dbPath = join(__dirname, '../school.db');
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    class_name TEXT NOT NULL,
    phone TEXT,
    student_number TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    teacher_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (id)
  );
`);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Students API
app.get('/api/students', (req, res) => {
  try {
    const students = db.prepare('SELECT * FROM students').all();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', (req, res) => {
  try {
    const { name, grade, class_name, phone, student_number } = req.body;
    const info = db.prepare(
      'INSERT INTO students (name, grade, class_name, phone, student_number) VALUES (?, ?, ?, ?, ?)'
    ).run(name, grade, class_name, phone, student_number);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/students/bulk', (req, res) => {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO students (name, grade, class_name, phone, student_number) VALUES (?, ?, ?, ?, ?)'
  );
  
  const insertMany = db.transaction((students) => {
    for (const s of students) {
      insert.run(s.name, s.grade, s.class_name, s.phone, s.student_number);
    }
  });

  try {
    insertMany(req.body);
    res.json({ success: true, count: req.body.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reports API
app.get('/api/reports', (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT r.*, s.name as student_name, s.grade, s.class_name, r.id as id
      FROM reports r 
      JOIN students s ON r.student_id = s.id 
      ORDER BY r.created_at DESC
    `).all();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', (req, res) => {
  try {
    const { student_id, teacher_name, subject, violation_type, notes } = req.body;
    const info = db.prepare(
      'INSERT INTO reports (student_id, teacher_name, subject, violation_type, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(student_id, teacher_name, subject, violation_type, notes);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Statistics API
app.get('/api/stats', (req, res) => {
  try {
    const violationStats = db.prepare(`
      SELECT violation_type, COUNT(*) as count 
      FROM reports 
      GROUP BY violation_type 
      ORDER BY count DESC
    `).all();

    const classStats = db.prepare(`
      SELECT s.class_name, COUNT(*) as count 
      FROM reports r 
      JOIN students s ON r.student_id = s.id 
      GROUP BY s.class_name
    `).all();

    res.json({ violationStats, classStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

