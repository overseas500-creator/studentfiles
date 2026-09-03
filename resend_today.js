import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGODB_URI;
const webhookUrl = process.env.GAS_WEBAPP_URL || "https://script.google.com/macros/s/AKfycbw1ntn0dUbpGZlg2bVyRddbihjQ4tK1W51FS95p4KtOXEYufzEMKEk_KgU8SuAQbx-WNg/exec";
const secret = process.env.AJAWID_SECRET || "Ajawid_Secret_2026";

if (!mongoURI) {
  console.error("❌ خطأ: لم يتم العثور على MONGODB_URI في ملف .env.");
  console.log("يرجى إضافة رابط قاعدة بيانات MongoDB (MONGODB_URI) إلى ملف .env الخاص بك حتى يتمكن السكريبت من جلب تقارير اليوم.");
  process.exit(1);
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
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  teacher_name: { type: String, required: true },
  subject: { type: String, required: true },
  violation_type: { type: String, required: true },
  notes: String,
  status: { type: String, default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);
const Report = mongoose.model('Report', reportSchema);

const resendTodayNotifications = async () => {
  try {
    console.log("🔄 جاري الاتصال بقاعدة البيانات...");
    await mongoose.connect(mongoURI);
    console.log("✅ تم الاتصال بقاعدة البيانات بنجاح.");

    // Define the start and end of 2026-09-02 (Local Time assumed to be matching server logs)
    // Using string matching or date range to catch all reports for today
    const startDate = new Date('2026-09-02T00:00:00.000Z');
    const endDate = new Date('2026-09-02T23:59:59.999Z');

    console.log(`\n🔍 جاري البحث عن التقارير ليوم 2026/9/2...`);
    const reports = await Report.find({
      created_at: { $gte: startDate, $lte: endDate }
    }).populate('student_id');

    if (reports.length === 0) {
      console.log("ℹ️ لم يتم العثور على أي تقارير في هذا اليوم.");
      process.exit(0);
    }

    console.log(`📊 تم العثور على ${reports.length} تقرير. جاري إرسال الإشعارات...\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      const student = report.student_id;

      if (!student || !student.student_number) {
        console.log(`⚠️ تخطي التقرير (${report._id}): بيانات الطالب مفقودة.`);
        failCount++;
        continue;
      }

      const paddedStudentId = String(student.student_number).padStart(10, '0');
      const payload = {
        secret: secret,
        student_id: paddedStudentId,
        message: `إشعار إلى ولي أمر الطالب ، من المعلم : "${report.teacher_name}" ، المادة "${report.subject}" ، الإشعار : **"${report.violation_type}"** ، التفاصيل : "${report.notes || 'لا يوجد'}"`
      };

      try {
        const response = await axios.post(webhookUrl, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log(`✅ تم الإرسال للطالب: ${student.name} | المخالفة: ${report.violation_type}`);
        successCount++;
      } catch (err) {
        console.error(`❌ فشل إرسال الإشعار للطالب: ${student.name} | الخطأ: ${err.message}`);
        failCount++;
      }

      // Small delay to prevent hitting Apps Script rate limits
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`\n🎉 اكتملت العملية! ناجح: ${successCount} ، فشل: ${failCount}`);
    process.exit(0);

  } catch (error) {
    console.error("❌ حدث خطأ أثناء تنفيذ السكريبت:", error);
    process.exit(1);
  }
};

resendTodayNotifications();
