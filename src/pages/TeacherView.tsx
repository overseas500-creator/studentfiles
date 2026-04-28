import { useState, useEffect } from 'react';
import { Send, CheckSquare, User, BookOpen } from 'lucide-react';
import axios from 'axios';

const violations = [
  "تأخر عن دخول الحصة", "هروب من الحصة", "إثارة الفوضى داخل الفصل", 
  "الاشتراك في مشاجرة", "الاعتداء على آخر بالضرب أو الألفاظ النابية", 
  "العبث بممتلكات المدرسة", "إهمال نظافة مكان الجلوس", "النوم داخل الفصل", 
  "تناول الأكل والمشروبات أثناء الدرس", "الانشغال بالأحاديث الجانبية أثناء الدرس", 
  "تدني المستوى الدراسي", "دخول الفصل دون استئذان", "الخروج من الفصل دون استئذان", 
  "عدم إحضار الكتاب الدراسي", "أخرى"
];

const TeacherView = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('الأول الثانوي');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedViolation, setSelectedViolation] = useState('');
  const [reportData, setReportData] = useState({
    teacherName: '',
    subject: '',
    notes: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStudents = students.filter(s => 
    s.grade === selectedGrade && (selectedClass ? s.class_name.includes(selectedClass) : true)
  );

  const handleSubmit = async () => {
    if (selectedStudents.length === 0 || !selectedViolation || !reportData.teacherName || !reportData.subject) {
      alert('يرجى إكمال جميع الحقول واختيار طالب واحد على الأقل');
      return;
    }

    try {
      for (const studentId of selectedStudents) {
        await axios.post('/api/reports', {
          student_id: studentId,
          teacher_name: reportData.teacherName,
          subject: reportData.subject,
          violation_type: selectedViolation,
          notes: reportData.notes
        });
      }
      alert('تم إرسال التقارير بنجاح');
      setSelectedStudents([]);
      setSelectedViolation('');
      setReportData({ ...reportData, notes: '' });
    } catch (err) {
      alert('حدث خطأ أثناء الإرسال');
    }
  };

  const toggleStudent = (id: number) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        
        {/* Selection Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card">
            <h3 style={{ marginBottom: '20px', borderBottom: '2px solid var(--primary)', paddingBottom: '10px', display: 'inline-block' }}>تحديد الفصل والطلاب</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>الصف الدراسي</label>
                <select 
                  className="input-field" 
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  <option>الأول الثانوي</option>
                  <option>الثاني الثانوي</option>
                  <option>الثالث الثانوي</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>الفصل</label>
                <input 
                  className="input-field" 
                  placeholder="مثال: 1/1" 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', maxHeight: '450px', overflowY: 'auto', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc' }}>
              <div style={{ padding: '12px', background: 'white', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 1 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>اختر الطلاب ({selectedStudents.length} محدد)</p>
              </div>
              {filteredStudents.length > 0 ? filteredStudents.map(student => (
                <div 
                  key={student.id} 
                  onClick={() => toggleStudent(student.id)}
                  style={{ 
                    padding: '12px 16px', 
                    margin: '4px',
                    borderRadius: '10px', 
                    background: selectedStudents.includes(student.id) ? 'var(--primary)' : 'white',
                    color: selectedStudents.includes(student.id) ? 'white' : 'var(--text-main)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '18px', height: '18px', border: `2px solid ${selectedStudents.includes(student.id) ? 'white' : 'var(--border)'}`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedStudents.includes(student.id) && <CheckSquare size={14} />}
                  </div>
                  <span style={{ fontWeight: 500 }}>{student.name}</span>
                </div>
              )) : <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا يوجد طلاب بهذا الفصل</p>}
            </div>
          </div>
        </div>

        {/* Report Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card">
            <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '10px', display: 'inline-block' }}>تفاصيل المخالفة</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <User size={16} color="var(--primary)" /> اسم المعلم
                </label>
                <input 
                  className="input-field" 
                  value={reportData.teacherName}
                  onChange={(e) => setReportData({...reportData, teacherName: e.target.value})}
                  placeholder="اسم المعلم"
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <BookOpen size={16} color="var(--primary)" /> المادة
                </label>
                <input 
                  className="input-field" 
                  value={reportData.subject}
                  onChange={(e) => setReportData({...reportData, subject: e.target.value})}
                  placeholder="اسم المادة"
                />
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>نوع المخالفة</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '24px' }}>
              {violations.map(v => (
                <div 
                  key={v}
                  onClick={() => setSelectedViolation(v)}
                  style={{ 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)',
                    background: selectedViolation === v ? 'var(--primary)' : 'white',
                    color: selectedViolation === v ? 'white' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    boxShadow: selectedViolation === v ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
                  }}
                >
                  {v}
                </div>
              ))}
            </div>

            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ملاحظات توضيحية</label>
            <textarea 
              className="input-field" 
              rows={4} 
              style={{ resize: 'none' }}
              value={reportData.notes}
              onChange={(e) => setReportData({...reportData, notes: e.target.value})}
              placeholder="اكتب تفاصيل إضافية هنا..."
            ></textarea>

            <button 
              className="btn-primary" 
              style={{ marginTop: '24px', width: '100%', justifyContent: 'center', padding: '16px' }}
              onClick={handleSubmit}
            >
              <Send size={20} /> إرسال التقرير
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherView;
