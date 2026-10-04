DROP FUNCTION IF EXISTS find_matches;
DROP PROCEDURE IF EXISTS refresh_car_models;
DROP FUNCTION IF EXISTS eea_clean_model, eea_starts_with_word;
DROP TABLE IF EXISTS ride_events, rides, matches, ride_requests, advertisements, route_points,
                     routes, users_cars, users, organizations, car_models, eea_raw CASCADE;
DROP TYPE IF EXISTS match_status, weekday, user_gender, trip_direction, ride_event_type CASCADE;

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE weekday AS ENUM ('mon','tue','wed','thu','fri','sat','sun');
CREATE TYPE match_status AS ENUM ('pending','accepted','rejected','cancelled');
CREATE TYPE user_gender AS ENUM ('female','male','other');
CREATE TYPE trip_direction AS ENUM ('to_work','to_home');
CREATE TYPE ride_event_type AS ENUM ('cancelled','restored');

CREATE TABLE car_models (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    brand          text         NOT NULL,
    model          text         NOT NULL,
    fuel_type      text         NOT NULL,
    l_per_100km    numeric,
    kwh_per_100km  numeric,
    co2_g_km       integer      NOT NULL,
    UNIQUE (brand, model, fuel_type)
);

-- organizacja = konkretny oddział z adresem (np. Orange, Kraków, ul. Jagiellońska 17)
CREATE TABLE organizations (
    id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name      text                   NOT NULL,
    address   text                   NOT NULL,
    location  geography(Point, 4326) NOT NULL,
    auto_approve_domain  text,
    auto_approve_enabled boolean NOT NULL DEFAULT false,
    join_code            text
);

-- adres domowy: front wybiera jednoznaczny adres (silnik/mapa), backend zapisuje nazwę + współrzędne.
-- To jedyne miejsce z adresem domu: trasy i matching biorą go stąd (widok route_stops).
CREATE TABLE users (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id  bigint                 NOT NULL REFERENCES organizations(id),
    name             text                   NOT NULL,
    surname          text                   NOT NULL,
    gender           user_gender,
    email            text                   NOT NULL UNIQUE,
    phone            text,
    password         text                   NOT NULL,
    profile_img      text,
    home_address     text,
    home_location    geography(Point, 4326),
    approval_status  text
);

-- car_model_id NULL = modelu nie ma w słowniku, wtedy model_name wpisany ręcznie ("Inne")
CREATE TABLE users_cars (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          bigint   NOT NULL REFERENCES users(id),
    car_model_id     bigint            REFERENCES car_models(id),
    model_name       text,
    plate            text,
    color            text,
    passenger_seats  smallint NOT NULL CHECK (passenger_seats > 0),
    CHECK (car_model_id IS NOT NULL OR model_name IS NOT NULL)
);

-- max dwie trasy na kierowcę: do pracy i z pracy
CREATE TABLE routes (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint         NOT NULL REFERENCES users(id),
    direction  trip_direction NOT NULL,
    UNIQUE (user_id, direction)
);

-- tylko przystanki POŚREDNIE (seq od 1, w kolejności jazdy); dom i biuro dokleja widok route_stops
CREATE TABLE route_points (
    route_id  bigint                 NOT NULL REFERENCES routes(id),
    seq       smallint               NOT NULL CHECK (seq >= 1),
    point     geography(Point, 4326) NOT NULL,
    PRIMARY KEY (route_id, seq)
);

-- pełna lista przystanków trasy: seq 0 = start, potem pośrednie, ostatni = meta
-- (to_work: dom -> ... -> biuro, to_home: biuro -> ... -> dom)
CREATE VIEW route_stops AS
SELECT r.id AS route_id, 0::smallint AS seq,
       CASE WHEN r.direction = 'to_work' THEN u.home_location ELSE o.location END AS point
FROM routes r
JOIN users u ON u.id = r.user_id
JOIN organizations o ON o.id = u.organization_id
UNION ALL
SELECT route_id, seq, point FROM route_points
UNION ALL
SELECT r.id,
       (COALESCE((SELECT max(rp.seq) FROM route_points rp WHERE rp.route_id = r.id), 0) + 1)::smallint,
       CASE WHEN r.direction = 'to_work' THEN o.location ELSE u.home_location END
FROM routes r
JOIN users u ON u.id = r.user_id
JOIN organizations o ON o.id = u.organization_id;

-- ogłoszenie = "post" kierowcy z harmonogramem na trasie; seats = "Ilu pasażerów chcesz zabrać?"
CREATE TABLE advertisements (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    route_id        bigint    NOT NULL REFERENCES routes(id),
    users_car_id    bigint             REFERENCES users_cars(id),
    seats           smallint  NOT NULL CHECK (seats > 0),
    departure_time  time      NOT NULL,
    days_of_week    weekday[] NOT NULL,
    is_active       boolean   NOT NULL DEFAULT true,
    description     text
);

-- skąd/dokąd wynika z kierunku: dom pasażera (users.home_location) <-> jego oddział (organizations.location)
CREATE TABLE ride_requests (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         bigint         NOT NULL REFERENCES users(id),
    direction       trip_direction NOT NULL,
    departure_time  time           NOT NULL,
    days_of_week    weekday[]      NOT NULL,
    is_active       boolean        NOT NULL DEFAULT true
);

-- pickup_seq / dropoff_seq = seq z route_stops trasy ogłoszenia
CREATE TABLE matches (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    advertisement_id  bigint       NOT NULL REFERENCES advertisements(id),
    request_id        bigint       NOT NULL REFERENCES ride_requests(id),
    pickup_seq        smallint     NOT NULL,
    dropoff_seq       smallint     NOT NULL,
    status            match_status NOT NULL DEFAULT 'pending',
    CHECK (pickup_seq < dropoff_seq)
);

-- dziennik zdarzeń dla konkretnych dni (tylko INSERT, nigdy UPDATE/DELETE -> pełna historia).
-- match_id NULL = dotyczy całego kursu (kierowca odwołuje dzień), match_id = jeden pasażer się wypisuje.
CREATE TABLE ride_events (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    advertisement_id  bigint          NOT NULL REFERENCES advertisements(id),
    match_id          bigint                   REFERENCES matches(id),
    ride_date         date            NOT NULL,
    event             ride_event_type NOT NULL,
    created_by        bigint          NOT NULL REFERENCES users(id),
    created_at        timestamptz     NOT NULL DEFAULT now()
);

-- aktualny stan: ostatnie zdarzenie dla (ogłoszenie, match, dzień)
CREATE VIEW ride_status AS
SELECT DISTINCT ON (advertisement_id, match_id, ride_date)
       advertisement_id, match_id, ride_date, event, created_by, created_at
FROM ride_events
ORDER BY advertisement_id, match_id, ride_date, created_at DESC, id DESC;

-- Kandydaci dla zapytania pasażera: trasy w tym samym kierunku, kierowcy z tego samego oddziału,
-- z przystankiem wsiadania blisko startu pasażera i przystankiem wysiadania blisko jego mety
-- (dalej na trasie), ze wspólnym dniem, w oknie czasowym i z wolnym miejscem.
-- Start/meta pasażera: to_work = dom -> oddział, to_home = oddział -> dom. Pomija pary, które już mają match.
CREATE FUNCTION find_matches(
    p_request_id  bigint,
    p_radius_m    double precision DEFAULT 500,
    p_time_window interval         DEFAULT '15 minutes'
)
RETURNS TABLE (
    advertisement_id   bigint,
    driver_id          bigint,
    pickup_seq         smallint,
    dropoff_seq        smallint,
    pickup_distance_m  integer,
    dropoff_distance_m integer,
    departure_time     time,
    free_seats         integer
)
LANGUAGE sql STABLE
AS $$
    SELECT a.id,
           r.user_id,
           pu.seq,
           dr.seq,
           ROUND(pu.dist)::int,
           ROUND(dr.dist)::int,
           a.departure_time,
           (a.seats - acc.n)::int
    FROM ride_requests rq
    JOIN users p ON p.id = rq.user_id
    JOIN organizations o ON o.id = p.organization_id
    CROSS JOIN LATERAL (
        SELECT CASE WHEN rq.direction = 'to_work' THEN p.home_location ELSE o.location END AS start_p,
               CASE WHEN rq.direction = 'to_work' THEN o.location ELSE p.home_location END AS end_p
    ) pt
    JOIN routes r ON r.direction = rq.direction
    JOIN users d ON d.id = r.user_id
                AND d.organization_id = p.organization_id
                AND d.id <> p.id
    JOIN advertisements a ON a.route_id = r.id
                         AND a.is_active
                         AND a.days_of_week && rq.days_of_week
                         AND a.departure_time BETWEEN rq.departure_time - p_time_window
                                                  AND rq.departure_time + p_time_window
    CROSS JOIN LATERAL (
        SELECT count(*) AS n
        FROM matches m
        WHERE m.advertisement_id = a.id AND m.status = 'accepted'
    ) acc
    CROSS JOIN LATERAL (
        SELECT rs.seq, ST_Distance(rs.point, pt.start_p) AS dist
        FROM route_stops rs
        WHERE rs.route_id = r.id
          AND ST_DWithin(rs.point, pt.start_p, p_radius_m)
        ORDER BY dist
        LIMIT 1
    ) pu
    CROSS JOIN LATERAL (
        SELECT rs.seq, ST_Distance(rs.point, pt.end_p) AS dist
        FROM route_stops rs
        WHERE rs.route_id = r.id
          AND rs.seq > pu.seq
          AND ST_DWithin(rs.point, pt.end_p, p_radius_m)
        ORDER BY dist
        LIMIT 1
    ) dr
    WHERE rq.id = p_request_id
      AND rq.is_active
      AND a.seats > acc.n
      AND NOT EXISTS (
          SELECT 1 FROM matches m
          WHERE m.advertisement_id = a.id AND m.request_id = rq.id
      )
    ORDER BY pu.dist, abs(EXTRACT(EPOCH FROM a.departure_time - rq.departure_time));
$$;

-- ============================================================================
-- Odświeżanie car_models z EEA.
-- Runner (scripts/load_eea_raw.py + .github/workflows/refresh-car-models.yml) wgrywa surowe
-- agregaty z discodata do eea_raw, potem woła CALL refresh_car_models().
-- Czyszczenie = port normalize()/clean_model() z scripts/fetch_car_models.py; zmiany robić w obu.
-- ============================================================================

CREATE TABLE eea_raw (
    year     smallint NOT NULL,
    mk       text,
    cn       text,
    ft       text,
    n        double precision,
    n_fc     double precision,
    fc_sum   double precision,
    n_co2    double precision,
    co2_sum  double precision,
    n_z      double precision,
    z_sum    double precision
);

CREATE FUNCTION eea_starts_with_word(s text, p text)
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
    SELECT s = p OR left(s, length(p) + 1) IN (p || ' ', p || '-');
$$;

-- 'NISSAN MICRA' -> 'MICRA', 'A180' -> 'A 180' (Mercedes), 'ID3' -> 'ID 3' (VW), bez mocy w kW
CREATE FUNCTION eea_clean_model(brand text, raw_brand text, model text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    prefix text;
    rest   text;
BEGIN
    model := btrim(regexp_replace(model, '[\s/,.]+', ' ', 'g'));
    FOR prefix IN
        SELECT p
        FROM (SELECT DISTINCT p FROM unnest(ARRAY[brand, raw_brand, split_part(brand, '-', 1), 'VW']) AS p) t
        ORDER BY length(p) DESC, p
    LOOP
        IF left(model, length(prefix)) = prefix AND length(model) > length(prefix) THEN
            rest := ltrim(substr(model, length(prefix) + 1), ' -');
            IF rest <> '' THEN
                model := rest;
                EXIT;
            END IF;
        END IF;
    END LOOP;
    model := regexp_replace(model, '\y\d+ ?KW\y', '', 'g');
    IF brand = 'MERCEDES-BENZ' THEN
        model := regexp_replace(model, '^([A-Z]{1,3})(\d)', '\1 \2');
    END IF;
    IF brand = 'VOLKSWAGEN' THEN
        model := regexp_replace(model, '^ID(\d)', 'ID \1');
    END IF;
    model := replace(replace(model, 'ERREIHE', 'ER REIHE'), 'XREIHE', 'X REIHE');
    RETURN btrim(regexp_replace(model, '\s+', ' ', 'g'));
END;
$$;

-- eea_raw -> car_models (upsert po brand + model + fuel_type, istniejące id zostają)
CREATE PROCEDURE refresh_car_models()
LANGUAGE plpgsql
AS $$
BEGIN
    WITH fuel_map(from_ft, to_ft) AS (
        VALUES ('PETROL-ELECTRIC', 'PETROL/ELECTRIC'),
               ('DIESEL-ELECTRIC', 'DIESEL/ELECTRIC'),
               ('NG-BIOMETHANE',   'NG')
    ),
    brand_map(from_mk, to_brand) AS (
        VALUES ('VOLKSWAGEN VW', 'VOLKSWAGEN'), ('VOLKSWAGEN, VW', 'VOLKSWAGEN'),
               ('VOLKSWAGEN,VW', 'VOLKSWAGEN'), ('VW', 'VOLKSWAGEN'),
               ('FIAT - INNOCENTI', 'FIAT'), ('ALFA-ROMEO', 'ALFA ROMEO'),
               ('LAND-ROVER', 'LAND ROVER'), ('LANDROVER', 'LAND ROVER'),
               ('MERCEDES BENZ', 'MERCEDES-BENZ'), ('MERCEDES', 'MERCEDES-BENZ'),
               ('MERCEDES-AMG', 'MERCEDES-BENZ'), ('SKODA AUTO', 'SKODA'),
               ('ŠKODA', 'SKODA'), ('CITROËN', 'CITROEN'),
               ('VAUXHALL', 'OPEL'), ('?KODA', 'SKODA')
    ),
    raw AS (
        SELECT COALESCE(r.mk, '') AS mk,
               COALESCE(r.cn, '') AS cn,
               COALESCE(fm.to_ft, r.ft, '') AS ft,
               SUM(COALESCE(r.n, 0))       AS n,
               SUM(COALESCE(r.n_fc, 0))    AS n_fc,
               SUM(COALESCE(r.fc_sum, 0))  AS fc_sum,
               SUM(COALESCE(r.n_co2, 0))   AS n_co2,
               SUM(COALESCE(r.co2_sum, 0)) AS co2_sum,
               SUM(COALESCE(r.n_z, 0))     AS n_z,
               SUM(COALESCE(r.z_sum, 0))   AS z_sum
        FROM eea_raw r
        LEFT JOIN fuel_map fm ON fm.from_ft = r.ft
        GROUP BY 1, 2, 3
    ),
    branded AS (
        SELECT CASE WHEN COALESCE(bm.to_brand, raw.mk) LIKE 'VOLKSWAGEN%' THEN 'VOLKSWAGEN'
                    ELSE COALESCE(bm.to_brand, raw.mk) END AS brand,
               raw.*
        FROM raw
        LEFT JOIN brand_map bm ON bm.from_mk = raw.mk
        WHERE raw.mk <> '' AND raw.cn <> '' AND raw.ft NOT IN ('', 'UNKNOWN')
    ),
    -- MATERIALIZED: liczone raz, nie per wiersz w LATERAL niżej
    clean_brands AS MATERIALIZED (
        SELECT brand FROM branded GROUP BY brand HAVING SUM(n) >= 100000
    ),
    -- 'OPEL VAUXHALL' -> 'OPEL', 'FORD-CNG-TECHNIK' -> 'FORD'
    rebranded AS (
        SELECT COALESCE(cb.brand, b.brand) AS brand, b.mk, b.cn, b.ft,
               b.n, b.n_fc, b.fc_sum, b.n_co2, b.co2_sum, b.n_z, b.z_sum
        FROM branded b
        LEFT JOIN LATERAL (
            SELECT c.brand FROM clean_brands c
            WHERE c.brand <> b.brand AND eea_starts_with_word(b.brand, c.brand)
            ORDER BY length(c.brand), c.brand
            LIMIT 1
        ) cb ON true
    ),
    modeled AS (
        SELECT brand, eea_clean_model(brand, mk, cn) AS model, ft,
               n, n_fc, fc_sum, n_co2, co2_sum, n_z, z_sum
        FROM rebranded
    ),
    kept AS (
        SELECT row_number() OVER () AS rid, *
        FROM modeled
        WHERE model <> '' AND model <> brand
    ),
    clean_models AS MATERIALIZED (
        SELECT brand, model FROM kept GROUP BY brand, model HAVING SUM(n) >= 20000  -- jak MODEL_MIN w fetch_car_models.py
    ),
    -- prefiksy nazwy na granicy słowa: 'OCTAVIA SE TDI' -> 'OCTAVIA', 'OCTAVIA SE', 'OCTAVIA SE TDI'
    prefixes AS (
        SELECT k.rid, k.brand, left(k.model, i - 1) AS prefix
        FROM kept k, generate_series(2, length(k.model)) AS i
        WHERE substr(k.model, i, 1) IN (' ', '-')
        UNION ALL
        SELECT rid, brand, model FROM kept
    ),
    -- brudna nazwa -> najkrótsza czysta nazwa będąca jej prefiksem ('OCTAVIA SE TDI' -> 'OCTAVIA')
    best AS (
        SELECT DISTINCT ON (p.rid) p.rid, p.prefix AS model
        FROM prefixes p
        JOIN clean_models c ON c.brand = p.brand AND c.model = p.prefix
        ORDER BY p.rid, length(p.prefix), p.prefix
    ),
    -- ręczne korekty (lista generowana: python scripts/fetch_car_models.py --sql-fixes); NULL = wyrzuć
    model_fix(brand, model, to_model) AS (
        VALUES ('AUDI', 'A3SPORTBACK', 'A3'),
               ('AUDI', 'A4AVANT', 'A4'),
               ('AUDI', 'A6AVANT', 'A6'),
               ('BMW', 'SERIE X', NULL),
               ('BMW', 'X REIHE', NULL),
               ('CHRYSLER', 'COMPASS', NULL),
               ('CHRYSLER', 'GRAND CHEROKEE', NULL),
               ('CHRYSLER', 'RENEGADE', NULL),
               ('CITROEN', 'C-ELYSSEE', 'C-ELYSEE'),
               ('CITROEN', 'GRAND', NULL),
               ('CITROEN', 'NUEVO', NULL),
               ('CITROEN', 'SUV', NULL),
               ('DR', '5 0', NULL),
               ('FIAT', 'DOBLO''', 'DOBLO'),
               ('HYUNDAI', 'I 10', 'I10'),
               ('HYUNDAI', 'I 20', 'I20'),
               ('HYUNDAI', 'I 30', 'I30'),
               ('HYUNDAI', 'I30I30CW', 'I30'),
               ('HYUNDAI', 'IONIQ5', 'IONIQ 5'),
               ('HYUNDAI', 'IONIQ6', 'IONIQ 6'),
               ('HYUNDAI', 'IX 20', 'IX20'),
               ('HYUNDAI', 'IX 35', 'IX35'),
               ('HYUNDAI', 'TUCSONIX35', 'TUCSON'),
               ('HYUNDAI', 'TUCSONIX35LM', 'TUCSON'),
               ('JAGUAR', 'RANGE ROVER EVOQUE', NULL),
               ('KIA', 'CEE D', 'CEED'),
               ('KIA', 'CEE''D', 'CEED'),
               ('KIA', 'CEE´D', 'CEED'),
               ('KIA', 'ED', NULL),
               ('KIA', 'EDCEED', 'CEED'),
               ('KIA', 'NEW SPORTAGE', 'SPORTAGE'),
               ('KIA', 'SL', 'SPORTAGE'),
               ('KIA', 'SPORTAGESLSLS', 'SPORTAGE'),
               ('LAND ROVER', 'DISCO-Y SPORT BLACK HSE TD4 A', 'DISCOVERY SPORT'),
               ('LAND ROVER', 'FREELANDER 2', 'FREELANDER'),
               ('LAND ROVER', 'FREELANDER GS TD4', 'FREELANDER'),
               ('LAND ROVER', 'R ROVER EVOQUE HSE DYN TD4 A', 'RANGE ROVER EVOQUE'),
               ('LAND ROVER', 'R ROVER EVOQUE SE TECH TD4 A', 'RANGE ROVER EVOQUE'),
               ('LAND ROVER', 'R ROVER SPORT HSE DYNAM SDV6 A', 'RANGE ROVER SPORT'),
               ('LAND ROVER', 'RANGE', 'RANGE ROVER'),
               ('LYNK&CO', 'LYNK & CO 01', '01'),
               ('MERCEDES-BENZ', 'A 180CDI', 'A 180'),
               ('MERCEDES-BENZ', 'B 180CDI', 'B 180'),
               ('MERCEDES-BENZ', 'C 200CDI', 'C 200'),
               ('MERCEDES-BENZ', 'C 220CDI', 'C 220'),
               ('MERCEDES-BENZ', 'E 200CDI', 'E 200'),
               ('MERCEDES-BENZ', 'E 220CDI', 'E 220'),
               ('MERCEDES-BENZ', 'GLK 220CDI4MATIC', 'GLK 220 CDI 4MATIC'),
               ('MERCEDES-BENZ', 'SLK 250 AMG SPORT CDI BLUE-CY A', 'SLK 250'),
               ('MG', '3 HYBRID+', '3'),
               ('MG', '4 ELECTRIC', '4'),
               ('MG', 'EHS PLUG-IN HYBRID', 'EHS'),
               ('OPEL', 'AFIRA TOURER', 'ZAFIRA'),
               ('OPEL', 'ASTRA+', 'ASTRA'),
               ('OPEL', 'ASTRASPORTSTOURER', 'ASTRA'),
               ('OPEL', 'CROSSLANDX', 'CROSSLAND'),
               ('OPEL', 'GRANDLANDX', 'GRANDLAND'),
               ('OPEL', 'INSIGNIASPORTSTOURERSW', 'INSIGNIA'),
               ('OPEL', 'KARLROCKS VIVAROCKS', 'KARL'),
               ('OPEL', 'MOKKAX', 'MOKKA'),
               ('OPEL', 'VIVA SE', 'KARL'),
               ('OPEL', 'VIVA SL', 'KARL'),
               ('PEUGEOT', '206 +', '206+'),
               ('PEUGEOT', 'N 2008', '2008'),
               ('PEUGEOT', 'N 3008', '3008'),
               ('PEUGEOT', 'N208', '208'),
               ('PEUGEOT', 'N308', '308'),
               ('PEUGEOT', 'N5008', '5008'),
               ('PEUGEOT', 'NUEVO', NULL),
               ('PEUGEOT', 'PART', 'PARTNER'),
               ('RENAULT', 'MEGANESCENIC', 'SCENIC'),
               ('RENAULT', 'NEW TWINGO', 'TWINGO'),
               ('RENAULT', 'NUOVA CLIO 5 PORTE', 'CLIO'),
               ('SEAT', 'IBIA', 'IBIZA'),
               ('SMART', 'FORTWOCOUPEMHD', 'FORTWO'),
               ('VOLKSWAGEN', 'GOLFPLUS', 'GOLF PLUS'),
               ('VOLKSWAGEN', 'HIGH UP', 'UP!'),
               ('VOLKSWAGEN', 'MOVE UP', 'UP!'),
               ('VOLKSWAGEN', 'TAKE UP', 'UP!')
    ),
    based AS (
        SELECT k.brand, CASE WHEN f.brand IS NULL THEN b.model ELSE f.to_model END AS model, k.ft,
               k.n, k.n_fc, k.fc_sum, k.n_co2, k.co2_sum, k.n_z, k.z_sum
        FROM kept k
        JOIN best b ON b.rid = k.rid
        LEFT JOIN model_fix f ON f.brand = k.brand AND f.model = b.model
        WHERE f.brand IS NULL OR f.to_model IS NOT NULL
    ),
    agg AS (
        SELECT brand, model, ft AS fuel_type,
               SUM(n) AS n, SUM(n_fc) AS n_fc, SUM(fc_sum) AS fc_sum,
               SUM(n_co2) AS n_co2, SUM(co2_sum) AS co2_sum, SUM(n_z) AS n_z, SUM(z_sum) AS z_sum
        FROM based
        GROUP BY 1, 2, 3
        HAVING SUM(n) >= 1000 AND SUM(n_co2) > 0
    ),
    final AS (
        SELECT brand, model, fuel_type,
               co2_sum / n_co2 AS co2,
               CASE WHEN fuel_type = 'ELECTRIC' THEN NULL
                    WHEN n_fc > 0 THEN fc_sum / n_fc
                    WHEN fuel_type IN ('PETROL', 'PETROL/ELECTRIC') THEN co2_sum / n_co2 / 23.2
                    WHEN fuel_type IN ('DIESEL', 'DIESEL/ELECTRIC') THEN co2_sum / n_co2 / 26.4
               END AS l100,
               CASE WHEN n_z > 0 AND fuel_type LIKE '%ELECTRIC%' THEN z_sum / n_z / 10 END AS kwh100
        FROM agg
        WHERE NOT (fuel_type = 'ELECTRIC' AND co2_sum / n_co2 >= 1)  -- hybrydy błędnie zgłoszone jako elektryk
    )
    INSERT INTO car_models (brand, model, fuel_type, l_per_100km, kwh_per_100km, co2_g_km)
    SELECT brand, model, fuel_type,
           CASE WHEN l100 <> 0 THEN round(l100::numeric, 1) END,
           CASE WHEN kwh100 <> 0 THEN round(kwh100::numeric, 1) END,
           round(co2)::int
    FROM final
    ON CONFLICT (brand, model, fuel_type) DO UPDATE
        SET l_per_100km   = EXCLUDED.l_per_100km,
            kwh_per_100km = EXCLUDED.kwh_per_100km,
            co2_g_km      = EXCLUDED.co2_g_km;
END;
$$;
