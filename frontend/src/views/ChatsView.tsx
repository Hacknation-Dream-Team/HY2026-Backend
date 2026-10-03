import { useState } from 'react';
import { ArrowLeft, UserCircle2, MapPin, Clock, Send, Calendar } from 'lucide-react';

export function ChatsView({ activeChatId, onSetActiveChatId }: { activeChatId: string | null, onSetActiveChatId: (id: string | null) => void }) {
  if (activeChatId) {
    return <ChatDetailView chatId={activeChatId} onBack={() => onSetActiveChatId(null)} />;
  }

  return (
    <div className="fade-in" style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', margin: '0 0 20px 0', color: '#212529' }}>Chaty</h1>
      
      <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #ced4da' }}>
        Nie masz jeszcze żadnych otwartych konwersacji.
      </div>
    </div>
  );
}

function ChatDetailView({ chatId, onBack }: { chatId: string, onBack: () => void }) {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Cześć, pasuje Ci 7:15 z przystanku na Długiej?', sender: 'other' }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    setMessages([...messages, { id: Date.now(), text: inputText, sender: 'me' }]);
    setInputText('');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px', backgroundColor: 'white', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#212529', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ width: '40px', height: '40px', backgroundColor: '#0d6efd', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>JK</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: '#212529' }}>Jan Kowalski</div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>Kierowca</div>
        </div>
        <button style={{ background: 'none', border: 'none', color: '#0d6efd', cursor: 'pointer' }}>
          <UserCircle2 size={24} />
        </button>
      </div>
      
      {/* Info Card */}
      <div style={{ padding: '16px', backgroundColor: '#f8f9fa' }}>
        <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #e9ecef', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 'bold' }}>Szczegóły przejazdu (Oczekiwanie)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><Calendar size={14} color="#6c757d"/> Stały cykl (Pon-Pt)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><MapPin size={14} color="#6c757d"/> Kraków (Długa) -&gt; BBP</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={14} color="#6c757d"/> 07:15 - 07:45</div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button style={{ flex: 1, padding: '8px', backgroundColor: '#198754', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Akceptuj</button>
            <button style={{ flex: 1, padding: '8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Odrzuć</button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8f9fa' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ 
            alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start', 
            backgroundColor: msg.sender === 'me' ? '#0d6efd' : '#e9ecef', 
            color: msg.sender === 'me' ? 'white' : '#212529',
            padding: '12px 16px', 
            borderRadius: '16px', 
            borderBottomLeftRadius: msg.sender === 'other' ? '4px' : '16px',
            borderBottomRightRadius: msg.sender === 'me' ? '4px' : '16px',
            maxWidth: '80%' 
          }}>
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '16px', backgroundColor: 'white', borderTop: '1px solid #e9ecef', paddingBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Napisz wiadomość..." 
            style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #ced4da', outline: 'none' }} 
          />
          <button onClick={handleSend} style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#0d6efd', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Send size={18} style={{ marginLeft: '2px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
