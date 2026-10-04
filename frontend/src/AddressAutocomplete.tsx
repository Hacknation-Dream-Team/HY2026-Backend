import { useState, useEffect, useRef } from 'react';


export function AddressAutocomplete({ 
  value, 
  onChange, 
  onSelect,
  placeholder 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  onSelect: (addr: string, lat: number, lng: number) => void,
  placeholder?: string
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!value || !showDropdown) {
      setSuggestions([]);
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      try {
        let q = value;
        if (!q.toLowerCase().includes('krak')) {
          q += ', Kraków';
        }
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&viewbox=19.78,50.12,20.08,49.98&bounded=1`);
        const data = await res.json();
        setSuggestions(data || []);
      } catch (e) {
        console.error(e);
      }
    }, 500);

    return () => clearTimeout(timeoutRef.current);
  }, [value, showDropdown]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '15px' }} 
      />
      
      {showDropdown && suggestions.length > 0 && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, 
          backgroundColor: 'white', border: '1px solid #ced4da', borderRadius: '8px', 
          marginTop: '4px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {suggestions.map((s, i) => (
            <div 
              key={i} 
              style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid #e9ecef' : 'none', fontSize: '13px' }}
              onMouseDown={() => {
                setShowDropdown(false);
                onChange(s.display_name);
                onSelect(s.display_name, parseFloat(s.lat), parseFloat(s.lon));
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {s.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
