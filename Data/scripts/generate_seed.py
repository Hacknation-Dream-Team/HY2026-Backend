"""Generuje seed.sql: car_models z data/car_models.csv + spójne dane mockowe (Warszawa).

Kolejność: najpierw schema.sql, potem seed.sql (np. psql "$DATABASE_URL" -f seed.sql).
Wszystkie konta mockowe mają hasło: haslo123.
"""
import csv
import math
import random
from datetime import date, datetime, time, timedelta
from pathlib import Path

random.seed(42)

ROOT = Path(__file__).resolve().parent.parent
CARS_CSV = ROOT / "data" / "car_models.csv"
OUT = ROOT / "seed.sql"
TODAY = date.today()
PASSWORD_HASH = "$2y$10$HHBiW3kpVSEVTb/PPjL2ZOyR51sGypk95HMEl9BFXAnkiYlSk/b6O"  # bcrypt("haslo123")
WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
WORKDAYS = WEEKDAYS[:5]
MATCH_RADIUS_M = 500  # jak domyślny p_radius_m w find_matches()

# fikcyjne firmy (oddziały), biura w różnych dzielnicach; domena maila, auto-akceptacja, kod dołączenia
ORGS = [
    ("Nordwind Software", "nordwind.pl", "ul. Domaniewska 39, 02-672 Warszawa", (52.1805, 21.0050),      # Mokotów
     True, "NORD-4821"),
    ("Vistula Logistics", "vistula-logistics.pl", "ul. Prosta 51, 00-838 Warszawa", (52.2320, 20.9810),   # Wola
     False, "VIST-7395"),
    ("Praga Labs", "pragalabs.pl", "ul. Ząbkowska 27/31, 03-736 Warszawa", (52.2540, 21.0400),          # Praga
     True, "PRAGA-1604"),
]
USERS_PER_ORG = 20
DRIVERS_PER_ORG = 7
NEAR_PASSENGERS_PER_ORG = 9  # reszta pasażerów mieszka z dala od tras
UNMATCHED_NEAR_PER_ORG = 3   # z tych przy trasie: bez gotowego matcha, do znalezienia przez find_matches()

FIRST_NAMES = ["Anna", "Piotr", "Katarzyna", "Tomasz", "Magdalena", "Michał", "Agnieszka", "Paweł",
               "Monika", "Krzysztof", "Ewa", "Marcin", "Joanna", "Jakub", "Aleksandra", "Łukasz",
               "Karolina", "Bartosz", "Natalia", "Kamil", "Zuzanna", "Mateusz", "Julia", "Adam"]
FEMALE_NAMES = {"Anna", "Katarzyna", "Magdalena", "Agnieszka", "Monika", "Ewa", "Joanna",
                "Aleksandra", "Karolina", "Natalia", "Zuzanna", "Julia"}
SURNAMES = ["Nowak", "Wójcik", "Kowalczyk", "Woźniak", "Mazur", "Krawczyk", "Kaczmarek", "Zając",
            "Król", "Wieczorek", "Wróbel", "Dudek", "Adamczyk", "Pawlak", "Sikora", "Baran",
            "Michalak", "Szewczyk", "Kubiak", "Wilk", "Lis", "Mróz", "Sobczak", "Czarnecki"]
# nazwy ulic są fikcyjne względem współrzędnych (mock)
STREETS = ["Lipowa", "Polna", "Ogrodowa", "Kwiatowa", "Leśna", "Słoneczna", "Brzozowa", "Klonowa",
           "Szkolna", "Łąkowa", "Akacjowa", "Spacerowa", "Jaśminowa", "Wiśniowa"]
DESCRIPTIONS = [None, None, "Jadę spokojnie, w aucie się nie pali.", "Mogę zabrać mały bagaż.",
                "Klimatyzacja, muzyka do negocjacji.", "Czekam max 3 minuty na przystanku.",
                "Wolę ciszę rano.", "Zabieram też rower na dachu, jeśli trzeba."]
POPULAR = [("TOYOTA", "COROLLA"), ("SKODA", "OCTAVIA"), ("TOYOTA", "YARIS"), ("VOLKSWAGEN", "GOLF"),
           ("SKODA", "FABIA"), ("KIA", "CEED"), ("HYUNDAI", "I30"), ("DACIA", "DUSTER"),
           ("OPEL", "ASTRA"), ("FORD", "FOCUS"), ("TESLA", "MODEL 3"), ("TOYOTA", "C-HR")]
CUSTOM_MODELS = ["Polonez Caro", "Daewoo Tico", "Fiat 126p"]  # spoza słownika ("Inne" na froncie)
COLORS = ["czarny", "biały", "srebrny", "szary", "niebieski", "czerwony", "granatowy"]
PLATE_PREFIXES = ["WA", "WB", "WD", "WE", "WF", "WH", "WI", "WJ", "WK", "WN", "WT", "WU", "WW", "WX", "WY"]
PL = str.maketrans("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ", "acelnoszzACELNOSZZ")


def offset(p, km, angle):
    lat, lon = p
    return (lat + km * math.cos(angle) / 111.0,
            lon + km * math.sin(angle) / (111.0 * math.cos(math.radians(lat))))


def jitter(p, max_km):
    return offset(p, random.uniform(0, max_km), random.uniform(0, 2 * math.pi))


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def dist_m(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371008.8 * 2 * math.asin(math.sqrt(h))


def hhmm(minutes):
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def plus(t, minutes):
    h, m = map(int, t.split(":"))
    return hhmm(h * 60 + m + minutes)


def load_cars():
    with CARS_CSV.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    for i, r in enumerate(rows, 1):
        r["id"] = i
    popular = [r for r in rows if (r["brand"], r["model"]) in POPULAR
               and r["fuel_type"] in ("PETROL", "DIESEL", "PETROL/ELECTRIC", "ELECTRIC")]
    assert popular, "brak popularnych modeli w car_models.csv"
    return rows, popular


def build():
    cars, popular = load_cars()
    db = {t: [] for t in ["organizations", "users", "users_cars", "routes", "route_points",
                          "advertisements", "ride_requests", "matches", "ride_events"]}
    ids = {t: 0 for t in db}

    def add(table, **row):
        if table != "route_points":
            ids[table] += 1
            row = {"id": ids[table], **row}
        db[table].append(row)
        return row

    def set_home(user, point):
        user["home_location"] = point
        user["home_address"] = f"ul. {random.choice(STREETS)} {random.randint(1, 120)}, Warszawa"

    def match(ad, req, pickup, dropoff):
        accepted = sum(1 for m_ in db["matches"] if m_["advertisement_id"] == ad["id"] and m_["status"] == "accepted")
        status = random.choices(["accepted", "pending", "rejected", "cancelled"], [70, 15, 10, 5])[0]
        if status == "accepted" and accepted >= ad["seats"]:
            status = "pending"
        add("matches", advertisement_id=ad["id"], request_id=req["id"], pickup_seq=pickup,
            dropoff_seq=dropoff, status=status)

    emails = set()
    for org_name, domain, address, office, auto_approve, join_code in ORGS:
        org = add("organizations", name=org_name, address=address, location=office,
                  auto_approve_domain=domain, auto_approve_enabled=auto_approve, join_code=join_code)
        drivers, passengers = [], []
        for i in range(USERS_PER_ORG):
            first, last = random.choice(FIRST_NAMES), random.choice(SURNAMES)
            base = f"{first}.{last}".lower().translate(PL)
            email, n = f"{base}@{domain}", 2
            while email in emails:
                email, n = f"{base}{n}@{domain}", n + 1
            emails.add(email)
            gender = None if (ids["users"] + 1) % 10 == 0 else ("female" if first in FEMALE_NAMES else "male")
            user = add("users", organization_id=org["id"], name=first, surname=last, gender=gender, email=email,
                       phone=f"+48 5{random.randint(10, 99)} {random.randint(100, 999)} {random.randint(100, 999)}",
                       password=PASSWORD_HASH, profile_img=None, home_address=None, home_location=None,
                       approval_status="approved")
            (drivers if i < DRIVERS_PER_ORG else passengers).append(user)

        # kierowcy: auto, trasa do pracy (dom -> przystanki -> biuro) i z pracy (te same przystanki odwrotnie)
        driver_trips = []
        for d_i, driver in enumerate(drivers):
            custom = d_i == DRIVERS_PER_ORG - 1  # jeden kierowca na firmę z autem spoza słownika
            car = add("users_cars", user_id=driver["id"],
                      car_model_id=None if custom else random.choice(popular)["id"],
                      model_name=random.choice(CUSTOM_MODELS) if custom else None,
                      plate=f"{random.choice(PLATE_PREFIXES)} {random.randint(10000, 99999)}",
                      color=random.choice(COLORS), passenger_seats=4)
            home = offset(office, random.uniform(4, 14), random.uniform(0, 2 * math.pi))
            set_home(driver, home)
            middle = sorted(random.sample([0.3, 0.5, 0.7], random.randint(0, 2)))
            mids = [jitter(lerp(home, office, t), 0.5) for t in middle]
            trip = {}
            for direction, stops, first_dep in (("to_work", [home] + mids + [office], range(420, 511, 15)),
                                                ("to_home", [office] + mids[::-1] + [home], range(960, 1051, 15))):
                route = add("routes", user_id=driver["id"], direction=direction)
                # w bazie tylko przystanki pośrednie (seq od 1); dom i biuro dokleja widok route_stops
                for seq, p in enumerate(stops[1:-1], 1):
                    add("route_points", route_id=route["id"], seq=seq, point=p)
                points = stops
                ad = add("advertisements", route_id=route["id"], users_car_id=car["id"],
                         seats=random.randint(1, car["passenger_seats"]),
                         departure_time=hhmm(random.choice(first_dep)), days_of_week=list(WORKDAYS),
                         is_active=not (d_i == 1 and direction == "to_home"),  # jedno wstrzymane ogłoszenie
                         description=random.choice(DESCRIPTIONS))
                trip[direction] = (ad, points)
            driver_trips.append(trip)

        # pasażerowie: część mieszka przy trasie kierowcy (do pracy + z pracy), reszta z dala (tylko do pracy)
        for p_i, passenger in enumerate(passengers):
            if p_i < NEAR_PASSENGERS_PER_ORG:
                trip = random.choice(driver_trips)
                (ad_w, pts_w), (ad_h, pts_h) = trip["to_work"], trip["to_home"]
                stop = random.randrange(len(pts_w) - 1)  # przystanek przy domu pasażera (nie biuro)
                set_home(passenger, jitter(pts_w[stop], 0.3))
                days = sorted(random.sample(WORKDAYS, random.choice([3, 4, 5, 5])), key=WEEKDAYS.index)
                req_w = add("ride_requests", user_id=passenger["id"], direction="to_work",
                            departure_time=plus(ad_w["departure_time"], random.choice([-15, 0, 0, 15])),
                            days_of_week=days, is_active=True)
                req_h = add("ride_requests", user_id=passenger["id"], direction="to_home",
                            departure_time=plus(ad_h["departure_time"], random.choice([-15, 0, 0, 15])),
                            days_of_week=days, is_active=True)
                if p_i >= NEAR_PASSENGERS_PER_ORG - UNMATCHED_NEAR_PER_ORG:
                    continue
                match(ad_w, req_w, stop, len(pts_w) - 1)
                match(ad_h, req_h, 0, len(pts_h) - 1 - stop)
            else:
                set_home(passenger, offset(office, random.uniform(3, 12), random.uniform(0, 2 * math.pi)))
                add("ride_requests", user_id=passenger["id"], direction="to_work",
                    departure_time=hhmm(random.choice(range(420, 541, 15))),
                    days_of_week=list(WORKDAYS), is_active=True)

    # zdarzenia na przyszły tydzień: kierowca odwołuje dzień (match_id NULL), pasażer się wypisuje (match_id),
    # jedno odwołanie cofnięte (restored) -> widać historię w ride_events, stan w ride_status
    ads = {a["id"]: a for a in db["advertisements"]}
    reqs = {r["id"]: r for r in db["ride_requests"]}
    driver_of = {a["id"]: next(r["user_id"] for r in db["routes"] if r["id"] == a["route_id"])
                 for a in db["advertisements"]}
    next_week = [TODAY + timedelta(days=i) for i in range(1, 8) if (TODAY + timedelta(days=i)).weekday() < 5]
    stamp = lambda days_ago, hour: datetime.combine(TODAY - timedelta(days=days_ago), time(hour, 0))
    accepted = [m_ for m_ in db["matches"] if m_["status"] == "accepted"]
    used_ads = []
    for m_ in accepted[:3]:  # kierowcy odwołują cały dzień
        ad = ads[m_["advertisement_id"]]
        if ad["id"] in used_ads:
            continue
        used_ads.append(ad["id"])
        add("ride_events", advertisement_id=ad["id"], match_id=None, ride_date=random.choice(next_week),
            event="cancelled", created_by=driver_of[ad["id"]], created_at=stamp(1, 9))
    for i, m_ in enumerate(accepted[3:8]):  # pasażerowie wypisują się z jednego dnia
        req = reqs[m_["request_id"]]
        d = next(x for x in next_week if WEEKDAYS[x.weekday()] in req["days_of_week"])
        add("ride_events", advertisement_id=m_["advertisement_id"], match_id=m_["id"], ride_date=d,
            event="cancelled", created_by=req["user_id"], created_at=stamp(2, 18))
        if i == 0:  # zmiana zdania: cofnięcie wypisania
            add("ride_events", advertisement_id=m_["advertisement_id"], match_id=m_["id"], ride_date=d,
                event="restored", created_by=req["user_id"], created_at=stamp(1, 20))

    return cars, db


def check(cars, db):
    car_ids = {c["id"] for c in cars}
    by = {t: {r["id"]: r for r in rows} for t, rows in db.items() if t != "route_points"}
    points = {(p["route_id"], p["seq"]): p["point"] for p in db["route_points"]}
    users = by["users"]
    office = {o["id"]: o["location"] for o in db["organizations"]}

    assert len({u["email"] for u in db["users"]}) == len(db["users"])
    for u in db["users"]:
        assert u["organization_id"] in by["organizations"]
    for c in db["users_cars"]:
        assert c["user_id"] in users
        assert c["car_model_id"] in car_ids if c["car_model_id"] else c["model_name"], "auto bez modelu"
        assert c["passenger_seats"] > 0
    assert len({(r["user_id"], r["direction"]) for r in db["routes"]}) == len(db["routes"])
    for r in db["routes"]:  # route_stops jak widok w bazie: start + pośrednie (seq od 1) + meta
        seqs = sorted(s for (rid, s) in points if rid == r["id"])
        assert seqs == list(range(1, len(seqs) + 1)), "przystanki pośrednie nie od 1 / z dziurą"
        u = users[r["user_id"]]
        home, work = u["home_location"], office[u["organization_id"]]
        start, end = (home, work) if r["direction"] == "to_work" else (work, home)
        points[(r["id"], 0)], points[(r["id"], len(seqs) + 1)] = start, end
    for a in db["advertisements"]:
        route = by["routes"][a["route_id"]]
        car = by["users_cars"][a["users_car_id"]]
        assert car["user_id"] == route["user_id"], "auto nie należy do kierowcy"
        assert 0 < a["seats"] <= car["passenger_seats"], "więcej miejsc niż w aucie"
    assert len({(r["user_id"], r["direction"]) for r in db["ride_requests"]}) == len(db["ride_requests"])
    for r in db["ride_requests"]:
        assert users[r["user_id"]]["home_location"], "pasażer bez adresu"
    for m_ in db["matches"]:
        ad = by["advertisements"][m_["advertisement_id"]]
        req = by["ride_requests"][m_["request_id"]]
        route = by["routes"][ad["route_id"]]
        p = users[req["user_id"]]
        assert route["direction"] == req["direction"]
        assert m_["pickup_seq"] < m_["dropoff_seq"]
        assert users[route["user_id"]]["organization_id"] == p["organization_id"], "różne oddziały"
        assert route["user_id"] != p["id"]
        assert set(ad["days_of_week"]) & set(req["days_of_week"])
        home, work = p["home_location"], office[p["organization_id"]]
        start, end = (home, work) if req["direction"] == "to_work" else (work, home)
        assert dist_m(points[(route["id"], m_["pickup_seq"])], start) <= MATCH_RADIUS_M, "wsiadanie za daleko"
        assert dist_m(points[(route["id"], m_["dropoff_seq"])], end) <= MATCH_RADIUS_M, "wysiadanie za daleko"
    for ad_id, ad in by["advertisements"].items():
        n = sum(1 for m_ in db["matches"] if m_["advertisement_id"] == ad_id and m_["status"] == "accepted")
        assert n <= ad["seats"], "więcej zaakceptowanych niż miejsc"
    for e in db["ride_events"]:
        ad = by["advertisements"][e["advertisement_id"]]
        driver = by["routes"][ad["route_id"]]["user_id"]
        assert WEEKDAYS[e["ride_date"].weekday()] in ad["days_of_week"], "zdarzenie w dzień bez kursu"
        if e["match_id"] is None:
            assert e["created_by"] == driver, "cały kurs odwołuje tylko kierowca"
        else:
            m_ = by["matches"][e["match_id"]]
            assert m_["advertisement_id"] == ad["id"], "match z innego ogłoszenia"
            assert e["created_by"] in (driver, by["ride_requests"][m_["request_id"]]["user_id"])


def lit(v):
    if v is None or v == "":
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, datetime):
        return f"'{v.isoformat(sep=' ')}+02'"
    if isinstance(v, date):
        return f"'{v.isoformat()}'"
    if isinstance(v, tuple):
        return f"'SRID=4326;POINT({v[1]:.6f} {v[0]:.6f})'"
    if isinstance(v, list):
        return "'{" + ",".join(v) + "}'"
    return "'" + str(v).replace("'", "''") + "'"


def inserts(table, rows, cols, identity=True, chunk=1000):
    out = []
    for i in range(0, len(rows), chunk):
        values = ",\n".join("(" + ", ".join(lit(r[c]) for c in cols) + ")" for r in rows[i:i + chunk])
        override = " OVERRIDING SYSTEM VALUE" if identity else ""
        out.append(f"INSERT INTO {table} ({', '.join(cols)}){override} VALUES\n{values};")
    return "\n\n".join(out)


def main():
    cars, db = build()
    check(cars, db)
    for c in cars:
        for f in ("l_per_100km", "kwh_per_100km"):
            c[f] = float(c[f]) if c[f] else None
        c["co2_g_km"] = int(c["co2_g_km"])

    tables = [
        ("car_models", cars, ["id", "brand", "model", "fuel_type", "l_per_100km", "kwh_per_100km", "co2_g_km"]),
        ("organizations", db["organizations"], ["id", "name", "address", "location", "auto_approve_domain",
                                                "auto_approve_enabled", "join_code"]),
        ("users", db["users"], ["id", "organization_id", "name", "surname", "gender", "email", "phone", "password",
                                "profile_img", "home_address", "home_location", "approval_status"]),
        ("users_cars", db["users_cars"], ["id", "user_id", "car_model_id", "model_name", "plate", "color",
                                          "passenger_seats"]),
        ("routes", db["routes"], ["id", "user_id", "direction"]),
        ("route_points", db["route_points"], ["route_id", "seq", "point"]),
        ("advertisements", db["advertisements"], ["id", "route_id", "users_car_id", "seats", "departure_time",
                                                  "days_of_week", "is_active", "description"]),
        ("ride_requests", db["ride_requests"], ["id", "user_id", "direction", "departure_time", "days_of_week",
                                                "is_active"]),
        ("matches", db["matches"], ["id", "advertisement_id", "request_id", "pickup_seq", "dropoff_seq", "status"]),
        ("ride_events", db["ride_events"], ["id", "advertisement_id", "match_id", "ride_date", "event",
                                            "created_by", "created_at"]),
    ]
    sql = ["-- Wygenerowane przez scripts/generate_seed.py. Uruchamiać po schema.sql.",
           "BEGIN;",
           "TRUNCATE ride_events, matches, ride_requests, advertisements, route_points, routes, users_cars, users,\n"
           "         organizations, car_models RESTART IDENTITY CASCADE;"]
    for table, rows, cols in tables:
        sql.append(inserts(table, rows, cols, identity=table != "route_points"))
    for table, _, cols in tables:
        if "id" in cols:
            sql.append(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), (SELECT MAX(id) FROM {table}));")
    sql.append("COMMIT;")
    OUT.write_text("\n\n".join(sql) + "\n", encoding="utf-8")

    print(f"zapisano {OUT}")
    for table, rows, _ in tables:
        print(f"  {table}: {len(rows)}")


if __name__ == "__main__":
    main()
