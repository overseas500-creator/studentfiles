import { useState, useEffect } from 'react';
import { 
  Send, CheckSquare, Clock, DoorOpen, AlertTriangle, Swords, ShieldAlert,
  Wrench, Trash2, Moon, Utensils, MessageSquare, TrendingDown,
  LogOut, BookX, MoreHorizontal, UserX, UserPlus, Award
} from 'lucide-react';
import axios from 'axios';

const violations = [
  { text: "شكر وتقدير", icon: Award, color: "#10b981" },
  { text: "تأخر عن دخول الحصة", icon: Clock },
  { text: "هروب من الحصة", icon: UserX },
  { text: "إثارة الفوضى داخل الفصل", icon: AlertTriangle },
  { text: "الاشتراك في مشاجرة", icon: Swords },
  { text: "الاعتداء على آخر بالضرب أو الألفاظ النابية", icon: ShieldAlert },
  { text: "العبث بممتلكات المدرسة", icon: Wrench },
  { text: "إهمال نظافة مكان الجلوس", icon: Trash2 },
  { text: "النوم داخل الفصل", icon: Moon },
  { text: "تناول الأكل والمشروبات أثناء الدرس", icon: Utensils },
  { text: "الانشغال بالأحاديث الجانبية أثناء الدرس", icon: MessageSquare },
  { text: "تدني المستوى الدراسي", icon: TrendingDown },
  { text: "دخول الفصل دون استئذان", icon: UserPlus },
  { text: "الخروج من الفصل دون استئذان", icon: LogOut },
  { text: "عدم إحضار الكتاب الدراسي", icon: BookX },
  { text: "أخرى", icon: MoreHorizontal }
];

const TeacherView = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<any>(null);
  const [loginId, setLoginId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedViolation, setSelectedViolation] = useState('');
  const [reportData, setReportData] = useState({
    notes: ''
  });

  useEffect(() => {
    const savedTeacher = localStorage.getItem('teacher');
    if (savedTeacher) {
      const teacher = JSON.parse(savedTeacher);
      setCurrentTeacher(teacher);
      setIsLoggedIn(true);
    }
    fetchStudents();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/teachers/login', { national_id: loginId });
      setCurrentTeacher(res.data);
      setIsLoggedIn(true);
      localStorage.setItem('teacher', JSON.stringify(res.data));
    } catch (err: any) {
      alert(err.response?.data?.error || 'خطأ في تسجيل الدخول');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentTeacher(null);
    localStorage.removeItem('teacher');
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStudents = students.filter(s => 
    s.grade?.trim() === selectedGrade.trim() && (selectedClass ? s.class_name?.includes(selectedClass.trim()) : true)
  );

  const handleSubmit = async () => {
    if (selectedStudents.length === 0 || !selectedViolation || !currentTeacher) {
      alert('يرجى إكمال جميع الحقول واختيار طالب واحد على الأقل');
      return;
    }

    try {
      for (const studentId of selectedStudents) {
        await axios.post('/api/reports', {
          student_id: studentId,
          teacher_id: currentTeacher.id,
          teacher_name: currentTeacher.name,
          subject: currentTeacher.subject || 'غير محدد',
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
      {!isLoggedIn ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '24px' }}>تسجيل دخول المعلم</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>رقم الهوية</label>
                <input 
                  className="input-field" 
                  type="text" 
                  required 
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="أدخل رقم الهوية الخاص بك"
                />
              </div>
              <button className="btn-primary" type="submit" style={{ justifyContent: 'center' }}>
                دخول
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', background: 'white', padding: '16px 24px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {currentTeacher.name[0]}
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ margin: 0 }}>مرحباً بك، {currentTeacher.name}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>مادة: {currentTeacher.subject || 'غير محدد'}</p>
              </div>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer' }}>
              تسجيل الخروج
            </button>
          </div>

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
                      <option value="">اختر الصف...</option>
                      {[...new Set(students.map(s => s.grade?.trim()))].filter(Boolean).sort().map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>الفصل</label>
                    <select 
                      className="input-field" 
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      disabled={!selectedGrade}
                    >
                      <option value="">جميع الفصول</option>
                      {[...new Set(
                        students
                          .filter(s => s.grade?.trim() === selectedGrade.trim())
                          .map(s => s.class_name?.trim())
                      )].filter(Boolean).sort().map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
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
                
                {/* Manual teacher info inputs removed as per request */}

                <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>نوع المخالفة</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '24px' }}>
                  {violations.map(v => {
                    const Icon = v.icon;
                    const isSelected = selectedViolation === v.text;
                    const activeColor = v.color || 'var(--primary)';
                    
                    return (
                      <div 
                        key={v.text}
                        onClick={() => setSelectedViolation(v.text)}
                        style={{ 
                          padding: '12px', 
                          borderRadius: '8px', 
                          border: `1px solid ${isSelected ? activeColor : (v.color ? activeColor + '40' : 'var(--border)')}`,
                          background: isSelected ? activeColor : 'white',
                          color: isSelected ? 'white' : (v.color || 'var(--text-main)'),
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? `0 4px 12px ${activeColor}40` : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Icon size={24} />
                        {v.text}
                      </div>
                    );
                  })}
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
        </>
      )}
    </div>
  );
};

export default TeacherView;
