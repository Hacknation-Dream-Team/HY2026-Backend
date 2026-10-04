import { User, LogOut, Settings, ArrowLeft, Car } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CarFormFields } from '../CarFormFields';
import { api } from '../api';

export function ProfileView({ user, onLogout }: { user?: any, onLogout?: () => void }) {
  const [showSettings, setShowSettings] = useState(false);
  const [carData, setCarData] = useState<any>({ brand: 'Toyota', model: 'Yaris', plate: 'KR 12345', color: 'Srebrny', seats: 3 });
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    api.getOrganizations().then(data => setOrganizations(data)).catch(err => console.error(err));
  }, []);

  if (showSettings) {
    return (
      <div className="fade-in" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: '#212529', cursor: 'pointer', padding: '4px' }}>
            <ArrowLeft size={24} />
          </button>
          <h1 style={{ fontSize: '20px', margin: 0 }}>Ustawienia konta</h1>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', margin: 0, color: '#0d6efd', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} /> Dane personalne
          </h2>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Imię</label>
            <input type="text" defaultValue={user?.name} className="input-field" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Nazwisko</label>
            <input type="text" defaultValue={user?.surname} className="input-field" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Numer telefonu</label>
            <input type="tel" defaultValue={user?.phone} className="input-field" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Płeć</label>
            <select defaultValue={user?.gender !== undefined ? user.gender : ''} className="input-field" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }}>
              <option value="">Wybierz...</option>
              <option value="Male">Mężczyzna</option>
              <option value="Female">Kobieta</option>
              <option value="Other">Inne / Nie chcę podawać</option>
            </select>
          </div>
          
          <h2 style={{ fontSize: '16px', margin: '8px 0 0 0', color: '#0d6efd', display: 'flex', alignItems: 'center', gap: '8px' }}>
             Lokalizacje
          </h2>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Miejsce zamieszkania</label>
            <input type="text" defaultValue={user?.homeAddressText || user?.homeAddress || ''} className="input-field" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Organizacja (Praca)</label>
            <select defaultValue={user?.organizationName || ''} className="input-field" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none', backgroundColor: 'white' }}>
              <option value="">Wybierz organizację...</option>
              {organizations.map(org => (
                <option key={org.id} value={org.name}>{org.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <h2 style={{ fontSize: '16px', margin: 0, color: '#198754', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car size={18} /> Twój samochód
          </h2>
          <CarFormFields 
            carData={carData} 
            onChange={setCarData} 
          />
        </div>

        <button className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '24px', fontSize: '16px', backgroundColor: '#0d6efd' }} onClick={() => setShowSettings(false)}>
          Zapisz zmiany
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', margin: '0 0 24px 0', color: '#212529' }}>Twój profil</h1>
      
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '100px', height: '100px', backgroundColor: '#f8f9fa', border: '2px dashed #ced4da', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {user?.profileImg ? <img src={user.profileImg} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <User size={40} color="#adb5bd" />}
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#212529' }}>{user?.name || 'Użytkownik'} {user?.surname || ''}</h2>
          <div style={{ color: '#6c757d', fontSize: '14px' }}>{user?.email || 'email@example.com'}</div>
          {user?.phone && <div style={{ color: '#6c757d', fontSize: '14px' }}>{user.phone}</div>}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={() => setShowSettings(true)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e9ecef', cursor: 'pointer' }}>
          <Settings size={20} color="#495057" />
          <span style={{ fontSize: '15px', color: '#212529', fontWeight: '500' }}>Ustawienia konta</span>
        </button>
        <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#fff5f5', borderRadius: '12px', border: '1px solid #ffe3e3', cursor: 'pointer', color: '#dc3545' }}>
          <LogOut size={20} />
          <span style={{ fontSize: '15px', fontWeight: '500' }}>Wyloguj się</span>
        </button>
      </div>
    </div>
  );
}
