# Test czyszczenia nazw aut (EEA → `car_models`)

Flota odniesienia: CEPiK, Warszawa, osobowe zarejestrowane, rocznik ≥ 2010: **325,502 aut**.

Niczego nie zapisano do bazy ani do `data/`; warianty liczone w pamięci.

## Podsumowanie

| wariant | modeli | pokrycie floty | gubi czyszczenie | spoza EEA | duplikaty | słowa wyposażenia | kontrolne słownik | kontrolne CEPiK |
|---|---|---|---|---|---|---|---|---|
| V0 poprzednie (próg modelu 20 tys.) | 588 | 97.69% | 2.13% | 0.19% | 2 | 32 | 0/3 | 11/15 |
| V1 próg 10 tys. | 789 | 98.38% | 1.44% | 0.18% | 13 | 63 | 1/3 | 13/15 |
| V2 próg 5 tys. (WDROŻONE) | 1029 | 98.87% | 0.96% | 0.17% | 27 | 111 | 3/3 | 15/15 |
| V3 próg 5 tys. + sklejanie kodów | 1019 | 98.92% | 0.91% | 0.17% | 18 | 96 | 3/3 | 15/15 |
| V4a reguły na śmieci, próg 10 tys. | 759 | 98.57% | 1.27% | 0.16% | 0 | 20 | 1/3 | 12/15 |
| V4b reguły na śmieci, próg 5 tys. | 971 | 98.98% | 0.87% | 0.15% | 0 | 44 | 3/3 | 14/15 |
| V5a V4 + poprawki, próg 10 tys. | 975 | 98.32% | 1.49% | 0.19% | 2 | 56 | 1/3 | 12/15 |
| V5b V4 + poprawki, próg 5 tys. | 1311 | 98.74% | 1.08% | 0.18% | 2 | 85 | 2/3 | 14/15 |
| V6a reguły deterministyczne, próg 10 tys. | 782 | 98.56% | 1.27% | 0.17% | 6 | 16 | 1/3 | 13/15 |
| V6b reguły deterministyczne, próg 5 tys. | 988 | 98.97% | 0.87% | 0.16% | 12 | 31 | 3/3 | 15/15 |
| V7a V6 + duplikaty, próg 10 tys. | 800 | 98.58% | 1.25% | 0.17% | 0 | 45 | 1/3 | 13/15 |
| V7b V6 + duplikaty, próg 5 tys. | 1028 | 98.98% | 0.86% | 0.16% | 0 | 71 | 2/3 | 15/15 |

Kontrolne CEPiK liczone tylko dla nazw, które występują w danych (rocznik ≥ 2010).

## V0 poprzednie (próg modelu 20 tys.)

- wierszy w słowniku: 1,292, modeli: 588
- pokrycie floty: **97.69%**
- niedopasowane, ale **są w EEA** (gubi czyszczenie): 2.13% floty
- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): 0.19% floty
- śmieci: duplikaty po spacjach 2, słowa wyposażenia 32, model = marka 0
- przypadki kontrolne (słownik): FIAT LINEA ❌, LEXUS NX200T ❌, LEXUS NX300 ❌
- przypadki kontrolne (nazwy z CEPiK): HYUNDAI | I30 CW ✅, SKODA | OCTAVIA COMBI ✅, SKODA | FABIA COMBI ✅, TOYOTA | COROLLA 1.4 KAT —, TOYOTA | YARIS HYBRID ✅, KIA | CEE'D ✅, OPEL | ASTRA+ ✅, FIAT | LINEA ❌, LEXUS | NX200T ❌, LEXUS | NX300 ❌, MAZDA | CX-5 ✅, HONDA | CR-V ✅, HYUNDAI | IX35 ✅, SUZUKI | GRAND VITARA ✅, NISSAN | X-TRAIL ✅, BMW | M135I ❌

Top 10 gubionych przez czyszczenie (są w EEA):

  - CHRYSLER | TOWN AND COUNTRY (134 aut)
  - LEXUS | NX200T (132 aut)
  - KIA | STINGER (105 aut)
  - TOYOTA | SIENNA (100 aut)
  - INFINITI | Q50 (93 aut)
  - LEXUS | NX300 (85 aut)
  - LEXUS | IS200T (85 aut)
  - MERCEDES-BENZ | E 180 (74 aut)
  - BMW | X4 XDRIVE20I (70 aut)
  - BMW | 528I XDRIVE (69 aut)

Top 10 spoza EEA:

  - AUDI | 8V S3 SPORTBACK (21 aut)
  - BMW I |  (19 aut)
  - OPEL/CARPOL | VIVARO-B (16 aut)
  - DACIA | SD SANDERO (15 aut)
  -  | PASSAT (15 aut)
  -  | GOLF (14 aut)
  - TATA |  (12 aut)
  - AUDI | 8V A3 (10 aut)
  -  | ALFA GIULIETTA (7 aut)
  - SAM |  (6 aut)

Przykłady śmieci (słowa wyposażenia): BMW 335D XDRIVE, BMW 435D XDRIVE, BMW 535D XDRIVE, BMW 540D XDRIVE, BMW 540I XDRIVE, BMW 740D XDRIVE, BMW M135I XDRIVE, BMW M440I XDRIVE, LAND ROVER DISCOVERY SPORT, LAND ROVER RANGE ROVER SPORT, MERCEDES-BENZ AMG C 43, MERCEDES-BENZ AMG G 63
Przykłady duplikatów: IX1 EDRIVE 20 / IX1 EDRIVE20; GRAND C-MAX / GRANDC-MAX

## V1 próg 10 tys.

- wierszy w słowniku: 1,581, modeli: 789
- pokrycie floty: **98.38%**
- niedopasowane, ale **są w EEA** (gubi czyszczenie): 1.44% floty
- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): 0.18% floty
- śmieci: duplikaty po spacjach 13, słowa wyposażenia 63, model = marka 0
- przypadki kontrolne (słownik): FIAT LINEA ✅, LEXUS NX200T ❌, LEXUS NX300 ❌
- przypadki kontrolne (nazwy z CEPiK): HYUNDAI | I30 CW ✅, SKODA | OCTAVIA COMBI ✅, SKODA | FABIA COMBI ✅, TOYOTA | COROLLA 1.4 KAT —, TOYOTA | YARIS HYBRID ✅, KIA | CEE'D ✅, OPEL | ASTRA+ ✅, FIAT | LINEA ✅, LEXUS | NX200T ❌, LEXUS | NX300 ❌, MAZDA | CX-5 ✅, HONDA | CR-V ✅, HYUNDAI | IX35 ✅, SUZUKI | GRAND VITARA ✅, NISSAN | X-TRAIL ✅, BMW | M135I ✅

Top 10 gubionych przez czyszczenie (są w EEA):

  - CHRYSLER | TOWN AND COUNTRY (134 aut)
  - LEXUS | NX200T (132 aut)
  - TOYOTA | SIENNA (100 aut)
  - LEXUS | NX300 (85 aut)
  - LEXUS | IS200T (85 aut)
  - MERCEDES-BENZ | E 180 (74 aut)
  - BMW | 528I XDRIVE (69 aut)
  - MAZDA | CX-9 (60 aut)
  - BMW | 520 (60 aut)
  - LEXUS | IS300 (58 aut)

Top 10 spoza EEA:

  - AUDI | 8V S3 SPORTBACK (21 aut)
  - BMW I |  (19 aut)
  - OPEL/CARPOL | VIVARO-B (16 aut)
  - DACIA | SD SANDERO (15 aut)
  -  | PASSAT (15 aut)
  -  | GOLF (14 aut)
  - TATA |  (12 aut)
  - AUDI | 8V A3 (10 aut)
  -  | ALFA GIULIETTA (7 aut)
  - SAM |  (6 aut)

Przykłady śmieci (słowa wyposażenia): AUDI Q6 SUV E-TRON QUATTRO, AUDI S5 TFSI QUATTRO AUTO, BMW 225E XDRIVE ACTIVE TOURER, BMW 335D XDRIVE, BMW 435D XDRIVE, BMW 540D XDRIVE, BMW 540I XDRIVE, BMW 740D XDRIVE, BMW 840D XDRIVE, BMW IX XDRIVE 40, BMW M 550D XDRIVE, BMW M340D XDRIVE
Przykłady duplikatów: C MAX / C-MAX; I5 EDRIVE 40 / I5 EDRIVE40; Q 2 / Q2; Z4 SDRIVE 20I / Z4 SDRIVE20I; Z REIHE / ZREIHE; ML 350 BLUETEC 4MATIC / ML 350BLUETEC4MATIC; I 40 / I40; RS 6 AVANT / RS6 AVANT

## V2 próg 5 tys. (WDROŻONE)

- wierszy w słowniku: 1,878, modeli: 1,029
- pokrycie floty: **98.87%**
- niedopasowane, ale **są w EEA** (gubi czyszczenie): 0.96% floty
- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): 0.17% floty
- śmieci: duplikaty po spacjach 27, słowa wyposażenia 111, model = marka 0
- przypadki kontrolne (słownik): FIAT LINEA ✅, LEXUS NX200T ✅, LEXUS NX300 ✅
- przypadki kontrolne (nazwy z CEPiK): HYUNDAI | I30 CW ✅, SKODA | OCTAVIA COMBI ✅, SKODA | FABIA COMBI ✅, TOYOTA | COROLLA 1.4 KAT —, TOYOTA | YARIS HYBRID ✅, KIA | CEE'D ✅, OPEL | ASTRA+ ✅, FIAT | LINEA ✅, LEXUS | NX200T ✅, LEXUS | NX300 ✅, MAZDA | CX-5 ✅, HONDA | CR-V ✅, HYUNDAI | IX35 ✅, SUZUKI | GRAND VITARA ✅, NISSAN | X-TRAIL ✅, BMW | M135I ✅

Top 10 gubionych przez czyszczenie (są w EEA):

  - CHRYSLER | TOWN AND COUNTRY (134 aut)
  - TOYOTA | SIENNA (100 aut)
  - LEXUS | IS200T (85 aut)
  - MERCEDES-BENZ | E 180 (74 aut)
  - MAZDA | CX-9 (60 aut)
  - BMW | 520 (60 aut)
  - LEXUS | IS300 (58 aut)
  - DODGE | GRAND CARAVAN (54 aut)
  - FORD | ESCAPE (49 aut)
  - CHRYSLER | TOWN & COUNTRY (49 aut)

Top 10 spoza EEA:

  - AUDI | 8V S3 SPORTBACK (21 aut)
  - BMW I |  (19 aut)
  - OPEL/CARPOL | VIVARO-B (16 aut)
  - DACIA | SD SANDERO (15 aut)
  -  | PASSAT (15 aut)
  -  | GOLF (14 aut)
  - TATA |  (12 aut)
  - AUDI | 8V A3 (10 aut)
  -  | ALFA GIULIETTA (7 aut)
  - SAM |  (6 aut)

Przykłady śmieci (słowa wyposażenia): ALFA ROMEO SPORT WAGON, AUDI S1 QUATTRO, AUDI S4 TFSI QUATTRO AUTO, AUDI TTS TFSI QUATTRO S-A, BMW 225E XDRIVE ACTIVE TOURER, BMW 335D XDRIVE, BMW 435D XDRIVE, BMW 540D XDRIVE, BMW 545E XDRIVE, BMW 550E XDRIVE, BMW 630D XDRIVE, BMW 740D XDRIVE
Przykłady duplikatów: C 3 / C3; C MAX / C-MAX; 4 0 / 40; I5 EDRIVE 40 / I5 EDRIVE40; Q 2 / Q2; Z4 SDRIVE 20I / Z4 SDRIVE20I; Z REIHE / ZREIHE; RANGE ROVER EVOQUE / RANGEROVEREVOQUE

## V3 próg 5 tys. + sklejanie kodów

- wierszy w słowniku: 1,872, modeli: 1,019
- pokrycie floty: **98.92%**
- niedopasowane, ale **są w EEA** (gubi czyszczenie): 0.91% floty
- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): 0.17% floty
- śmieci: duplikaty po spacjach 18, słowa wyposażenia 96, model = marka 0
- przypadki kontrolne (słownik): FIAT LINEA ✅, LEXUS NX200T ✅, LEXUS NX300 ✅
- przypadki kontrolne (nazwy z CEPiK): HYUNDAI | I30 CW ✅, SKODA | OCTAVIA COMBI ✅, SKODA | FABIA COMBI ✅, TOYOTA | COROLLA 1.4 KAT —, TOYOTA | YARIS HYBRID ✅, KIA | CEE'D ✅, OPEL | ASTRA+ ✅, FIAT | LINEA ✅, LEXUS | NX200T ✅, LEXUS | NX300 ✅, MAZDA | CX-5 ✅, HONDA | CR-V ✅, HYUNDAI | IX35 ✅, SUZUKI | GRAND VITARA ✅, NISSAN | X-TRAIL ✅, BMW | M135I ✅

Top 10 gubionych przez czyszczenie (są w EEA):

  - CHRYSLER | TOWN AND COUNTRY (134 aut)
  - TOYOTA | SIENNA (100 aut)
  - LEXUS | IS200T (85 aut)
  - MERCEDES-BENZ | E 180 (74 aut)
  - MAZDA | CX-9 (60 aut)
  - BMW | 520 (60 aut)
  - LEXUS | IS300 (58 aut)
  - DODGE | GRAND CARAVAN (54 aut)
  - FORD | ESCAPE (49 aut)
  - CHRYSLER | TOWN & COUNTRY (49 aut)

Top 10 spoza EEA:

  - AUDI | 8V S3 SPORTBACK (21 aut)
  - BMW I |  (19 aut)
  - OPEL/CARPOL | VIVARO-B (16 aut)
  - DACIA | SD SANDERO (15 aut)
  -  | PASSAT (15 aut)
  -  | GOLF (14 aut)
  - TATA |  (12 aut)
  - AUDI | 8V A3 (10 aut)
  -  | ALFA GIULIETTA (7 aut)
  - SAM |  (6 aut)

Przykłady śmieci (słowa wyposażenia): ALFA ROMEO SPORT WAGON, AUDI RS3 QUATTRO S-A, AUDI S1 QUATTRO, AUDI S4 TFSI QUATTRO AUTO, AUDI TTS TFSI QUATTRO S-A, BMW 225E XDRIVE ACTIVE TOURER, BMW 335D XDRIVE, BMW 435D XDRIVE, BMW 540D XDRIVE, BMW 545E XDRIVE, BMW 550E XDRIVE, BMW 630D XDRIVE
Przykłady duplikatów: C MAX / C-MAX; 4 0 / 40; I5 EDRIVE 40 / I5 EDRIVE40; Z4 SDRIVE 20I / Z4 SDRIVE20I; Z REIHE / ZREIHE; RANGE ROVER EVOQUE / RANGEROVEREVOQUE; 5ER GRAN TURISMO REIHE / 5ERGRANTURISMOREIHE; T ROC / T-ROC

## V4a reguły na śmieci, próg 10 tys.

- wierszy w słowniku: 1,527, modeli: 759
- pokrycie floty: **98.57%**
- niedopasowane, ale **są w EEA** (gubi czyszczenie): 1.27% floty
- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): 0.16% floty
- śmieci: duplikaty po spacjach 0, słowa wyposażenia 20, model = marka 0
- przypadki kontrolne (słownik): FIAT LINEA ✅, LEXUS NX200T ❌, LEXUS NX300 ❌
- przypadki kontrolne (nazwy z CEPiK): HYUNDAI | I30 CW ❌, SKODA | OCTAVIA COMBI ✅, SKODA | FABIA COMBI ✅, TOYOTA | COROLLA 1.4 KAT —, TOYOTA | YARIS HYBRID ✅, KIA | CEE'D ✅, OPEL | ASTRA+ ✅, FIAT | LINEA ✅, LEXUS | NX200T ❌, LEXUS | NX300 ❌, MAZDA | CX-5 ✅, HONDA | CR-V ✅, HYUNDAI | IX35 ✅, SUZUKI | GRAND VITARA ✅, NISSAN | X-TRAIL ✅, BMW | M135I ✅

Top 10 gubionych przez czyszczenie (są w EEA):

  - HYUNDAI | I30 CW (182 aut)
  - CHRYSLER | TOWN AND COUNTRY (134 aut)
  - LEXUS | NX200T (132 aut)
  - TOYOTA | SIENNA (100 aut)
  - LEXUS | NX300 (85 aut)
  - LEXUS | IS200T (85 aut)
  - MERCEDES-BENZ | E 180 (74 aut)
  - MAZDA | CX-9 (60 aut)
  - BMW | 520 (60 aut)
  - LEXUS | IS300 (58 aut)

Top 10 spoza EEA:

  - AUDI | 8V S3 SPORTBACK (21 aut)
  - BMW I |  (19 aut)
  - OPEL/CARPOL | VIVARO-B (16 aut)
  - DACIA | SD SANDERO (15 aut)
  -  | PASSAT (15 aut)
  -  | GOLF (14 aut)
  - TATA |  (12 aut)
  - AUDI | 8V A3 (10 aut)
  -  | ALFA GIULIETTA (7 aut)
  - SAM |  (6 aut)

Przykłady śmieci (słowa wyposażenia): LAND ROVER DISCO-Y SPORT BLACK TD4, LAND ROVER DISCO-Y SPORT TD4, LAND ROVER R ROVER SPORT SDV6, LAND ROVER RROVER SPORT ABIO SDV6, MERCEDES-BENZ A 45 AMG, MERCEDES-BENZ AMG 35, MERCEDES-BENZ AMG 45, MERCEDES-BENZ AMG C 43, MERCEDES-BENZ AMG C 63, MERCEDES-BENZ AMG CLA 35, MERCEDES-BENZ AMG CLA 45, MERCEDES-BENZ AMG E 53
Przykłady duplikatów: 

## V4b reguły na śmieci, próg 5 tys.

- wierszy w słowniku: 1,777, modeli: 971
- pokrycie floty: **98.98%**
- niedopasowane, ale **są w EEA** (gubi czyszczenie): 0.87% floty
- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): 0.15% floty
- śmieci: duplikaty po spacjach 0, słowa wyposażenia 44, model = marka 0
- przypadki kontrolne (słownik): FIAT LINEA ✅, LEXUS NX200T ✅, LEXUS NX300 ✅
- przypadki kontrolne (nazwy z CEPiK): HYUNDAI | I30 CW ❌, SKODA | OCTAVIA COMBI ✅, SKODA | FABIA COMBI ✅, TOYOTA | COROLLA 1.4 KAT —, TOYOTA | YARIS HYBRID ✅, KIA | CEE'D ✅, OPEL | ASTRA+ ✅, FIAT | LINEA ✅, LEXUS | NX200T ✅, LEXUS | NX300 ✅, MAZDA | CX-5 ✅, HONDA | CR-V ✅, HYUNDAI | IX35 ✅, SUZUKI | GRAND VITARA ✅, NISSAN | X-TRAIL ✅, BMW | M135I ✅

Top 10 gubionych przez czyszczenie (są w EEA):

  - HYUNDAI | I30 CW (182 aut)
  - CHRYSLER | TOWN AND COUNTRY (134 aut)
  - TOYOTA | SIENNA (100 aut)
  - LEXUS | IS200T (85 aut)
  - MERCEDES-BENZ | E 180 (74 aut)
  - MAZDA | CX-9 (60 aut)
  - BMW | 520 (60 aut)
  - LEXUS | IS300 (58 aut)
  - DODGE | GRAND CARAVAN (54 aut)
  - FORD | ESCAPE (49 aut)

Top 10 spoza EEA:

  - AUDI | 8V S3 SPORTBACK (21 aut)
  - BMW I |  (19 aut)
  - OPEL/CARPOL | VIVARO-B (16 aut)
  - DACIA | SD SANDERO (15 aut)
  -  | PASSAT (15 aut)
  -  | GOLF (14 aut)
  - TATA |  (12 aut)
  - AUDI | 8V A3 (10 aut)
  -  | ALFA GIULIETTA (7 aut)
  - SAM |  (6 aut)

Przykłady śmieci (słowa wyposażenia): ALFA ROMEO SPORT WAGON, LAND ROVER DISCO-Y SPORT BLACK TD4, LAND ROVER DISCO-Y SPORT TD4, LAND ROVER R ROVER SPORT ABIO SDV8, LAND ROVER R ROVER SPORT ABIOG SDV6, LAND ROVER R ROVER SPORT BLACK SDV6, LAND ROVER R ROVER SPORT P400E, LAND ROVER R ROVER SPORT SDV6, LAND ROVER RROVER SPORT ABIO SDV6, LEXUS CT 200H F SPORT, LEXUS CT 200H SPORT, LEXUS IS 300H F SPORT
Przykłady duplikatów: 

## V5a V4 + poprawki, próg 10 tys.

- wierszy w słowniku: 1,800, modeli: 975
- pokrycie floty: **98.32%**
- niedopasowane, ale **są w EEA** (gubi czyszczenie): 1.49% floty
- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): 0.19% floty
- śmieci: duplikaty po spacjach 2, słowa wyposażenia 56, model = marka 0
- przypadki kontrolne (słownik): FIAT LINEA ✅, LEXUS NX200T ❌, LEXUS NX300 ❌
- przypadki kontrolne (nazwy z CEPiK): HYUNDAI | I30 CW ❌, SKODA | OCTAVIA COMBI ✅, SKODA | FABIA COMBI ✅, TOYOTA | COROLLA 1.4 KAT —, TOYOTA | YARIS HYBRID ✅, KIA | CEE'D ✅, OPEL | ASTRA+ ✅, FIAT | LINEA ✅, LEXUS | NX200T ❌, LEXUS | NX300 ❌, MAZDA | CX-5 ✅, HONDA | CR-V ✅, HYUNDAI | IX35 ✅, SUZUKI | GRAND VITARA ✅, NISSAN | X-TRAIL ✅, BMW | M135I ✅

Top 10 gubionych przez czyszczenie (są w EEA):

  - HYUNDAI | I30 CW (182 aut)
  - CHRYSLER | TOWN AND COUNTRY (134 aut)
  - LEXUS | NX200T (132 aut)
  - TOYOTA | SIENNA (100 aut)
  - LAND ROVER | RANGE ROVER VELAR (88 aut)
  - LEXUS | NX300 (85 aut)
  - LEXUS | IS200T (85 aut)
  - MERCEDES-BENZ | E 180 (74 aut)
  - MAZDA | CX-9 (60 aut)
  - BMW | 520 (60 aut)

Top 10 spoza EEA:

  - AUDI | 8V S3 SPORTBACK (21 aut)
  - BMW I |  (19 aut)
  - OPEL/CARPOL | VIVARO-B (16 aut)
  - DACIA | SD SANDERO (15 aut)
  -  | PASSAT (15 aut)
  -  | GOLF (14 aut)
  - TATA |  (12 aut)
  - AUDI | 8V A3 (10 aut)
  -  | ALFA GIULIETTA (7 aut)
  - SAM |  (6 aut)

Przykłady śmieci (słowa wyposażenia): AUDI A1 SPORT, AUDI A3 SPORT, AUDI A4 SPORT, AUDI Q2 SPORT, AUDI Q3 SPORT, BMW 116D M SPORT, BMW 116D SPORT, BMW 116I SPORT, BMW 118D M SPORT, BMW 118D SPORT, BMW 118I M SPORT SHADOW, BMW 118I SPORT
Przykłady duplikatów: 3008 / 3008 -; C- ELYSEE / C-ELYSEE

## V5b V4 + poprawki, próg 5 tys.

- wierszy w słowniku: 2,204, modeli: 1,311
- pokrycie floty: **98.74%**
- niedopasowane, ale **są w EEA** (gubi czyszczenie): 1.08% floty
- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): 0.18% floty
- śmieci: duplikaty po spacjach 2, słowa wyposażenia 85, model = marka 0
- przypadki kontrolne (słownik): FIAT LINEA ✅, LEXUS NX200T ❌, LEXUS NX300 ✅
- przypadki kontrolne (nazwy z CEPiK): HYUNDAI | I30 CW ❌, SKODA | OCTAVIA COMBI ✅, SKODA | FABIA COMBI ✅, TOYOTA | COROLLA 1.4 KAT —, TOYOTA | YARIS HYBRID ✅, KIA | CEE'D ✅, OPEL | ASTRA+ ✅, FIAT | LINEA ✅, LEXUS | NX200T ✅, LEXUS | NX300 ✅, MAZDA | CX-5 ✅, HONDA | CR-V ✅, HYUNDAI | IX35 ✅, SUZUKI | GRAND VITARA ✅, NISSAN | X-TRAIL ✅, BMW | M135I ✅

Top 10 gubionych przez czyszczenie (są w EEA):

  - HYUNDAI | I30 CW (182 aut)
  - CHRYSLER | TOWN AND COUNTRY (134 aut)
  - TOYOTA | SIENNA (100 aut)
  - LAND ROVER | RANGE ROVER VELAR (88 aut)
  - LEXUS | IS200T (85 aut)
  - MERCEDES-BENZ | E 180 (74 aut)
  - MAZDA | CX-9 (60 aut)
  - BMW | 520 (60 aut)
  - LEXUS | IS300 (58 aut)
  - PEUGEOT | 206+ (58 aut)

Top 10 spoza EEA:

  - AUDI | 8V S3 SPORTBACK (21 aut)
  - BMW I |  (19 aut)
  - OPEL/CARPOL | VIVARO-B (16 aut)
  - DACIA | SD SANDERO (15 aut)
  -  | PASSAT (15 aut)
  -  | GOLF (14 aut)
  - TATA |  (12 aut)
  - AUDI | 8V A3 (10 aut)
  -  | ALFA GIULIETTA (7 aut)
  - SAM |  (6 aut)

Przykłady śmieci (słowa wyposażenia): ALFA ROMEO SPORT WAGON, AUDI A1 SPORT, AUDI A3 SPORT, AUDI A4 SPORT, AUDI A5 SPORT, AUDI A6 SPORT 40, AUDI Q2 SPORT, AUDI Q3 SPORT, AUDI Q5 SPORT, BMW 116D M SPORT, BMW 116D SPORT, BMW 116I SPORT
Przykłady duplikatów: C- ELYSEE / C-ELYSEE; 3008 / 3008 -

## V6a reguły deterministyczne, próg 10 tys.

- wierszy w słowniku: 1,577, modeli: 782
- pokrycie floty: **98.56%**
- niedopasowane, ale **są w EEA** (gubi czyszczenie): 1.27% floty
- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): 0.17% floty
- śmieci: duplikaty po spacjach 6, słowa wyposażenia 16, model = marka 0
- przypadki kontrolne (słownik): FIAT LINEA ✅, LEXUS NX200T ❌, LEXUS NX300 ❌
- przypadki kontrolne (nazwy z CEPiK): HYUNDAI | I30 CW ✅, SKODA | OCTAVIA COMBI ✅, SKODA | FABIA COMBI ✅, TOYOTA | COROLLA 1.4 KAT —, TOYOTA | YARIS HYBRID ✅, KIA | CEE'D ✅, OPEL | ASTRA+ ✅, FIAT | LINEA ✅, LEXUS | NX200T ❌, LEXUS | NX300 ❌, MAZDA | CX-5 ✅, HONDA | CR-V ✅, HYUNDAI | IX35 ✅, SUZUKI | GRAND VITARA ✅, NISSAN | X-TRAIL ✅, BMW | M135I ✅

Top 10 gubionych przez czyszczenie (są w EEA):

  - CHRYSLER | TOWN AND COUNTRY (134 aut)
  - LEXUS | NX200T (132 aut)
  - TOYOTA | SIENNA (100 aut)
  - LEXUS | NX300 (85 aut)
  - LEXUS | IS200T (85 aut)
  - MERCEDES-BENZ | E 180 (74 aut)
  - MAZDA | CX-9 (60 aut)
  - BMW | 520 (60 aut)
  - LEXUS | IS300 (58 aut)
  - LEXUS | IS250 (54 aut)

Top 10 spoza EEA:

  - AUDI | 8V S3 SPORTBACK (21 aut)
  - BMW I |  (19 aut)
  - OPEL/CARPOL | VIVARO-B (16 aut)
  - DACIA | SD SANDERO (15 aut)
  -  | PASSAT (15 aut)
  -  | GOLF (14 aut)
  - TATA |  (12 aut)
  - AUDI | 8V A3 (10 aut)
  -  | ALFA GIULIETTA (7 aut)
  - SAM |  (6 aut)

Przykłady śmieci (słowa wyposażenia): MERCEDES-BENZ A 45 AMG, MERCEDES-BENZ AMG 35, MERCEDES-BENZ AMG 45, MERCEDES-BENZ AMG C 43, MERCEDES-BENZ AMG C 63, MERCEDES-BENZ AMG CLA 35, MERCEDES-BENZ AMG CLA 45, MERCEDES-BENZ AMG E 53, MERCEDES-BENZ AMG E 63 S, MERCEDES-BENZ AMG G 63, MERCEDES-BENZ AMG GLC 43, MERCEDES-BENZ AMG GLE 43
Przykłady duplikatów: I5 EDRIVE 40 / I5 EDRIVE40; Z REIHE / ZREIHE; IX1 EDRIVE 20 / IX1 EDRIVE20; I X35 / IX35; I4 EDRIVE 40 / I4 EDRIVE40; GRAND VITARA / GRANDVITARA

## V6b reguły deterministyczne, próg 5 tys.

- wierszy w słowniku: 1,826, modeli: 988
- pokrycie floty: **98.97%**
- niedopasowane, ale **są w EEA** (gubi czyszczenie): 0.87% floty
- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): 0.16% floty
- śmieci: duplikaty po spacjach 12, słowa wyposażenia 31, model = marka 0
- przypadki kontrolne (słownik): FIAT LINEA ✅, LEXUS NX200T ✅, LEXUS NX300 ✅
- przypadki kontrolne (nazwy z CEPiK): HYUNDAI | I30 CW ✅, SKODA | OCTAVIA COMBI ✅, SKODA | FABIA COMBI ✅, TOYOTA | COROLLA 1.4 KAT —, TOYOTA | YARIS HYBRID ✅, KIA | CEE'D ✅, OPEL | ASTRA+ ✅, FIAT | LINEA ✅, LEXUS | NX200T ✅, LEXUS | NX300 ✅, MAZDA | CX-5 ✅, HONDA | CR-V ✅, HYUNDAI | IX35 ✅, SUZUKI | GRAND VITARA ✅, NISSAN | X-TRAIL ✅, BMW | M135I ✅

Top 10 gubionych przez czyszczenie (są w EEA):

  - CHRYSLER | TOWN AND COUNTRY (134 aut)
  - TOYOTA | SIENNA (100 aut)
  - LEXUS | IS200T (85 aut)
  - MERCEDES-BENZ | E 180 (74 aut)
  - MAZDA | CX-9 (60 aut)
  - BMW | 520 (60 aut)
  - LEXUS | IS300 (58 aut)
  - DODGE | GRAND CARAVAN (54 aut)
  - FORD | ESCAPE (49 aut)
  - CHRYSLER | TOWN & COUNTRY (49 aut)

Top 10 spoza EEA:

  - AUDI | 8V S3 SPORTBACK (21 aut)
  - BMW I |  (19 aut)
  - OPEL/CARPOL | VIVARO-B (16 aut)
  - DACIA | SD SANDERO (15 aut)
  -  | PASSAT (15 aut)
  -  | GOLF (14 aut)
  - TATA |  (12 aut)
  - AUDI | 8V A3 (10 aut)
  -  | ALFA GIULIETTA (7 aut)
  - SAM |  (6 aut)

Przykłady śmieci (słowa wyposażenia): ALFA ROMEO SPORT WAGON, MERCEDES-BENZ A 45 AMG, MERCEDES-BENZ AMG 35, MERCEDES-BENZ AMG 45, MERCEDES-BENZ AMG C 43, MERCEDES-BENZ AMG C 63, MERCEDES-BENZ AMG C63 S, MERCEDES-BENZ AMG CLA 35, MERCEDES-BENZ AMG CLA 45, MERCEDES-BENZ AMG CLE 53, MERCEDES-BENZ AMG E 43, MERCEDES-BENZ AMG E 53
Przykłady duplikatów: 4 0 / 40; I5 EDRIVE 40 / I5 EDRIVE40; Z REIHE / ZREIHE; M1 35I / M135I; M1 40I / M140I; 5ER GRAN TURISMO REIHE / 5ERGRANTURISMOREIHE; CX-5 / CX5; I4 EDRIVE 35 / I4 EDRIVE35

## V7a V6 + duplikaty, próg 10 tys.

- wierszy w słowniku: 1,577, modeli: 800
- pokrycie floty: **98.58%**
- niedopasowane, ale **są w EEA** (gubi czyszczenie): 1.25% floty
- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): 0.17% floty
- śmieci: duplikaty po spacjach 0, słowa wyposażenia 45, model = marka 0
- przypadki kontrolne (słownik): FIAT LINEA ✅, LEXUS NX200T ❌, LEXUS NX300 ❌
- przypadki kontrolne (nazwy z CEPiK): HYUNDAI | I30 CW ✅, SKODA | OCTAVIA COMBI ✅, SKODA | FABIA COMBI ✅, TOYOTA | COROLLA 1.4 KAT —, TOYOTA | YARIS HYBRID ✅, KIA | CEE'D ✅, OPEL | ASTRA+ ✅, FIAT | LINEA ✅, LEXUS | NX200T ❌, LEXUS | NX300 ❌, MAZDA | CX-5 ✅, HONDA | CR-V ✅, HYUNDAI | IX35 ✅, SUZUKI | GRAND VITARA ✅, NISSAN | X-TRAIL ✅, BMW | M135I ✅

Top 10 gubionych przez czyszczenie (są w EEA):

  - CHRYSLER | TOWN AND COUNTRY (134 aut)
  - LEXUS | NX200T (132 aut)
  - TOYOTA | SIENNA (100 aut)
  - LAND ROVER | RANGE ROVER VELAR (88 aut)
  - LEXUS | NX300 (85 aut)
  - LEXUS | IS200T (85 aut)
  - MERCEDES-BENZ | E 180 (74 aut)
  - MAZDA | CX-9 (60 aut)
  - BMW | 520 (60 aut)
  - LEXUS | IS300 (58 aut)

Top 10 spoza EEA:

  - AUDI | 8V S3 SPORTBACK (21 aut)
  - BMW I |  (19 aut)
  - OPEL/CARPOL | VIVARO-B (16 aut)
  - DACIA | SD SANDERO (15 aut)
  -  | PASSAT (15 aut)
  -  | GOLF (14 aut)
  - TATA |  (12 aut)
  - AUDI | 8V A3 (10 aut)
  -  | ALFA GIULIETTA (7 aut)
  - SAM |  (6 aut)

Przykłady śmieci (słowa wyposażenia): BMW 116D M SPORT, BMW 116D SPORT, BMW 116I SPORT, BMW 118D M SPORT, BMW 118D SPORT, BMW 118I M SPORT SHADOW, BMW 118I SPORT, BMW 120D M SPORT, BMW 218D M SPORT, BMW 218I M SPORT, BMW 218I SPORT, BMW 220D M SPORT
Przykłady duplikatów: 

## V7b V6 + duplikaty, próg 5 tys.

- wierszy w słowniku: 1,848, modeli: 1,028
- pokrycie floty: **98.98%**
- niedopasowane, ale **są w EEA** (gubi czyszczenie): 0.86% floty
- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): 0.16% floty
- śmieci: duplikaty po spacjach 0, słowa wyposażenia 71, model = marka 0
- przypadki kontrolne (słownik): FIAT LINEA ✅, LEXUS NX200T ❌, LEXUS NX300 ✅
- przypadki kontrolne (nazwy z CEPiK): HYUNDAI | I30 CW ✅, SKODA | OCTAVIA COMBI ✅, SKODA | FABIA COMBI ✅, TOYOTA | COROLLA 1.4 KAT —, TOYOTA | YARIS HYBRID ✅, KIA | CEE'D ✅, OPEL | ASTRA+ ✅, FIAT | LINEA ✅, LEXUS | NX200T ✅, LEXUS | NX300 ✅, MAZDA | CX-5 ✅, HONDA | CR-V ✅, HYUNDAI | IX35 ✅, SUZUKI | GRAND VITARA ✅, NISSAN | X-TRAIL ✅, BMW | M135I ✅

Top 10 gubionych przez czyszczenie (są w EEA):

  - CHRYSLER | TOWN AND COUNTRY (134 aut)
  - TOYOTA | SIENNA (100 aut)
  - LAND ROVER | RANGE ROVER VELAR (88 aut)
  - LEXUS | IS200T (85 aut)
  - MERCEDES-BENZ | E 180 (74 aut)
  - MAZDA | CX-9 (60 aut)
  - BMW | 520 (60 aut)
  - LEXUS | IS300 (58 aut)
  - PEUGEOT | 206+ (58 aut)
  - DODGE | GRAND CARAVAN (54 aut)

Top 10 spoza EEA:

  - AUDI | 8V S3 SPORTBACK (21 aut)
  - BMW I |  (19 aut)
  - OPEL/CARPOL | VIVARO-B (16 aut)
  - DACIA | SD SANDERO (15 aut)
  -  | PASSAT (15 aut)
  -  | GOLF (14 aut)
  - TATA |  (12 aut)
  - AUDI | 8V A3 (10 aut)
  -  | ALFA GIULIETTA (7 aut)
  - SAM |  (6 aut)

Przykłady śmieci (słowa wyposażenia): ALFA ROMEO SPORT WAGON, BMW 116D M SPORT, BMW 116D SPORT, BMW 116I SPORT, BMW 118D M SPORT, BMW 118D SPORT, BMW 118I M SPORT SHADOW, BMW 118I SPORT, BMW 120D M SPORT, BMW 120D SPORT, BMW 218D M SPORT, BMW 218D SPORT
Przykłady duplikatów: 

