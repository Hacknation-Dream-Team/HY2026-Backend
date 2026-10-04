import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Send, Check, X, MessageCircle, RefreshCw, 
  CheckCheck, Sparkles, Car, MapPin, Clock, UserCircle2, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';
import { api } from '../api';

export interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export interface ConversationSummary {
  otherUserId: number;
  otherUserName: string;
  otherUserProfileImg?: string | null;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageSenderId: number;
  unreadCount: number;
}

interface ChatsViewProps {
  activeUserId?: number | string | null;
  onSelectUser?: (userId: number | null) => void;
  currentUser?: any;
}

export function ChatsView({ activeUserId = null, onSelectUser, currentUser }: ChatsViewProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    activeUserId ? Number(activeUserId) : null
  );
  const [activeTab, setActiveTab] = useState<'conversations' | 'matches'>('conversations');
  
  // Conversations & Matches state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Active Chat Thread state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Helper for checking match status (handles both integer enums and string values)
  const isStatusAccepted = (status: any) => status === 'Accepted' || status === 1 || status === '1';
  const isStatusRejected = (status: any) => status === 'Rejected' || status === 2 || status === '2';
  const isStatusPending = (status: any) => !isStatusAccepted(status) && !isStatusRejected(status);

  // Sync prop activeUserId with local selectedUserId
  useEffect(() => {
    if (activeUserId) {
      setSelectedUserId(Number(activeUserId));
    }
  }, [activeUserId]);

  const handleSelectUser = (id: number | null, name?: string) => {
    setSelectedUserId(id);
    if (name) setOtherUserName(name);
    if (onSelectUser) onSelectUser(id);
  };

  // Load conversations & matches
  const fetchListData = async () => {
    setLoadingList(true);
    try {
      const [convs, matchRes] = await Promise.allSettled([
        api.getConversations(),
        api.getMyMatches()
      ]);
      if (convs.status === 'fulfilled') {
        setConversations(convs.value || []);
      }
      if (matchRes.status === 'fulfilled') {
        setMatches(matchRes.value || []);
      }
    } catch (e) {
      console.error('Error fetching chat data:', e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchListData();
  }, []);

  // Fetch messages for active user & setup auto polling
  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    // Look up user name if not set
    const foundConv = conversations.find(c => c.otherUserId === selectedUserId);
    if (foundConv) {
      setOtherUserName(foundConv.otherUserName);
    } else if (!otherUserName) {
      setOtherUserName(`Użytkownik #${selectedUserId}`);
    }

    const loadMessages = async (silent = false) => {
      if (!silent) setLoadingMessages(true);
      try {
        const history = await api.getChatMessages(selectedUserId);
        if (isMounted) {
          setMessages(history || []);
          if (history && history.length > 0) {
            const firstMsg = history.find((m: ChatMessage) => m.senderId === selectedUserId);
            if (firstMsg?.senderName) {
              setOtherUserName(firstMsg.senderName);
            }
          }
        }
        await api.markChatAsRead(selectedUserId).catch(() => {});
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        if (isMounted && !silent) setLoadingMessages(false);
      }
    };

    loadMessages(false);

    // Poll every 3 seconds for active conversation
    const interval = setInterval(() => {
      loadMessages(true);
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (selectedUserId && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUserId]);

  // Handle message sending
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedUserId || sending) return;

    setSending(true);
    const content = text.trim();
    if (!textToSend) setInputText('');

    try {
      const newMsg = await api.sendChatMessage(selectedUserId, content);
      setMessages(prev => [...prev, newMsg]);
      fetchListData();
    } catch (err: any) {
      alert('Błąd podczas wysyłania wiadomości: ' + (err.message || err));
      if (!textToSend) setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/matches/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Nie udało się zmienić statusu (${res.status})`);
      }
      
      setMatches(prev => prev.map(m => m.id === id ? (data || { ...m, status }) : m));
    } catch(e: any) {
      alert('Błąd: ' + e.message);
    }
  };

  // Helper for rendering initial avatar
  const renderAvatar = (name: string, isOnline = true) => {
    const initials = name
      ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : 'U';
    return (
      <div style={{ position: 'relative' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: '#0d6efd',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '16px',
          boxShadow: '0 2px 8px rgba(13,110,253,0.2)'
        }}>
          {initials}
        </div>
        {isOnline && (
          <div style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#198754',
            border: '2px solid white'
          }} />
        )}
      </div>
    );
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // ----------------------------------------------------
  // RENDER ACTIVE CHAT THREAD
  // ----------------------------------------------------
  if (selectedUserId !== null) {
    let storedUserId = 0;
    try {
      const userObjStr = localStorage.getItem('user');
      if (userObjStr) storedUserId = JSON.parse(userObjStr)?.id || 0;
    } catch {}
    const currentUserId = currentUser?.id || storedUserId || Number(localStorage.getItem('userId') || 0);

    // Find match for this user if exists
    const activeMatch = matches.find(m => 
      m.driverUserId === selectedUserId || 
      m.passengerUserId === selectedUserId || 
      m.otherUserId === selectedUserId ||
      m.userId === selectedUserId
    ) || (matches.length > 0 ? matches[0] : null);

    // Is the current logged in user the driver of this match?
    const isDriver = activeMatch 
      ? (activeMatch.driverUserId ? activeMatch.driverUserId === currentUserId : (currentUser?.role === 'Driver' || true))
      : true;

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', backgroundColor: '#f8f9fa' }}>
        {/* Chat Thread Top Bar */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <button
            onClick={() => handleSelectUser(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#212529'
            }}
            title="Powrót do listy"
          >
            <ArrowLeft size={20} />
          </button>

          {renderAvatar(otherUserName)}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {otherUserName || `Rozmowa #${selectedUserId}`}
            </h2>
            <div style={{ fontSize: '12px', color: '#198754', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#198754', display: 'inline-block' }}></span>
              Aktywny teraz
            </div>
          </div>

          <button
            onClick={() => {
              setLoadingMessages(true);
              api.getChatMessages(selectedUserId)
                .then(setMessages)
                .finally(() => setLoadingMessages(false));
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#6c757d' }}
            title="Odśwież"
          >
            <RefreshCw size={18} className={loadingMessages ? 'spin' : ''} />
          </button>
        </div>

        {/* Ride Summary Card Header */}
        <div style={{
          margin: '12px 16px 4px 16px',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d6efd', fontWeight: 600, fontSize: '14px' }}>
              <Car size={18} />
              <span>Streszczenie przejazdu</span>
              {activeMatch && (
                <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: 'normal' }}>
                  (Dopasowanie #{activeMatch.id})
                </span>
              )}
            </div>

            {/* Status badge */}
            {activeMatch && (
              <div style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: isStatusAccepted(activeMatch.status) ? '#d1e7dd' : isStatusRejected(activeMatch.status) ? '#f8d7da' : '#fff3cd',
                color: isStatusAccepted(activeMatch.status) ? '#0f5132' : isStatusRejected(activeMatch.status) ? '#842029' : '#664d03'
              }}>
                {isStatusAccepted(activeMatch.status) ? (
                  <><CheckCircle2 size={14} /> Zaakceptowano</>
                ) : isStatusRejected(activeMatch.status) ? (
                  <><AlertCircle size={14} /> Odrzucono</>
                ) : (
                  <><Clock size={14} /> Oczekuje na decyzję</>
                )}
              </div>
            )}
          </div>

          {/* Ride Details info */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#495057', borderTop: '1px solid #f1f3f5', paddingTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} color="#6c757d" />
              <span>Kierunek: <strong>{activeMatch?.direction === 'WorkToHome' ? 'Praca ➔ Dom' : 'Dom ➔ Praca'}</strong></span>
            </div>
            {activeMatch?.departureTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="#6c757d" />
                <span>Odjazd: <strong>{activeMatch.departureTime}</strong></span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCircle2 size={15} color="#6c757d" />
              <span>Uczestnik: <strong>{otherUserName}</strong></span>
            </div>
          </div>

          {/* Action Controls: Driver (Accept / Reject) vs Passenger (Status view) */}
          {activeMatch ? (
            <div style={{ borderTop: '1px solid #f1f3f5', paddingTop: '10px' }}>
              {isDriver ? (
                /* DRIVER ACTIONS */
                isStatusPending(activeMatch.status) ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleStatusChange(activeMatch.id, 'Accepted')}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#198754',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(25,135,84,0.3)'
                      }}
                    >
                      <Check size={16} /> Akceptuj pasażera
                    </button>
                    <button
                      onClick={() => handleStatusChange(activeMatch.id, 'Rejected')}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <X size={16} /> Odrzuć
                    </button>
                  </div>
                ) : isStatusAccepted(activeMatch.status) ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#0f5132', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} color="#198754" /> Zaakceptowałeś tego pasażera na ten przejazd
                    </span>
                    <button
                      onClick={() => handleStatusChange(activeMatch.id, 'Rejected')}
                      style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #dc3545', backgroundColor: '#fff', color: '#dc3545', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Cofnij / Odrzuć
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#842029', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={16} color="#dc3545" /> Odmówiłeś dołączenia temu pasażerowi. Pasażer musi wysłać nową prośbę.
                    </span>
                  </div>
                )
              ) : (
                /* PASSENGER STATUS VIEW */
                <div style={{
                  fontSize: '13px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: isStatusAccepted(activeMatch.status) ? '#d1e7dd' : isStatusRejected(activeMatch.status) ? '#f8d7da' : '#fff3cd',
                  color: isStatusAccepted(activeMatch.status) ? '#0f5132' : isStatusRejected(activeMatch.status) ? '#842029' : '#664d03',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {isStatusAccepted(activeMatch.status) ? (
                    <><CheckCircle2 size={16} /> Twoja prośba została zaakceptowana przez kierowcę! Miłej podróży.</>
                  ) : isStatusRejected(activeMatch.status) ? (
                    <><AlertCircle size={16} /> Kierowca odrzucił tę prośbę o dołączenie do przejazdu.</>
                  ) : (
                    <><Clock size={16} /> Prośba wysłana. Oczekujesz na decyzję kierowcy.</>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ borderTop: '1px solid #f1f3f5', paddingTop: '8px', fontSize: '12px', color: '#6c757d' }}>
              Rozmawiasz bezpośrednio z użytkownikiem <strong>{otherUserName}</strong>.
            </div>
          )}
        </div>

        {/* Messages List Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loadingMessages && messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px 0' }}>
              Ładowanie historii wiadomości...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: '#6c757d', padding: '20px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#e7f1ff', color: '#0d6efd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <MessageCircle size={32} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#212529' }}>Rozpocznij konwersację</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>Wyślij wiadomość do {otherUserName}, aby omówić szczegóły wspólnego przejazdu!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUserId || (currentUserId === 0 && msg.senderName === currentUser?.name);
              
              return (
                <div
                  key={msg.id || idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    backgroundColor: isMe ? '#0d6efd' : 'white',
                    color: isMe ? 'white' : '#212529',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                    border: isMe ? 'none' : '1px solid #e9ecef'
                  }}>
                    {msg.content}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#adb5bd',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0 4px'
                  }}>
                    {formatTime(msg.sentAt)}
                    {isMe && (
                      msg.isRead ? (
                        <CheckCheck size={14} color="#0d6efd" title="Przeczytane" />
                      ) : (
                        <Check size={14} color="#adb5bd" title="Dostarczone" />
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Tags */}
        <div style={{ padding: '0 16px 8px 16px', display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {[
            'Cześć! O której wyjeżdżamy?',
            'Gdzie dokładnie się spotkamy?',
            'Będę na miejscu za 5 minut!'
          ].map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(promptText)}
              disabled={sending}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '16px',
                border: '1px solid #dee2e6',
                backgroundColor: 'white',
                color: '#495057',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <Sparkles size={12} color="#0d6efd" /> {promptText}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'white',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Napisz wiadomość..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '24px',
              border: '1px solid #ced4da',
              outline: 'none',
              fontSize: '14px',
              backgroundColor: '#f8f9fa'
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || sending}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: inputText.trim() && !sending ? '#0d6efd' : '#ced4da',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputText.trim() && !sending ? 'pointer' : 'default',
              transition: 'background-color 0.2s',
              boxShadow: inputText.trim() ? '0 2px 8px rgba(13,110,253,0.3)' : 'none'
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER CHAT LIST / MATCHES LIST
  // ----------------------------------------------------
  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="fade-in" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, color: '#212529', fontWeight: 700 }}>Wiadomości i Czaty</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6c757d' }}>Komunikuj się z kierowcami i pasażerami</p>
        </div>
        
        <button
          onClick={fetchListData}
          style={{ background: 'none', border: '1px solid #ced4da', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#495057' }}
        >
          <RefreshCw size={16} className={loadingList ? 'spin' : ''} /> Odśwież
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e9ecef', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('conversations')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'conversations' ? '3px solid #0d6efd' : '3px solid transparent',
            color: activeTab === 'conversations' ? '#0d6efd' : '#6c757d',
            fontWeight: activeTab === 'conversations' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Konwersacje
          {unreadTotal > 0 && (
            <span style={{
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {unreadTotal}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'matches' ? '3px solid #0d6efd' : '3px solid transparent',
            color: activeTab === 'matches' ? '#0d6efd' : '#6c757d',
            fontWeight: activeTab === 'matches' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Dopasowania
          {matches.length > 0 && (
            <span style={{
              backgroundColor: '#e9ecef',
              color: '#495057',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {matches.length}
            </span>
          )}
        </button>
      </div>

      {loadingList ? (
        <div style={{ textAlign: 'center', color: '#6c757d', padding: '60px 20px' }}>
          <div className="spin" style={{ display: 'inline-block', marginBottom: '12px' }}>
            <RefreshCw size={24} color="#0d6efd" />
          </div>
          <div>Ładowanie wiadomości...</div>
        </div>
      ) : activeTab === 'conversations' ? (
        /* CONVERSATIONS LIST */
        conversations.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6c757d', padding: '50px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #ced4da' }}>
            <MessageCircle size={48} color="#adb5bd" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#212529' }}>Nie masz jeszcze żadnych konwersacji</h3>
            <p style={{ margin: 0, fontSize: '14px', maxWidth: '400px', marginInline: 'auto' }}>
              Gdy omówisz przejazd z innym użytkownikiem lub wyślesz prośbę o dołączenie, Twoje konwersacje pojawią się tutaj.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {conversations.map(conv => (
              <div
                key={conv.otherUserId}
                onClick={() => handleSelectUser(conv.otherUserId, conv.otherUserName)}
                style={{
                  backgroundColor: 'white',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid #e9ecef',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
                className="card-hover"
              >
                {renderAvatar(conv.otherUserName)}
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.otherUserName}
                    </span>
                    <span style={{ fontSize: '12px', color: '#adb5bd' }}>
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: conv.unreadCount > 0 ? '#212529' : '#6c757d',
                    fontWeight: conv.unreadCount > 0 ? 600 : 'normal',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {conv.lastMessage || 'Kliknij, aby otworzyć czat'}
                  </div>
                </div>

                {conv.unreadCount > 0 && (
                  <div style={{
                    backgroundColor: '#0d6efd',
                    color: 'white',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* MATCHES LIST */
        matches.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6c757d', padding: '50px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #ced4da' }}>
            <UserCircle2 size={48} color="#adb5bd" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#212529' }}>Brak aktywnych dopasowań</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>Szukaj przejazdów w zakładce "Odkryj", aby wygenerować automatyczne dopasowania.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {matches.map(match => (
              <div key={match.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e9ecef', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Dopasowanie #{match.id}</div>
                  <div style={{ 
                    padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                    backgroundColor: isStatusAccepted(match.status) ? '#d1e7dd' : isStatusRejected(match.status) ? '#f8d7da' : '#fff3cd',
                    color: isStatusAccepted(match.status) ? '#0f5132' : isStatusRejected(match.status) ? '#842029' : '#664d03'
                  }}>
                    {isStatusAccepted(match.status) ? 'Zaakceptowano' : isStatusRejected(match.status) ? 'Odrzucono' : 'Oczekuje'}
                  </div>
                </div>

                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '16px' }}>
                  ID Ogłoszenia: <strong>#{match.advertisementId}</strong> | ID Zapytania: <strong>#{match.requestId}</strong>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {isStatusPending(match.status) && (
                    <>
                      <button onClick={() => handleStatusChange(match.id, 'Accepted')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#198754', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Check size={18} /> Akceptuj
                      </button>
                      <button onClick={() => handleStatusChange(match.id, 'Rejected')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#dc3545', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <X size={18} /> Odrzuć
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      const targetUserId = match.passengerUserId || match.otherUserId || match.userId || match.requestId || match.advertisementId;
                      handleSelectUser(targetUserId, `Czat dot. Dopasowania #${match.id}`);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #0d6efd',
                      backgroundColor: '#e7f1ff',
                      color: '#0d6efd',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <MessageCircle size={18} /> Otwórz czat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
