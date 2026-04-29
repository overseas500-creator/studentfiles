import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { FileText, Printer, BarChart3, TrendingUp, Filter, Search } from 'lucide-react';
import axios from 'axios';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CounselorDashboard = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ violationStats: [], classStats: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('الكل');
  const [filterClass, setFilterClass] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        axios.get('/api/reports'),
        axios.get('/api/stats')
      ]);
      setReports(reportsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.student_name.includes(searchQuery) || (r.student_number && r.student_number.includes(searchQuery));
    const matchesGrade = filterGrade === 'الكل' || r.grade === filterGrade;
    const matchesClass = !filterClass || r.class_name.includes(filterClass);
    return matchesSearch && matchesGrade && matchesClass;
  });

  const handlePrint = (studentId: number) => {
    const studentReports = reports.filter(r => r.student_id === studentId);
    const studentName = studentReports[0]?.student_name || 'طالب';
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>تقرير أرشيف الطالب - ${studentName}</title>
            <style>
              body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
              h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
              .student-info { margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
              th { background-color: #f5f5f5; }
              .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>
            <h1>سجل انضباط الطالب</h1>
            <div class="student-info">
              <p><strong>اسم الطالب:</strong> ${studentName}</p>
              <p><strong>الصف/الفصل:</strong> ${studentReports[0]?.grade} - ${studentReports[0]?.class_name}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المعلم</th>
                  <th>المادة</th>
                  <th>المخالفة</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                ${studentReports.map(r => `
                  <tr>
                    <td>${new Date(r.created_at).toLocaleDateString('ar-SA')}</td>
                    <td>${r.teacher_name}</td>
                    <td>${r.subject}</td>
                    <td>${r.violation_type}</td>
                    <td>${r.notes || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>توقيع وكيل المدرسة: _______________</p>
              <p>توقيع الموجه الطلابي: _______________</p>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="animate-fade">
      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
            <FileText size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>إجمالي المخالفات</p>
            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{reports.length}</h2>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>المخالفة الأكثر تكراراً</p>
            <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>{stats.violationStats[0]?.violation_type || 'لا يوجد'}</h2>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={20} color="var(--primary)" />
            المشكلات المتكررة
          </h3>
          <div style={{ flex: 1, minHeight: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.violationStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="violation_type" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: 'var(--shadow)' }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                  {stats.violationStats.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={20} color="var(--primary)" />
            حالة الانضباط حسب الفصول
          </h3>
          <div style={{ flex: 1, minHeight: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.classStats}
                  dataKey="count"
                  nameKey="class_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {stats.classStats.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: 'var(--shadow)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="var(--primary)" />
            أرشيف البلاغات
          </h3>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
              style={{ width: '140px', padding: '10px' }}
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
            >
              <option value="الكل">جميع الصفوف</option>
              {[...new Set(reports.map(r => r.grade?.trim()))].filter(Boolean).sort().map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            <select 
              className="input-field" 
              style={{ width: '120px', padding: '10px' }}
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              disabled={filterGrade === 'الكل'}
            >
              <option value="">جميع الفصول</option>
              {[...new Set(
                reports
                  .filter(r => r.grade?.trim() === filterGrade.trim())
                  .map(r => r.class_name?.trim())
              )].filter(Boolean).sort().map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>التاريخ</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>الطالب</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>الصف/الفصل</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>المعلم</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>المخالفة</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', fontSize: '0.9rem' }}>{new Date(report.created_at).toLocaleDateString('ar-SA')}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{report.student_name}</td>
                  <td style={{ padding: '16px' }}>{report.grade} - {report.class_name}</td>
                  <td style={{ padding: '16px' }}>{report.teacher_name}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      background: 'rgba(239, 68, 68, 0.05)', 
                      color: 'var(--danger)',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(239, 68, 68, 0.1)',
                      fontWeight: 600
                    }}>
                      {report.violation_type}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button 
                      onClick={() => handlePrint(report.student_id)}
                      className="btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'white', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                    >
                      <Printer size={14} style={{ marginLeft: '4px' }} /> طباعة أرشيف
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد بلاغات تطابق البحث</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CounselorDashboard;
