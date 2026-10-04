import { useState, useEffect, useMemo, useCallback } from 'react';
import { Car, UserCircle2, PlusCircle, Clock, MapPin, ArrowLeft, Search, CheckCircle2 } from 'lucide-react';
import { MapRoute } from '../MapRoute';
import { CarFormFields } from '../CarFormFields';
import { api } from '../api';

export function DiscoverView({ user }: { user?: any }) {
  const [roleTab, setRoleTab] = useState<'driver' | 'passenger'>('driver');
  const [action, setAction] = useState<'none' | 'offer' | 'search' | 'addCar'>('none');
  const [tempHasCar, setTempHasCar] = useState(false); // local mock state for when user adds car in this session
  const [hasFetchedCars, setHasFetchedCars] = useState(false);
  const [userHasCar, setUserHasCar] = useState(false);

  useEffect(() => {
    api.getCars().then(cars => {
      setUserHasCar(cars && cars.length > 0);
      setHasFetchedCars(true);
    }).catch(() => setHasFetchedCars(true));
  }, []);

  const handleOffer = () => {
    if (!hasFetchedCars) return; // Wait until fetched
    if (!userHasCar && !tempHasCar) {
      setAction('addCar');
    } else {
      setAction('offer');
    }
  };

  if (action === 'addCar') return <AddCarView onBack={() => setAction('none')} onSaved={() => { setTempHasCar(true); setAction('offer'); }} />;
  if (action === 'offer') return <OfferRideView onBack={() => setAction('none')} user={user} />;
  if (action === 'search') return <SearchRideView onBack={() => setAction('none')} />;

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
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    api.getAdvertisements().then(setAds).catch(console.error);
  }, []);

  const formatDays = (days: any[]) => {
    if (!days || !Array.isArray(days)) return '';
    const map: Record<string | number, string> = {
      0: 'Pn', 1: 'Wt', 2: 'Śr', 3: 'Cz', 4: 'Pt', 5: 'Sb', 6: 'Nd',
      'Mon': 'Pn', 'Tue': 'Wt', 'Wed': 'Śr', 'Thu': 'Cz', 'Fri': 'Pt', 'Sat': 'Sb', 'Sun': 'Nd'
    };
    return days.map(d => map[d] ?? d).join(', ');
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
        
        {ads.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #ced4da' }}>
            Nie masz jeszcze żadnych zaplanowanych przejazdów.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ads.map(ad => (
              <div key={ad.id} style={{ padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                <div style={{ fontWeight: 'bold' }}>Wyjazd o: {ad.departureTime}</div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '4px' }}>Dni: {formatDays(ad.daysOfWeek)}</div>
              </div>
            ))}
          </div>
        )}
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
  const [carData, setCarData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!carData.plate || !carData.color) {
      alert('Wypełnij wszystkie pola.');
      return;
    }
    setLoading(true);
    try {
      await api.addCar(carData);
      onSaved();
    } catch(e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

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
        
        <CarFormFields carData={carData} onChange={setCarData} />

        <button disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px', fontSize: '16px', backgroundColor: '#0d6efd' }} onClick={handleSubmit}>
          {loading ? 'Zapisywanie...' : 'Zapisz i kontynuuj'}
        </button>
      </div>
    </div>
  );
}

function OfferRideView({ onBack, user }: { onBack: () => void, user?: any }) {
  const [direction, setDirection] = useState<'home-to-work' | 'work-to-home'>('home-to-work');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Pn', 'Wt', 'Śr', 'Cz', 'Pt']);
  const [departureTime, setDepartureTime] = useState('07:00');
  const [durationMins, setDurationMins] = useState(45);
  const [routePoints, setRoutePoints] = useState<any[]>([]);
  const [midAddress, setMidAddress] = useState<string>('');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    api.getOrganizations().then(setOrganizations).catch(console.error);
  }, []);

  const userOrg = organizations.find(o => o.id === user?.organizationId || o.name === user?.organizationName);

  const home = user?.homeAddress || user?.homeAddressText || '';
  const org = userOrg?.address || user?.organizationName || '';

  const homeCoords = useMemo(() => user?.homeLocation ? { lat: user.homeLocation.latitude, lng: user.homeLocation.longitude } : null, [user?.homeLocation?.latitude, user?.homeLocation?.longitude]);
  const orgCoords = useMemo(() => userOrg?.location ? { lat: userOrg.location.latitude, lng: userOrg.location.longitude } : null, [userOrg?.location?.latitude, userOrg?.location?.longitude]);

  const startAddress = direction === 'home-to-work' ? home : org;
  const endAddress = direction === 'home-to-work' ? org : home;
  const startCoords = direction === 'home-to-work' ? homeCoords : orgCoords;
  const endCoords = direction === 'home-to-work' ? orgCoords : homeCoords;

  const handleRouteCalculated = useCallback((info: any) => {
    setDurationMins(prev => prev !== info.time ? info.time : prev);
    setRoutePoints(info.points || []);
  }, []);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const calculateArrival = (depTime: string, mins: number) => {
    if (!depTime) return '';
    const [h, m] = depTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + mins);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const mapDaysToEnum = (days: string[]) => {
    const map: Record<string, number> = { 'Pn': 0, 'Wt': 1, 'Śr': 2, 'Cz': 3, 'Pt': 4, 'Sb': 5, 'Nd': 6 };
    return days.map(d => map[d]).filter(v => v !== undefined);
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    if (routePoints.length < 2) {
      setErrorMessage('Trasa nie została jeszcze wyznaczona. Upewnij się, że masz ustawiony adres domowy i organizację.');
      return;
    }
    setLoading(true);
    try {
      const targetDirection = direction === 'home-to-work' ? 'ToWork' : 'ToHome';

      // Clean up previous route for this direction if it already exists
      try {
        const existingRoutes = await api.getRoutes();
        if (Array.isArray(existingRoutes)) {
          for (const r of existingRoutes) {
            if (r.direction === targetDirection || r.direction === (targetDirection === 'ToWork' ? 0 : 1)) {
              await api.deleteRoute(r.id);
            }
          }
        }
      } catch (err) {
        console.warn('Could not clean up existing routes', err);
      }

      const routeRes = await api.createRoute({
        direction: targetDirection,
        points: routePoints,
        lookingFor: 'Passenger'
      });

      await api.createAdvertisement({
        routeId: routeRes.id,
        seats: 3,
        departureTime: departureTime.length === 5 ? `${departureTime}:00` : departureTime,
        daysOfWeek: mapDaysToEnum(selectedDays)
      });
      
      setIsSuccessModalOpen(true);
    } catch (e: any) {
      setErrorMessage(e.message || 'Wystąpił błąd podczas tworzenia ogłoszenia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#212529', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', margin: 0 }}>Ogłoś przejazd</h1>
      </div>

      <div style={{ display: 'flex', backgroundColor: '#e9ecef', padding: '4px', borderRadius: '12px' }}>
        <button type="button" onClick={() => setDirection('home-to-work')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: direction === 'home-to-work' ? 'white' : 'transparent', fontWeight: direction === 'home-to-work' ? 'bold' : 'normal', transition: 'all 0.2s', cursor: 'pointer' }}>
          Dom &rarr; Praca
        </button>
        <button type="button" onClick={() => setDirection('work-to-home')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: direction === 'work-to-home' ? 'white' : 'transparent', fontWeight: direction === 'work-to-home' ? 'bold' : 'normal', transition: 'all 0.2s', cursor: 'pointer' }}>
          Praca &rarr; Dom
        </button>
      </div>

      {/* Map Module */}
      <MapRoute
        startAddress={startAddress}
        endAddress={endAddress}
        startCoords={startCoords}
        endCoords={endCoords}
        midAddress={midAddress}
        onMidAddressChange={setMidAddress}
        onRouteCalculated={handleRouteCalculated}
      />

      <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '16px', margin: 0 }}>Harmonogram i godziny</h2>
        
        {/* Days selector */}
        <div>
          <label style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px', display: 'block' }}>Dni tygodnia</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: selectedDays.includes(day) ? '#0d6efd' : '#dee2e6',
                  backgroundColor: selectedDays.includes(day) ? '#e7f1ff' : 'white',
                  color: selectedDays.includes(day) ? '#0d6efd' : '#212529',
                  fontWeight: selectedDays.includes(day) ? 'bold' : 'normal',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Time settings */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px', display: 'block' }}>Godzina odjazdu</label>
            <input 
              type="time" 
              value={departureTime} 
              onChange={e => setDepartureTime(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px', display: 'block' }}>Szacowany przyjazd</label>
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', color: '#495057', fontWeight: 'bold' }}>
              ~{calculateArrival(departureTime, durationMins)} ({durationMins} min)
            </div>
          </div>
        </div>

        {errorMessage && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f8d7da', color: '#721c24', fontSize: '14px', border: '1px solid #f5c6cb' }}>
            {errorMessage}
          </div>
        )}

        <button 
          disabled={loading}
          className="btn-primary" 
          style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px', fontSize: '16px', backgroundColor: '#198754', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }} 
          onClick={handleSubmit}
        >
          {loading ? 'Ogłaszanie przejazdu...' : 'Utwórz trasę i ogłoś przejazd'}
        </button>
      </div>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '32px 24px',
            maxWidth: '380px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#d1e7dd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f5132'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#212529' }}>Przejazd ogłoszony!</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6c757d', lineHeight: '1.4' }}>
                Twoja trasa ({direction === 'home-to-work' ? 'Dom → Praca' : 'Praca → Dom'}) została pomyślnie opublikowana dla współpracowników.
              </p>
            </div>

            <div style={{
              width: '100%',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13px',
              color: '#495057',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              border: '1px solid #e9ecef'
            }}>
              <div><strong>Odjazd:</strong> {departureTime} (szac. ~{calculateArrival(departureTime, durationMins)})</div>
              <div><strong>Dni:</strong> {selectedDays.join(', ')}</div>
              <div><strong>Punkty trasy:</strong> {routePoints.length}</div>
            </div>

            <button
              type="button"
              onClick={onBack}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#198754',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(25, 135, 84, 0.2)',
                marginTop: '6px'
              }}
            >
              Świetnie, przejdź dalej
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function SearchRideView({ onBack }: { onBack: () => void }) {
  const [hasSearched, setHasSearched] = useState(false);
  const [direction, setDirection] = useState<'home-to-work' | 'work-to-home'>('home-to-work');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Pn', 'Wt', 'Śr', 'Cz', 'Pt']);
  const [timeMode, setTimeMode] = useState<'departure' | 'arrival'>('departure');
  const [timeValue, setTimeValue] = useState('07:00');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [lastRequestId, setLastRequestId] = useState<number | null>(null);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const mapDaysToEnum = (day: string) => {
    const map: Record<string, number> = { 'Pn': 0, 'Wt': 1, 'Śr': 2, 'Cz': 3, 'Pt': 4, 'Sb': 5, 'Nd': 6 };
    return map[day];
  };

  const handleSearch = async () => {
    setHasSearched(true);
    try {
      const targetDirection = direction === 'home-to-work' ? 'ToWork' : 'ToHome';

      // Clean up previous ride request for this direction if it exists
      try {
        const existingRequests = await api.getRideRequests();
        if (Array.isArray(existingRequests)) {
          for (const req of existingRequests) {
            if (req.direction === targetDirection || req.direction === (targetDirection === 'ToWork' ? 0 : 1)) {
              await api.deleteRideRequest(req.id);
            }
          }
        }
      } catch (err) {
        console.warn('Could not clean up existing ride requests', err);
      }

      const req = await api.createRideRequest({
        direction: targetDirection,
        departureTime: timeValue.length === 5 ? `${timeValue}:00` : timeValue,
        daysOfWeek: selectedDays.map(mapDaysToEnum).filter(v => v !== undefined)
      });
      setLastRequestId(req.id);
      
      const results = await api.searchMatches({ requestId: req.id });
      setSearchResults(results || []);
    } catch (e: any) {
      alert('Błąd wyszukiwania: ' + e.message);
      setHasSearched(false);
    }
  };

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

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Dni tygodnia</label>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <div 
                    key={day} 
                    onClick={() => toggleDay(day)}
                    style={{ padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', backgroundColor: isSelected ? '#0d6efd' : '#f8f9fa', color: isSelected ? 'white' : '#212529', userSelect: 'none' }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold' }}>Szukam po godzinie:</label>
            <div style={{ display: 'flex', backgroundColor: '#e9ecef', padding: '4px', borderRadius: '12px' }}>
              <button onClick={() => setTimeMode('departure')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: timeMode === 'departure' ? 'white' : 'transparent', fontWeight: timeMode === 'departure' ? 'bold' : 'normal', transition: 'all 0.2s', cursor: 'pointer' }}>Wyjazdu</button>
              <button onClick={() => setTimeMode('arrival')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: timeMode === 'arrival' ? 'white' : 'transparent', fontWeight: timeMode === 'arrival' ? 'bold' : 'normal', transition: 'all 0.2s', cursor: 'pointer' }}>Dojazdu</button>
            </div>
            <input type="time" value={timeValue} onChange={e => setTimeValue(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none', marginTop: '4px' }} />
          </div>

          <button className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px', fontSize: '16px', backgroundColor: '#0d6efd' }} onClick={handleSearch}>
            Szukaj w bazie
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', color: '#6c757d', display: 'flex', justifyContent: 'space-between' }}>
            Znalezione przejazdy (z bazy)
            <span style={{ fontSize: '13px', color: '#0d6efd', cursor: 'pointer' }} onClick={() => setHasSearched(false)}>Zmień filtry</span>
          </h2>
          
          {searchResults.length === 0 && <div style={{ textAlign: 'center', color: '#6c757d' }}>Brak wyników</div>}
          {searchResults.map(res => (
            <div 
              key={`${res.advertisementId}-${res.driverId}`}
              style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e9ecef', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#0d6efd', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>K</div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#212529' }}>Kierowca #{res.driverId}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Wolnych miejsc: {res.freeSeats}</div>
                  </div>
                </div>
              </div>
              
              <div style={{ fontSize: '14px', color: '#495057', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> Wyjazd: {res.departureTime}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} /> Dojście do auta: {res.pickupDistanceM}m, z auta: {res.dropoffDistanceM}m</div>
              </div>
              
              <button 
                onClick={async () => {
                  if (!lastRequestId) return;
                  try {
                    await api.createMatch({
                      advertisementId: res.advertisementId,
                      requestId: lastRequestId,
                      pickupSeq: res.pickupSeq,
                      dropoffSeq: res.dropoffSeq
                    });
                    alert('Wysłano prośbę o dołączenie do przejazdu!');
                  } catch(e: any) {
                    alert('Błąd: ' + e.message);
                  }
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#e9ecef', color: '#212529', fontWeight: 'bold', marginTop: '16px', cursor: 'pointer' }}
              >
                Poproś o dołączenie
              </button>
            </div>
          ))}
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
