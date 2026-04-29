import { useState, useEffect } from 'react';
import { PlusCircle, Search, Users, Trash2, FileUp } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    grade: 'الأول الثانوي',
    class_name: '',
    phone: '',
    student_number: ''
  });
  const [importLoading, setImportLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/students', formData);
      setFormData({ name: '', grade: 'الأول الثانوي', class_name: '', phone: '', student_number: '' });
      fetchStudents();
    } catch (err) {
      alert('Error adding student');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        const formattedStudents = data.map((row: any) => ({
          name: row['اسم الطالب'] || row['الاسم'],
          grade: row['الصف'] || 'الأول الثانوي',
          class_name: row['الفصل'] || '',
          phone: row['رقم الجوال'] || row['الجوال'],
          student_number: String(row['رقم الطالب'] || row['الهوية'] || '')
        })).filter(s => s.name && s.student_number);

        if (formattedStudents.length === 0) {
          alert('لم يتم العثور على بيانات صالحة في الملف. تأكد من وجود أعمدة (اسم الطالب، الصف، الفصل، رقم الطالب)');
          return;
        }

        await axios.post('/api/students/bulk', formattedStudents);
        alert(`تم استيراد ${formattedStudents.length} طالب بنجاح`);
        fetchStudents();
      } catch (err: any) {
        console.error(err);
        const errorMessage = err.response?.data?.error || err.message;
        if (err.response) {
          alert(`خطأ من الخادم: ${errorMessage}`);
        } else {
          alert('حدث خطأ أثناء قراءة الملف أو مشكلة في الاتصال');
        }
      } finally {
        setImportLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'اسم الطالب': 'أحمد محمد علي', 'الصف': 'الأول الثانوي', 'الفصل': '1/1', 'رقم الجوال': '0501234567', 'رقم الطالب': '100100100' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'قالب_استيراد_الطلاب.xlsx');
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Add Student Form */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlusCircle size={20} color="var(--primary)" />
            إضافة طالب جديد
          </h3>
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
                <select 
                  className="input-field"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                >
                  <option>الأول الثانوي</option>
                  <option>الثاني الثانوي</option>
                  <option>الثالث الثانوي</option>
                </select>
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
        </div>

        {/* Excel Import Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <FileUp size={32} />
          </div>
          <h3>استيراد من اكسل</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '12px 0 24px', maxWidth: '300px' }}>
            يمكنك رفع ملف Excel يحتوي على الأعمدة: (اسم الطالب، الصف، الفصل، رقم الجوال، رقم الطالب)
          </p>
          <input 
            type="file" 
            id="excel-upload" 
            hidden 
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
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
            onClick={downloadTemplate}
            style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
          >
            تحميل نموذج للملف (Template)
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} color="var(--primary)" />
            قائمة الطلاب ({students.length})
          </h3>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input-field" 
              placeholder="بحث في الطلاب..." 
              style={{ paddingRight: '36px', width: '250px', padding: '10px 36px 10px 12px' }} 
            />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
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
                  <td style={{ padding: '12px', fontWeight: 600 }}>{student.name}</td>
                  <td style={{ padding: '12px' }}>{student.grade} - {student.class_name}</td>
                  <td style={{ padding: '12px' }}>{student.student_number}</td>
                  <td style={{ padding: '12px' }}>{student.phone}</td>
                  <td style={{ padding: '12px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
