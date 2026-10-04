"""Pobiera słownik car_models z EEA (CO2 emissions from new passenger cars) do data/car_models.csv.

Źródło: https://discodata.eea.europa.eu/sql, cała UE, lata 2010-2025 (2025 wstępne). Przed 2010 EEA nie zbierała danych.
Agregacja: marka + model + paliwo, średnie ważone liczbą aut (R).
Spalanie: Fc (jest od 2021), wcześniej wyliczane z CO2 (benzyna CO2/23.2, diesel CO2/26.4).
"""
import csv
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

URL = "https://discodata.eea.europa.eu/sql"
YEARS = range(2010, 2026)
# 2010-2022 są w jednej tabeli, nowsze lata EEA publikuje osobno (F = final, P = provisional)
TABLES = {2023: "co2cars_2023Fv28", 2024: "co2cars_2024Fv30", 2025: "co2cars_2025Pv31"}
MIN_CARS = 1000  # odcina szum, zostawia ~95% aut
PAGE = 10000
OUT = Path(__file__).resolve().parent.parent / "data" / "car_models.csv"
CACHE = OUT.parent / "eea_cache"

CO2 = "COALESCE([Ewltp (g/km)], [Enedc (g/km)], [E (g/km)])"
MK = "UPPER(LTRIM(RTRIM(Mk)))"
CN = "UPPER(LTRIM(RTRIM(Cn)))"
FT = "UPPER(LTRIM(RTRIM(Ft)))"

QUERY = f"""
SELECT {MK} mk, {CN} cn, {FT} ft,
       SUM(R) n,
       SUM(CASE WHEN Fc IS NOT NULL THEN R END) n_fc,  SUM(CAST(Fc AS float) * R) fc_sum,
       SUM(CASE WHEN {CO2} IS NOT NULL THEN R END) n_co2, SUM(CAST({CO2} AS float) * R) co2_sum,
       SUM(CASE WHEN [Z (Wh/km)] IS NOT NULL THEN R END) n_z, SUM(CAST([Z (Wh/km)] AS float) * R) z_sum
FROM [CO2Emission].[latest].[{{table}}]
WHERE Year = {{year}} AND Mk IS NOT NULL AND Cn IS NOT NULL AND Ft IS NOT NULL
GROUP BY {MK}, {CN}, {FT}
ORDER BY mk, cn, ft
"""

# sklejanie wariantów nazw marek
BRANDS = {
    "VOLKSWAGEN VW": "VOLKSWAGEN",
    "VOLKSWAGEN, VW": "VOLKSWAGEN",
    "VOLKSWAGEN,VW": "VOLKSWAGEN",
    "VW": "VOLKSWAGEN",
    "FIAT - INNOCENTI": "FIAT",
    "ALFA-ROMEO": "ALFA ROMEO",
    "LAND-ROVER": "LAND ROVER",
    "LANDROVER": "LAND ROVER",
    "MERCEDES BENZ": "MERCEDES-BENZ",
    "MERCEDES": "MERCEDES-BENZ",
    "MERCEDES-AMG": "MERCEDES-BENZ",
    "SKODA AUTO": "SKODA",
    "ŠKODA": "SKODA",
    "CITROËN": "CITROEN",
    "VAUXHALL": "OPEL",  # brytyjski Opel, te same modele
    "?KODA": "SKODA",
}
# ręczne korekty po normalizacji: (marka, model) -> poprawny model, None = wyrzuć (śmieć / zła marka)
# ta sama lista jest w refresh_car_models() w schema.sql (generowana: python fetch_car_models.py --sql-fixes)
MODEL_FIX = {
    ("AUDI", "A3SPORTBACK"): "A3", ("AUDI", "A4AVANT"): "A4", ("AUDI", "A6AVANT"): "A6",
    ("BMW", "SERIE X"): None, ("BMW", "X REIHE"): None,
    ("CHRYSLER", "COMPASS"): None, ("CHRYSLER", "GRAND CHEROKEE"): None, ("CHRYSLER", "RENEGADE"): None,
    ("CITROEN", "C-ELYSSEE"): "C-ELYSEE", ("CITROEN", "GRAND"): None, ("CITROEN", "NUEVO"): None,
    ("CITROEN", "SUV"): None,
    ("DR", "5 0"): None,
    ("FIAT", "DOBLO'"): "DOBLO",
    ("HYUNDAI", "I 10"): "I10", ("HYUNDAI", "I 20"): "I20", ("HYUNDAI", "I 30"): "I30",
    ("HYUNDAI", "I30I30CW"): "I30", ("HYUNDAI", "IX 20"): "IX20", ("HYUNDAI", "IX 35"): "IX35",
    ("HYUNDAI", "TUCSONIX35"): "TUCSON", ("HYUNDAI", "TUCSONIX35LM"): "TUCSON",
    ("HYUNDAI", "IONIQ5"): "IONIQ 5", ("HYUNDAI", "IONIQ6"): "IONIQ 6",
    ("JAGUAR", "RANGE ROVER EVOQUE"): None,
    ("KIA", "CEE D"): "CEED", ("KIA", "CEE'D"): "CEED", ("KIA", "CEE´D"): "CEED", ("KIA", "EDCEED"): "CEED",
    ("KIA", "ED"): None, ("KIA", "SL"): "SPORTAGE", ("KIA", "SPORTAGESLSLS"): "SPORTAGE",
    ("KIA", "NEW SPORTAGE"): "SPORTAGE",
    ("LAND ROVER", "DISCO-Y SPORT BLACK HSE TD4 A"): "DISCOVERY SPORT", ("LAND ROVER", "RANGE"): "RANGE ROVER",
    ("LAND ROVER", "R ROVER EVOQUE HSE DYN TD4 A"): "RANGE ROVER EVOQUE",
    ("LAND ROVER", "R ROVER EVOQUE SE TECH TD4 A"): "RANGE ROVER EVOQUE",
    ("LAND ROVER", "R ROVER SPORT HSE DYNAM SDV6 A"): "RANGE ROVER SPORT",
    ("LAND ROVER", "FREELANDER GS TD4"): "FREELANDER", ("LAND ROVER", "FREELANDER 2"): "FREELANDER",
    ("LYNK&CO", "LYNK & CO 01"): "01",
    ("MERCEDES-BENZ", "A 180CDI"): "A 180", ("MERCEDES-BENZ", "B 180CDI"): "B 180",
    ("MERCEDES-BENZ", "C 200CDI"): "C 200", ("MERCEDES-BENZ", "C 220CDI"): "C 220",
    ("MERCEDES-BENZ", "E 200CDI"): "E 200", ("MERCEDES-BENZ", "E 220CDI"): "E 220",
    ("MERCEDES-BENZ", "GLK 220CDI4MATIC"): "GLK 220 CDI 4MATIC",
    ("MERCEDES-BENZ", "SLK 250 AMG SPORT CDI BLUE-CY A"): "SLK 250",
    ("MG", "3 HYBRID+"): "3", ("MG", "4 ELECTRIC"): "4", ("MG", "EHS PLUG-IN HYBRID"): "EHS",
    ("OPEL", "AFIRA TOURER"): "ZAFIRA", ("OPEL", "ASTRA+"): "ASTRA", ("OPEL", "ASTRASPORTSTOURER"): "ASTRA",
    ("OPEL", "CROSSLANDX"): "CROSSLAND", ("OPEL", "GRANDLANDX"): "GRANDLAND",
    ("OPEL", "INSIGNIASPORTSTOURERSW"): "INSIGNIA", ("OPEL", "KARLROCKS VIVAROCKS"): "KARL",
    ("OPEL", "MOKKAX"): "MOKKA", ("OPEL", "VIVA SE"): "KARL", ("OPEL", "VIVA SL"): "KARL",
    ("PEUGEOT", "206 +"): "206+", ("PEUGEOT", "N 2008"): "2008", ("PEUGEOT", "N 3008"): "3008",
    ("PEUGEOT", "N208"): "208", ("PEUGEOT", "N308"): "308", ("PEUGEOT", "N5008"): "5008",
    ("PEUGEOT", "NUEVO"): None, ("PEUGEOT", "PART"): "PARTNER",
    ("RENAULT", "MEGANESCENIC"): "SCENIC", ("RENAULT", "NEW TWINGO"): "TWINGO",
    ("RENAULT", "NUOVA CLIO 5 PORTE"): "CLIO",
    ("SEAT", "IBIA"): "IBIZA",
    ("SMART", "FORTWOCOUPEMHD"): "FORTWO",
    ("VOLKSWAGEN", "GOLFPLUS"): "GOLF PLUS", ("VOLKSWAGEN", "HIGH UP"): "UP!",
    ("VOLKSWAGEN", "MOVE UP"): "UP!", ("VOLKSWAGEN", "TAKE UP"): "UP!",
}
FUELS = {"PETROL-ELECTRIC": "PETROL/ELECTRIC", "DIESEL-ELECTRIC": "DIESEL/ELECTRIC", "NG-BIOMETHANE": "NG"}
BRAND_MIN = 100_000  # marka z tyloma autami jest "czysta"; śmieciowe warianty ("FORD-CNG-TECHNIK") doklejane po prefiksie
MODEL_MIN = 20_000   # nazwa modelu z tyloma autami jest "czysta"; reszta sprowadzana do najkrótszej czystej nazwy-prefiksu
                     # (5 tys. testowane jako V2 w analysis/test_czyszczenia.py: +1,2 pkt pokrycia, ale śmieci w liście modeli)

# kg CO2 na litr: l/100km = g/km / (kg/l * 10)
CO2_PER_L = {"PETROL": 23.2, "DIESEL": 26.4, "PETROL/ELECTRIC": 23.2, "DIESEL/ELECTRIC": 26.4}


def clean_model(brand, raw_brand, model):
    """Ucina markę z początku nazwy modelu ('NISSAN MICRA' -> 'MICRA') i ujednolica separatory."""
    model = re.sub(r"[\s/,.]+", " ", model).strip()
    for prefix in sorted({brand, raw_brand, brand.split("-")[0], "VW"}, key=lambda p: (-len(p), p)):
        if model.startswith(prefix) and len(model) > len(prefix):
            rest = model[len(prefix):].lstrip(" -")
            if rest:
                model = rest
                break
    model = re.sub(r"\b\d+ ?KW\b", "", model)                # 'ID 3 PRO 150 KW' -> 'ID 3 PRO'
    if brand == "MERCEDES-BENZ":
        model = re.sub(r"^([A-Z]{1,3})(\d)", r"\1 \2", model)  # 'A180' -> 'A 180'
    if brand == "VOLKSWAGEN":
        model = re.sub(r"^ID(\d)", r"ID \1", model)             # 'ID3' -> 'ID 3'
    model = model.replace("ERREIHE", "ER REIHE").replace("XREIHE", "X REIHE")
    return re.sub(r"\s+", " ", model).strip()


def starts_with_word(s, prefix):
    return s == prefix or s.startswith(prefix + " ") or s.startswith(prefix + "-")


def normalize(raw):
    """raw: {(mk, cn, ft): sumy} -> {(marka, model, paliwo): sumy} z czystymi nazwami."""
    rows = []
    for (mk, cn, ft), a in raw.items():
        ft = FUELS.get(ft, ft)
        if not mk or not cn or not ft or ft == "UNKNOWN":
            continue
        brand = BRANDS.get(mk, mk)
        if brand.startswith("VOLKSWAGEN"):
            brand = "VOLKSWAGEN"
        rows.append([brand, mk, cn, ft, a])

    brand_n = defaultdict(float)
    for r in rows:
        brand_n[r[0]] += r[4]["n"]
    clean_brands = sorted((b for b, n in brand_n.items() if n >= BRAND_MIN), key=len, reverse=True)
    for r in rows:
        # 'OPEL VAUXHALL' -> 'OPEL', 'FORD-CNG-TECHNIK' -> 'FORD', 'BMW I' -> 'BMW'
        r[0] = next((b for b in reversed(clean_brands) if b != r[0] and starts_with_word(r[0], b)), r[0])
        r[2] = clean_model(r[0], r[1], r[2])
    rows = [r for r in rows if r[2] and r[2] != r[0]]

    model_n = defaultdict(float)
    for brand, _, model, _, a in rows:
        model_n[(brand, model)] += a["n"]
    clean = defaultdict(list)
    for (brand, model), n in model_n.items():
        if n >= MODEL_MIN:
            clean[brand].append(model)
    for brand in clean:
        clean[brand].sort(key=len)

    out = defaultdict(lambda: defaultdict(float))
    for brand, _, model, ft, a in rows:
        base = next((c for c in clean[brand] if starts_with_word(model, c)), None)
        base = MODEL_FIX.get((brand, base), base)
        if base is None:
            continue
        for f, v in a.items():
            out[(brand, base, ft)][f] += v
    return out


def get(params, tries=5):
    for i in range(tries):
        try:
            with urllib.request.urlopen(f"{URL}?{urllib.parse.urlencode(params)}", timeout=300) as r:
                return json.load(r)
        except (urllib.error.URLError, TimeoutError) as e:
            if i == tries - 1:
                raise
            print(f"  błąd ({e}), ponawiam za {30 * (i + 1)} s")
            time.sleep(30 * (i + 1))


def fetch(year):
    cache = CACHE / f"eea_{year}.json"
    if cache.exists():
        return json.loads(cache.read_text())
    rows, page = [], 1
    while True:
        query = QUERY.format(year=year, table=TABLES.get(year, "co2cars"))
        data = get({"query": query, "p": page, "nrOfHits": PAGE})
        if "errors" in data:
            raise RuntimeError(data["errors"])
        batch = data["results"]
        rows += batch
        if len(batch) < PAGE:
            break
        page += 1
    CACHE.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(rows))
    return rows


def main():
    raw = defaultdict(lambda: defaultdict(float))
    for year in YEARS:
        rows = fetch(year)
        print(f"{year}: {len(rows)} kombinacji")
        for r in rows:
            key = (r["mk"] or "", r["cn"] or "", r["ft"] or "")
            for f in ("n", "n_fc", "fc_sum", "n_co2", "co2_sum", "n_z", "z_sum"):
                raw[key][f] += r[f] or 0
    acc = normalize(raw)

    out = []
    for (brand, model, fuel), a in acc.items():
        if a["n"] < MIN_CARS or a["n_co2"] == 0:
            continue
        co2 = a["co2_sum"] / a["n_co2"]
        if fuel == "ELECTRIC" and co2 >= 1:  # hybrydy błędnie zgłoszone jako elektryk
            continue
        if a["n_fc"]:
            l100 = a["fc_sum"] / a["n_fc"]
        elif fuel in CO2_PER_L:
            l100 = co2 / CO2_PER_L[fuel]
        else:
            l100 = None
        kwh100 = a["z_sum"] / a["n_z"] / 10 if a["n_z"] and "ELECTRIC" in fuel else None
        if fuel == "ELECTRIC":
            l100 = None
        out.append({
            "brand": brand,
            "model": model,
            "fuel_type": fuel,
            "l_per_100km": round(l100, 1) if l100 else None,
            "kwh_per_100km": round(kwh100, 1) if kwh100 else None,
            "co2_g_km": round(co2),
        })

    out.sort(key=lambda r: (r["brand"], r["model"], r["fuel_type"]))
    OUT.parent.mkdir(exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0]))
        w.writeheader()
        w.writerows(out)
    print(f"zapisano {len(out)} wierszy do {OUT}")


def sql_fixes():
    """VALUES dla model_fix w refresh_car_models() (schema.sql), żeby lista była jedna."""
    q = lambda s: "NULL" if s is None else "'" + s.replace("'", "''") + "'"
    return ",\n".join(f"({q(b)}, {q(m)}, {q(t)})" for (b, m), t in sorted(MODEL_FIX.items()))


if __name__ == "__main__":
    import sys
    if "--sql-fixes" in sys.argv:
        print(sql_fixes())
    else:
        main()
