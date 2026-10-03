import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { Map, Crosshair, Search, Loader2, ChevronRight, Navigation, PlusCircle, MapPin } from 'lucide-react';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    return data?.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
};

export const geocode = async (query: string) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) return L.latLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
  } catch (e) { console.error(e); }
  return null;
};

export function MapRoute({ 
  title = "Wyznacz Trasę",
  startLabel = "Wpisz skąd ruszasz...",
  endLabel = "Wpisz cel podróży...",
  extraControls = null,
  onNext = null,
  onPrev = null,
  startAddress, setStartAddress,
  midAddress, setMidAddress,
  endAddress, setEndAddress,
  setStartCoords = null,
  setMidCoords = null,
  setEndCoords = null,
  readOnlyStartEnd = false
}: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  const [routeFound, setRouteFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{dist: string, timeStr: string} | null>(null);
  const [showMidPoint, setShowMidPoint] = useState(false);

  const startPointRef = useRef<L.LatLng | null>(null);
  const midPointRef = useRef<L.LatLng | null>(null);
  const endPointRef = useRef<L.LatLng | null>(null);
  
  const tempStartMarkerRef = useRef<L.Marker | null>(null);
  const tempMidMarkerRef = useRef<L.Marker | null>(null);
  const tempEndMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([52.2297, 21.0122], 13);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map);

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const latlng = e.latlng;
      
      if (readOnlyStartEnd) {
        updateMidPoint(latlng);
        setIsLoading(true);
        const addr = await reverseGeocode(latlng.lat, latlng.lng);
        if (setMidAddress) setMidAddress(addr);
        setIsLoading(false);
        checkAndRoute();
        return;
      }
      
      // Auto-assign logic
      if (!startPointRef.current) {
        updateStartPoint(latlng);
        setIsLoading(true);
        const addr = await reverseGeocode(latlng.lat, latlng.lng);
        setStartAddress(addr);
        setIsLoading(false);
        checkAndRoute();
      } else if (showMidPoint && !midPointRef.current) {
        updateMidPoint(latlng);
        setIsLoading(true);
        const addr = await reverseGeocode(latlng.lat, latlng.lng);
        if (setMidAddress) setMidAddress(addr);
        setIsLoading(false);
        checkAndRoute();
      } else if (!endPointRef.current) {
        updateEndPoint(latlng);
        setIsLoading(true);
        const addr = await reverseGeocode(latlng.lat, latlng.lng);
        setEndAddress(addr);
        setIsLoading(false);
        checkAndRoute();
      } else {
        updateEndPoint(latlng);
        setIsLoading(true);
        const addr = await reverseGeocode(latlng.lat, latlng.lng);
        setEndAddress(addr);
        setIsLoading(false);
        checkAndRoute();
      }
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 400);

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [showMidPoint, readOnlyStartEnd]); // Re-bind click logic if mode changes

  // Auto geocode initial addresses if readOnlyStartEnd is true
  useEffect(() => {
    if (readOnlyStartEnd && mapInstanceRef.current && startAddress && endAddress) {
      const geocodeInitial = async () => {
        setIsLoading(true);
        const startLatlng = await geocode(startAddress);
        if (startLatlng) updateStartPoint(startLatlng);
        const endLatlng = await geocode(endAddress);
        if (endLatlng) updateEndPoint(endLatlng);
        
        if (startLatlng && endLatlng) {
          mapInstanceRef.current?.fitBounds([startLatlng, endLatlng], { padding: [50, 50] });
          checkAndRoute();
        }
        setIsLoading(false);
      };
      geocodeInitial();
    }
  }, [readOnlyStartEnd, startAddress, endAddress]);

  const updateStartPoint = (latlng: L.LatLng) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    startPointRef.current = latlng;
    if (setStartCoords) setStartCoords({lat: latlng.lat, lng: latlng.lng});
    if (tempStartMarkerRef.current) map.removeLayer(tempStartMarkerRef.current);
    tempStartMarkerRef.current = L.marker(latlng).addTo(map).bindPopup('Początek').openPopup();
  };

  const updateMidPoint = (latlng: L.LatLng) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    midPointRef.current = latlng;
    if (setMidCoords) setMidCoords({lat: latlng.lat, lng: latlng.lng});
    if (tempMidMarkerRef.current) map.removeLayer(tempMidMarkerRef.current);
    tempMidMarkerRef.current = L.marker(latlng).addTo(map).bindPopup('Punkt pośredni').openPopup();
  };

  const updateEndPoint = (latlng: L.LatLng) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    endPointRef.current = latlng;
    if (setEndCoords) setEndCoords({lat: latlng.lat, lng: latlng.lng});
    if (tempEndMarkerRef.current) map.removeLayer(tempEndMarkerRef.current);
    tempEndMarkerRef.current = L.marker(latlng).addTo(map).bindPopup('Koniec').openPopup();
  };



  const handleSearchStart = async () => {
    if (!startAddress) return;
    setIsLoading(true);
    const latlng = await geocode(startAddress);
    if (latlng) {
      updateStartPoint(latlng);
      mapInstanceRef.current?.setView(latlng, 14);
      checkAndRoute();
    }
    setIsLoading(false);
  };

  const handleSearchMid = async () => {
    if (!midAddress) return;
    setIsLoading(true);
    const latlng = await geocode(midAddress);
    if (latlng) {
      updateMidPoint(latlng);
      mapInstanceRef.current?.setView(latlng, 14);
      checkAndRoute();
    }
    setIsLoading(false);
  };

  const handleSearchEnd = async () => {
    if (!endAddress) return;
    setIsLoading(true);
    const latlng = await geocode(endAddress);
    if (latlng) {
      updateEndPoint(latlng);
      mapInstanceRef.current?.setView(latlng, 14);
      checkAndRoute();
    }
    setIsLoading(false);
  };

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) return;
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
        updateStartPoint(latlng);
        mapInstanceRef.current?.setView(latlng, 15);
        setStartAddress('Pobieranie...');
        checkAndRoute();
        const addr = await reverseGeocode(latlng.lat, latlng.lng);
        setStartAddress(addr);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const checkAndRoute = () => {
    const startPoint = startPointRef.current;
    const midPoint = midPointRef.current;
    const endPoint = endPointRef.current;
    const map = mapInstanceRef.current;

    if (startPoint && endPoint && map) {
      setIsLoading(true);
      if (tempStartMarkerRef.current) map.removeLayer(tempStartMarkerRef.current);
      if (tempMidMarkerRef.current) map.removeLayer(tempMidMarkerRef.current);
      if (tempEndMarkerRef.current) map.removeLayer(tempEndMarkerRef.current);
      if (routingControlRef.current) {
        try {
          routingControlRef.current.getPlan().setWaypoints([]);
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.warn('Leaflet routing remove error', e);
        }
      }

      const waypoints = [startPoint];
      if (showMidPoint && midPoint) waypoints.push(midPoint);
      waypoints.push(endPoint);

      const control = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: true,
        show: false,
        lineOptions: { styles: [{color: '#0d6efd', opacity: 0.8, weight: 6}], extendToWaypoints: true, missingRouteTolerance: 10 } as any,
        altLineOptions: { styles: [{color: '#6c757d', opacity: 0.8, weight: 6}], extendToWaypoints: true, missingRouteTolerance: 10 } as any,
      } as any).addTo(map);

      routingControlRef.current = control;

      control.on('routesfound', (e: any) => {
        const summary = e.routes[0].summary;
        const dist = (summary.totalDistance / 1000).toFixed(1);
        const time = Math.round(summary.totalTime / 60);
        let timeStr = time >= 60 ? `${Math.floor(time / 60)}h ${time % 60}m` : `${time} min`;
        
        setRouteInfo({ dist, timeStr });
        setRouteFound(true);
        setIsLoading(false);
      });
      
      control.on('routingerror', () => {
        setRouteFound(false);
        setIsLoading(false);
      });
    }
  };

  return (
    <section className="card location-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: 'none' }}>
      
      <div style={{ padding: '16px 16px 12px 16px', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', margin: 0 }}>
            <Map size={20} color="#0d6efd" />
            {title}
          </h2>
          {isLoading && <Loader2 size={20} color="#0d6efd" className="animate-spin" />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Start Point Input Group */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '4px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
            {!readOnlyStartEnd && (
              <button 
                onClick={handleLocateMe}
                title="Użyj mojej lokalizacji"
                style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#0d6efd', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                <Crosshair size={16} />
              </button>
            )}
            <input 
              type="text" 
              value={startAddress}
              onChange={(e) => setStartAddress(e.target.value)}
              placeholder={startLabel}
              style={{ flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '13px', outline: 'none' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchStart()}
              disabled={readOnlyStartEnd}
            />
            {!readOnlyStartEnd && (
              <button 
                onClick={handleSearchStart} 
                style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'transparent', color: '#495057', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                 <Search size={16} />
              </button>
            )}
          </div>

          {/* Optional Mid Point Input Group */}
          {showMidPoint ? (
            <div className="fade-in" style={{ display: 'flex', gap: '6px', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '4px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
              <div style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fd7e14' }}>
                <MapPin size={16} />
              </div>
              <input 
                type="text" 
                value={midAddress}
                onChange={(e) => setMidAddress(e.target.value)}
                placeholder="Przejeżdżam przez..."
                style={{ flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '13px', outline: 'none' }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchMid()}
              />
              <button 
                onClick={handleSearchMid} 
                style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'transparent', color: '#495057', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                 <Search size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowMidPoint(true)}
              style={{ padding: '2px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'transparent', border: 'none', color: '#0d6efd', cursor: 'pointer', alignSelf: 'flex-start', fontWeight: 'bold' }}
            >
              <PlusCircle size={14} /> Dodaj punkt pośredni (przejeżdżam przez)
            </button>
          )}

          {/* End Point Input Group */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '4px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
            <div style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#198754' }}>
              <Navigation size={16} />
            </div>
            <input 
              type="text" 
              value={endAddress}
              onChange={(e) => setEndAddress(e.target.value)}
              placeholder={endLabel}
              style={{ flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '13px', outline: 'none' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchEnd()}
              disabled={readOnlyStartEnd}
            />
            {!readOnlyStartEnd && (
              <button 
                onClick={handleSearchEnd} 
                style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'transparent', color: '#495057', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                 <Search size={16} />
              </button>
            )}
          </div>
          
        </div>

        {/* Action Buttons (Moved above the map to prevent mobile scroll trapping) */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
          {onPrev && (
            <button className="btn-secondary" style={{ padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: '#f8f9fa', border: '1px solid #ced4da', color: '#495057', fontSize: '14px' }} onClick={onPrev}>
              Wróć
            </button>
          )}
          {onNext && (
            <button 
              className="btn-primary" 
              style={{ padding: '10px', borderRadius: '10px', flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px' }} 
              onClick={onNext}
              disabled={!(startAddress && endAddress)}
            >
              {(startAddress && endAddress) ? 'Dalej' : 'Wybierz punkty'}
              {(startAddress && endAddress) && <ChevronRight size={16} />}
            </button>
          )}
        </div>
      </div>
      
      {/* Map Display */}
      <div style={{ position: 'relative', width: '100%', height: '400px', flexGrow: 1, borderTop: '1px solid #e9ecef', borderBottom: '1px solid #e9ecef' }}>
        <div ref={mapRef} className="leaflet-map-container" style={{ width: '100%', height: '100%', zIndex: 1 }}></div>
        
        {/* Minimal route info overlay */}
        {routeFound && routeInfo && (
          <div className="fade-in" style={{ position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(255,255,255,0.95)', padding: '8px 16px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 400, fontWeight: 'bold', fontSize: '13px', color: '#212529', display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
            <span>{routeInfo.dist} km</span>
            <span style={{ color: '#ced4da' }}>|</span>
            <span style={{ color: '#0d6efd' }}>~{routeInfo.timeStr}</span>
          </div>
        )}
      </div>

      {extraControls && (
        <div style={{ padding: '16px', backgroundColor: 'white' }}>
          {extraControls}
        </div>
      )}
      
      <style>{`
        .leaflet-routing-container { display: none !important; }
        .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important; }
        .leaflet-control-zoom a { color: #495057 !important; }
      `}</style>
    </section>
  );
}
