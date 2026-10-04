"""Pobiera dane geograficzne do symulacji CO₂ i zapisuje cache w data/geo/ (notebook działa potem offline).

1. Ludność dzielnic Warszawy: GUS Bank Danych Lokalnych, zmienna 72305 ("ludność ogółem", temat P2137),
   najnowszy dostępny rok. API: https://bdl.stat.gov.pl/api/v1/data/by-unit/{id}?var-id=72305
   (endpoint zbiorczy by-variable zwracał limit wywołań, więc 18 zapytań per dzielnica, co 1 s).
2. Granice dzielnic: OpenStreetMap przez Nominatim (polygon_geojson=1), co 1,1 s zgodnie z zasadami Nominatim.

Wynik: data/geo/warszawa_dzielnice.json = [{"dzielnica", "gus_id", "rok", "ludnosc", "geometry"}, ...]
"""
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "geo" / "warszawa_dzielnice.json"
UA = {"User-Agent": "commute-app-hackathon-analysis/1.0", "Accept": "application/json"}

# identyfikatory jednostek GUS (BDL, poziom 6, rodzaj 8 = dzielnica m.st. Warszawy)
DISTRICTS = {
    "Bemowo": "071412865028", "Białołęka": "071412865038", "Bielany": "071412865048",
    "Mokotów": "071412865058", "Ochota": "071412865068", "Praga-Południe": "071412865078",
    "Praga-Północ": "071412865088", "Rembertów": "071412865098", "Śródmieście": "071412865108",
    "Targówek": "071412865118", "Ursus": "071412865128", "Ursynów": "071412865138",
    "Wawer": "071412865148", "Wesoła": "071412865158", "Wilanów": "071412865168",
    "Włochy": "071412865178", "Wola": "071412865188", "Żoliborz": "071412865198",
}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.load(r)


def population(gus_id):
    d = get(f"https://bdl.stat.gov.pl/api/v1/data/by-unit/{gus_id}?var-id=72305&format=json")
    last = max(d["results"][0]["values"], key=lambda v: int(v["year"]))
    return int(last["year"]), int(last["val"])


def boundary(name):
    q = urllib.parse.urlencode({"q": f"{name}, Warszawa, Polska", "polygon_geojson": 1, "format": "jsonv2", "limit": 5})
    hits = get(f"https://nominatim.openstreetmap.org/search?{q}")
    hit = next(h for h in hits if h.get("geojson", {}).get("type") in ("Polygon", "MultiPolygon")
               and h.get("type") == "administrative")
    return hit["display_name"], hit["geojson"]


def main():
    out = []
    for name, gus_id in DISTRICTS.items():
        year, pop = population(gus_id)
        time.sleep(1)
        display, geom = boundary(name)
        time.sleep(1.1)
        out.append({"dzielnica": name, "gus_id": gus_id, "rok": year, "ludnosc": pop,
                    "osm_nazwa": display, "geometry": geom})
        print(f"{name:15} {year} {pop:>8,}  {geom['type']:12} {display[:60]}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"zapisano {OUT}, razem {sum(d['ludnosc'] for d in out):,} mieszkańców")


if __name__ == "__main__":
    main()
