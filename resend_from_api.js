import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'https://studentfiles.onrender.com/api/reports';
const WEBHOOK_URL = process.env.GAS_WEBAPP_URL || "https://script.google.com/macros/s/AKfycbw1ntn0dUbpGZlg2bVyRddbihjQ4tK1W51FS95p4KtOXEYufzEMKEk_KgU8SuAQbx-WNg/exec";
const SECRET = process.env.AJAWID_SECRET || "Ajawid_Secret_2026";

const resendTodayNotifications = async () => {
  try {
    console.log("🔄 جاري سحب التقارير من السيرفر المباشر...");
    const response = await axios.get(API_URL);
    const allReports = response.data;
    
    // Filter reports for 2026-09-02
    const targetDateStr = '2026-09-02';
    const todayReports = allReports.filter(report => {
      if (!report.created_at) return false;
      return report.created_at.startsWith(targetDateStr);
    });

    if (todayReports.length === 0) {
      console.log("ℹ️ لم يتم العثور على أي تقارير ليوم 2026/9/2.");
      process.exit(0);
    }

    console.log(`📊 تم العثور على ${todayReports.length} تقرير لهذا اليوم. جاري الإرسال لبوابة أولياء الأمور...\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < todayReports.length; i++) {
      const report = todayReports[i];
      const student = report.student_id; // It's populated in the API response

      if (!student || !student.student_number) {
        console.log(`⚠️ تخطي التقرير (${report.id}): بيانات الطالب مفقودة.`);
        failCount++;
        continue;
      }

      const paddedStudentId = String(student.student_number).padStart(10, '0');
      const payload = {
        secret: SECRET,
        student_id: paddedStudentId,
        message: `إشعار إلى ولي أمر الطالب ، من المعلم : "${report.teacher_name}" ، المادة "${report.subject}" ، الإشعار : **"${report.violation_type}"** ، التفاصيل : "${report.notes || 'لا يوجد'}"`
      };

      try {
        await axios.post(WEBHOOK_URL, payload, {
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
    console.error("❌ حدث خطأ أثناء تنفيذ السكريبت:", error.message);
    process.exit(1);
  }
};

resendTodayNotifications();
