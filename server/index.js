import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST') console.log('Body:', req.body);
  next();
});

const db = new Database('school.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    class_name TEXT NOT NULL,
    phone TEXT,
    student_number TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    teacher_name TEXT,
    subject TEXT,
    violation_type TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );
`);

// Add sample student if none exists
const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
if (studentCount === 0) {
  db.prepare('INSERT INTO students (name, grade, class_name, phone, student_number) VALUES (?, ?, ?, ?, ?)')
    .run('أحمد محمد', 'الأول الثانوي', '1/1', '0501234567', '1001');
  db.prepare('INSERT INTO students (name, grade, class_name, phone, student_number) VALUES (?, ?, ?, ?, ?)')
    .run('خالد عبدالله', 'الأول الثانوي', '1/1', '0507654321', '1002');
  db.prepare('INSERT INTO students (name, grade, class_name, phone, student_number) VALUES (?, ?, ?, ?, ?)')
    .run('ياسر فهد', 'الثاني الثانوي', '2/1', '0500000000', '1003');
}

// Students API
app.get('/api/students', (req, res) => {
  const students = db.prepare('SELECT * FROM students').all();
  res.json(students);
});

app.post('/api/students', (req, res) => {
  const { name, grade, class_name, phone, student_number } = req.body;
  const info = db.prepare('INSERT INTO students (name, grade, class_name, phone, student_number) VALUES (?, ?, ?, ?, ?)')
    .run(name, grade, class_name, phone, student_number);
  res.json({ id: info.lastInsertRowid });
});

app.post('/api/students/bulk', (req, res) => {
  const students = req.body;
  const insert = db.prepare('INSERT OR IGNORE INTO students (name, grade, class_name, phone, student_number) VALUES (?, ?, ?, ?, ?)');
  
  const insertMany = db.transaction((list) => {
    for (const s of list) insert.run(s.name, s.grade, s.class_name, s.phone, s.student_number);
  });

  insertMany(students);
  res.json({ success: true, count: students.length });
});

// Reports API
app.get('/api/reports', (req, res) => {
  const reports = db.prepare(`
    SELECT reports.*, students.name as student_name, students.grade, students.class_name 
    FROM reports 
    JOIN students ON reports.student_id = students.id
    ORDER BY created_at DESC
  `).all();
  res.json(reports);
});

app.post('/api/reports', (req, res) => {
  const { student_id, teacher_name, subject, violation_type, notes } = req.body;
  const info = db.prepare('INSERT INTO reports (student_id, teacher_name, subject, violation_type, notes) VALUES (?, ?, ?, ?, ?)')
    .run(student_id, teacher_name, subject, violation_type, notes);
  res.json({ id: info.lastInsertRowid });
});

// Statistics API
app.get('/api/stats', (req, res) => {
  const violationStats = db.prepare(`
    SELECT violation_type, COUNT(*) as count 
    FROM reports 
    GROUP BY violation_type
    ORDER BY count DESC
  `).all();
  
  const classStats = db.prepare(`
    SELECT students.class_name, COUNT(*) as count 
    FROM reports 
    JOIN students ON reports.student_id = students.id
    GROUP BY students.class_name
  `).all();

  res.json({ violationStats, classStats });
});

// Serve Frontend
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
