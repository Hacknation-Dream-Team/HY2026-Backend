# Diagram schematu

Odpowiada `schema.sql`. Strzałka wskazuje tabelę, do której prowadzi FK. Opis tabel: `docs/schema.md`.

```
                    ┌────────────────────┐
                    │ users_cars         │    ┌─────────────────────┐
┌────────────────┐  │────────────────────│    │ users               │    ┌────────────────────┐
│ car_models     │  │ id              PK │    │─────────────────────│    │ organizations      │
│────────────────│  │ user_id         FK │───►│ id               PK │    │────────────────────│
│ id          PK │◄─│ car_model_id    FK │    │ organization_id  FK │───►│ id              PK │
│ brand, model   │  │ model_name         │    │ name, surname       │    │ name               │
│ fuel_type      │  │ plate              │    │ gender              │    │ address            │
│ l/kwh_100km    │  │ color              │    │ email, phone        │    │ location           │
│ co2_g_km       │  │ passenger_seats    │    │ password (hash)     │    └────────────────────┘
└────────────────┘  └────────────────────┘    │ profile_img         │
                                              │ home_address        │
                                              │ home_location       │
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

- **Kierowca:** `routes` (max 2: do pracy i z pracy) → `route_points` (przystanki pośrednie) i `advertisements` (posty z harmonogramem).
- **Pasażer:** `ride_requests` (kierunek + godzina + dni); skąd/dokąd wynika z adresu domu i oddziału.
- **`matches`:** jeden pasażer na jednym ogłoszeniu; przystanki = `seq` z widoku `route_stops`.
- **`ride_events`:** dziennik odwołań/przywróceń konkretnych dni, tylko dopisywany; stan bieżący w widoku `ride_status`.
