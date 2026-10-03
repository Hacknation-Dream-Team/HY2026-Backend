import { useState } from 'react';
import { Compass, MessageCircle, User as UserIcon, Bell } from 'lucide-react';
import { DiscoverView } from './views/DiscoverView';
import { ChatsView } from './views/ChatsView';
import { ProfileView } from './views/ProfileView';

export function MainView({ user, onLogout }: { user?: any, onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState<'discover' | 'chats' | 'profile'>('discover');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const openChat = (chatId: string) => {
    setActiveChatId(chatId);
    setActiveTab('chats');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8f9fa', position: 'relative' }}>
      
      {/* Top Bar for Notifications */}
      <div style={{ padding: '16px 20px', backgroundColor: 'white', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#0d6efd' }}>Commute Together</div>
        <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
          <Bell size={24} color="#495057" />
          <div style={{ position: 'absolute', top: '-2px', right: '-2px', backgroundColor: '#dc3545', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid white' }}></div>
        </button>
      </div>

      {showNotifications && (
        <div style={{ position: 'absolute', top: '60px', right: '20px', width: '300px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #e9ecef', zIndex: 100, padding: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Powiadomienia</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#fff3cd', borderRadius: '8px', fontSize: '13px', color: '#664d03', border: '1px solid #ffecb5' }}>
              <strong>Kierowca odwołał przejazd!</strong><br/>
              Jan Kowalski odwołał Twój przejazd (Wtorek, 07:15).
            </div>
            <div style={{ padding: '12px', backgroundColor: '#d1e7dd', borderRadius: '8px', fontSize: '13px', color: '#0f5132', border: '1px solid #badbcc' }}>
              <strong>Prośba zaakceptowana</strong><br/>
              Zostałeś zapisany na stały cykl do BBP.
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }} onClick={() => setShowNotifications(false)}>
        {activeTab === 'discover' && <DiscoverView user={user} onOpenChat={openChat} />}
        {activeTab === 'chats' && <ChatsView activeChatId={activeChatId} onSetActiveChatId={setActiveChatId} />}
        {activeTab === 'profile' && <ProfileView user={user} onLogout={onLogout} />}
      </div>

      <div style={{ display: 'flex', borderTop: '1px solid #e9ecef', backgroundColor: 'white', padding: '10px 0', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <button 
          onClick={() => { setActiveTab('discover'); setActiveChatId(null); }}
          style={navButtonStyle(activeTab === 'discover')}
        >
          <Compass size={24} />
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Odkryj</span>
        </button>
        <button 
          onClick={() => { setActiveTab('chats'); setActiveChatId(null); }}
          style={navButtonStyle(activeTab === 'chats')}
        >
          <MessageCircle size={24} />
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Chaty</span>
        </button>
        <button 
          onClick={() => { setActiveTab('profile'); setActiveChatId(null); }}
          style={navButtonStyle(activeTab === 'profile')}
        >
          <UserIcon size={24} />
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Profil</span>
        </button>
      </div>
    </div>
  );
}

function navButtonStyle(isActive: boolean) {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: isActive ? '#0d6efd' : '#6c757d',
    cursor: 'pointer'
  };
}
