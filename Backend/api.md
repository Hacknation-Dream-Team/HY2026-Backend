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
    "gender": "Male",               // opcjonalne ("Female", "Male", "Other")
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
      "gender": "Male",
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
- **Odpowiedź (200 OK):** Obiekt użytkownika (`UserDto`). Pole `warning` jest ustawione, gdy brak adresu domowego (użytkownik nie dostanie matchy).

### Zmiana adresu domowego
- **`PUT /api/users/me/home-address`** `[Wymaga JWT]`
- **Body:** `{ "homeAddress": "ul. Prosta 1, Warszawa", "homeLocation": { "latitude": 52.23, "longitude": 21.01 } }`
- **Odpowiedź (200 OK):** Zaktualizowany `UserDto`. Trasy nie wymagają zmian (widok `route_stops` bierze adres z użytkownika).

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
    "gender": "Male",               // opcjonalne ("Female", "Male", "Other")
    "profileImg": "https://..."
  }
  ```

### Usunięcie konta
- **`DELETE /api/users/{id}`** `[Wymaga JWT]`
- **Opis:** Usuwa konto użytkownika. Użytkownik może usunąć własne konto, a administrator dowolne konto.
- **Odpowiedź (204 No Content)**

### Zmiana roli użytkownika
- **`PUT /api/users/{id}/role`** `[Wymaga JWT (Admin)]`
- **Opis:** Zmienia rolę użytkownika (np. `"Admin"` lub `"User"`).
- **Body:**
  ```json
  {
    "role": "Admin"
  }
  ```

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

### Przystanki trasy (widok `route_stops`)
- **`GET /api/routes/{id}/stops`**
- **Opis:** Pełna lista przystanków: `seq 0` = start, potem punkty pośrednie, ostatni = meta. Wartości `seq` są używane jako `pickupSeq`/`dropoffSeq` w matchach.
- **Odpowiedź (200 OK):** `[ { "routeId": 10, "seq": 0, "point": { "latitude": 52.2, "longitude": 21.0 } }, ... ]`; 404 gdy trasa nie istnieje.

---

## 3. Dopasowania i Matche (`/api/matches`)

### Wyszukiwanie pasujących tras (Matching)
- **`GET /api/matches`** `[Wymaga JWT]`
- **Opis:** Wyszukuje pasujące ogłoszenia kierowców przy użyciu funkcji PostgreSQL `find_matches`. Jeśli `requestId` nie zostanie podany w query, automatycznie wyszukuje dla aktywnego zapytania przejazdu zalogowanego użytkownika.
- **Parametry query:**
  - `requestId` (`long`, opcjonalny) – ID zapytania w tabeli `ride_requests`.
  - `maxDistanceMeters` (`int`, opcjonalny, domyślnie `500`) – maksymalny promień od przystanków w metrach.
  - `timeWindowMinutes` (`int`, opcjonalny, domyślnie `15`) – tolerancja czasu odjazdu w minutach.
- **Błędy (400):** brak aktywnego zapytania, zapytanie cudze/nieistniejące, brak adresu domowego użytkownika. Wyniki o kierunku innym niż zapytanie są odfiltrowywane.
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
- **Walidacje (400):** `pickupSeq < dropoffSeq`; oba `seq` muszą istnieć w `route_stops` trasy ogłoszenia; kierunek trasy = kierunek zapytania; ten sam oddział; kierowca ≠ pasażer; aktywne ogłoszenie i zapytanie; pasażer ma adres domowy; brak duplikatu matcha. 403 dla cudzego zapytania.
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
- **Body:** `"Accepted"` | `"Rejected"` | `"Cancelled"`
- **Reguły:** akceptować/odrzucać może tylko kierowca (403 dla pasażera); pasażer może tylko anulować (`Cancelled`); nie można ustawić `Pending` ani zmienić anulowanego matcha (400); akceptacja niemożliwa, gdy liczba zaakceptowanych matchy osiągnęła `advertisements.seats` (400).
- **Odpowiedź (200 OK):** Zaktualizowany obiekt `MatchDto`.

---

## 4. Pozostałe moduły (Pasażerowie, Kierowcy, Pojazdy, Organizacje, Przejazdy)

### Zapytania o przejazd - Pasażer (`/api/riderequests`)
- **`POST /api/riderequests`** `[Wymaga JWT]` - Utworzenie nowego zapytania o przejazd przez pasażera.
- **`GET /api/riderequests`** `[Wymaga JWT]` - Pobranie zapytań o przejazd zalogowanego użytkownika.
- **`GET /api/riderequests/{id}`** `[Wymaga JWT]` - Pobranie zapytania o przejazd po ID (dla zalogowanego użytkownika).
- **`DELETE /api/riderequests/{id}`** `[Wymaga JWT]` - Usunięcie zapytania o przejazd po ID (dla zalogowanego użytkownika).

### Ogłoszenia - Kierowca (`/api/advertisements`)
- **`POST /api/advertisements`** `[Wymaga JWT]` - Utworzenie nowego ogłoszenia przez kierowcę na wcześniej zdefiniowanej trasie. `seats` > 0 i nie więcej niż `passengerSeats` wskazanego auta.
- **`GET /api/advertisements`** `[Wymaga JWT]` - Pobranie ogłoszeń zalogowanego użytkownika.
- **`GET /api/advertisements/{id}`** `[Wymaga JWT]` - Pobranie ogłoszenia po ID (dla zalogowanego użytkownika).
- **`DELETE /api/advertisements/{id}`** `[Wymaga JWT]` - Usunięcie ogłoszenia po ID (dla zalogowanego użytkownika).

### Pojazdy użytkownika i modele aut (`/api/cars`)
- **`GET /api/cars/models`** `[Wymaga JWT]` - Pobranie listy dostępnych w bazie modeli samochodów.
- **`POST /api/cars`** `[Wymaga JWT]` - Przypisanie modelu samochodu z bazy do profilu użytkownika.
- **`GET /api/cars`** `[Wymaga JWT]` - Pobranie listy pojazdów zalogowanego użytkownika.
- **`DELETE /api/cars/{id}`** `[Wymaga JWT]` - Usunięcie pojazdu użytkownika o podanym ID.

### Organizacje (`/api/organizations`)
- **`POST /api/organizations`** `[Wymaga JWT (Admin)]` - Utworzenie nowej organizacji (tylko Administrator).
- **`PUT /api/organizations/{id}`** `[Wymaga JWT (Admin)]` - Edycja nazwy i lokalizacji organizacji (tylko Administrator).
- **`DELETE /api/organizations/{id}`** `[Wymaga JWT (Admin)]` - Usunięcie organizacji (tylko Administrator).
- **`GET /api/organizations`** - Pobranie listy wszystkich dostępnych organizacji (nie wymaga autoryzacji).
- **`GET /api/organizations/{id}`** - Pobranie konkretnej organizacji po jej ID (nie wymaga autoryzacji).

### Odwołania dni (`/api/rideevents`) `[Wymaga JWT]`
- **`POST /api/rideevents`** - Dopisuje zdarzenie `Cancelled`/`Restored` (body: `advertisementId`, `matchId` (null = cały kurs, tylko kierowca), `rideDate`, `event`). `rideDate` musi wypadać w dzień z `daysOfWeek` ogłoszenia.
- **`GET /api/rideevents/advertisement/{advertisementId}`** - Pełny dziennik zdarzeń ogłoszenia.
- **`GET /api/rideevents/status/advertisement/{advertisementId}?date=YYYY-MM-DD`** - Aktualny stan odwołań (widok `ride_status`), `date` opcjonalne.
- **`GET /api/rideevents/riding/match/{matchId}?date=YYYY-MM-DD`** - Czy pasażer jedzie danego dnia: `{ matchId, advertisementId, rideDate, isRiding, reason }`. Tylko uczestnicy matcha (403 dla innych).

---

## 5. Panel Administratora (`/api/admin`) `[Wymaga JWT (Admin)]`

Wszystkie endpointy w tym dziale wymagają autoryzacji kontem o roli `Admin`.

- **`GET /api/admin/stats`** - Zwraca podsumowanie statystyk w systemie (liczba użytkowników, adminów, organizacji, tras, ogłoszeń, zapytań, matchy, przejazdów, modeli aut).
- **`GET /api/admin/users`** - Pobiera pełną listę wszystkich użytkowników w systemie wraz z przypisanymi rolami.
- **`PUT /api/admin/users/{id}/role`** - Pozwala administratorowi zmienić rolę wskazanego użytkownika (`"Admin"` / `"User"`).
- **`GET /api/admin/organizations`** - Pobiera listę wszystkich organizacji w systemie.
- **`POST /api/admin/organizations`** - Tworzy nową organizację.
- **`PUT /api/admin/organizations/{id}`** - Edytuje nazwę oraz współrzędne geograficzne (lokalizację biura) organizacji.
- **`DELETE /api/admin/organizations/{id}`** - Usuwa organizację po ID.
- **`GET /api/admin/routes`** - Podgląd wszystkich tras utworzonych w całym systemie.
- **`GET /api/admin/advertisements`** - Podgląd wszystkich ogłoszeń kierowców w całym systemie.
- **`GET /api/admin/riderequests`** - Podgląd wszystkich zapytań pasażerów w całym systemie.
- **`GET /api/admin/matches`** - Podgląd wszystkich matchy w całym systemie.
- **`GET /api/admin/rides`** - Podgląd dziennika wszystkich zrealizowanych i planowanych przejazdów w całym systemie.

