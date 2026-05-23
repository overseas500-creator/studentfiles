import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import serverless from 'serverless-http';

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

const connectDB = async () => {
  try {
    if (!mongoURI) {
      console.warn('MONGODB_URI is not set. Database connection skipped during build or if not required.');
      return;
    }
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas');
    
    if (process.env.NODE_ENV !== 'production' || !process.env.NETLIFY) {
      app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
      });
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (process.env.NODE_ENV === 'production') {
      // Don't crash during build process in CI
      console.warn('Continuing without DB connection...');
    } else {
      process.exit(1);
    }
  }
};

connectDB();
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  grade: { type: String, required: true },
  class_name: { type: String, required: true },
  phone: String,
  student_number: { type: String, unique: true, required: true }
});

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  national_id: { type: String, unique: true, required: true },
  subject: { type: String }
});

const reportSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  teacher_name: { type: String, required: true },
  subject: { type: String, required: true },
  violation_type: { type: String, required: true },
  notes: String,
  status: { type: String, default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);
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
    const insertedCount = err.insertedDocs ? err.insertedDocs.length : 0;
    if (insertedCount > 0) {
      return res.json({ success: true, count: insertedCount });
    }
    res.status(500).json({ error: err.message });
  }
});

// Teachers API
app.get('/api/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers.map(t => ({ ...t._doc, id: t._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/teachers/bulk', async (req, res) => {
  try {
    const teachers = req.body;
    const result = await Teacher.insertMany(teachers, { ordered: false });
    res.json({ success: true, count: result.length });
  } catch (err) {
    const insertedCount = err.insertedDocs ? err.insertedDocs.length : 0;
    if (insertedCount > 0) {
      return res.json({ success: true, count: insertedCount });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const teacher = new Teacher(req.body);
    await teacher.save();
    res.json({ ...teacher._doc, id: teacher._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    // Also delete reports for this student? (Optional but good for consistency)
    await Report.deleteMany({ student_id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/teachers/:id', async (req, res) => {
  try {
    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/teachers/login', async (req, res) => {
  try {
    const { national_id } = req.body;
    const teacher = await Teacher.findOne({ national_id });
    if (!teacher) {
      return res.status(404).json({ error: 'المعلم غير موجود. يرجى التأكد من رقم الهوية' });
    }
    res.json({ ...teacher._doc, id: teacher._id });
  } catch (err) {
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

    // إرسال إشعار لحظي إلى سكربت جوجل (رسالة لولي الأمر)
    try {
      const student = await Student.findById(report.student_id);
      if (student && student.student_number && process.env.GAS_WEBAPP_URL) {
        const payload = {
          secret: process.env.AJAWID_SECRET || "Ajawid_Secret_2026",
          student_id: student.student_number,
          message: `تم تسجيل ملاحظة سلبية على الطالب وهي : "${report.violation_type}" ، من قبل المعلم "${report.teacher_name}" ، المادة : "${report.subject}" ، تفاصيل إضافية : "${report.notes || 'لا يوجد'}"`
        };
        
        fetch(process.env.GAS_WEBAPP_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.error("Webhook failed:", err));
      }
    } catch (e) {
      console.error("Error triggering webhook:", e);
    }

    res.json({ ...report._doc, id: report._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/reports/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await Report.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    
    // Hierarchical stats: Grade -> Classes
    const gradeMap = {};
    reportsWithStudents.forEach(curr => {
      const grade = curr.student_id?.grade || 'غير محدد';
      const className = curr.student_id?.class_name || 'غير محدد';
      
      if (!gradeMap[grade]) {
        gradeMap[grade] = { 
          grade_name: grade, 
          count: 0, 
          classes: {} 
        };
      }
      
      gradeMap[grade].count += 1;
      gradeMap[grade].classes[className] = (gradeMap[grade].classes[className] || 0) + 1;
    });

    const gradeStats = Object.values(gradeMap).map(g => ({
      ...g,
      classes: Object.keys(g.classes).map(name => ({
        class_name: name,
        count: g.classes[name]
      })).sort((a, b) => b.count - a.count)
    })).sort((a, b) => b.count - a.count);

    // Flat class stats for backward compatibility if needed, but we'll use gradeStats
    const classStats = gradeStats.reduce((acc, g) => {
      return acc.concat(g.classes);
    }, []).sort((a, b) => b.count - a.count);

    res.json({ violationStats, gradeStats, classStats });
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

// Export for Netlify Functions
export const handler = serverless(app);
export default app;

