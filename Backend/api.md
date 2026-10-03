# Dokumentacja API - HY2026 Backend

Wszystkie endpointy mają prefiks `/api`. Autoryzacja odbywa się za pomocą tokena Bearer JWT przekazywanego w nagłówku:
`Authorization: Bearer <token_jwt>`

---

## 1. Autoryzacja i Użytkownicy (`/api/users`)

### Rejestracja
- **`POST /api/users`**
- **Opis:** Rejestruje nowego użytkownika i zwraca token JWT. Pole `organizationId` jest opcjonalne (w przypadku braku, użytkownik zostanie przypisany do organizacji domyślnej).
- **Body:**
  ```json
  {
    "organizationId": 1,            // opcjonalne
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
      "organizationId": 1,
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
    "organizationId": 1,            // opcjonalne
    "name": "Jan",
    "surname": "Nowak",
    "phone": "+48987654321",
    "profileImg": "https://..."
  }
  ```

### Usunięcie konta
- **`DELETE /api/users/{id}`** `[Wymaga JWT]`
- **Opis:** Usuwa konto użytkownika. Użytkownik może usunąć tylko własne konto.
- **Odpowiedź (204 No Content)**

---

## 2. Trasy (`/api/routes`)

Punkty trasy można przekazać na dwa sposoby:
1. **W liście `points`**: Pierwszy element to punkt startowy, ostatni to punkt docelowy, a wszystkie elementy pomiędzy to punkty pośrednie (`middlePoints`).
2. **Za pomocą pól `startPoint`, `endPoint` i `middlePoints`**: Jawnie wskazany start, meta oraz opcjonalna tablica punktów pośrednich.

Wymagane są **minimum 2 punkty** (start i meta).

### Tworzenie trasy
- **`POST /api/routes`** `[Wymaga JWT]`
- **Opis:** Tworzy nową trasę przypisaną do zalogowanego użytkownika.
- **Body (Wariant A - Uporządkowana lista `points`):**
  ```json
  {
    "points": [
      { "latitude": 52.2297, "longitude": 21.0122 }, // Warszawa (Start)
      { "latitude": 51.7592, "longitude": 19.4560 }, // Łódź (Middle point)
      { "latitude": 50.0647, "longitude": 19.9450 }  // Kraków (End)
    ],
    "lookingFor": "Passenger / Pasażer"  // opcjonalne
  }
  ```

- **Body (Wariant B - Jawne punkty start, middle i end):**
  ```json
  {
    "startPoint": { "latitude": 52.2297, "longitude": 21.0122 },
    "middlePoints": [
      { "latitude": 51.7592, "longitude": 19.4560 }
    ],
    "endPoint": { "latitude": 50.0647, "longitude": 19.9450 },
    "lookingFor": "Passenger / Pasażer"  // opcjonalne
  }
  ```

- **Odpowiedź (201 Created):**
  ```json
  {
    "id": 10,
    "userId": 1,
    "points": [
      { "latitude": 52.2297, "longitude": 21.0122 },
      { "latitude": 51.7592, "longitude": 19.4560 },
      { "latitude": 50.0647, "longitude": 19.9450 }
    ],
    "startPoint": { "latitude": 52.2297, "longitude": 21.0122 },
    "endPoint": { "latitude": 50.0647, "longitude": 19.9450 },
    "middlePoints": [
      { "latitude": 51.7592, "longitude": 19.4560 }
    ],
    "lookingFor": "Passenger / Pasażer"
  }
  ```

### Pobranie trasy po ID
- **`GET /api/routes/{id}`**
- **Opis:** Zwraca trasę o podanym ID wraz z wyliczonymi punktami startowym, docelowym oraz liścią punktów pośrednich (`middlePoints`).

### Pobranie listy tras
- **`GET /api/routes`** lub **`GET /api/routes?userId={userId}`**
- **Opis:** Zwraca listę wszystkich tras (z opcją filtrowania po ID użytkownika).

### Usunięcie trasy
- **`DELETE /api/routes/{id}`** `[Wymaga JWT]`
- **Opis:** Usuwa trasę o podanym ID. Użytkownik może usunąć tylko własną trasę.
- **Odpowiedź (204 No Content)**

---

## 3. Dopasowania i Matche (`/api/matches`)

### Wyszukiwanie pasujących tras (Matching)
- **`GET /api/matches`** `[Wymaga JWT]`
- **Opis:** Wyszukuje pasujące ogłoszenia kierowców przy użyciu funkcji PostgreSQL `find_matches`. Jeśli `requestId` nie zostanie podany w query, automatycznie wyszukuje dla aktywnego zapytania przejazdu zalogowanego użytkownika.
- **Parametry query:**
  - `requestId` (`long`, opcjonalny) – ID zapytania w tabeli `ride_requests`.
  - `maxDistanceMeters` (`int`, opcjonalny, domyślnie `500`) – maksymalny promień od przystanków w metrach.
  - `timeWindowMinutes` (`int`, opcjonalny, domyślnie `15`) – tolerancja czasu odjazdu w minutach.
- **Odpowiedź (200 OK):**
  ```json
  [
    {
      "advertisementId": 12,
      "driverId": 3,
      "pickupSeq": 1,
      "dropoffSeq": 3,
      "pickupDistanceM": 120,
      "dropoffDistanceM": 45,
      "departureTime": "07:30:00",
      "freeSeats": 3
    }
  ]
  ```

### Zgłoszenie matcha (Pasażer wybiera ogłoszenie)
- **`POST /api/matches`** `[Wymaga JWT]`
- **Opis:** Tworzy wniosek o match pomiędzy zapytaniem pasażera a ogłoszeniem kierowcy ze statusem `Pending`.
- **Body:**
  ```json
  {
    "advertisementId": 12,
    "requestId": 9,
    "pickupSeq": 1,
    "dropoffSeq": 3
  }
  ```
- **Odpowiedź (201 Created):**
  ```json
  {
    "id": 1,
    "advertisementId": 12,
    "requestId": 9,
    "pickupSeq": 1,
    "dropoffSeq": 3,
    "status": "Pending"
  }
  ```

### Moje matche
- **`GET /api/matches/my`** `[Wymaga JWT]`
- **Opis:** Zwraca listę wszystkich matchy zalogowanego użytkownika (zarówno jako pasażera, jak i kierowcy).

### Zmiana statusu matcha (Akceptacja / Odmowa)
- **`PUT /api/matches/{id}/status`** `[Wymaga JWT]`
- **Body:** `"Accepted"` (lub `"Rejected"`, `"Cancelled"`, `"Pending"`)
- **Odpowiedź (200 OK):** Zaktualizowany obiekt `MatchDto`.
