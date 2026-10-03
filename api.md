# Dokumentacja API - HY2026 Backend

Wszystkie endpointy mają prefiks `/api`. Autoryzacja odbywa się za pomocą tokena Bearer JWT przekazywanego w nagłówku:
`Authorization: Bearer <token_jwt>`

---

## 1. Autoryzacja i Użytkownicy (`/api/users`)

### Rejestracja
- **`POST /api/users`**
- **Opis:** Rejestruje nowego użytkownika i zwraca token JWT.
- **Body:**
  ```json
  {
    "name": "Jan",
    "surname": "Kowalski",
    "email": "jan.kowalski@example.com",
    "password": "Haslo123!",
    "phone": "+48123456789",       // opcjonalne
    "profileImg": "https://..."     // opcjonalne
  }
  ```
- **Odpowiedź (201 Created):**
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "name": "Jan",
      "surname": "Kowalski",
      "email": "jan.kowalski@example.com",
      "phone": "+48123456789",
      "profileImg": "https://..."
    }
  }
  ```

### Logowanie
- **`POST /api/users/login`**
- **Opis:** Weryfikuje dane logowania i zwraca token JWT.
- **Body:**
  ```json
  {
    "email": "jan.kowalski@example.com",
    "password": "Haslo123!"
  }
  ```
- **Odpowiedź (200 OK):** Zwraca obiekt z `token` oraz `user`.

### Mój profil
- **`GET /api/users/me`** `[Wymaga JWT]`
- **Opis:** Zwraca profil aktualnie zalogowanego użytkownika.
- **Odpowiedź (200 OK):** Obiekt użytkownika (`UserDto`).

### Pobranie listy użytkowników
- **`GET /api/users`**
- **Opis:** Zwraca listę wszystkich użytkowników.

### Pobranie użytkownika po ID
- **`GET /api/users/{id}`**
- **Opis:** Zwraca dane użytkownika o podanym ID.

### Aktualizacja profilu
- **`PUT /api/users/{id}`** `[Wymaga JWT]`
- **Opis:** Aktualizuje dane profilowe. Użytkownik może edytować tylko własny profil.
- **Body:**
  ```json
  {
    "name": "Jan",
    "surname": "Nowak",
    "phone": "+48987654321",
    "profileImg": "https://..."
  }
  ```

### Usunięcie konta
- **`DELETE /api/users/{id}`** `[Wymaga JWT]`
- **Opis:** Usuwa konto użytkownika. Użytkownik może usunąć tylko własne konto.
- **Odpowiedź (244 NoContent)**

---

## 2. Trasy (`/api/routes`)

Punkty trasy przekazywane są w liście `points`. 
- Pierwszy punkt (`points[0]`) to punkt startowy (**startP**).
- Ostatni punkt (`points[points.length - 1]`) to punkt docelowy (**endP**).
- Wymagane są **minimum 2 punkty**.

### Tworzenie trasy
- **`POST /api/routes`** `[Wymaga JWT]`
- **Opis:** Tworzy nową trasę przypisaną do zalogowanego użytkownika.
- **Body:**
  ```json
  {
    "points": [
      {
        "latitude": 52.2297,
        "longitude": 21.0122
      },
      {
        "latitude": 50.0647,
        "longitude": 19.9450
      }
    ],
    "lookingFor": "Passenger / Pasażer"  // opcjonalne
  }
  ```
- **Odpowiedź (201 Created):**
  ```json
  {
    "id": 10,
    "userId": 1,
    "points": [
      {
        "latitude": 52.2297,
        "longitude": 21.0122
      },
      {
        "latitude": 50.0647,
        "longitude": 19.9450
      }
    ],
    "lookingFor": "Passenger / Pasażer"
  }
  ```

### Pobranie trasy po ID
- **`GET /api/routes/{id}`**
- **Opis:** Zwraca trasę o podanym ID.

### Pobranie listy tras
- **`GET /api/routes`** lub **`GET /api/routes?userId={userId}`**
- **Opis:** Zwraca listę wszystkich tras (z opcją filtrowania po ID użytkownika).

### Usunięcie trasy
- **`DELETE /api/routes/{id}`** `[Wymaga JWT]`
- **Opis:** Usuwa trasę o podanym ID. Użytkownik może usunąć tylko własną trasę.
- **Odpowiedź (244 NoContent)**
