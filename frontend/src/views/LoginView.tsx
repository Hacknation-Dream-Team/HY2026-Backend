import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../api';

export function LoginView({ onLogin, onBack }: { onLogin: (user: any) => void, onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Wypełnij wszystkie pola.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const authData = await api.login({ email, password });
      localStorage.setItem('token', authData.token);
      
      try {
        const fullUser = await fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${authData.token}` } }).then(r => r.json());
        onLogin({ ...authData.user, homeAddressText: fullUser.homeAddress });
      } catch {
        onLogin(authData.user);
      }
    } catch (e: any) {
      setError(e.message || 'Nie udało się zalogować.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#212529', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Zaloguj się</h1>
      </div>
      
      {error && <div style={{ backgroundColor: '#f8d7da', color: '#842029', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="Twój e-mail" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Hasło</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Twoje hasło" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
        </div>
        
        <button 
          onClick={handleLogin} 
          disabled={isLoading}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#0d6efd', color: 'white', border: 'none', fontSize: '16px', fontWeight: 'bold', marginTop: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          {isLoading ? <><Loader2 size={20} className="spin" /> Logowanie...</> : 'Zaloguj się'}
        </button>
      </div>
    </div>
  );
}
