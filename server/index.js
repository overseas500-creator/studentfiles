import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
mongoose.set('bufferCommands', false); // Disable buffering to see real errors immediately

if (!mongoURI) {
  console.error('ERROR: MONGODB_URI environment variable is not set!');
} else {
  mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Schemas
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  grade: { type: String, required: true },
  class_name: { type: String, required: true },
  phone: String,
  student_number: { type: String, unique: true, required: true }
});

const reportSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher_name: { type: String, required: true },
  subject: { type: String, required: true },
  violation_type: { type: String, required: true },
  notes: String,
  created_at: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);
const Report = mongoose.model('Report', reportSchema);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Students API
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    console.log(`[Database] Found ${students.length} students in collection.`);
    res.json(students.map(s => {
      const obj = s.toObject();
      return { ...obj, id: obj._id };
    }));
  } catch (err) {
    console.error('[Database Error] Fetch failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.json({ ...student._doc, id: student._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/students/bulk', async (req, res) => {
  try {
    const students = req.body;
    const result = await Student.insertMany(students, { ordered: false });
    res.json({ success: true, count: result.length });
  } catch (err) {
    // If some were inserted and some failed (e.g. duplicates), we still return success with the count of what was inserted
    const insertedCount = err.insertedDocs ? err.insertedDocs.length : 0;
    if (insertedCount > 0) {
      return res.json({ success: true, count: insertedCount });
    }
    res.status(500).json({ error: err.message });
  }
});

// Reports API
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().populate('student_id').sort({ created_at: -1 });
    const formattedReports = reports.map(r => ({
      ...r._doc,
      student_name: r.student_id?.name,
      grade: r.student_id?.grade,
      class_name: r.student_id?.class_name,
      id: r._id
    }));
    res.json(formattedReports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();
    res.json({ ...report._doc, id: report._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Statistics API
app.get('/api/stats', async (req, res) => {
  try {
    const violationStats = await Report.aggregate([
      { $group: { _id: "$violation_type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { violation_type: "$_id", count: 1, _id: 0 } }
    ]);

    const reportsWithStudents = await Report.find().populate('student_id');
    const classGroups = reportsWithStudents.reduce((acc, curr) => {
      const className = curr.student_id?.class_name || 'Unknown';
      acc[className] = (acc[className] || 0) + 1;
      return acc;
    }, {});

    const classStats = Object.keys(classGroups).map(name => ({
      class_name: name,
      count: classGroups[name]
    }));

    res.json({ violationStats, classStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Frontend
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback for SPA - matches all routes without path-to-regexp issues
app.use((req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

