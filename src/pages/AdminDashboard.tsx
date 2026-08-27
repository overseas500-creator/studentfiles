import { useState, useEffect } from 'react';
import { PlusCircle, Search, Users, Trash2, FileUp } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    class_name: '',
    phone: '',
    student_number: ''
  });
  const [teacherFormData, setTeacherFormData] = useState({
    name: '',
    national_id: '',
    subject: ''
  });
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchTeachers();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('/api/teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/teachers', teacherFormData);
      setTeacherFormData({ name: '', national_id: '', subject: '' });
      fetchTeachers();
    } catch (err) {
      alert('Error adding teacher');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/students', formData);
      setFormData({ name: '', grade: '', class_name: '', phone: '', student_number: '' });
      fetchStudents();
    } catch (err) {
      alert('Error adding student');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع تقاريره أيضاً.')) {
      try {
        await axios.delete(`/api/students/${id}`);
        fetchStudents();
      } catch (err) {
        alert('خطأ في حذف الطالب');
      }
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
      try {
        await axios.delete(`/api/teachers/${id}`);
        fetchTeachers();
      } catch (err) {
        alert('خطأ في حذف المعلم');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (activeTab === 'students') {
      if (selectedStudents.length === 0) return;
      if (window.confirm(`هل أنت متأكد من حذف ${selectedStudents.length} طالب؟ سيتم حذف جميع تقاريرهم أيضاً.`)) {
        try {
          await axios.post('/api/students/bulk-delete', { ids: selectedStudents });
          setSelectedStudents([]);
          fetchStudents();
        } catch (err) {
          alert('خطأ في حذف الطلاب');
        }
      }
    } else {
      if (selectedTeachers.length === 0) return;
      if (window.confirm(`هل أنت متأكد من حذف ${selectedTeachers.length} معلم؟`)) {
        try {
          await axios.post('/api/teachers/bulk-delete', { ids: selectedTeachers });
          setSelectedTeachers([]);
          fetchTeachers();
        } catch (err) {
          alert('خطأ في حذف المعلمين');
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'students' | 'teachers') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (type === 'students') {
          const formattedStudents = data.map((row: any) => ({
            name: (row['اسم الطالب'] || row['الاسم'] || '').trim(),
            grade: (row['الصف'] || 'الأول الثانوي').trim(),
            class_name: (row['الفصل'] || '').trim(),
            phone: (row['رقم الجوال'] || row['الجوال'] || '').trim(),
            student_number: String(row['رقم الطالب'] || row['الهوية'] || '').trim()
          })).filter(s => s.name && s.student_number);

          if (formattedStudents.length === 0) {
            alert('لم يتم العثور على بيانات صالحة في الملف. تأكد من وجود أعمدة (اسم الطالب، الصف، الفصل، رقم الطالب)');
            return;
          }

          const res = await axios.post('/api/students/bulk', formattedStudents);
          const { count, ignored } = res.data;
          alert(`تم استيراد ${count} طالب جديد بنجاح. ${ignored ? `وتم تجاهل ${ignored} طالب موجود مسبقاً.` : ''}`);
          fetchStudents();
        } else {
          const formattedTeachers = data.map((row: any) => ({
            name: (row['اسم المعلم'] || row['الاسم'] || '').trim(),
            national_id: String(row['رقم الهوية'] || row['الهوية'] || '').trim(),
            subject: (row['المادة'] || row['مادة التدريس'] || '').trim()
          })).filter(t => t.name && t.national_id);

          if (formattedTeachers.length === 0) {
            alert('لم يتم العثور على بيانات صالحة في الملف. تأكد من وجود أعمدة (اسم المعلم، رقم الهوية)');
            return;
          }

          const res = await axios.post('/api/teachers/bulk', formattedTeachers);
          const { count, ignored } = res.data;
          alert(`تم استيراد ${count} معلم جديد بنجاح. ${ignored ? `وتم تجاهل ${ignored} معلم موجود مسبقاً.` : ''}`);
          fetchTeachers();
        }
      } catch (err: any) {
        console.error(err);
        const errorMessage = err.response?.data?.error || err.message;
        alert(`خطأ: ${errorMessage}`);
      } finally {
        setImportLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = (type: 'students' | 'teachers') => {
    let ws;
    if (type === 'students') {
      ws = XLSX.utils.json_to_sheet([
        { 'اسم الطالب': 'أحمد محمد علي', 'الصف': 'الأول الثانوي', 'الفصل': '1/1', 'رقم الجوال': '0501234567', 'رقم الطالب': '100100100' }
      ]);
    } else {
      ws = XLSX.utils.json_to_sheet([
        { 'اسم المعلم': 'سلطان القحطاني', 'رقم الهوية': '1098765432', 'المادة': 'لغتي' }
      ]);
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type === 'students' ? 'Students' : 'Teachers');
    XLSX.writeFile(wb, type === 'students' ? 'قالب_استيراد_الطلاب.xlsx' : 'قالب_استيراد_المعلمين.xlsx');
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('students')}
          style={{ 
            padding: '12px 24px', 
            borderRadius: '12px', 
            border: 'none', 
            background: activeTab === 'students' ? 'var(--primary)' : 'white',
            color: activeTab === 'students' ? 'white' : 'var(--text-main)',
            cursor: 'pointer',
            fontWeight: 600,
            boxShadow: 'var(--shadow)'
          }}
        >
          إدارة الطلاب
        </button>
        <button 
          onClick={() => setActiveTab('teachers')}
          style={{ 
            padding: '12px 24px', 
            borderRadius: '12px', 
            border: 'none', 
            background: activeTab === 'teachers' ? 'var(--primary)' : 'white',
            color: activeTab === 'teachers' ? 'white' : 'var(--text-main)',
            cursor: 'pointer',
            fontWeight: 600,
            boxShadow: 'var(--shadow)'
          }}
        >
          إدارة المعلمين
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Add Form */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlusCircle size={20} color="var(--primary)" />
            {activeTab === 'students' ? 'إضافة طالب جديد' : 'إضافة معلم جديد'}
          </h3>
          {activeTab === 'students' ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>اسم الطالب</label>
                <input 
                  className="input-field" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="أدخل الاسم الرباعي"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>الصف</label>
                  <input 
                    className="input-field"
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    placeholder="مثال: الأول الثانوي"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>الفصل</label>
                  <input 
                    className="input-field" 
                    required
                    value={formData.class_name}
                    onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                    placeholder="مثال: 1/1"
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>رقم الطالب (الهوية/الأكاديمي)</label>
                <input 
                  className="input-field" 
                  required
                  value={formData.student_number}
                  onChange={(e) => setFormData({...formData, student_number: e.target.value})}
                />
              </div>
              <button className="btn-primary" type="submit" style={{ marginTop: '10px', justifyContent: 'center' }}>
                حفظ البيانات
              </button>
            </form>
          ) : (
            <form onSubmit={handleTeacherSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>اسم المعلم</label>
                <input 
                  className="input-field" 
                  required 
                  value={teacherFormData.name}
                  onChange={(e) => setTeacherFormData({...teacherFormData, name: e.target.value})}
                  placeholder="أدخل اسم المعلم"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>رقم الهوية</label>
                <input 
                  className="input-field" 
                  required
                  value={teacherFormData.national_id}
                  onChange={(e) => setTeacherFormData({...teacherFormData, national_id: e.target.value})}
                  placeholder="أدخل رقم الهوية"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>المادة</label>
                <input 
                  className="input-field" 
                  value={teacherFormData.subject}
                  onChange={(e) => setTeacherFormData({...teacherFormData, subject: e.target.value})}
                  placeholder="اختياري: المادة"
                />
              </div>
              <button className="btn-primary" type="submit" style={{ marginTop: '10px', justifyContent: 'center' }}>
                حفظ بيانات المعلم
              </button>
            </form>
          )}
        </div>

        {/* Excel Import Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <FileUp size={32} />
          </div>
          <h3>استيراد من اكسل</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '12px 0 24px', maxWidth: '300px' }}>
            {activeTab === 'students' 
              ? 'يمكنك رفع ملف Excel يحتوي على الأعمدة: (اسم الطالب، الصف، الفصل، رقم الجوال، رقم الطالب)'
              : 'يمكنك رفع ملف Excel يحتوي على الأعمدة: (اسم المعلم، رقم الهوية، المادة)'}
          </p>
          <input 
            type="file" 
            id="excel-upload" 
            hidden 
            accept=".xlsx, .xls"
            onChange={(e) => handleFileUpload(e, activeTab)}
            disabled={importLoading}
          />
          <label 
            htmlFor="excel-upload" 
            className="btn-primary" 
            style={{ cursor: importLoading ? 'not-allowed' : 'pointer', background: 'white', border: '2px dashed var(--primary)', color: 'var(--primary)', width: '100%', justifyContent: 'center' }}
          >
            {importLoading ? 'جاري الاستيراد...' : 'اختيار ملف الاكسل'}
          </label>
          <button 
            onClick={() => downloadTemplate(activeTab)}
            style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
          >
            تحميل نموذج للملف (Template)
          </button>
        </div>
      </div>

      {/* List */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} color="var(--primary)" />
            {activeTab === 'students' ? `قائمة الطلاب (${students.length})` : `قائمة المعلمين (${teachers.length})`}
          </h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {((activeTab === 'students' && selectedStudents.length > 0) || (activeTab === 'teachers' && selectedTeachers.length > 0)) && (
              <button 
                onClick={handleBulkDelete}
                style={{ 
                  background: 'var(--danger)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
                }}
              >
                <Trash2 size={16} />
                حذف المحدد ({activeTab === 'students' ? selectedStudents.length : selectedTeachers.length})
              </button>
            )}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="input-field" 
                placeholder={activeTab === 'students' ? "بحث في الطلاب..." : "بحث في المعلمين..."}
                style={{ paddingRight: '36px', width: '250px', padding: '10px 36px 10px 12px' }} 
              />
            </div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {activeTab === 'students' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedStudents(students.map(s => s.id || s._id));
                        else setSelectedStudents([]);
                      }}
                      checked={students.length > 0 && selectedStudents.length === students.length}
                    />
                  </th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>الاسم</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>الصف/الفصل</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>رقم الطالب</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>الجوال</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(student.id || student._id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedStudents([...selectedStudents, student.id || student._id]);
                          else setSelectedStudents(selectedStudents.filter(id => id !== (student.id || student._id)));
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{student.name}</td>
                    <td style={{ padding: '12px' }}>{student.grade} - {student.class_name}</td>
                    <td style={{ padding: '12px' }}>{student.student_number}</td>
                    <td style={{ padding: '12px' }}>{student.phone}</td>
                    <td style={{ padding: '12px' }}>
                      <button onClick={() => handleDeleteStudent(student.id || student._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTeachers(teachers.map(t => t.id || t._id));
                        else setSelectedTeachers([]);
                      }}
                      checked={teachers.length > 0 && selectedTeachers.length === teachers.length}
                    />
                  </th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>الاسم</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>رقم الهوية</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>المادة</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedTeachers.includes(teacher.id || teacher._id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTeachers([...selectedTeachers, teacher.id || teacher._id]);
                          else setSelectedTeachers(selectedTeachers.filter(id => id !== (teacher.id || teacher._id)));
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{teacher.name}</td>
                    <td style={{ padding: '12px' }}>{teacher.national_id}</td>
                    <td style={{ padding: '12px' }}>{teacher.subject}</td>
                    <td style={{ padding: '12px' }}>
                      <button onClick={() => handleDeleteTeacher(teacher.id || teacher._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
