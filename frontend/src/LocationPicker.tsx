import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocode, reverseGeocode } from './MapRoute';

export function LocationPicker({ 
  initialAddress, 
  onLocationSelected, 
  onClose 
}: { 
  initialAddress: string, 
  onLocationSelected: (address: string, lat: number, lng: number) => void,
  onClose: () => void 
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [address, setAddress] = useState(initialAddress);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current).setView([52.2297, 21.0122], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    mapInstanceRef.current = map;

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const latlng = e.latlng;
      setCoords({lat: latlng.lat, lng: latlng.lng});
      if (markerRef.current) map.removeLayer(markerRef.current);
      markerRef.current = L.marker(latlng).addTo(map);
      
      setIsLoading(true);
      const newAddr = await reverseGeocode(latlng.lat, latlng.lng);
      setAddress(newAddr);
      setIsLoading(false);
    });

    const initMap = async () => {
      if (initialAddress) {
        const latlng = await geocode(initialAddress);
        if (latlng) {
          map.setView(latlng, 15);
          setCoords({lat: latlng.lat, lng: latlng.lng});
          markerRef.current = L.marker(latlng).addTo(map);
        }
      }
      setIsLoading(false);
      setTimeout(() => map.invalidateSize(), 400);
    };
    initMap();

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e9ecef' }}>
          <h3 style={{ margin: 0 }}>Zweryfikuj adres</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6c757d' }}>Kliknij na mapie, aby przestawić pinezkę.</p>
        </div>
        
        <div style={{ padding: '16px', backgroundColor: '#f8f9fa' }}>
          <input type="text" value={address} readOnly style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: '#e9ecef', color: '#495057' }} />
        </div>

        <div style={{ position: 'relative', width: '100%', height: '350px' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
          {isLoading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '10px 20px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 1000 }}>Ładowanie...</div>}
        </div>

        <div style={{ padding: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #e9ecef' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: 'white', cursor: 'pointer' }}>Anuluj</button>
          <button 
            onClick={() => coords && onLocationSelected(address, coords.lat, coords.lng)}
            disabled={!coords || isLoading}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#198754', color: 'white', cursor: coords ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
          >
            Zatwierdź pinezkę
          </button>
        </div>
      </div>
    </div>
  );
}
