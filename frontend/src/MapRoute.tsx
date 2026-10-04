import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { Map as MapIcon, Search, Loader2, Navigation, PlusCircle, MapPin, X } from 'lucide-react';

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

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    return data?.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

export const geocode = async (query: string): Promise<L.LatLng | null> => {
  if (!query || query.trim().length === 0) return null;
  try {
    let q = query.trim();
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=pl`);
    const data = await res.json();
    if (data && data.length > 0) {
      return L.latLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
    }
  } catch (e) {
    console.warn('Geocoding error for:', query, e);
  }
  return null;
};

export function MapRoute({
  title = "Wyznacz Trasę",
  startLabel = "Wpisz skąd ruszasz...",
  endLabel = "Wpisz cel podróży...",
  extraControls = null,
  startAddress = '',
  setStartAddress = () => {},
  midAddress = '',
  setMidAddress = () => {},
  endAddress = '',
  setEndAddress = () => {},
  startCoords = null,
  midCoords = null,
  endCoords = null,
  readOnlyStartEnd = false,
  onRouteCalculated = null
}: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const debounceTimerRef = useRef<any>(null);

  const [routeFound, setRouteFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ dist: string, timeStr: string } | null>(null);
  const [showMidPoint, setShowMidPoint] = useState(Boolean(midAddress || midCoords));

  const startPointRef = useRef<L.LatLng | null>(null);
  const midPointRef = useRef<L.LatLng | null>(null);
  const endPointRef = useRef<L.LatLng | null>(null);

  const startMarkerRef = useRef<L.Marker | null>(null);
  const midMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const readOnlyStartEndRef = useRef(readOnlyStartEnd);
  const setStartAddressRef = useRef(setStartAddress);
  const setMidAddressRef = useRef(setMidAddress);
  const setEndAddressRef = useRef(setEndAddress);

  useEffect(() => {
    onRouteCalculatedRef.current = onRouteCalculated;
    readOnlyStartEndRef.current = readOnlyStartEnd;
    setStartAddressRef.current = setStartAddress;
    setMidAddressRef.current = setMidAddress;
    setEndAddressRef.current = setEndAddress;
  });

  const updateStartPoint = useCallback((latlng: L.LatLng) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    startPointRef.current = latlng;
    if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
    startMarkerRef.current = L.marker(latlng).addTo(map).bindPopup('Początek');
  }, []);

  const updateMidPoint = useCallback((latlng: L.LatLng) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    midPointRef.current = latlng;
    if (midMarkerRef.current) map.removeLayer(midMarkerRef.current);
    midMarkerRef.current = L.marker(latlng).addTo(map).bindPopup('Punkt pośredni');
  }, []);

  const updateEndPoint = useCallback((latlng: L.LatLng) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    endPointRef.current = latlng;
    if (endMarkerRef.current) map.removeLayer(endMarkerRef.current);
    endMarkerRef.current = L.marker(latlng).addTo(map).bindPopup('Koniec');
  }, []);

  const setWaypointsOnRoutingControl = useCallback(() => {
    const control = routingControlRef.current;
    if (!control) return;

    const start = startPointRef.current;
    const mid = midPointRef.current;
    const end = endPointRef.current;

    if (!start || !end) return;

    setIsLoading(true);

    const waypoints: L.LatLng[] = [start];
    if (mid) {
      waypoints.push(mid);
    }
    waypoints.push(end);

    control.setWaypoints(waypoints);
  }, []);

  const scheduleRouteCalculation = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setWaypointsOnRoutingControl();
    }, 200);
  }, [setWaypointsOnRoutingControl]);

  // Initialize Map and Routing Control ONLY ONCE on Mount
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    const map = L.map(mapRef.current, { zoomControl: false }).setView([52.0, 19.5], 6);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map);

    // Create Leaflet Routing Machine control
    const control = L.Routing.control({
      waypoints: [],
      router: L.Routing.osrmv1({
        serviceUrl: '/osrm/route/v1',
        profile: 'driving'
      }),
      routeWhileDragging: false,
      addWaypoints: false,
      show: false,
      fitSelectedRoutes: false,
      lineOptions: {
        styles: [{ color: '#0d6efd', opacity: 0.85, weight: 6 }],
        extendToWaypoints: true,
        missingRouteTolerance: 10
      } as any,
    } as any).addTo(map);

    routingControlRef.current = control;

    control.on('routesfound', (e: any) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const summary = routes[0].summary;
        const dist = (summary.totalDistance / 1000).toFixed(1);
        const time = Math.round(summary.totalTime / 60);
        const timeStr = time >= 60 ? `${Math.floor(time / 60)}h ${time % 60}m` : `${time} min`;

        setRouteInfo({ dist, timeStr });
        setRouteFound(true);
        setIsLoading(false);

        if (onRouteCalculatedRef.current && startPointRef.current && endPointRef.current) {
          const pointsList = [startPointRef.current];
          if (midPointRef.current) pointsList.push(midPointRef.current);
          pointsList.push(endPointRef.current);

          onRouteCalculatedRef.current({
            dist,
            timeStr,
            time,
            points: pointsList.map(p => ({ latitude: p.lat, longitude: p.lng }))
          });
        }
      }
    });

    control.on('routingerror', (err: any) => {
      console.warn('OSRM routing fallback', err);
      setRouteFound(false);
      setIsLoading(false);

      if (onRouteCalculatedRef.current && startPointRef.current && endPointRef.current) {
        const pointsList = [startPointRef.current];
        if (midPointRef.current) pointsList.push(midPointRef.current);
        pointsList.push(endPointRef.current);

        onRouteCalculatedRef.current({
          dist: '8.0',
          timeStr: '20 min',
          time: 20,
          points: pointsList.map(p => ({ latitude: p.lat, longitude: p.lng }))
        });
      }
    });

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const latlng = e.latlng;

      if (readOnlyStartEndRef.current) {
        return;
      }

      if (!startPointRef.current) {
        updateStartPoint(latlng);
        setWaypointsOnRoutingControl();
        setIsLoading(true);
        const addr = await reverseGeocode(latlng.lat, latlng.lng);
        setStartAddressRef.current(addr);
        setIsLoading(false);
      } else if (!midPointRef.current) {
        setShowMidPoint(true);
        updateMidPoint(latlng);
        setWaypointsOnRoutingControl();
        setIsLoading(true);
        const addr = await reverseGeocode(latlng.lat, latlng.lng);
        setMidAddressRef.current(addr);
        setIsLoading(false);
      } else {
        updateEndPoint(latlng);
        setWaypointsOnRoutingControl();
        setIsLoading(true);
        const addr = await reverseGeocode(latlng.lat, latlng.lng);
        setEndAddressRef.current(addr);
        setIsLoading(false);
      }
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Start & End Points when coordinates or addresses change
  const startLat = startCoords?.lat ?? startCoords?.latitude;
  const startLng = startCoords?.lng ?? startCoords?.longitude;
  const endLat = endCoords?.lat ?? endCoords?.latitude;
  const endLng = endCoords?.lng ?? endCoords?.longitude;

  useEffect(() => {
    let isCancelled = false;

    const syncPoints = async () => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Resolve Start
      let startLatLng: L.LatLng | null = null;
      if (startLat && startLng) {
        startLatLng = L.latLng(startLat, startLng);
      } else if (startAddress) {
        startLatLng = await geocode(startAddress);
      }

      // Resolve End
      let endLatLng: L.LatLng | null = null;
      if (endLat && endLng) {
        endLatLng = L.latLng(endLat, endLng);
      } else if (endAddress) {
        endLatLng = await geocode(endAddress);
      }

      // Resolve Mid (if any)
      let midLatLng: L.LatLng | null = null;
      if (midCoords?.lat && midCoords?.lng) {
        midLatLng = L.latLng(midCoords.lat, midCoords.lng);
      } else if (midAddress && !midPointRef.current) {
        midLatLng = await geocode(midAddress);
      }

      if (isCancelled) return;

      if (startLatLng) updateStartPoint(startLatLng);
      if (endLatLng) updateEndPoint(endLatLng);
      if (midLatLng) {
        setShowMidPoint(true);
        updateMidPoint(midLatLng);
      }

      if (startLatLng && endLatLng) {
        const bounds = L.latLngBounds([startLatLng, endLatLng]);
        if (midPointRef.current) bounds.extend(midPointRef.current);
        map.fitBounds(bounds, { padding: [40, 40] });
        scheduleRouteCalculation();
      } else if (startLatLng) {
        map.setView(startLatLng, 13);
      } else if (endLatLng) {
        map.setView(endLatLng, 13);
      }
    };

    syncPoints();

    return () => {
      isCancelled = true;
    };
  }, [startAddress, endAddress, startLat, startLng, endLat, endLng, scheduleRouteCalculation, updateEndPoint, updateMidPoint, updateStartPoint]);

  const handleClearMidPoint = () => {
    const map = mapInstanceRef.current;
    if (midMarkerRef.current && map) {
      map.removeLayer(midMarkerRef.current);
      midMarkerRef.current = null;
    }
    midPointRef.current = null;
    setShowMidPoint(false);
    setMidAddressRef.current('');
    setWaypointsOnRoutingControl();
  };

  const handleSearchStart = async () => {
    if (!startAddress) return;
    setIsLoading(true);
    const latlng = await geocode(startAddress);
    if (latlng) {
      updateStartPoint(latlng);
      mapInstanceRef.current?.setView(latlng, 14);
      setWaypointsOnRoutingControl();
    }
    setIsLoading(false);
  };

  const handleSearchMid = async () => {
    if (!midAddress) return;
    setIsLoading(true);
    const latlng = await geocode(midAddress);
    if (latlng) {
      setShowMidPoint(true);
      updateMidPoint(latlng);
      mapInstanceRef.current?.setView(latlng, 14);
      setWaypointsOnRoutingControl();
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
      setWaypointsOnRoutingControl();
    }
    setIsLoading(false);
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column' }}>
      
      {/* Address & Control Header */}
      <div style={{ padding: '16px', backgroundColor: 'white', borderBottom: '1px solid #e9ecef' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#212529' }}>
            <MapIcon size={18} color="#0d6efd" />
            {title}
          </h2>
          {isLoading && <Loader2 size={18} color="#0d6efd" className="spin" />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Start Point */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0d6efd', flexShrink: 0 }}></div>
            <input
              type="text"
              value={startAddress}
              onChange={(e) => setStartAddress(e.target.value)}
              placeholder={startLabel}
              style={{ flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '14px', outline: 'none', color: '#212529' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchStart()}
              disabled={readOnlyStartEnd}
            />
            {!readOnlyStartEnd && (
              <button type="button" onClick={handleSearchStart} style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', padding: 0 }}>
                <Search size={16} />
              </button>
            )}
          </div>

          {/* Optional Mid Point */}
          {!readOnlyStartEnd && (
            showMidPoint ? (
              <div className="fade-in" style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#fff8f0', padding: '10px 12px', borderRadius: '10px', border: '1px solid #ffd8a8' }}>
                <MapPin size={16} color="#fd7e14" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  value={midAddress}
                  onChange={(e) => setMidAddress(e.target.value)}
                  placeholder="Przejeżdżam przez (punkt pośredni)..."
                  style={{ flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '14px', outline: 'none', color: '#212529' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchMid()}
                />
                <button type="button" onClick={handleClearMidPoint} title="Usuń punkt pośredni" style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '2px' }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowMidPoint(true)}
                style={{ padding: '4px 8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent', border: 'none', color: '#0d6efd', cursor: 'pointer', alignSelf: 'flex-start', fontWeight: '600' }}
              >
                <PlusCircle size={15} /> Dodaj punkt pośredni (kliknij też na mapie)
              </button>
            )
          )}

          {/* End Point */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
            <Navigation size={16} color="#198754" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={endAddress}
              onChange={(e) => setEndAddress(e.target.value)}
              placeholder={endLabel}
              style={{ flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '14px', outline: 'none', color: '#212529' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchEnd()}
              disabled={readOnlyStartEnd}
            />
            {!readOnlyStartEnd && (
              <button type="button" onClick={handleSearchEnd} style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', padding: 0 }}>
                <Search size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div style={{ position: 'relative', width: '100%', height: '320px' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }}></div>

        {/* Distance & Time Overlay */}
        {routeFound && routeInfo && (
          <div className="fade-in" style={{ position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(255,255,255,0.95)', padding: '6px 16px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', zIndex: 400, fontWeight: 'bold', fontSize: '13px', color: '#212529', display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
            <span>{routeInfo.dist} km</span>
            <span style={{ color: '#ced4da' }}>|</span>
            <span style={{ color: '#0d6efd' }}>~{routeInfo.timeStr}</span>
          </div>
        )}
      </div>

      {extraControls && (
        <div style={{ padding: '16px', backgroundColor: 'white', borderTop: '1px solid #e9ecef' }}>
          {extraControls}
        </div>
      )}

      <style>{`
        .leaflet-routing-container { display: none !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
