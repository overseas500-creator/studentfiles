import { useState, useEffect } from 'react';
import { Send, CheckSquare, Award, FileText, Printer, Search } from 'lucide-react';
import axios from 'axios';

const behavioralViolations = [
  "التأخر عن دخول الحصة",
  "هروب من الحصة",
  "إثارة الفوضى داخل الفصل",
  "الاشتراك في مشاجرة",
  "الاعتداء على آخر بالضرب",
  "الاعتداء على آخر بالألفاظ النابية",
  "العبث بممتلكات المدرسة",
  "التنمر على آخر",
  "أخذ أدوات الغير دون استئذان",
  "أخذ أدوات الغير دون علمهم",
  "إهمال نظافة مكان الجلوس",
  "النوم داخل الفصل",
  "تناول الأكل والمشروبات أثناء الدرس",
  "الانشغال بالأحاديث الجانبية أثناء الدرس",
  "دخول الفصل دون استئذان",
  "الخروج من الفصل دون استئذان"
];

const academicViolations = [
  "عدم دخول الطالب على منصة مدرستي",
  "عدم تنفيذ المهام و الواجبات في منصة مدرستي",
  "عدم حل الواجبات في الكتاب المدرسي",
  "عدم تنفيذ المهام",
  "عدم إحضار اللبس الرياضي",
  "عدم التقيد بالزي الرسمي",
  "عدم إحضار أدوات التربية الفنية",
  "تدني المستوى الدراسي",
  "عدم حضور الاختبار القصير للمادة",
  "تكرار الغياب عن الحصة الدراسية",
  "عدم إحضار الكتاب الدراسي"
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
  const [activeTab, setActiveTab] = useState<'create' | 'archive'>('create');
  const [myReports, setMyReports] = useState<any[]>([]);
  const [archiveFilterGrade, setArchiveFilterGrade] = useState('الكل');
  const [archiveFilterClass, setArchiveFilterClass] = useState('');
  const [archiveFilterCategory, setArchiveFilterCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMyReports = async () => {
    if (!currentTeacher) return;
    try {
      const res = await axios.get('/api/reports');
      const teacherReports = res.data.filter((r: any) => 
        (r.teacher_id && r.teacher_id === currentTeacher.id) || 
        r.teacher_name === currentTeacher.name
      );
      setMyReports(teacherReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'archive') {
      fetchMyReports();
    }
  }, [activeTab, currentTeacher]);

  const filteredArchive = myReports.filter(r => {
    const matchesSearch = !searchQuery || (r.student_name && r.student_name.includes(searchQuery));
    const matchesGrade = archiveFilterGrade === 'الكل' || r.grade === archiveFilterGrade;
    const matchesClass = !archiveFilterClass || (r.class_name && r.class_name.includes(archiveFilterClass));
    
    let matchesCategory = true;
    if (archiveFilterCategory !== 'الكل') {
      if (archiveFilterCategory === 'المشكلات السلوكية') {
        matchesCategory = behavioralViolations.includes(r.violation_type);
      } else if (archiveFilterCategory === 'المشكلات الدراسية') {
        matchesCategory = academicViolations.includes(r.violation_type);
      } else if (archiveFilterCategory === 'الشكر والتقدير') {
        matchesCategory = r.violation_type === 'شكر وتقدير';
      } else if (archiveFilterCategory === 'أخرى') {
        matchesCategory = !behavioralViolations.includes(r.violation_type) && 
                          !academicViolations.includes(r.violation_type) && 
                          r.violation_type !== 'شكر وتقدير';
      }
    }
    return matchesSearch && matchesGrade && matchesClass && matchesCategory;
  });

  const handlePrintArchive = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>سجل الملاحظات المرسلة</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
              body { font-family: 'Cairo', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 3px double #333; padding-bottom: 20px; }
              h2 { margin: 0; color: #1a365d; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: right; }
              th { background-color: #f1f5f9; color: #475569; font-weight: 700; }
              tr:nth-child(even) { background-color: #f8fafc; }
              @media print {
                body { padding: 20px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>سجل الملاحظات المرسلة</h2>
              <p>المعلم: ${currentTeacher.name}</p>
              <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 15%">التاريخ</th>
                  <th style="width: 20%">الطالب</th>
                  <th style="width: 15%">الصف/الفصل</th>
                  <th style="width: 25%">التصنيف</th>
                  <th style="width: 25%">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                ${filteredArchive.map(r => `
                  <tr>
                    <td>${new Date(r.created_at).toLocaleDateString('ar-SA')}</td>
                    <td>${r.student_name}</td>
                    <td>${r.grade} - ${r.class_name}</td>
                    <td>${r.violation_type}</td>
                    <td>${r.notes || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <script>
              window.onload = () => {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'white', padding: '16px 24px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
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

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <button 
              onClick={() => setActiveTab('create')}
              style={{ 
                padding: '12px 24px', 
                borderRadius: '12px', 
                border: 'none', 
                background: activeTab === 'create' ? 'var(--primary)' : 'white',
                color: activeTab === 'create' ? 'white' : 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: 'var(--shadow)'
              }}
            >
              إنشاء بلاغ
            </button>
            <button 
              onClick={() => setActiveTab('archive')}
              style={{ 
                padding: '12px 24px', 
                borderRadius: '12px', 
                border: 'none', 
                background: activeTab === 'archive' ? 'var(--primary)' : 'white',
                color: activeTab === 'archive' ? 'white' : 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: 'var(--shadow)'
              }}
            >
              سجل الملاحظات المرسلة
            </button>
          </div>

          {activeTab === 'create' ? (
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
                <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '10px', display: 'inline-block' }}>تفاصيل الحالة</h3>
                
                {/* Manual teacher info inputs removed as per request */}

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '16px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>مخالفات سلوكية</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                    {behavioralViolations.map(v => {
                      const isSelected = selectedViolation === v;
                      return (
                        <div 
                          key={v}
                          onClick={() => setSelectedViolation(v)}
                          style={{ 
                            padding: '10px 12px', 
                            borderRadius: '8px', 
                            border: '1px solid var(--border)',
                            background: isSelected ? 'var(--primary)' : 'white',
                            color: isSelected ? 'white' : 'var(--text-main)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          {v}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '16px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>مخالفات دراسية</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                    {academicViolations.map(v => {
                      const isSelected = selectedViolation === v;
                      return (
                        <div 
                          key={v}
                          onClick={() => setSelectedViolation(v)}
                          style={{ 
                            padding: '10px 12px', 
                            borderRadius: '8px', 
                            border: '1px solid var(--border)',
                            background: isSelected ? 'var(--primary)' : 'white',
                            color: isSelected ? 'white' : 'var(--text-main)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          {v}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '16px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>إيجابيات</label>
                  <div 
                    onClick={() => setSelectedViolation('شكر وتقدير')}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      border: `1px solid ${selectedViolation === 'شكر وتقدير' ? '#10b981' : '#a7f3d0'}`,
                      background: selectedViolation === 'شكر وتقدير' ? '#10b981' : '#ecfdf5',
                      color: selectedViolation === 'شكر وتقدير' ? 'white' : '#059669',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      boxShadow: selectedViolation === 'شكر وتقدير' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Award size={18} />
                    شكر وتقدير
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '16px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>أخرى</label>
                  
                  <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                    <div 
                      onClick={() => setSelectedViolation('أخرى')}
                      style={{ 
                        padding: '10px 12px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border)',
                        background: selectedViolation === 'أخرى' ? 'var(--primary)' : 'white',
                        color: selectedViolation === 'أخرى' ? 'white' : 'var(--text-main)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        boxShadow: selectedViolation === 'أخرى' ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      أخرى
                    </div>
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
                </div>

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
          ) : (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                  <FileText size={20} color="var(--primary)" />
                  أرشيف الملاحظات المرسلة
                </h3>
                <button
                  onClick={handlePrintArchive}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                >
                  <Printer size={16} style={{ marginLeft: '8px' }} />
                  طباعة السجل
                </button>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input-field"
                    placeholder="بحث باسم الطالب..."
                    style={{ paddingRight: '36px', width: '220px', padding: '10px 36px 10px 12px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="input-field"
                  style={{ width: '150px', padding: '10px' }}
                  value={archiveFilterCategory}
                  onChange={(e) => setArchiveFilterCategory(e.target.value)}
                >
                  <option value="الكل">جميع التصنيفات</option>
                  <option value="المشكلات السلوكية">المشكلات السلوكية</option>
                  <option value="المشكلات الدراسية">المشكلات الدراسية</option>
                  <option value="الشكر والتقدير">الشكر والتقدير</option>
                  <option value="أخرى">أخرى</option>
                </select>

                <select
                  className="input-field"
                  style={{ width: '140px', padding: '10px' }}
                  value={archiveFilterGrade}
                  onChange={(e) => { setArchiveFilterGrade(e.target.value); setArchiveFilterClass(''); }}
                >
                  <option value="الكل">جميع الصفوف</option>
                  {[...new Set(myReports.map(r => r.grade?.trim()))].filter(Boolean).sort().map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>

                <select
                  className="input-field"
                  style={{ width: '120px', padding: '10px' }}
                  value={archiveFilterClass}
                  onChange={(e) => setArchiveFilterClass(e.target.value)}
                  disabled={archiveFilterGrade === 'الكل'}
                >
                  <option value="">جميع الفصول</option>
                  {[...new Set(
                    myReports
                      .filter(r => r.grade?.trim() === archiveFilterGrade.trim())
                      .map(r => r.class_name?.trim())
                  )].filter(Boolean).sort().map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '16px', color: 'var(--text-muted)' }}>التاريخ</th>
                      <th style={{ padding: '16px', color: 'var(--text-muted)' }}>الطالب</th>
                      <th style={{ padding: '16px', color: 'var(--text-muted)' }}>الصف/الفصل</th>
                      <th style={{ padding: '16px', color: 'var(--text-muted)' }}>التصنيف</th>
                      <th style={{ padding: '16px', color: 'var(--text-muted)' }}>الحالة</th>
                      <th style={{ padding: '16px', color: 'var(--text-muted)' }}>ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArchive.map((report) => (
                      <tr key={report.id || report._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px', fontSize: '0.9rem' }}>{new Date(report.created_at).toLocaleDateString('ar-SA')}</td>
                        <td style={{ padding: '16px', fontWeight: 600 }}>{report.student_name}</td>
                        <td style={{ padding: '16px' }}>{report.grade} - {report.class_name}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            background: 'rgba(37, 99, 235, 0.05)',
                            color: 'var(--primary)',
                            fontSize: '0.8rem',
                            border: '1px solid rgba(37, 99, 235, 0.1)',
                            fontWeight: 600
                          }}>
                            {report.violation_type}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            background: report.status === 'done' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: report.status === 'done' ? 'var(--success)' : '#d97706',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}>
                            {report.status === 'done' ? 'مكتمل' : 'قيد المعالجة'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>{report.notes || '-'}</td>
                      </tr>
                    ))}
                    {filteredArchive.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد بلاغات تطابق البحث</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherView;
