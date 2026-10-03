import { useState } from 'react';
import { Car, UserCircle2, PlusCircle, Calendar as CalendarIcon, Clock, MapPin, Trash2, ArrowLeft, Search, Map } from 'lucide-react';
import { MapRoute } from '../MapRoute';

export function DiscoverView({ user, onOpenChat }: { user?: any, onOpenChat: (id: string) => void }) {
  const [roleTab, setRoleTab] = useState<'driver' | 'passenger'>('driver');
  const [action, setAction] = useState<'none' | 'offer' | 'search' | 'addCar'>('none');
  const [tempHasCar, setTempHasCar] = useState(false); // local mock state for when user adds car in this session

  const handleOffer = () => {
    if (!user?.carPlate && !tempHasCar) {
      setAction('addCar');
    } else {
      setAction('offer');
    }
  };

  if (action === 'addCar') return <AddCarView onBack={() => setAction('none')} onSaved={() => { setTempHasCar(true); setAction('offer'); }} />;
  if (action === 'offer') return <OfferRideView onBack={() => setAction('none')} user={user} />;
  if (action === 'search') return <SearchRideView onBack={() => setAction('none')} onOpenChat={onOpenChat} user={user} />;

  return (
    <div className="fade-in" style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', margin: '0 0 20px 0', color: '#212529' }}>Odkryj przejazdy</h1>
      
      {/* Top Tabs */}
      <div style={{ display: 'flex', backgroundColor: '#e9ecef', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
        <button onClick={() => setRoleTab('driver')} style={tabStyle(roleTab === 'driver')}>
          <Car size={18} /> Kierowca
        </button>
        <button onClick={() => setRoleTab('passenger')} style={tabStyle(roleTab === 'passenger')}>
          <UserCircle2 size={18} /> Pasażer
        </button>
      </div>

      {roleTab === 'driver' ? (
        <DriverSection onOffer={handleOffer} />
      ) : (
        <PassengerSection onSearch={() => setAction('search')} />
      )}
    </div>
  );
}

function DriverSection({ onOffer }: { onOffer: () => void }) {
  const [cancelDate, setCancelDate] = useState('');

  const handleCancel = () => {
    if (!cancelDate) alert('Wybierz datę!');
    else {
      alert(`Odwołano przejazd w dniu: ${cancelDate}`);
      setCancelDate('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <button 
        className="card" 
        onClick={onOffer}
        style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#f0fdf4', border: '1px solid #d1e7dd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 15px rgba(25,135,84,0.05)', width: '100%' }}
      >
        <div style={{ backgroundColor: '#198754', color: 'white', padding: '12px', borderRadius: '50%' }}><PlusCircle size={24} /></div>
        <div style={{ textAlign: 'left' }}>
          <strong style={{ color: '#198754', fontSize: '16px', display: 'block' }}>Ogłoś nowy przejazd</strong>
          <span style={{ color: '#6c757d', fontSize: '13px' }}>Zabierz pasażerów na swojej trasie</span>
        </div>
      </button>

      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '12px', color: '#212529' }}>Zaplanowane przejazdy</h2>
        
        <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #ced4da' }}>
          Nie masz jeszcze żadnych zaplanowanych przejazdów.
        </div>
      </div>
    </div>
  );
}

function PassengerSection({ onSearch }: { onSearch: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <button 
        className="card" 
        onClick={onSearch}
        style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#eff6ff', border: '1px solid #cfe2ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 15px rgba(13,110,253,0.05)', width: '100%' }}
      >
        <div style={{ backgroundColor: '#0d6efd', color: 'white', padding: '12px', borderRadius: '50%' }}><Search size={24} /></div>
        <div style={{ textAlign: 'left' }}>
          <strong style={{ color: '#0d6efd', fontSize: '16px', display: 'block' }}>Szukaj przejazdu</strong>
          <span style={{ color: '#6c757d', fontSize: '13px' }}>Znajdź kierowcę na swojej trasie</span>
        </div>
      </button>

      <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #ced4da' }}>
        Twoje zapisane trasy i historia przejazdów pojawią się tutaj.
      </div>
    </div>
  );
}

function AddCarView({ onBack, onSaved }: { onBack: () => void, onSaved: () => void }) {
  return (
    <div className="fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#212529', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', margin: 0 }}>Dodaj samochód</h1>
      </div>
      
      <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>Zanim ogłosisz przejazd, musisz dodać dane swojego samochodu.</p>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Marka i model</label>
          <input type="text" placeholder="np. Toyota Yaris" className="input-field" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Numer rejestracyjny</label>
          <input type="text" placeholder="np. KR 12345" className="input-field" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Liczba miejsc dla pasażerów</label>
          <input type="number" defaultValue="3" className="input-field" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
        </div>

        <button className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px', fontSize: '16px', backgroundColor: '#0d6efd' }} onClick={onSaved}>
          Zapisz i kontynuuj
        </button>
      </div>
    </div>
  );
}

function OfferRideView({ onBack, user }: { onBack: () => void, user?: any }) {
  const [direction, setDirection] = useState<'home-to-work' | 'work-to-home'>('home-to-work');
  const [rideType, setRideType] = useState<'one-time' | 'recurring'>('one-time');

  const home = user?.homeAddressText || 'Twój Dom';
  const org = user?.organizationName || 'Twoja Praca';

  const startAddress = direction === 'home-to-work' ? home : org;
  const endAddress = direction === 'home-to-work' ? org : home;

  return (
    <div className="fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#212529', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', margin: 0 }}>Ogłoś przejazd</h1>
      </div>

      <div style={{ display: 'flex', backgroundColor: '#e9ecef', padding: '4px', borderRadius: '12px' }}>
        <button onClick={() => setDirection('home-to-work')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: direction === 'home-to-work' ? 'white' : 'transparent', fontWeight: direction === 'home-to-work' ? 'bold' : 'normal', transition: 'all 0.2s', cursor: 'pointer' }}>
          Dom &rarr; Praca
        </button>
        <button onClick={() => setDirection('work-to-home')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: direction === 'work-to-home' ? 'white' : 'transparent', fontWeight: direction === 'work-to-home' ? 'bold' : 'normal', transition: 'all 0.2s', cursor: 'pointer' }}>
          Praca &rarr; Dom
        </button>
      </div>

      <div style={{ display: 'flex', backgroundColor: '#e9ecef', padding: '4px', borderRadius: '12px' }}>
        <button onClick={() => setRideType('one-time')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: rideType === 'one-time' ? 'white' : 'transparent', fontWeight: rideType === 'one-time' ? 'bold' : 'normal', transition: 'all 0.2s', cursor: 'pointer' }}>
          Jednorazowy
        </button>
        <button onClick={() => setRideType('recurring')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: rideType === 'recurring' ? 'white' : 'transparent', fontWeight: rideType === 'recurring' ? 'bold' : 'normal', transition: 'all 0.2s', cursor: 'pointer' }}>
          Cykliczny
        </button>
      </div>

      <div style={{ flex: 1, minHeight: '300px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #ced4da' }}>
        <MapRoute 
          startAddress={startAddress} setStartAddress={() => {}}
          endAddress={endAddress} setEndAddress={() => {}}
          title="Ustal trasę (Kliknij aby dodać punkty pośrednie)"
          readOnlyStartEnd={true}
        />
      </div>

      <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {rideType === 'one-time' ? (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Data przejazdu</label>
            <input type="date" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Dni tygodnia</label>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((day) => (
                <div key={day} style={{ padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', backgroundColor: day === 'Pn' || day === 'Wt' || day === 'Śr' || day === 'Cz' || day === 'Pt' ? '#198754' : '#f8f9fa', color: day === 'Pn' || day === 'Wt' || day === 'Śr' || day === 'Cz' || day === 'Pt' ? 'white' : '#212529' }}>
                  {day}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Godzina wyjazdu</label>
            <input type="time" defaultValue="07:00" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Szacowany dojazd</label>
            <input type="time" defaultValue="07:45" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
          </div>
        </div>

        <button className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px', fontSize: '16px', backgroundColor: '#198754' }} onClick={onBack}>
          Utwórz trasę i ogłoś przejazd
        </button>
      </div>
    </div>
  );
}

function SearchRideView({ onBack, onOpenChat, user }: { onBack: () => void, onOpenChat: (chatId: string) => void, user?: any }) {
  const [hasSearched, setHasSearched] = useState(false);
  const [direction, setDirection] = useState<'home-to-work' | 'work-to-home'>('home-to-work');
  const [rideType, setRideType] = useState<'one-time' | 'recurring'>('one-time');

  return (
    <div className="fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#212529', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', margin: 0 }}>Szukaj przejazdu</h1>
      </div>
      
      {!hasSearched ? (
        <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', backgroundColor: '#e9ecef', padding: '4px', borderRadius: '12px' }}>
            <button onClick={() => setDirection('home-to-work')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: direction === 'home-to-work' ? 'white' : 'transparent', fontWeight: direction === 'home-to-work' ? 'bold' : 'normal', transition: 'all 0.2s', cursor: 'pointer' }}>
              Dom &rarr; Praca
            </button>
            <button onClick={() => setDirection('work-to-home')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: direction === 'work-to-home' ? 'white' : 'transparent', fontWeight: direction === 'work-to-home' ? 'bold' : 'normal', transition: 'all 0.2s', cursor: 'pointer' }}>
              Praca &rarr; Dom
            </button>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#e9ecef', padding: '4px', borderRadius: '12px' }}>
            <button onClick={() => setRideType('one-time')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: rideType === 'one-time' ? 'white' : 'transparent', fontWeight: rideType === 'one-time' ? 'bold' : 'normal', transition: 'all 0.2s', cursor: 'pointer' }}>
              Jednorazowy
            </button>
            <button onClick={() => setRideType('recurring')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: rideType === 'recurring' ? 'white' : 'transparent', fontWeight: rideType === 'recurring' ? 'bold' : 'normal', transition: 'all 0.2s', cursor: 'pointer' }}>
              Cykliczny
            </button>
          </div>

          {rideType === 'one-time' ? (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Data przejazdu</label>
              <input type="date" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Dni tygodnia</label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((day) => (
                  <div key={day} style={{ padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', backgroundColor: day === 'Pn' || day === 'Wt' ? '#0d6efd' : '#f8f9fa', color: day === 'Pn' || day === 'Wt' ? 'white' : '#212529' }}>
                    {day}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Godzina wyjazdu</label>
              <input type="time" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Szacowany dojazd</label>
              <input type="time" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
            </div>
          </div>

          <button className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px', fontSize: '16px', backgroundColor: '#0d6efd' }} onClick={() => setHasSearched(true)}>
            Szukaj w API
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', color: '#6c757d' }}>Znalezione przejazdy (z API)</h2>
          
          <div 
            onClick={() => onOpenChat('chat1')}
            style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e9ecef', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#0d6efd', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>JK</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#212529' }}>Jan Kowalski</div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>Toyota Yaris • 4.9 ★ </div>
                </div>
              </div>
              <div style={{ fontWeight: 'bold', color: '#198754' }}>15 PLN</div>
            </div>
            
            <div style={{ fontSize: '14px', color: '#495057', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> 07:15 - 07:45</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} /> Trasa pokrywa się w 90%</div>
            </div>
            
            <button style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#e9ecef', color: '#212529', fontWeight: 'bold', marginTop: '16px', cursor: 'pointer' }}>
              Skontaktuj się
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function tabStyle(isActive: boolean) {
  return {
    flex: 1, padding: '10px', borderRadius: '10px', border: 'none', 
    backgroundColor: isActive ? 'white' : 'transparent', 
    color: isActive ? '#212529' : '#6c757d', 
    fontWeight: isActive ? 'bold' : 'normal', 
    boxShadow: isActive ? '0 2px 5px rgba(0,0,0,0.05)' : 'none', 
    transition: 'all 0.2s', cursor: 'pointer', fontSize: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
  };
}
