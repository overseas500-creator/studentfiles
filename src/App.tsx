import { useState } from 'react';
import { Shield, GraduationCap, LayoutDashboard, Lock } from 'lucide-react';
import AdminDashboard from './pages/AdminDashboard';
import TeacherView from './pages/TeacherView';
import CounselorDashboard from './pages/CounselorDashboard';

type Role = 'ADMIN' | 'TEACHER' | 'COUNSELOR' | 'NONE';

function App() {
  const [role, setRole] = useState<Role>('NONE');
  const [password, setPassword] = useState('');
  const [showPassModal, setShowPassModal] = useState<Role>('NONE');

  const handleRoleSelection = (selectedRole: Role) => {
    setShowPassModal(selectedRole);
  };

  const handleLogin = () => {
    if (password === '1245') {
      setRole(showPassModal);
      setShowPassModal('NONE');
      setPassword('');
    } else {
      alert('الرقم السري غير صحيح');
    }
  };

  const RoleCard = ({ title, icon: Icon, onClick, color }: any) => (
    <div className="glass-card animate-fade" style={{ cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s' }} onClick={onClick}>
      <div style={{ background: color, width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Icon size={32} color="white" />
      </div>
      <h3 style={{ marginBottom: '8px' }}>{title}</h3>
    </div>
  );

  if (role === 'NONE' && showPassModal === 'NONE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '10px', textAlign: 'center', color: 'var(--primary)' }}>منصة الضبط المدرسي</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>نظام المراسلة والأرشفة المتكامل</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', width: '100%', maxWidth: '900px' }}>
            <RoleCard title="الأدمن (الإدارة)" icon={Shield} onClick={() => handleRoleSelection('ADMIN')} color="#4f46e5" />
            <RoleCard title="المعلم" icon={GraduationCap} onClick={() => handleRoleSelection('TEACHER')} color="#059669" />
            <RoleCard title="وكيل المدرسة / الموجه الطلابي" icon={LayoutDashboard} onClick={() => handleRoleSelection('COUNSELOR')} color="#d97706" />
          </div>
        </div>
        <footer>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>فكرة المعلم / عبدالله هزاع الذويبي</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>تنفيذ مدير المدرسة / ماجد عثمان الزهراني</p>
        </footer>
      </div>
    );
  }

  if (showPassModal !== 'NONE') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-light)' }}>
        <div className="glass-card animate-fade" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ background: 'var(--primary)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Lock size={20} color="white" />
          </div>
          <h2 style={{ marginBottom: '8px' }}>تسجيل الدخول</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>يرجى إدخال الرقم السري للوصول</p>
          <input 
            type="password"
            className="input-field"
            placeholder="الرقم السري"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleLogin}>دخول</button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#e2e8f0', color: 'var(--text-main)' }} onClick={() => setShowPassModal('NONE')}>إلغاء</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav style={{ padding: '16px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
        <h2 style={{ fontSize: '1.25rem', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => setRole('NONE')}>
          <Shield size={24} /> منصة الضبط المدرسي
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>المستخدم</p>
            <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{role === 'ADMIN' ? 'مدير النظام' : role === 'TEACHER' ? 'المعلم' : 'الوكيل/الموجه الطلابي'}</p>
          </div>
          <button 
            onClick={() => setRole('NONE')}
            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
          >
            خروج
          </button>
        </div>
      </nav>

      <main style={{ padding: '32px 40px', flex: 1 }}>
        {role === 'ADMIN' && <AdminDashboard />}
        {role === 'TEACHER' && <TeacherView />}
        {role === 'COUNSELOR' && <CounselorDashboard />}
      </main>

      <footer style={{ background: 'white', padding: '12px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>فكرة المعلم / عبدالله هزاع الذويبي | تنفيذ مدير المدرسة / ماجد عثمان الزهراني</p>
      </footer>
    </div>
  );
}

export default App;
