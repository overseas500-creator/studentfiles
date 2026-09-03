const url = 'https://script.google.com/macros/s/AKfycbw1ntn0dUbpGZlg2bVyRddbihjQ4tK1W51FS95p4KtOXEYufzEMKEk_KgU8SuAQbx-WNg/exec';
const secret = 'Ajawid_Secret_2026';

const payload = {
  secret: secret,
  student_id: '0123456789', // Example student ID that starts with zero to test the zero-padding fix!
  message: `إشعار إلى ولي أمر الطالب ، من المعلم : "محمد التجريبي" ، المادة "علوم" ، الإشعار : **"التأخر عن دخول الحصة"** ، التفاصيل : "تم إرسال هذا الإشعار اليوم لتجربة الربط الجديد بين النظامين"`
};

console.log("Sending payload to Parent Portal:", payload);

fetch(url, {
  method: 'POST',
  body: JSON.stringify(payload),
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.text())
.then(text => {
  console.log("Response from Google Apps Script:", text);
})
.catch(err => {
  console.error("Error:", err);
});
