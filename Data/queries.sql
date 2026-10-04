-- Zapytania podglądowe do Neona. Każde odpalać osobno.

-- 1. Trasy z pełną listą przystanków (dom/biuro + pośrednie), każdy punkt jako lat/lon
SELECT r.id AS route_id, r.direction, u.name || ' ' || u.surname AS kierowca, o.name AS firma, rp.seq,
       ROUND(ST_Y(rp.point::geometry)::numeric, 5) AS lat,
       ROUND(ST_X(rp.point::geometry)::numeric, 5) AS lon
FROM routes r
JOIN users u ON u.id = r.user_id
JOIN organizations o ON o.id = u.organization_id
JOIN route_stops rp ON rp.route_id = r.id
ORDER BY r.id, rp.seq;


-- 2. Trasy jako linia + długość w km (w linii prostej między przystankami, nie po ulicach)
SELECT r.id AS route_id, r.direction, u.name || ' ' || u.surname AS kierowca, COUNT(*) AS przystanki,
       ROUND((ST_Length(ST_MakeLine(rp.point::geometry ORDER BY rp.seq)::geography) / 1000)::numeric, 1) AS km
FROM routes r
JOIN users u ON u.id = r.user_id
JOIN route_stops rp ON rp.route_id = r.id
GROUP BY r.id, r.direction, u.name, u.surname
ORDER BY r.id;


-- 3. Trasy na mapie: wynik (jedna komórka JSON) wkleić na https://geojson.io
SELECT json_build_object('type', 'FeatureCollection', 'features', json_agg(f)) AS geojson
FROM (
  SELECT json_build_object(
    'type', 'Feature',
    'geometry', ST_AsGeoJSON(ST_MakeLine(rp.point::geometry ORDER BY rp.seq))::json,
    'properties', json_build_object('route_id', r.id, 'kierunek', r.direction,
                                    'kierowca', u.name || ' ' || u.surname, 'firma', o.name)
  ) AS f
  FROM routes r
  JOIN users u ON u.id = r.user_id
  JOIN organizations o ON o.id = u.organization_id
  JOIN route_stops rp ON rp.route_id = r.id
  GROUP BY r.id, r.direction, u.name, u.surname, o.name
) t;


-- 4. Ogłoszenia z autem i wolnymi miejscami
SELECT a.id AS ad_id, r.direction, u.name || ' ' || u.surname AS kierowca,
       COALESCE(cm.brand || ' ' || cm.model, uc.model_name) AS auto, uc.plate, uc.color,
       a.departure_time, a.days_of_week, a.seats,
       a.seats - COUNT(m.id) FILTER (WHERE m.status = 'accepted') AS wolne,
       a.is_active
FROM advertisements a
JOIN routes r ON r.id = a.route_id
JOIN users u ON u.id = r.user_id
LEFT JOIN users_cars uc ON uc.id = a.users_car_id
LEFT JOIN car_models cm ON cm.id = uc.brand_id
LEFT JOIN matches m ON m.advertisement_id = a.id
GROUP BY a.id, r.direction, u.name, u.surname, cm.brand, cm.model, uc.model_name, uc.plate, uc.color
ORDER BY a.id;


-- 5. Matche: kto z kim i jak daleko pasażer ma do przystanku wsiadania (metry)
SELECT m.id AS match_id, m.status, rq.direction,
       d.name || ' ' || d.surname AS kierowca,
       p.name || ' ' || p.surname AS pasazer,
       m.pickup_seq, m.dropoff_seq,
       ROUND(ST_Distance(CASE WHEN rq.direction = 'to_work' THEN p.home_location ELSE o.location END,
                         pu.point)::numeric) AS m_do_przystanku
FROM matches m
JOIN advertisements a ON a.id = m.advertisement_id
JOIN routes r ON r.id = a.route_id
JOIN users d ON d.id = r.user_id
JOIN ride_requests rq ON rq.id = m.request_id
JOIN users p ON p.id = rq.user_id
JOIN organizations o ON o.id = p.organization_id
JOIN route_stops pu ON pu.route_id = r.id AND pu.seq = m.pickup_seq
ORDER BY m.id;


-- 6. Matching: kandydaci dla zapytania pasażera (13 = do pracy, 14 = z pracy; domyślnie 500 m, ±15 min)
SELECT * FROM find_matches(13);
SELECT * FROM find_matches(14);

-- 6b. Luźniejsze kryteria
SELECT * FROM find_matches(13, 1000, '30 minutes');


-- 7. Ilu kandydatów ma każde aktywne zapytanie
SELECT rq.id AS request_id, rq.direction, p.name || ' ' || p.surname AS pasazer,
       (SELECT count(*) FROM find_matches(rq.id)) AS kandydaci
FROM ride_requests rq
JOIN users p ON p.id = rq.user_id
WHERE rq.is_active
ORDER BY kandydaci DESC, rq.id;


-- 8. Odwołania: aktualny stan (ostatnie zdarzenie) i pełna historia
SELECT s.ride_date, s.advertisement_id, s.match_id, s.event,
       CASE WHEN s.match_id IS NULL THEN 'cały kurs' ELSE 'jeden pasażer' END AS zakres,
       u.name || ' ' || u.surname AS kto, s.created_at
FROM ride_status s
JOIN users u ON u.id = s.created_by
ORDER BY s.ride_date, s.advertisement_id;

SELECT * FROM ride_events ORDER BY advertisement_id, match_id, ride_date, created_at;
