import { useState, useEffect, useMemo, useCallback } from 'react';
import { Car, UserCircle2, PlusCircle, Clock, MapPin, ArrowLeft, Search, CheckCircle2, Eye, Edit2, Trash2, Calendar, Users, X, AlertTriangle, MessageCircle, Loader2 } from 'lucide-react';
import { MapRoute } from '../MapRoute';
import { CarFormFields } from '../CarFormFields';
import { api } from '../api';

export function DiscoverView({ user, onNavigateToChats }: { user?: any, onNavigateToChats?: () => void }) {
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
  if (action === 'search') return <SearchRideView onBack={() => setAction('none')} user={user} onNavigateToChats={onNavigateToChats} />;

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
        <DriverSection onOffer={handleOffer} user={user} />
      ) : (
        <PassengerSection onSearch={() => setAction('search')} user={user} onNavigateToChats={onNavigateToChats} />
      )}
    </div>
  );
}

function formatDays(days: any[]) {
  if (!days || !Array.isArray(days)) return '';
  const map: Record<string | number, string> = {
    0: 'Pn', 1: 'Wt', 2: 'Śr', 3: 'Cz', 4: 'Pt', 5: 'Sb', 6: 'Nd',
    'Mon': 'Pn', 'Tue': 'Wt', 'Wed': 'Śr', 'Thu': 'Cz', 'Fri': 'Pt', 'Sat': 'Sb', 'Sun': 'Nd',
    'Monday': 'Pn', 'Tuesday': 'Wt', 'Wednesday': 'Śr', 'Thursday': 'Cz', 'Friday': 'Pt', 'Saturday': 'Sb', 'Sunday': 'Nd'
  };
  return days.map(d => map[d] ?? d).join(', ');
}

function DriverSection({ onOffer, user }: { onOffer: () => void, user?: any }) {
  const [ads, setAds] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedAd, setSelectedAd] = useState<any | null>(null);
  const [editingAd, setEditingAd] = useState<any | null>(null);
  const [deletingAd, setDeletingAd] = useState<any | null>(null);

  const fetchAds = useCallback(() => {
    api.getAdvertisements().then(setAds).catch(console.error);
    api.getRoutes().then(setRoutes).catch(console.error);
    api.getOrganizations().then(setOrganizations).catch(console.error);
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleDeleteConfirm = async () => {
    if (!deletingAd) return;
    try {
      await api.deleteAdvertisement(deletingAd.id);
      setDeletingAd(null);
      if (selectedAd?.id === deletingAd.id) setSelectedAd(null);
      fetchAds();
    } catch (err: any) {
      alert('Błąd podczas usuwania: ' + (err.message || err));
    }
  };

  const handleSaveEdit = async (updatedData: any) => {
    if (!editingAd) return;
    try {
      await api.updateAdvertisement(editingAd.id, updatedData);
      setEditingAd(null);
      if (selectedAd?.id === editingAd.id) {
        setSelectedAd((prev: any) => prev ? { ...prev, ...updatedData } : null);
      }
      fetchAds();
    } catch (err: any) {
      alert('Błąd podczas zapisywania: ' + (err.message || err));
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
        
        {ads.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #ced4da' }}>
            Nie masz jeszcze żadnych zaplanowanych przejazdów.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ads.map(ad => {
              const route = routes.find(r => r.id === ad.routeId);
              const directionName = (route?.direction === 0 || route?.direction === 'ToWork' || ad.direction === 'ToWork') 
                ? 'Dom ➔ Praca' : 'Praca ➔ Dom';

              return (
                <div 
                  key={ad.id} 
                  style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    borderRadius: '16px', 
                    border: '1px solid #e9ecef',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      backgroundColor: '#e7f1ff', 
                      color: '#0d6efd', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <MapPin size={13} /> {directionName}
                    </span>
                    <span style={{ fontSize: '12px', color: '#198754', fontWeight: 'bold', backgroundColor: '#d1e7dd', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={13} /> {ad.seats} {ad.seats === 1 ? 'miejsce' : 'miejsca'}
                    </span>
                  </div>

                  <div 
                    onClick={() => setSelectedAd(ad)} 
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#212529', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="#0d6efd" /> Wyjazd o: {ad.departureTime}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="#6c757d" /> Dni: <strong>{formatDays(ad.daysOfWeek)}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f3f5' }}>
                    <button 
                      onClick={() => setSelectedAd(ad)} 
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid #cfe2ff', backgroundColor: '#eff6ff', color: '#0d6efd', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Eye size={15} /> Szczegóły / Trasa
                    </button>
                    <button 
                      onClick={() => setEditingAd(ad)} 
                      style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #dee2e6', backgroundColor: '#f8f9fa', color: '#495057', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Edit2 size={15} /> Edytuj
                    </button>
                    <button 
                      onClick={() => setDeletingAd(ad)} 
                      style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #ffe3e3', backgroundColor: '#fff5f5', color: '#dc3545', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Trash2 size={15} /> Usuń
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedAd && (
        <RideDetailsModal
          item={selectedAd}
          isDriver={true}
          user={user}
          organizations={organizations}
          routes={routes}
          onClose={() => setSelectedAd(null)}
          onEdit={() => { setEditingAd(selectedAd); setSelectedAd(null); }}
          onDelete={() => { setDeletingAd(selectedAd); setSelectedAd(null); }}
        />
      )}

      {editingAd && (
        <EditRideModal
          item={editingAd}
          isDriver={true}
          onClose={() => setEditingAd(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deletingAd && (
        <DeleteConfirmModal
          title="Usuń przejazd"
          message="Czy na pewno chcesz usunąć ten zaplanowany przejazd? Usunięcie spowoduje anulowanie ogłoszenia."
          onClose={() => setDeletingAd(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

function PassengerSection({ onSearch, user }: { onSearch: () => void, user?: any }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [editingReq, setEditingReq] = useState<any | null>(null);
  const [deletingReq, setDeletingReq] = useState<any | null>(null);

  const fetchRequests = useCallback(() => {
    api.getRideRequests().then(setRequests).catch(console.error);
    api.getOrganizations().then(setOrganizations).catch(console.error);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleDeleteConfirm = async () => {
    if (!deletingReq) return;
    try {
      await api.deleteRideRequest(deletingReq.id);
      setDeletingReq(null);
      if (selectedReq?.id === deletingReq.id) setSelectedReq(null);
      fetchRequests();
    } catch (err: any) {
      alert('Błąd podczas usuwania: ' + (err.message || err));
    }
  };

  const handleSaveEdit = async (updatedData: any) => {
    if (!editingReq) return;
    try {
      await api.updateRideRequest(editingReq.id, updatedData);
      setEditingReq(null);
      if (selectedReq?.id === editingReq.id) {
        setSelectedReq((prev: any) => prev ? { ...prev, ...updatedData } : null);
      }
      fetchRequests();
    } catch (err: any) {
      alert('Błąd podczas zapisywania: ' + (err.message || err));
    }
  };

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

      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '12px', color: '#212529' }}>Zaplanowane prośby o przejazd</h2>
        
        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #ced4da' }}>
            Nie masz jeszcze żadnych zapisanych prośb o przejazd.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map(req => {
              const directionName = (req.direction === 0 || req.direction === 'ToWork') 
                ? 'Dom ➔ Praca' : 'Praca ➔ Dom';

              return (
                <div 
                  key={req.id} 
                  style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    borderRadius: '16px', 
                    border: '1px solid #e9ecef',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      backgroundColor: '#e7f1ff', 
                      color: '#0d6efd', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <MapPin size={13} /> {directionName}
                    </span>
                    <span style={{ fontSize: '12px', color: '#0d6efd', fontWeight: 'bold', backgroundColor: '#e7f1ff', padding: '4px 10px', borderRadius: '20px' }}>
                      Pasażer
                    </span>
                  </div>

                  <div 
                    onClick={() => setSelectedReq(req)} 
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#212529', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="#0d6efd" /> Preferowany odjazd: {req.departureTime}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="#6c757d" /> Dni: <strong>{formatDays(req.daysOfWeek)}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f3f5' }}>
                    <button 
                      onClick={() => setSelectedReq(req)} 
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid #cfe2ff', backgroundColor: '#eff6ff', color: '#0d6efd', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Eye size={15} /> Szczegóły / Trasa
                    </button>
                    <button 
                      onClick={() => setEditingReq(req)} 
                      style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #dee2e6', backgroundColor: '#f8f9fa', color: '#495057', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Edit2 size={15} /> Edytuj
                    </button>
                    <button 
                      onClick={() => setDeletingReq(req)} 
                      style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #ffe3e3', backgroundColor: '#fff5f5', color: '#dc3545', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Trash2 size={15} /> Usuń
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedReq && (
        <RideDetailsModal
          item={selectedReq}
          isDriver={false}
          user={user}
          organizations={organizations}
          routes={[]}
          onClose={() => setSelectedReq(null)}
          onEdit={() => { setEditingReq(selectedReq); setSelectedReq(null); }}
          onDelete={() => { setDeletingReq(selectedReq); setSelectedReq(null); }}
        />
      )}

      {editingReq && (
        <EditRideModal
          item={editingReq}
          isDriver={false}
          onClose={() => setEditingReq(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deletingReq && (
        <DeleteConfirmModal
          title="Usuń prośbę o przejazd"
          message="Czy na pewno chcesz usunąć tę zaplanowaną prośbę o przejazd?"
          onClose={() => setDeletingReq(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
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


function SearchRideView({ onBack, user, onNavigateToChats }: { onBack: () => void, user?: any, onNavigateToChats?: () => void }) {
  const [hasSearched, setHasSearched] = useState(false);
  const [direction, setDirection] = useState<'home-to-work' | 'work-to-home'>('home-to-work');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Pn', 'Wt', 'Śr', 'Cz', 'Pt']);
  const [timeMode, setTimeMode] = useState<'departure' | 'arrival'>('departure');
  const [timeValue, setTimeValue] = useState('07:00');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [lastRequestId, setLastRequestId] = useState<number | null>(null);
  const [isRequestSaved, setIsRequestSaved] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [joinedAdIds, setJoinedAdIds] = useState<number[]>([]);
  const [successModalData, setSuccessModalData] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [expandedMapId, setExpandedMapId] = useState<number | string | null>(null);

  useEffect(() => {
    api.getOrganizations().then(setOrganizations).catch(console.error);
  }, []);

  const userOrg = organizations.find(o => o.id === user?.organizationId || o.name === user?.organizationName);
  const home = user?.homeAddress || user?.homeAddressText || 'Adres domowy';
  const org = userOrg?.address || user?.organizationName || 'Miejsce pracy';

  const homeCoords = useMemo(() => user?.homeLocation ? { lat: user.homeLocation.latitude, lng: user.homeLocation.longitude } : null, [user?.homeLocation?.latitude, user?.homeLocation?.longitude]);
  const orgCoords = useMemo(() => userOrg?.location ? { lat: userOrg.location.latitude, lng: userOrg.location.longitude } : null, [userOrg?.location?.latitude, userOrg?.location?.longitude]);

  const startAddress = direction === 'home-to-work' ? home : org;
  const endAddress = direction === 'home-to-work' ? org : home;
  const startCoords = direction === 'home-to-work' ? homeCoords : orgCoords;
  const endCoords = direction === 'home-to-work' ? orgCoords : homeCoords;

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const mapDaysToEnum = (day: string) => {
    const map: Record<string, number> = { 'Pn': 0, 'Wt': 1, 'Śr': 2, 'Cz': 3, 'Pt': 4, 'Sb': 5, 'Nd': 6 };
    return map[day];
  };

  const handleBack = async () => {
    if (lastRequestId && !isRequestSaved && joinedAdIds.length === 0) {
      try {
        await api.deleteRideRequest(lastRequestId);
      } catch (err) {
        console.warn('Could not clean up temporary search ride request', err);
      }
    }
    onBack();
  };

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    setSearchError(null);
    try {
      const targetDirection = direction === 'home-to-work' ? 'ToWork' : 'ToHome';

      const req = await api.createRideRequest({
        direction: targetDirection,
        departureTime: timeValue.length === 5 ? `${timeValue}:00` : timeValue,
        daysOfWeek: selectedDays.map(mapDaysToEnum).filter(v => v !== undefined)
      });
      setLastRequestId(req.id);
      setIsRequestSaved(false);

      let matchResults: any[] = [];
      try {
        matchResults = await api.searchMatches({
          requestId: req.id,
          maxDistanceMeters: 5000,
          timeWindowMinutes: 120
        });
      } catch (err) {
        console.warn('PostGIS searchMatches warning:', err);
      }

      let allAds: any[] = [];
      let allRoutes: any[] = [];
      try {
        allAds = await api.getAdvertisements();
        allRoutes = await api.getRoutes();
      } catch (err) {
        console.warn('Could not fetch advertisements:', err);
      }

      const map = new Map<number, any>();

      if (Array.isArray(matchResults)) {
        for (const mr of matchResults) {
          map.set(mr.advertisementId, {
            ...mr,
            daysOfWeek: selectedDays
          });
        }
      }

      if (Array.isArray(allAds)) {
        for (const ad of allAds) {
          const r = allRoutes.find(rt => rt.id === ad.routeId);
          const adDir = r ? r.direction : ad.direction;
          const isSameDir = (adDir === targetDirection) ||
                            (targetDirection === 'ToWork' && (adDir === 0 || adDir === 'ToWork')) ||
                            (targetDirection === 'ToHome' && (adDir === 1 || adDir === 'ToHome'));

          if (isSameDir && !map.has(ad.id)) {
            map.set(ad.id, {
              advertisementId: ad.id,
              driverId: r?.userId || ad.userId || 1,
              freeSeats: ad.seats,
              departureTime: typeof ad.departureTime === 'string' ? ad.departureTime.substring(0, 5) : ad.departureTime,
              daysOfWeek: ad.daysOfWeek,
              pickupSeq: 0,
              dropoffSeq: 1
            });
          }
        }
      }

      setSearchResults(Array.from(map.values()));
    } catch (e: any) {
      setSearchError(e.message || 'Błąd podczas wyszukiwania przejazdów');
      setHasSearched(false);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRide = async (res: any) => {
    if (!lastRequestId) return;
    setJoiningId(res.advertisementId);
    try {
      await api.createMatch({
        advertisementId: res.advertisementId,
        requestId: lastRequestId,
        pickupSeq: res.pickupSeq ?? 0,
        dropoffSeq: res.dropoffSeq ?? 1
      });
      setIsRequestSaved(true);
      setJoinedAdIds(prev => [...prev, res.advertisementId]);
      setSuccessModalData(res);
    } catch (e: any) {
      alert('Nie udało się wysłać prośby: ' + (e.message || 'Błąd serwera'));
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#212529', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', margin: 0 }}>Szukaj przejazdu</h1>
      </div>

      {searchError && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8d7da', color: '#721c24', fontSize: '14px', border: '1px solid #f5c6cb', marginBottom: '16px' }}>
          {searchError}
        </div>
      )}
      
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

          <button disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px', fontSize: '16px', backgroundColor: '#0d6efd', cursor: loading ? 'wait' : 'pointer' }} onClick={handleSearch}>
            {loading ? 'Szukanie przejazdów...' : 'Szukaj przejazdów'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', color: '#6c757d', margin: 0 }}>
              Znalezione przejazdy ({searchResults.length})
            </h2>
            <span style={{ fontSize: '13px', color: '#0d6efd', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setHasSearched(false)}>Zmień filtry</span>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', color: '#0d6efd', padding: '50px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <Loader2 size={40} className="spin" color="#0d6efd" />
              <div>
                <strong style={{ fontSize: '16px', color: '#212529', display: 'block', marginBottom: '4px' }}>Szukanie dostępnych przejazdów...</strong>
                <span style={{ fontSize: '13px', color: '#6c757d' }}>Sprawdzamy dopasowania tras i harmonogramy kierowców</span>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e9ecef' }}>
              Brak dopasowanych przejazdów w wybranych godzinach.
            </div>
          ) : null}

          {searchResults.map(res => {
            const isJoined = joinedAdIds.includes(res.advertisementId);
            const isCurrentJoining = joiningId === res.advertisementId;
            const formattedTime = typeof res.departureTime === 'string' ? res.departureTime.substring(0, 5) : res.departureTime;

            return (
              <div 
                key={`${res.advertisementId}-${res.driverId}`}
                style={{ 
                  backgroundColor: 'white', 
                  padding: '18px', 
                  borderRadius: '16px', 
                  border: '1px solid #e9ecef', 
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '42px', height: '42px', backgroundColor: '#0d6efd', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                      K
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#212529' }}>Kierowca #{res.driverId}</div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>Wolnych miejsc: <strong>{res.freeSeats ?? 3}</strong></div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e7f1ff', color: '#0d6efd', padding: '4px 10px', borderRadius: '20px' }}>
                    {direction === 'home-to-work' ? 'Dom ➔ Praca' : 'Praca ➔ Dom'}
                  </span>
                </div>

                {/* Time & details info */}
                <div style={{ fontSize: '14px', color: '#495057', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="#0d6efd" /> <strong>Odjazd:</strong> {formattedTime}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} color="#0d6efd" /> <strong>Dni:</strong> {formatDays(res.daysOfWeek)}
                  </div>
                  {res.pickupDistanceM !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} color="#198754" /> <strong>Dojście:</strong> do auta {res.pickupDistanceM}m, do celu {res.dropoffDistanceM}m
                    </div>
                  )}
                </div>

                {/* Optional Map Preview Toggle */}
                <button
                  type="button"
                  onClick={() => setExpandedMapId(prev => prev === res.advertisementId ? null : res.advertisementId)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: expandedMapId === res.advertisementId ? '#eff6ff' : '#f8fafc',
                    color: '#0d6efd',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Eye size={15} /> {expandedMapId === res.advertisementId ? 'Ukryj mapę trasy' : 'Pokaż trasę na mapie'}
                </button>

                {/* Map Preview when expanded */}
                {expandedMapId === res.advertisementId && (
                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #dee2e6' }} className="fade-in">
                    <MapRoute
                      startAddress={startAddress}
                      endAddress={endAddress}
                      startCoords={startCoords}
                      endCoords={endCoords}
                      readOnlyStartEnd={true}
                    />
                  </div>
                )}
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    disabled={isJoined || isCurrentJoining}
                    onClick={() => handleJoinRide(res)}
                    style={{ 
                      flex: 2, 
                      padding: '12px', 
                      borderRadius: '10px', 
                      border: 'none', 
                      backgroundColor: isJoined ? '#d1e7dd' : '#0d6efd', 
                      color: isJoined ? '#0f5132' : 'white', 
                      fontWeight: 600, 
                      cursor: (isJoined || isCurrentJoining) ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: isJoined ? 'none' : '0 4px 6px -1px rgba(13, 110, 253, 0.2)'
                    }}
                  >
                    {isJoined ? (
                      <>
                        <CheckCircle2 size={18} /> Prośba wysłana
                      </>
                    ) : isCurrentJoining ? (
                      'Wysyłanie...'
                    ) : (
                      <>
                        <PlusCircle size={18} /> Poproś o dołączenie
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { if (onNavigateToChats) onNavigateToChats(); }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #ced4da',
                      backgroundColor: '#f8f9fa',
                      color: '#212529',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <MessageCircle size={18} color="#0d6efd" /> Czaty
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Success Modal */}
      {successModalData && (
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
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#212529' }}>Wysłano prośbę!</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6c757d', lineHeight: '1.4' }}>
                Twoja prośba o dołączenie do przejazdu kierowcy #{successModalData.driverId} została przesłana.
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
              <div><strong>Odjazd:</strong> {typeof successModalData.departureTime === 'string' ? successModalData.departureTime.substring(0, 5) : successModalData.departureTime}</div>
              {successModalData.pickupDistanceM !== undefined && (
                <>
                  <div><strong>Dojście do punktu zbiórki:</strong> {successModalData.pickupDistanceM}m</div>
                  <div><strong>Dojście z wysiadki:</strong> {successModalData.dropoffDistanceM}m</div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSuccessModalData(null)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(13, 110, 253, 0.2)',
                marginTop: '6px'
              }}
            >
              Rozumiem
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

function RideDetailsModal({
  item,
  isDriver,
  user,
  organizations,
  routes,
  onClose,
  onEdit,
  onDelete
}: {
  item: any;
  isDriver: boolean;
  user?: any;
  organizations: any[];
  routes: any[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const route = isDriver ? routes.find(r => r.id === item.routeId) : null;
  const isToWork = (route?.direction === 0 || route?.direction === 'ToWork' || item.direction === 'ToWork' || item.direction === 0);
  
  const userOrg = organizations.find(o => o.id === user?.organizationId || o.name === user?.organizationName);
  const home = user?.homeAddress || user?.homeAddressText || 'Adres domowy';
  const org = userOrg?.address || user?.organizationName || 'Miejsce pracy';

  const homeCoords = user?.homeLocation ? { lat: user.homeLocation.latitude, lng: user.homeLocation.longitude } : null;
  const orgCoords = userOrg?.location ? { lat: userOrg.location.latitude, lng: userOrg.location.longitude } : null;

  const startAddress = isToWork ? home : org;
  const endAddress = isToWork ? org : home;
  const startCoords = isToWork ? homeCoords : orgCoords;
  const endCoords = isToWork ? orgCoords : homeCoords;

  const formattedDeparture = typeof item.departureTime === 'string' ? item.departureTime.substring(0, 5) : item.departureTime;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#0d6efd', fontWeight: 'bold', backgroundColor: '#e7f1ff', padding: '3px 8px', borderRadius: '12px', display: 'inline-block', marginBottom: '4px' }}>
              {isDriver ? 'Ogłoszenie Kierowcy' : 'Prośba Pasażera'}
            </span>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#212529' }}>
              Trasa: {isToWork ? 'Dom ➔ Praca' : 'Praca ➔ Dom'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#6c757d', borderRadius: '50%' }}>
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Map */}
          <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #dee2e6' }}>
            <MapRoute
              startAddress={startAddress}
              endAddress={endAddress}
              startCoords={startCoords}
              endCoords={endCoords}
              readOnlyStartEnd={true}
            />
          </div>

          {/* Key information */}
          <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '16px', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#212529' }}>
              <Clock size={18} color="#0d6efd" />
              <span>Godzina wyjazdu: <strong>{formattedDeparture}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#212529' }}>
              <Calendar size={18} color="#0d6efd" />
              <span>Dni tygodnia: <strong>{formatDays(item.daysOfWeek)}</strong></span>
            </div>

            {isDriver && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#212529' }}>
                <Users size={18} color="#198754" />
                <span>Miejsca w aucie: <strong>{item.seats} wolnych</strong></span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#212529', marginTop: '4px' }}>
              <MapPin size={18} color="#dc3545" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Start &rarr; Cel</div>
                <strong>{startAddress}</strong> &rarr; <strong>{endAddress}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #e9ecef', display: 'flex', gap: '10px', backgroundColor: '#fafafa', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
          <button 
            onClick={onEdit} 
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #dee2e6', backgroundColor: 'white', color: '#212529', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Edit2 size={16} /> Edytuj przejazd
          </button>
          <button 
            onClick={onDelete} 
            style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #ffe3e3', backgroundColor: '#fff5f5', color: '#dc3545', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Trash2 size={16} /> Usuń
          </button>
        </div>
      </div>
    </div>
  );
}

function EditRideModal({
  item,
  isDriver,
  onClose,
  onSave
}: {
  item: any;
  isDriver: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const initialDeparture = typeof item.departureTime === 'string' ? item.departureTime.substring(0, 5) : '07:00';
  
  const mapEnumToDays = (days: any[]) => {
    if (!days || !Array.isArray(days)) return [];
    const map: Record<string | number, string> = {
      0: 'Pn', 1: 'Wt', 2: 'Śr', 3: 'Cz', 4: 'Pt', 5: 'Sb', 6: 'Nd',
      'Mon': 'Pn', 'Tue': 'Wt', 'Wed': 'Śr', 'Thu': 'Cz', 'Fri': 'Pt', 'Sat': 'Sb', 'Sun': 'Nd'
    };
    return days.map(d => map[d] ?? d);
  };

  const [departureTime, setDepartureTime] = useState(initialDeparture);
  const [selectedDays, setSelectedDays] = useState<string[]>(mapEnumToDays(item.daysOfWeek));
  const [seats, setSeats] = useState<number>(item.seats || 3);
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const mapDaysToEnum = (days: string[]) => {
    const map: Record<string, number> = { 'Pn': 0, 'Wt': 1, 'Śr': 2, 'Cz': 3, 'Pt': 4, 'Sb': 5, 'Nd': 6 };
    return days.map(d => map[d]).filter(v => v !== undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      alert('Wybierz przynajmniej jeden dzień tygodnia.');
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        departureTime: departureTime.length === 5 ? `${departureTime}:00` : departureTime,
        daysOfWeek: mapDaysToEnum(selectedDays)
      };
      if (isDriver) {
        payload.seats = Number(seats);
      }
      await onSave(payload);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#212529' }}>
            Edytuj przejazd
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#6c757d' }}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#212529' }}>
              Godzina odjazdu
            </label>
            <input 
              type="time" 
              value={departureTime} 
              onChange={e => setDepartureTime(e.target.value)} 
              required
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', fontSize: '16px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#212529' }}>
              Dni tygodnia
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(day => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    style={{
                      flex: 1,
                      minWidth: '40px',
                      padding: '10px 0',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isSelected ? '#0d6efd' : '#dee2e6',
                      backgroundColor: isSelected ? '#e7f1ff' : 'white',
                      color: isSelected ? '#0d6efd' : '#212529',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {isDriver && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#212529' }}>
                Liczba wolnych miejsc dla pasażerów
              </label>
              <input 
                type="number" 
                min="1" 
                max="8" 
                value={seats} 
                onChange={e => setSeats(Number(e.target.value))} 
                required
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', fontSize: '16px', outline: 'none' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #dee2e6', backgroundColor: '#f8f9fa', color: '#495057', fontWeight: 600, cursor: 'pointer' }}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#0d6efd', color: 'white', fontWeight: 600, cursor: loading ? 'wait' : 'pointer' }}
            >
              {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  title,
  message,
  onClose,
  onConfirm
}: {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '28px 24px',
        maxWidth: '380px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#fff5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#dc3545'
        }}>
          <AlertTriangle size={32} />
        </div>

        <div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#212529' }}>{title}</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#6c757d', lineHeight: '1.4' }}>{message}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #dee2e6', backgroundColor: '#f8f9fa', color: '#495057', fontWeight: 600, cursor: 'pointer' }}
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#dc3545', color: 'white', fontWeight: 600, cursor: 'pointer' }}
          >
            Usuń
          </button>
        </div>
      </div>
    </div>
  );
}
