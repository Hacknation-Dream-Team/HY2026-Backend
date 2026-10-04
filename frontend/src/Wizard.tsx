import { useState } from 'react';
import { CheckCircle2, ChevronRight, UserCircle2, Building2, MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from './api';

import { LocationPicker } from './LocationPicker';

export function Wizard({ onComplete, onBack }: { onComplete: (user: any) => void, onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Personal Data
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [personalErrors, setPersonalErrors] = useState<string[]>([]);

  // Step 2: Location Data
  const [organization, setOrganization] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [, setHomeCoords] = useState<{lat: number, lng: number} | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationErrors, setLocationErrors] = useState<string[]>([]);

  const handleNextStep1 = () => {
    const errs = [];
    if (!name.trim()) errs.push('ImiÄ™ jest wymagane.');
    if (!surname.trim()) errs.push('Nazwisko jest wymagane.');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('WprowadĹş poprawny email.');
    if (!password.trim()) errs.push('HasĹ‚o jest wymagane.');
    if (!gender) errs.push('Wybierz pĹ‚eÄ‡.');
    setPersonalErrors(errs);
    if (errs.length === 0) setStep(2);
  };

  const handleNextStep2 = () => {
    const errs = [];
    if (!organization.trim()) errs.push('Wybierz organizacjÄ™ (punkt docelowy).');
    if (!homeAddress.trim()) errs.push('Podaj miejsce zamieszkania (punkt startowy).');
    setLocationErrors(errs);
    if (errs.length === 0) setStep(3);
  };

  const submitToBackend = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        surname,
        email,
        password,
        phone,
        gender, // sent to backend even if backend ignores it for now
        organizationId: parseInt(organization) || 1, // backend requires organizationId as number
        organizationName: organization, // keep for UI logic
        homeAddressText: homeAddress,
      };
      
      const authData = await api.register(payload);
      localStorage.setItem('token', authData.token);
      
      const updatedUser = await api.updateHomeAddress({
        homeAddress: homeAddress,
        homeLocation: {
           latitude: 50.06, // hardcoded if picker isn't used
           longitude: 19.94
        }
      }, authData.token);

      onComplete({ ...updatedUser, organizationName: organization, homeAddressText: homeAddress });
    } catch (e: any) {
      console.error(e);
      alert('BĹ‚Ä…d rejestracji: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', paddingBottom: '30px' }}>
      {step < 4 && (
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '6px', width: step === i ? '20px' : '10px', borderRadius: '3px', backgroundColor: step >= i ? '#0d6efd' : '#e9ecef', transition: 'all 0.3s ease' }}></div>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card fade-in" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#212529', cursor: 'pointer', padding: '4px' }}>
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', margin: 0 }}><UserCircle2 size={26} color="#0d6efd" /> O Tobie</h2>
          </div>
          <p style={{ color: '#6c757d', marginBottom: '24px', fontSize: '14px' }}>WprowadĹş swoje dane podstawowe.</p>

          {personalErrors.length > 0 && (
            <div style={{ backgroundColor: '#f8d7da', color: '#842029', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {personalErrors.map((err, idx) => <div key={idx}>â€˘ {err}</div>)}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>ImiÄ™ *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Jan" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Nazwisko *</label>
              <input type="text" value={surname} onChange={e => setSurname(e.target.value)} className="input-field" placeholder="Kowalski" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="jan@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>HasĹ‚o *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Minimum 8 znakĂłw" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Numer telefonu</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input-field" placeholder="+48 123 456 789" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>PĹ‚eÄ‡ *</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="input-field" style={inputStyle}>
                <option value="">Wybierz...</option>
                <option value="MÄ™ĹĽczyzna">MÄ™ĹĽczyzna</option>
                <option value="Kobieta">Kobieta</option>
                <option value="Inne">Inne</option>
                <option value="Nie chcÄ™ podawaÄ‡">Nie chcÄ™ podawaÄ‡</option>
              </select>
            </div>
          </div>

          <button onClick={handleNextStep1} style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#0d6efd', color: 'white', border: 'none', fontSize: '16px', fontWeight: 'bold', marginTop: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            Dalej <ChevronRight size={20} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card fade-in" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#212529', cursor: 'pointer', padding: '4px' }}>
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', margin: 0 }}><Building2 size={26} color="#0d6efd" /> Lokalizacje</h2>
          </div>
          <p style={{ color: '#6c757d', marginBottom: '24px', fontSize: '14px' }}>Ustal swoje staĹ‚e punkty podrĂłĹĽy.</p>

          {locationErrors.length > 0 && (
            <div style={{ backgroundColor: '#f8d7da', color: '#842029', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {locationErrors.map((err, idx) => <div key={idx}>â€˘ {err}</div>)}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Organizacja (Twoje miejsce pracy) *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da' }}>
                <Building2 size={18} color="#0d6efd" />
                <select value={organization} onChange={e => setOrganization(e.target.value)} style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '15px' }}>
                  <option value="">Wybierz organizacjÄ™...</option>
                  <option value="1">BBP (Business Park)</option>
                  <option value="2">Uniwersytet JagielloĹ„ski</option>
                  <option value="3">AGH KrakĂłw</option>
                  <option value="4">Korporacja XYZ</option>
                </select>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '6px', marginBottom: 0 }}>To bÄ™dzie TwĂłj domyĹ›lny punkt docelowy w dni robocze.</p>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Miejsce zamieszkania (Dom) *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da' }}>
                <MapPin size={18} color="#198754" />
                <input type="text" value={homeAddress} onChange={e => setHomeAddress(e.target.value)} placeholder="Wpisz swĂłj adres" style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '15px' }} />
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '6px', marginBottom: 0 }}>To bÄ™dzie TwĂłj domyĹ›lny punkt startowy w dni robocze.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button onClick={handleNextStep2} style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#0d6efd', color: 'white', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              Dalej <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card fade-in" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button onClick={() => setStep(2)} disabled={isSubmitting} style={{ background: 'none', border: 'none', color: '#212529', cursor: 'pointer', padding: '4px' }}>
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Podsumowanie</h2>
          </div>
          
          <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', color: '#6c757d', marginBottom: '12px', textTransform: 'uppercase' }}>O Tobie</h3>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{name} {surname}</div>
            <div style={{ fontSize: '14px', color: '#495057' }}>{email}</div>
          </div>

          <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', color: '#6c757d', marginBottom: '12px', textTransform: 'uppercase' }}>Lokalizacje</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <MapPin size={18} color="#198754" /> 
              <span style={{ fontSize: '14px', color: '#212529' }}>Dom: {homeAddress}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Building2 size={18} color="#0d6efd" /> 
              <span style={{ fontSize: '14px', color: '#212529' }}>Praca: {organization === '1' ? 'BBP (Business Park)' : organization === '2' ? 'Uniwersytet JagielloĹ„ski' : organization === '3' ? 'AGH KrakĂłw' : 'Korporacja XYZ'}</span>
            </div>
          </div>

          <button onClick={submitToBackend} disabled={isSubmitting} style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#198754', color: 'white', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {isSubmitting ? <><Loader2 size={20} className="spin" /> Zapisywanie...</> : <>UtwĂłrz konto <CheckCircle2 size={20} /></>}
          </button>
        </div>
      )}

      {showMapPicker && (
        <LocationPicker 
          initialAddress={homeAddress} 
          onClose={() => setShowMapPicker(false)} 
          onLocationSelected={(addr, lat, lng) => {
            setHomeAddress(addr);
            setHomeCoords({lat, lng});
            setShowMapPicker(false);
          }} 
        />
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none', fontSize: '15px'
};

