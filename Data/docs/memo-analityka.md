# Memo: badanie CO₂ — wyniki

Stan: 4 paź 2026. Szczegóły i kod: `analysis/cepik_flota_warszawa.ipynb` (flota) i `analysis/co2_symulacja.ipynb` (symulacja).

## TL;DR

- **Wspólny przejazd tnie CO₂ mniej więcej o połowę na osobę** (w aucie średnio 2,1–2,9 osoby → −53…−65%). Teza „kilkadziesiąt procent” trzyma się na poziomie auta.
- **Jeden oddział 500 osób to za mało**: przejazd znajduje ~9% szukających, oszczędność ~1 t CO₂/rok. Za mała gęstość.
- **Pula dzielnicy biurowej (10 tys. osób)**: 80% szukających z przejazdem, −43% CO₂ uczestników, ~240 t CO₂/rok, ~390 aut mniej pod biurami dziennie.
- **Wniosek produktowy**: dopasowanie między firmami w tej samej lokalizacji i szersze reguły (800 m, ±30 min). Dziś matching jest zamknięty w oddziale.

## Krok po kroku

1. **Flota (dane prawdziwe).** Pełny zrzut CEPiK dla mazowieckiego (stan 17.04.2022) → osobowe zarejestrowane w Warszawie: 904 tys. 62% to roczniki < 2010, w tym „martwe dusze” (57 tys. Polskich Fiatów), więc zakres zawężony do roczników ≥ 2010 (326 tys., tyle obejmuje EEA).
2. **Dopasowanie do słownika.** To samo czyszczenie nazw co przy EEA → **97,7%** aut trafia do `car_models`. Niedopasowane to głównie rzadkie w UE modele odcięte progiem czyszczenia (niższy próg daje 98,9%, ale śmieci w liście modeli; patrz `docs/test_czyszczenia_raport.md`). Średnie CO₂ floty: **131 g/km** (homologacyjne).
3. **Wiarygodność.** Na 285 tys. aut z CO₂ w obu źródłach: średnia EEA vs CEPiK różni się o **0,1%**, korelacja na poziomie modelu 0,88. Słownik nadaje się do statystyk zbiorczych (dla pojedynczego auta to przybliżenie — nie zna wersji silnika).
4. **Symulacja.** Syntetyczny oddział: domy rozłożone jak ludność dzielnic (GUS 2025) wewnątrz ich granic (OpenStreetMap), auta losowane z rozkładu CEPiK, biuro na Służewcu, dopasowanie według reguł `find_matches`. 500 przebiegów, wynik z widełkami 5–95%. Ceny paliw e-petrol z 30.09.2026.
5. **Wrażliwość.** Po kolei: wielkość puli, udział w programie, udział jeżdżących autem, udział kierowców, zasięg dojścia, dni w biurze.

## Wyniki

| scenariusz | szukających z przejazdem | CO₂ uczestników | CO₂ / rok | aut mniej dziennie |
|---|---|---|---|---|
| oddział 500 os., reguły bazowe (500 m, ±15 min) | ~9% | −3% | ~1 t | ~2 |
| oddział 500 os., reguły elastyczne (800 m, ±30 min) | ~24% | −10% | ~3 t | ~6 |
| pula 2 000 os., elastyczne | ~52% | −25% | ~29 t | ~51 |
| pula 10 000 os., elastyczne | ~80% | −43% | ~240 t | ~390 |

Najmocniejsze dźwignie: wielkość puli i udział w programie (efekt sieci), potem zasięg dojścia i okno czasowe.

## Co z tego wynika

**Dla produktu (do decyzji):**
- matching między firmami w tym samym biurowcu / dzielnicy biurowej (zmiana reguły „tylko ten sam oddział” w `find_matches`),
- domyślnie szersze reguły (np. 800 m, ±30 min),
- ewentualnie dopasowanie do całej trasy kierowcy, nie tylko zadeklarowanych przystanków.

**Na prezentację:** „Każde wspólne auto to mniej więcej o połowę mniej CO₂ na osobę. Skala rośnie z gęstością: w dzielnicy biurowej z 10 tys. pracowników to ok. 240 t CO₂ rocznie i ok. 390 aut mniej pod biurami dziennie.” + dopisek: symulacja na prawdziwej flocie (CEPiK + EEA) i geografii (GUS + OSM), z jawnymi założeniami o zachowaniu ludzi.

## Założenia i ograniczenia

- **Założenia bez danych:** udział jeżdżących autem (45%), udział w programie (30%), udział kierowców (40%), godziny wyjazdu (~7:45 ± 30 min), przystanki co 1 km. Wynik pokazany jako zależny od nich.
- Trasy w linii prostej (× 1,3 na dystans), nie po ulicach — prawdziwe trasy zbiegają się na arteriach, więc dopasowań byłoby raczej więcej.
- Pracownicy mieszkają jak cała Warszawa (bez dojeżdżających spoza miasta).
- Flota z 2022 r., CO₂ homologacyjne (realne w mieście zwykle wyższe → wynik ostrożny).

## Odtworzenie

1. `data/cepik/pojazdy_14_2022-04-17.zip` z https://api.cepik.gov.pl/www/files/pojazdy_14_2022-04-17.zip, potem `python analysis/cepik_extract.py`
2. `python analysis/fetch_geo.py` (GUS + OSM → `data/geo/`)
3. `analysis/cepik_flota_warszawa.ipynb` → zapisuje rozkład aut
4. `analysis/co2_symulacja.ipynb` (~30 s)

Środowisko: `.venv` w projekcie (pandas, matplotlib, ipykernel).
