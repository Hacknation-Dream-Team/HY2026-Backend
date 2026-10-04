# Schemat bazy

```
                    ┌────────────────────┐
                    │ users_cars         │    ┌─────────────────────┐
┌────────────────┐  │────────────────────│    │ users               │    ┌───────────────────────┐
│ car_models     │  │ id              PK │    │─────────────────────│    │ organizations         │
│────────────────│  │ user_id         FK │───►│ id               PK │    │───────────────────────│
│ id          PK │◄─│ car_model_id    FK │    │ organization_id  FK │───►│ id                 PK │
│ brand, model   │  │ model_name         │    │ name, surname       │    │ name                  │
│ fuel_type      │  │ plate              │    │ gender              │    │ address               │
│ l/kwh_100km    │  │ color              │    │ email, phone        │    │ location              │
│ co2_g_km       │  │ passenger_seats    │    │ password (hash)     │    │ auto_approve_domain   │
└────────────────┘  └────────────────────┘    │ profile_img         │    │ auto_approve_enabled  │
                                              │ home_address        │    │ join_code             │
                                              │ home_location       │    └───────────────────────┘
                                              │ approval_status     │
                                              └─────────────────────┘
                                                  ▲           ▲
                              KIEROWCA            │           │   PASAŻER
                        ┌─────────────────────────┘           └─────────────────────┐
                        │                                                           │
            ┌───────────┴────────────┐                                 ┌────────────┴───────────┐
            │ routes                 │                                 │ ride_requests          │
            │────────────────────────│                                 │────────────────────────│
            │ id                  PK │                                 │ id                  PK │
            │ user_id             FK │                                 │ user_id             FK │
            │ direction              │                                 │ direction              │
            │ UNIQUE(user,direction) │                                 │ departure_time         │
            └────────────────────────┘                                 │ days_of_week           │
                ▲             ▲                                        │ is_active              │
                │             │                                        │                        │
┌───────────────┴────────┐ ┌──┴──────────────────────────────┐         └────────────────────────┘
│ route_points           │ │ advertisements                  │                      ▲
│────────────────────────│ │─────────────────────────────────│                      │
│ route_id            FK │ │ id                           PK │                      │
│ seq (od 1)             │ │ route_id                     FK │                      │
│ point                  │ │ users_car_id → users_cars    FK │                      │
│ tylko pośrednie        │ │ seats                           │                      │
└────────────────────────┘ │ departure_time                  │                      │
                           │ days_of_week                    │                      │
widok route_stops:         │ is_active                       │                      │
dom + pośrednie + biuro    │ description                     │                      │
                           └─────────────────────────────────┘                      │
                                            ▲                                       │
                                            │                                       │
                                    ┌───────┴───────────────────────────────────────┴──┐
                                    │ matches                                          │
                                    │──────────────────────────────────────────────────│
                                    │ id                                            PK │
                                    │ advertisement_id                              FK │
                                    │ request_id                                    FK │
                                    │ pickup_seq   (seq z route_stops)                 │
                                    │ dropoff_seq  (seq z route_stops)                 │
                                    │ status  pending|accepted|rejected|cancelled      │
                                    └──────────────────────────────────────────────────┘
                                                            ▲
                                                            │
                                    ┌───────────────────────┴──────────────────────────┐
                                    │ ride_events  (tylko INSERT)                      │
                                    │──────────────────────────────────────────────────│
                                    │ id                                            PK │
                                    │ advertisement_id → advertisements             FK │
                                    │ match_id  (NULL = cały kurs)                  FK │
                                    │ ride_date                                        │
                                    │ event  cancelled|restored                        │
                                    │ created_by → users                            FK │
                                    │ created_at                                       │
                                    └──────────────────────────────────────────────────┘
                                    widok ride_status: ostatnie zdarzenie na (kurs, dzień)
```

Baza: PostgreSQL + PostGIS (Neon). Pełny SQL w `schema.sql`, diagram w `docs/erd-draft.md`, skrót dla backendu w `docs/memo-backend.md`.

Połączenie: zmienna środowiskowa `DATABASE_URL` (connection string dostajesz prywatnie, nie commituj go do repo).

## Pliki

| plik          | co robi |
|---------------|---------|
| `schema.sql`  | **kasuje wszystkie tabele i dane**, potem tworzy schemat od nowa |
| `seed.sql`    | słownik aut z EEA (1292 wiersze) + dane mockowe (Warszawa, 3 oddziały, 60 userów). Odpalać po `schema.sql`. Hasło wszystkich mockowych kont: `haslo123` |
| `queries.sql` | zapytania podglądowe (trasy, ogłoszenia, matche, GeoJSON na mapę, matching) |
| `scripts/load_eea_raw.py` + `.github/workflows/refresh-car-models.yml` | odświeżenie `car_models` z EEA (patrz niżej) |

## Model w skrócie

- **Organizacja = oddział** z adresem (np. Orange, Kraków, ul. Jagiellońska 17). Każdy user należy do dokładnie jednej. Matching tylko w obrębie oddziału.
- **User** ma jeden adres domowy (`home_address` + `home_location`), ustawiany w ustawieniach. To jedyne miejsce z adresem domu.
- **Kierowca:** max dwie `routes` (do pracy, z pracy). Trasa = przystanki pośrednie w `route_points`; dom i biuro dokleja widok `route_stops`. Na trasie wisi `advertisements` (post z harmonogramem: godzina wyjazdu, dni, ile pasażerów, auto).
- **Pasażer:** `ride_requests`, może mieć kilka na kierunek (np. inne godziny w różne dni; nakładanie dni pilnuje backend). Skąd/dokąd wynika z kierunku: do pracy = dom → oddział, z pracy = oddział → dom.
- **`matches`:** jeden wiersz = jeden pasażer na jednym ogłoszeniu, z przystankiem wsiadania i wysiadania. To umowa, przy commute trwa tygodniami.
- **`ride_events`:** odwołania/przywrócenia konkretnych dni. Tylko dopisujemy, nigdy nie zmieniamy (pełna historia). Stan bieżący w widoku `ride_status`.
- **Godziny:** baza trzyma tylko godzinę wyjazdu. Szacowane godziny na przystankach liczy front.

```
organizations 1 ── N users
users 1 ── N users_cars N ── 0..1 car_models
users 1 ── 0..2 routes 1 ── N route_points
                routes 1 ── N advertisements N ── 0..1 users_cars
users 1 ── N ride_requests
advertisements 1 ── N matches N ── 1 ride_requests
advertisements 1 ── N ride_events N ── 0..1 matches
```

## Typy

| typ               | wartości |
|-------------------|----------|
| `weekday`         | `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun` |
| `trip_direction`  | `to_work` (dom → oddział), `to_home` (oddział → dom) |
| `match_status`    | `pending` (pasażer się zgłosił), `accepted` (obie strony się zgodziły), `rejected` (kierowca odmówił), `cancelled` (ktoś zrezygnował na stałe) |
| `ride_event_type` | `cancelled` (odwołany dzień), `restored` (cofnięcie odwołania) |
| `user_gender`     | `female`, `male`, `other` |

## C# / Npgsql

Enumy i PostGIS trzeba zarejestrować, inaczej odczyt się wywali:

```csharp
public enum Weekday { Mon, Tue, Wed, Thu, Fri, Sat, Sun }
public enum TripDirection { ToWork, ToHome }
public enum MatchStatus { Pending, Accepted, Rejected, Cancelled }
public enum RideEventType { Cancelled, Restored }
public enum UserGender { Female, Male, Other }

// EF Core (Npgsql 9+):
options.UseNpgsql(connStr, o =>
{
    o.UseNetTopologySuite();
    o.MapEnum<Weekday>("weekday");
    o.MapEnum<TripDirection>("trip_direction");
    o.MapEnum<MatchStatus>("match_status");
    o.MapEnum<RideEventType>("ride_event_type");
    o.MapEnum<UserGender>("user_gender");
});
```

- Npgsql domyślnie zamienia `ToWork` → `to_work`, `Pending` → `pending` itd., więc nazwy się zgadzają bez dodatkowej konfiguracji.
- `weekday[]` → `Weekday[]` (albo `List<Weekday>`).
- `geography(Point, 4326)` → `NetTopologySuite.Geometries.Point`. Uwaga na kolejność: `X` = długość (lng), `Y` = szerokość (lat), SRID 4326.
- `time` → `TimeOnly`, `date` → `DateOnly`, `timestamptz` → `DateTime` (UTC).

## Tabele

### organizations

| kolumna  | typ                    | uwagi |
|----------|------------------------|-------|
| id       | bigint                 | PK, generowany |
| name     | text                   | nazwa firmy/oddziału |
| address  | text                   | adres oddziału |
| location | geography(Point, 4326) | współrzędne oddziału |
| auto_approve_domain  | text    | opcjonalna, domena maila, np. `nordwind.pl` |
| auto_approve_enabled | boolean | domyślnie `false`; `true` = user z maila w `auto_approve_domain` dostaje od razu `approved` |
| join_code            | text    | opcjonalny, kod dołączenia do oddziału, np. `NORD-4821` |

### users

| kolumna         | typ                    | uwagi |
|-----------------|------------------------|-------|
| id              | bigint                 | PK, generowany |
| organization_id | bigint                 | FK → organizations.id, wymagane |
| name, surname   | text                   | |
| gender          | user_gender            | opcjonalna; NULL = nie podano |
| email           | text                   | unikalny |
| phone           | text                   | opcjonalny |
| password        | text                   | zapisuj hash (bcrypt/argon2), nie hasło jawne |
| profile_img     | text                   | opcjonalny, URL lub ścieżka |
| home_address    | text                   | adres domu (nazwa), z ustawień |
| home_location   | geography(Point, 4326) | współrzędne domu; bez nich user nie dostanie matchy |
| approval_status | text                   | `pending` (czeka na akceptację), `approved`, `rejected`; w mocku wszyscy `approved` |

### car_models

Słownik modeli aut z EEA (marka + model + paliwo), spalanie i CO₂ homologacyjne (średnie 2010–2025). `UNIQUE (brand, model, fuel_type)`. Tylko do odczytu dla backendu.

| kolumna       | typ     | uwagi |
|---------------|---------|-------|
| id            | bigint  | PK |
| brand, model  | text    | np. `SKODA`, `OCTAVIA` |
| fuel_type     | text    | `PETROL`, `DIESEL`, `ELECTRIC`, `PETROL/ELECTRIC`, `DIESEL/ELECTRIC`, `LPG`, `NG`, `E85`, `CNG` |
| l_per_100km   | numeric | NULL dla elektryków; bywa NULL dla LPG/NG/E85 |
| kwh_per_100km | numeric | tylko elektryki i hybrydy plug-in |
| co2_g_km      | integer | |

### users_cars

| kolumna         | typ      | uwagi |
|-----------------|----------|-------|
| id              | bigint   | PK |
| user_id         | bigint   | FK → users.id |
| car_model_id    | bigint   | FK → car_models.id; NULL = model spoza słownika ("Inne" na froncie) |
| model_name      | text     | model wpisany ręcznie, używany gdy `car_model_id` jest NULL |
| plate           | text     | numer rejestracyjny |
| color           | text     | |
| passenger_seats | smallint | ile miejsc dla pasażerów, > 0 |

`CHECK`: `car_model_id` albo `model_name` musi być wypełnione.

### routes

| kolumna   | typ            | uwagi |
|-----------|----------------|-------|
| id        | bigint         | PK |
| user_id   | bigint         | FK → users.id (kierowca) |
| direction | trip_direction | `UNIQUE (user_id, direction)`: max jedna trasa w każdą stronę |

### route_points

Tylko przystanki **pośrednie**, w kolejności jazdy. Trasa bez przystanków pośrednich = zero wierszy.

| kolumna  | typ                    | uwagi |
|----------|------------------------|-------|
| route_id | bigint                 | FK → routes.id |
| seq      | smallint               | od 1, bez dziur |
| point    | geography(Point, 4326) | `ST_MakePoint(lng, lat)` |

PK: `(route_id, seq)`.

### route_stops (widok)

Pełna lista przystanków trasy: `seq 0` = start, potem pośrednie z `route_points`, ostatni = meta. Do pracy: dom kierowcy → … → oddział; z pracy: oddział → … → dom. Dom i oddział brane na bieżąco z `users` / `organizations`, więc zmiana adresu w ustawieniach działa od razu. Kolumny: `route_id`, `seq`, `point`.

### advertisements

Post kierowcy: kiedy jedzie danym kierunkiem.

| kolumna        | typ       | uwagi |
|----------------|-----------|-------|
| id             | bigint    | PK |
| route_id       | bigint    | FK → routes.id; kierowcę i kierunek bierzesz z trasy |
| users_car_id   | bigint    | FK → users_cars.id, opcjonalne (bez auta → domyślne spalanie) |
| seats          | smallint  | "Ilu pasażerów chcesz zabrać?", > 0 |
| departure_time | time      | godzina wyjazdu ze startu trasy |
| days_of_week   | weekday[] | dni |
| is_active      | boolean   | domyślnie true |
| description    | text      | opcjonalny opis |

### ride_requests

| kolumna        | typ            | uwagi |
|----------------|----------------|-------|
| id             | bigint         | PK |
| user_id        | bigint         | FK → users.id (pasażer) |
| direction      | trip_direction | `UNIQUE (user_id, direction)` |
| departure_time | time           | kiedy chce wyjechać |
| days_of_week   | weekday[]      | |
| is_active      | boolean        | domyślnie true |

### matches

| kolumna          | typ          | uwagi |
|------------------|--------------|-------|
| id               | bigint       | PK |
| advertisement_id | bigint       | FK → advertisements.id |
| request_id       | bigint       | FK → ride_requests.id |
| pickup_seq       | smallint     | przystanek wsiadania = `seq` z `route_stops` trasy ogłoszenia |
| dropoff_seq      | smallint     | przystanek wysiadania; `CHECK (pickup_seq < dropoff_seq)` |
| status           | match_status | domyślnie `pending` |

### ride_events

Dziennik zdarzeń dla konkretnych dni. **Tylko INSERT**, nigdy UPDATE/DELETE.

| kolumna          | typ             | uwagi |
|------------------|-----------------|-------|
| id               | bigint          | PK |
| advertisement_id | bigint          | FK → advertisements.id |
| match_id         | bigint          | FK → matches.id; **NULL = cały kurs** (kierowca odwołuje dzień), wypełnione = jeden pasażer |
| ride_date        | date            | konkretny dzień kursu (np. środa 8.10); przychodzi z frontu przy odwołaniu, kursy wynikają z `days_of_week` ogłoszenia |
| event            | ride_event_type | `cancelled` / `restored` |
| created_by       | bigint          | FK → users.id, kto to zrobił |
| created_at       | timestamptz     | domyślnie `now()` |

### ride_status (widok)

Ostatnie zdarzenie dla każdej pary (ogłoszenie, match, dzień). Kolumny jak w `ride_events` bez `id`. Pasażer danego dnia **nie jedzie**, jeśli `event = 'cancelled'` dla jego matcha albo dla całego kursu (`match_id IS NULL`).

## Matching: `find_matches`

Gotowa funkcja w bazie: dla zapytania pasażera zwraca pasujące ogłoszenia, najlepsze pierwsze (najbliższy przystanek, potem najmniejsza różnica godzin).

```sql
SELECT * FROM find_matches(13);                         -- domyślnie: 500 m, ±15 min
SELECT * FROM find_matches(13, 800, '30 minutes');     -- luźniejsze kryteria
```

Warunki: ten sam kierunek, ten sam oddział, kierowca ≠ pasażer, ogłoszenie aktywne, co najmniej jeden wspólny dzień, `departure_time` w oknie czasowym, przystanek w promieniu od startu pasażera i dalszy przystanek w promieniu od jego mety, wolne miejsce, brak istniejącego matcha tej pary.

Zwraca: `advertisement_id`, `driver_id`, `pickup_seq`, `dropoff_seq`, `pickup_distance_m`, `dropoff_distance_m`, `departure_time`, `free_seats`. Z tych pól backend tworzy wiersz w `matches` (status `pending`).

Ograniczenia: okno czasowe porównuje godzinę wyjazdu kierowcy z godziną pasażera (bez czasu dojazdu do przystanku); nie obsługuje przejścia przez północ.

## Odświeżanie `car_models` z EEA

Backendu nie dotyczy, opis dla porządku. Raz na jakiś czas (gdy EEA opublikuje nowy rok) ręcznie odpala się workflow `refresh-car-models` w GitHub Actions:

1. `scripts/load_eea_raw.py` pobiera surowe agregaty z EEA do CSV,
2. CSV trafia do tabeli `eea_raw`,
3. `CALL refresh_car_models();` czyści nazwy marek i modeli, liczy spalanie i robi upsert do `car_models` po `(brand, model, fuel_type)`. Istniejące `id` zostają, więc `users_cars.car_model_id` się nie rozjeżdża.

`eea_raw` to tabela robocza, aplikacja jej nie używa. Funkcje `eea_starts_with_word` i `eea_clean_model` to pomocnicze funkcje procedury. Czas odświeżenia: ok. 5 s.

## Czego baza NIE pilnuje (musi backend)

- `pickup_seq` / `dropoff_seq` muszą istnieć w `route_stops` trasy tego ogłoszenia.
- Zaakceptowanych matchy na ogłoszeniu nie więcej niż `advertisements.seats`; `seats` nie więcej niż `passenger_seats` auta.
- `advertisements.users_car_id` musi należeć do kierowcy trasy (`users_cars.user_id = routes.user_id`).
- Kierowca i pasażer z tego samego oddziału; kierowca ≠ pasażer; kierunek trasy = kierunek zapytania.
- Kierowca nie może mieć dwóch ogłoszeń na ten sam termin (ta sama trasa, wspólny dzień, ta sama godzina).
- `ride_events`: `match_id` musi należeć do `advertisement_id`; cały kurs (`match_id` NULL) odwołuje tylko kierowca; `ride_date` nie z przeszłości i musi wypadać w dzień z `days_of_week` ogłoszenia (przy wypisaniu pasażera także jego zapytania).
