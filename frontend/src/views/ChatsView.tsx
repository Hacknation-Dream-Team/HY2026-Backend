import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { api } from '../api';

export function ChatsView() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyMatches()
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/matches/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      setMatches(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    } catch(e: any) {
      alert('Błąd: ' + e.message);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', margin: '0 0 20px 0', color: '#212529' }}>Moje dopasowania</h1>
      
      {loading ? (
        <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px 20px' }}>Ładowanie...</div>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #ced4da' }}>
          Nie masz jeszcze żadnych dopasowań.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {matches.map(match => (
            <div key={match.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold' }}>Match #{match.id}</div>
                <div style={{ 
                  padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
                  backgroundColor: match.status === 'Accepted' ? '#d1e7dd' : match.status === 'Rejected' ? '#f8d7da' : '#fff3cd',
                  color: match.status === 'Accepted' ? '#0f5132' : match.status === 'Rejected' ? '#842029' : '#664d03'
                }}>
                  {match.status}
                </div>
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '16px' }}>
                ID Ogłoszenia: {match.advertisementId} | ID Zapytania: {match.requestId}
              </div>

              {match.status === 'Pending' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleStatusChange(match.id, 'Accepted')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#198754', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Check size={18} /> Akceptuj
                  </button>
                  <button onClick={() => handleStatusChange(match.id, 'Rejected')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#dc3545', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <X size={18} /> Odrzuć
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
