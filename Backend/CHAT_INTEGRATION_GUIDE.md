# Instrukcja Integracji Czatu z Frontendem (React / TypeScript / SignalR)

Niniejszy dokument opisuje, jak zintegrować moduł czatu na frontendzie z backendem **HY2026 Backend**.

---

## 1. Architektura i Koncepcja

Moduł czatu łączy dwa mechanizmy:
1. **REST API (`/api/chat`)**: Do wstępnego pobierania danych (lista rozmów, historia wiadomości, stan nieprzeczytanych wiadomości).
2. **SignalR WebSocket (`/hubs/chat`)**: Do natychmiastowego odbierania i wysyłania wiadomości na żywo oraz wyświetlania powiadomień/toastów.

---

## 2. Instalacja zależności

Aby połączyć się z SignalR w aplikacji React / Vue / Angular / JS, zainstaluj oficjalną bibliotekę Microsoftu:

```bash
npm install @microsoft/signalr
```

---

## 3. Typy TypeScript (Interfaces)

Stwórz plik `src/types/chat.ts`:

```typescript
export interface ChatMessage {
  id: string;             // GUID wiadomości
  senderId: number;       // ID nadawcy
  senderName: string;     // Imię i nazwisko nadawcy
  recipientId: number;    // ID odbiorcy
  recipientName: string;  // Imię i nazwisko odbiorcy
  content: string;        // Treść wiadomości
  sentAt: string;         // Data ISO (np. "2026-10-04T00:15:00Z")
  isRead: boolean;        // Czy wiadomość została przeczytana
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

export interface SendMessageRequest {
  recipientId: number;
  content: string;
}

export interface UnreadCountResponse {
  totalUnreadCount: number;
}
```

---

## 4. Endpoints REST API (`/api/chat`)

Wszystkie żądania REST wymagają nagłówka autoryzacyjnego:
`Authorization: Bearer <jwt_token>`

### 4.1 Pobranie listy konwersacji
- **Endpoint**: `GET /api/chat/conversations`
- **Zastosowanie**: Wyświetlenie listy aktywnych rozmów na panelu czatu.
- **Odpowiedź**: `ConversationSummary[]`

### 4.2 Pobranie historii wiadomości z użytkownikiem
- **Endpoint**: `GET /api/chat/messages/{otherUserId}`
- **Zastosowanie**: Po kliknięciu na konkretnego użytkownika w czacie.
- **Odpowiedź**: `ChatMessage[]`

### 4.3 Wysłanie wiadomości przez REST
- **Endpoint**: `POST /api/chat/messages`
- **Body**: `{ "recipientId": 12, "content": "Cześć!" }`
- **Zastosowanie**: Alternatywna (lub domyślna) metoda wysyłania wiadomości. Serwer po odebraniu REST POST automatycznie rozgłasza wiadomość przez SignalR do odbiorcy.

### 4.4 Oznaczenie wiadomości jako przeczytane
- **Endpoint**: `POST /api/chat/read/{otherUserId}`
- **Zastosowanie**: Wywoływane gdy użytkownik otworzy okno czatu z danym użytkownikiem.

### 4.5 Liczba nieprzeczytanych wiadomości
- **Endpoint**: `GET /api/chat/unread-count`
- **Odpowiedź**: `{ "totalUnreadCount": 5 }`
- **Zastosowanie**: Czerwona kropka / badge powiadomień w menu nawigacyjnym aplikacji.

---

## 5. Połączenie SignalR Hub (`/hubs/chat`)

### 5.1 Nawiązanie połączenia z tokenem JWT

Dla połączeń WebSocket SignalR token JWT należy przekazać poprzez `accessTokenFactory`.

```typescript
import { HubConnectionBuilder, HubConnection, LogLevel } from "@microsoft/signalr";

const API_BASE_URL = "http://localhost:5000"; // Zmień na adres swojego backendu

export function createChatHubConnection(token: string): HubConnection {
  const connection = new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/chat`, {
      accessTokenFactory: () => token
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();

  return connection;
}
```

---

## 6. Zdarzenia SignalR

### 6.1 Zdarzenia odbierane z serwera (Server -> Client)

Subskrybuj te zdarzenia po utworzeniu połączenia:

```typescript
// 1. Odebranie nowej wiadomości (gdy użytkownik ma otwarty ten czat)
connection.on("ReceiveMessage", (message: ChatMessage) => {
  console.log("Odebrano wiadomość:", message);
  // Dodaj wiadomość do lokalnego stanu wiadomości w oknie czatu
});

// 2. Powiadomienie o nowej wiadomości (dla toastów / badge'a w tle)
connection.on("NewMessageNotification", (message: ChatMessage) => {
  console.log("Nowa wiadomość od:", message.senderName);
  // Wyświetl np. Toast "Jan Kowalski wysłał Ci wiadomość"
  // Zwiększ licznik unread count
});

// 3. Potwierdzenie wysłania wiadomości (jeśli wysyłasz przez SignalR invoke)
connection.on("MessageSent", (message: ChatMessage) => {
  console.log("Wiadomość wysłana pomyślnie:", message);
});

// 4. Powiadomienie, że odbiorca odczytał Twoje wiadomości
connection.on("MessagesRead", (readByUserId: number) => {
  console.log(`Użytkownik ${readByUserId} przeczytał Twoje wiadomości`);
  // Zaktualizuj stan isRead = true w wiadomościach
});
```

### 6.2 Wywoływanie metod na serwerze (Client -> Server)

```typescript
// Wysłanie wiadomości przez SignalR
await connection.invoke("SendMessage", recipientId, content);

// Oznaczenie wiadomości jako przeczytane przez SignalR
await connection.invoke("MarkAsRead", otherUserId);
```

---

## 7. Przykładowy Hook w React (`useChat.ts`)

Oto gotowy szablon Hooka React do użycia w aplikacji:

```typescript
import { useEffect, useState, useRef } from "react";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { ChatMessage, ConversationSummary } from "../types/chat";

export function useChat(token: string | null, activeRecipientId?: number) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadTotal, setUnreadTotal] = useState<number>(0);
  const connectionRef = useRef<HubConnection | null>(null);

  // 1. Inicjalizacja połączenia SignalR
  useEffect(() => {
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl("http://localhost:5000/hubs/chat", {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (msg: ChatMessage) => {
      if (activeRecipientId === msg.senderId || activeRecipientId === msg.recipientId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    connection.on("NewMessageNotification", (msg: ChatMessage) => {
      setUnreadTotal((prev) => prev + 1);
      // Opcjonalnie: odśwież listę konwersacji
    });

    connection.on("MessagesRead", (readByUserId: number) => {
      setMessages((prev) =>
        prev.map((m) => (m.recipientId === readByUserId ? { ...m, isRead: true } : m))
      );
    });

    connection
      .start()
      .then(() => console.log("SignalR Chat podłączony!"))
      .catch((err) => console.error("Błąd połączenia SignalR:", err));

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, [token, activeRecipientId]);

  // 2. Metoda do wysyłania wiadomości
  const sendMessage = async (recipientId: number, content: string) => {
    if (connectionRef.current && connectionRef.current.state === "Connected") {
      await connectionRef.current.invoke("SendMessage", recipientId, content);
    } else {
      // Fallback REST API
      const res = await fetch("http://localhost:5000/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId, content }),
      });
      const newMsg = await res.json();
      setMessages((prev) => [...prev, newMsg]);
    }
  };

  // 3. Metoda do oznaczania jako przeczytane
  const markAsRead = async (otherUserId: number) => {
    if (connectionRef.current && connectionRef.current.state === "Connected") {
      await connectionRef.current.invoke("MarkAsRead", otherUserId);
    }
  };

  return {
    conversations,
    messages,
    unreadTotal,
    sendMessage,
    markAsRead,
  };
}
```

---

## 8. Podsumowanie dla Dewelopera Frontendu

1. Aby pokazać badge powiadomień: wywołaj `GET /api/chat/unread-count`.
2. Aby otworzyć zakłądkę "Wiadomości": wywołaj `GET /api/chat/conversations`.
3. Aby wejść do rozmowy z użytkownikiem: wywołaj `GET /api/chat/messages/{otherUserId}` oraz `POST /api/chat/read/{otherUserId}`.
4. Podłącz SignalR Hub na starcie aplikacji / po zalogowaniu, aby na bieżąco odbierać `NewMessageNotification` i Pokazywać toasty!
