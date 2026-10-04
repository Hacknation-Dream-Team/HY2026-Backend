import { useState, useEffect } from 'react';
import './App.css';
import { Wizard } from './Wizard';
import { MainView } from './MainView';
import { LoginView } from './views/LoginView';

export function App() {
  const [view, setView] = useState<'authChoice' | 'login' | 'wizard' | 'main'>('authChoice');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
      setView('main');
    }
  }, []);

  const handleLogin = (user: any) => {
    localStorage.setItem('user', JSON.stringify(user));
    setUserData(user);
    setView('main');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUserData(null);
    setView('authChoice');
  };

  if (view === 'authChoice') {
    return (
      <div className="fade-in app-container" style={{ padding: '40px 20px', textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '10px', color: '#0d6efd', fontSize: '32px' }}>Commuter Share</h1>
        <p style={{ color: '#6c757d', marginBottom: '40px' }}>Wspólne dojazdy do pracy.</p>
        
        <button 
          onClick={() => setView('login')}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#0d6efd', color: 'white', border: 'none', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', cursor: 'pointer' }}
        >
          Zaloguj się
        </button>
        <button 
          onClick={() => setView('wizard')}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: 'white', color: '#212529', border: '1px solid #ced4da', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Załóż nowe konto
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <main className="app-content">
        {view === 'login' && <LoginView onLogin={handleLogin} onBack={() => setView('authChoice')} />}
        {view === 'wizard' && <Wizard onComplete={handleLogin} onBack={() => setView('authChoice')} />}
        {view === 'main' && <MainView user={userData} onLogout={handleLogout} />}
      </main>
    </div>
  );
}

export default App;
