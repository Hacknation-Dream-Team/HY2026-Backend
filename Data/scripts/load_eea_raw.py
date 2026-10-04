"""Cienki runner: pobiera surowe agregaty z EEA discodata do data/eea_raw.csv (bez czyszczenia).

Wgranie do Neona i czyszczenie robi baza:
    TRUNCATE eea_raw; \\copy eea_raw FROM 'data/eea_raw.csv' CSV HEADER; CALL refresh_car_models();
(patrz .github/workflows/refresh-car-models.yml)

Nowy rok w EEA = dopisać jego tabelę do TABLES w fetch_car_models.py i rozszerzyć YEARS.
"""
import csv
from pathlib import Path

from fetch_car_models import YEARS, fetch

OUT = Path(__file__).resolve().parent.parent / "data" / "eea_raw.csv"
FIELDS = ["year", "mk", "cn", "ft", "n", "n_fc", "fc_sum", "n_co2", "co2_sum", "n_z", "z_sum"]


def main():
    OUT.parent.mkdir(exist_ok=True)
    total = 0
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        for year in YEARS:
            rows = fetch(year)
            for r in rows:
                w.writerow({"year": year, **{k: r[k] for k in FIELDS[1:]}})
            total += len(rows)
            print(f"{year}: {len(rows)} wierszy")
    print(f"zapisano {total} wierszy do {OUT}")


if __name__ == "__main__":
    main()
