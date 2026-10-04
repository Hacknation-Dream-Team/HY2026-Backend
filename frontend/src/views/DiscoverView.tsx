import { useState, useEffect } from 'react';
import { Car, UserCircle2, PlusCircle, Clock, MapPin, ArrowLeft, Search } from 'lucide-react';
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
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '4px' }}>Dni: {ad.daysOfWeek?.join(', ')}</div>
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

  const home = user?.homeAddressText || user?.homeAddress || 'Kraków, Wawel';
  const org = user?.organizationName || 'Kraków, Rynek Główny';

  const startAddress = direction === 'home-to-work' ? home : org;
  const endAddress = direction === 'home-to-work' ? org : home;

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
    const map: Record<string, string> = { 'Pn': 'Mon', 'Wt': 'Tue', 'Śr': 'Wed', 'Cz': 'Thu', 'Pt': 'Fri', 'Sb': 'Sat', 'Nd': 'Sun' };
    return days.map(d => map[d]).filter(Boolean);
  };

  const handleSubmit = async () => {
    try {
      if (routePoints.length < 2) {
        alert('Trasa nie została jeszcze wyznaczona. Upewnij się, że masz ustawiony adres domowy i organizację.');
        return;
      }
      const routeRes = await api.createRoute({
        points: routePoints,
        lookingFor: 'Passenger'
      });

      await api.createAdvertisement({
        routeId: routeRes.id,
        seats: 3,
        departureTime: departureTime.length === 5 ? `${departureTime}:00` : departureTime,
        daysOfWeek: mapDaysToEnum(selectedDays)
      });
      alert('Przejazd został ogłoszony!');
      onBack();
    } catch (e: any) {
      alert('Błąd tworzenia ogłoszenia: ' + e.message);
    }
  };

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

      <div style={{ flex: 1, minHeight: '300px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #ced4da' }}>
        <MapRoute 
          startAddress={startAddress} setStartAddress={() => {}}
          endAddress={endAddress} setEndAddress={() => {}}
          title="Ustal trasę (Kliknij aby dodać punkty pośrednie)"
          readOnlyStartEnd={true}
          onRouteCalculated={(info: any) => {
            setDurationMins(info.time);
            setRoutePoints(info.points || []);
          }}
        />
      </div>

      <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Dni tygodnia</label>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <div 
                  key={day} 
                  onClick={() => toggleDay(day)}
                  style={{ padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', backgroundColor: isSelected ? '#198754' : '#f8f9fa', color: isSelected ? 'white' : '#212529', userSelect: 'none' }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Godzina wyjazdu</label>
            <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Szacowany dojazd</label>
            <input type="time" value={calculateArrival(departureTime, durationMins)} readOnly style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none', backgroundColor: '#e9ecef', color: '#6c757d' }} />
          </div>
        </div>

        <button className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px', fontSize: '16px', backgroundColor: '#198754' }} onClick={handleSubmit}>
          Utwórz trasę i ogłoś przejazd
        </button>
      </div>
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
    const map: Record<string, string> = { 'Pn': 'Mon', 'Wt': 'Tue', 'Śr': 'Wed', 'Cz': 'Thu', 'Pt': 'Fri', 'Sb': 'Sat', 'Nd': 'Sun' };
    return map[day];
  };

  const handleSearch = async () => {
    setHasSearched(true);
    try {
      const req = await api.createRideRequest({
        direction: direction === 'home-to-work' ? 0 : 1,
        departureTime: timeValue.length === 5 ? `${timeValue}:00` : timeValue,
        daysOfWeek: selectedDays.map(mapDaysToEnum).filter(Boolean)
      });
      setLastRequestId(req.id);
      
      const results = await api.searchMatches({ requestId: req.id });
      setSearchResults(results);
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
