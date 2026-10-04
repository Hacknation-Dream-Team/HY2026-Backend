"""Wyciąg z pełnego zrzutu CEPiK (województwo mazowieckie, stan na 17.04.2022): samochody osobowe z Warszawy.

Źródło: https://api.cepik.gov.pl/pliki -> pojazdy_14_2022-04-17.zip (CSV, ~390 MB zip).
Czyta CSV strumieniowo prosto z zipa (bez rozpakowywania na dysk), zapisuje:
  data/cepik/warszawa_osobowe_2022.csv  - tylko potrzebne kolumny, wszystkie osobowe z powiatu Warszawa
  data/cepik/extract_stats.json         - liczności po drodze (do udokumentowania filtrów w notebooku)
Wyrejestrowane pojazdy NIE są tu odrzucane (kolumna `wyrejestrowany`), decyzja zapada w notebooku.
"""
import csv
import io
import json
import sys
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ZIP = ROOT / "data" / "cepik" / "pojazdy_14_2022-04-17.zip"
OUT = ROOT / "data" / "cepik" / "warszawa_osobowe_2022.csv"
STATS = ROOT / "data" / "cepik" / "extract_stats.json"

KEEP = ["marka", "model", "rok_produkcji", "rodzaj_paliwa", "rodzaj_paliwa_alternatywnego",
        "rodzaj_paliwa_alternatywnego2", "pojemnosc_silnika", "moc_silnika", "emisja_co2", "sr_zuzycie_pal",
        "pochodzenie", "data_pierwszej_rej_w_kraju", "akt_miejsce_rej_gmina"]


def main():
    csv.field_size_limit(sys.maxsize)
    stats = {"wiersze": 0, "rodzaj": Counter(), "powiat_warsz": Counter(), "osobowe_warszawa": 0,
             "osobowe_warszawa_wyrejestrowane": 0}
    with zipfile.ZipFile(ZIP) as z:
        name = z.namelist()[0]
        stats["plik_w_zipie"] = name
        with z.open(name) as raw, OUT.open("w", newline="", encoding="utf-8") as out:
            reader = csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8", newline=""))
            stats["kolumny"] = reader.fieldnames
            w = csv.DictWriter(out, fieldnames=KEEP + ["wyrejestrowany"])
            w.writeheader()
            for row in reader:
                stats["wiersze"] += 1
                rodzaj = (row.get("rodzaj") or "").strip().upper()
                stats["rodzaj"][rodzaj] += 1
                powiat = (row.get("akt_miejsce_rej_powiat") or "").strip().upper()
                if "WARSZ" in powiat:
                    stats["powiat_warsz"][powiat] += 1
                # "WARSZAWA" (miasto na prawach powiatu), bez "WARSZAWSKI ZACHODNI" itp.
                if rodzaj != "SAMOCHÓD OSOBOWY" or "WARSZAWA" not in powiat:
                    continue
                wyrej = bool((row.get("data_wyrejestrowania") or "").strip())
                stats["osobowe_warszawa"] += 1
                stats["osobowe_warszawa_wyrejestrowane"] += wyrej
                w.writerow({**{k: row.get(k, "") for k in KEEP}, "wyrejestrowany": int(wyrej)})
                if stats["wiersze"] % 1_000_000 == 0:
                    print(f"{stats['wiersze']:,} wierszy...", flush=True)
    stats["rodzaj"] = dict(stats["rodzaj"].most_common(15))
    stats["powiat_warsz"] = dict(stats["powiat_warsz"].most_common())
    STATS.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in stats.items() if k != "kolumny"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
