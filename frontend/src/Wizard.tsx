import { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, UserCircle2, Building2, MapPin, ArrowLeft, Loader2, Map as MapIcon } from 'lucide-react';
import { api } from './api';
import { LocationPicker } from './LocationPicker';
import { geocode } from './MapRoute';

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
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [organization, setOrganization] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [homeCoords, setHomeCoords] = useState<{lat: number, lng: number} | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationErrors, setLocationErrors] = useState<string[]>([]);

  useEffect(() => {
    api.getOrganizations()
      .then((orgs) => {
        if (Array.isArray(orgs) && orgs.length > 0) {
          setOrganizations(orgs);
          setOrganization(orgs[0].id.toString());
        }
      })
      .catch((err) => console.error('Błąd pobierania organizacji:', err));
  }, []);

  const handleNextStep1 = () => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Imię jest wymagane.');
    if (!surname.trim()) errs.push('Nazwisko jest wymagane.');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Wprowadź poprawny email.');
    if (!password.trim()) errs.push('Hasło jest wymagane.');
    if (password.length > 0 && password.length < 6) errs.push('Hasło musi mieć co najmniej 6 znaków.');
    if (!gender) errs.push('Wybierz płeć.');
    setPersonalErrors(errs);
    if (errs.length === 0) setStep(2);
  };

  const handleNextStep2 = () => {
    const errs: string[] = [];
    if (!organization.trim()) errs.push('Wybierz organizację (punkt docelowy).');
    if (!homeAddress.trim()) errs.push('Podaj miejsce zamieszkania (punkt startowy).');
    setLocationErrors(errs);
    if (errs.length === 0) setStep(3);
  };

  const geocodeAddress = async (addr: string) => {
    try {
      const latlng = await geocode(addr);
      if (latlng) {
        return { latitude: latlng.lat, longitude: latlng.lng };
      }
    } catch (e) {
      console.error(e);
    }
    return { latitude: 50.0647, longitude: 19.9450 }; // Kraków fallback
  };

  const submitToBackend = async () => {
    setIsSubmitting(true);
    try {
      let finalLocation = homeCoords ? { latitude: homeCoords.lat, longitude: homeCoords.lng } : null;
      if (!finalLocation && homeAddress.trim()) {
        finalLocation = await geocodeAddress(homeAddress.trim());
      }

      const payload = {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || null,
        gender: gender || null, // "Female" | "Male" | "Other"
        organizationId: organization ? parseInt(organization, 10) : null,
        homeAddress: homeAddress.trim() || null,
        homeLocation: finalLocation
      };

      const authData = await api.register(payload);
      if (authData?.token) {
        localStorage.setItem('token', authData.token);
      }

      const selectedOrg = organizations.find(o => o.id.toString() === organization);
      const userResult = authData?.user || authData;
      
      onComplete({
        ...userResult,
        organizationName: selectedOrg ? selectedOrg.name : 'Wybrana organizacja',
        homeAddressText: homeAddress
      });
    } catch (e: any) {
      console.error(e);
      alert('Błąd rejestracji: ' + (e.message || 'Wystąpił nieoczekiwany błąd.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOrgName = organizations.find(o => o.id.toString() === organization)?.name || (
    organization === '1' ? 'BBP (Business Park)' :
    organization === '2' ? 'Uniwersytet Jagielloński' :
    organization === '3' ? 'AGH Kraków' :
    'Organizacja'
  );

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
          <p style={{ color: '#6c757d', marginBottom: '24px', fontSize: '14px' }}>Wprowadź swoje dane podstawowe.</p>

          {personalErrors.length > 0 && (
            <div style={{ backgroundColor: '#f8d7da', color: '#842029', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {personalErrors.map((err, idx) => <div key={idx}>• {err}</div>)}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Imię *</label>
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Hasło *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Minimum 6 znaków" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Numer telefonu</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input-field" placeholder="+48 123 456 789" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Płeć *</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="input-field" style={inputStyle}>
                <option value="">Wybierz...</option>
                <option value="Male">Mężczyzna</option>
                <option value="Female">Kobieta</option>
                <option value="Other">Inna / Nie chcę podawać</option>
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
          <p style={{ color: '#6c757d', marginBottom: '24px', fontSize: '14px' }}>Ustal swoje stałe punkty podróży.</p>

          {locationErrors.length > 0 && (
            <div style={{ backgroundColor: '#f8d7da', color: '#842029', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {locationErrors.map((err, idx) => <div key={idx}>• {err}</div>)}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Organizacja (Twoje miejsce pracy) *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da' }}>
                <Building2 size={18} color="#0d6efd" />
                <select value={organization} onChange={e => setOrganization(e.target.value)} style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '15px' }}>
                  <option value="">Wybierz organizację...</option>
                  {organizations.length > 0 ? (
                    organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="1">BBP (Business Park)</option>
                      <option value="2">Uniwersytet Jagielloński</option>
                      <option value="3">AGH Kraków</option>
                      <option value="4">Korporacja XYZ</option>
                    </>
                  )}
                </select>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '6px', marginBottom: 0 }}>To będzie Twój domyślny punkt docelowy w dni robocze.</p>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontWeight: '600', fontSize: '14px', margin: 0 }}>Miejsce zamieszkania (Dom) *</label>
                <button 
                  type="button" 
                  onClick={() => setShowMapPicker(true)}
                  style={{ background: 'none', border: 'none', color: '#0d6efd', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                >
                  <MapIcon size={14} /> Wybierz na mapie
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da' }}>
                <MapPin size={18} color="#198754" />
                <input 
                  type="text" 
                  value={homeAddress} 
                  onChange={e => {
                    setHomeAddress(e.target.value);
                    setHomeCoords(null);
                  }} 
                  placeholder="np. Kraków, ul. Długa 1" 
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '15px' }} 
                />
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '6px', marginBottom: 0 }}>To będzie Twój domyślny punkt startowy w dni robocze.</p>
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
            {phone && <div style={{ fontSize: '14px', color: '#495057' }}>{phone}</div>}
          </div>

          <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', color: '#6c757d', marginBottom: '12px', textTransform: 'uppercase' }}>Lokalizacje</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <MapPin size={18} color="#198754" /> 
              <span style={{ fontSize: '14px', color: '#212529' }}>Dom: {homeAddress}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Building2 size={18} color="#0d6efd" /> 
              <span style={{ fontSize: '14px', color: '#212529' }}>Praca: {selectedOrgName}</span>
            </div>
          </div>

          <button onClick={submitToBackend} disabled={isSubmitting} style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#198754', color: 'white', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {isSubmitting ? <><Loader2 size={20} className="spin" /> Zapisywanie...</> : <>Utwórz konto <CheckCircle2 size={20} /></>}
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
