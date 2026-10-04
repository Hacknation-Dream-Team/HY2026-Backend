"""TEST czyszczenia nazw aut (EEA -> car_models). Niczego nie zapisuje do bazy ani do data/.

Czyta: data/eea_raw.csv (surowe agregaty EEA), data/cepik/warszawa_osobowe_2022.csv (flota Warszawy).
Liczy w pamięci słownik dla kilku wariantów czyszczenia i porównuje je:
  1. pokrycie prawdziwej floty (CEPiK, rocznik >= 2010),
  2. niedopasowane modele CEPiK rozdzielone na: brak w EEA (spoza UE) / jest w EEA, gubi czyszczenie,
  3. śmieci w słowniku (duplikaty po spacjach, słowa wyposażenia, model = marka),
  4. przypadki kontrolne (Fiat Linea, Lexus NX200T / NX300).
Raport: docs/test_czyszczenia_raport.md
"""
import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import fetch_car_models as fcm  # obecne czyszczenie (nie modyfikujemy pliku, warianty tylko w pamięci)

ORIG_CLEAN = fcm.clean_model
ORIG_MODEL_MIN = fcm.MODEL_MIN  # aktualny próg ze skryptu
TRIM_WORDS = {"SE", "CVT", "AUTO", "TDI", "TSI", "CDI", "SPORT", "LUXURY", "PREMIUM", "EDITION", "HSE",
              "BLUETEC", "4MATIC", "XDRIVE", "SDRIVE", "QUATTRO", "TECH", "DYN", "AMG", "S-A", "KOMBI", "COMBI"}
CONTROL = [("FIAT", "LINEA"), ("LEXUS", "NX200T"), ("LEXUS", "NX300")]
# prawdziwe zapisy z CEPiK, które MUSZĄ się dopasować (każda znaleziona regresja trafia tutaj)
CONTROL_CEPIK = [("HYUNDAI", "I30 CW"), ("SKODA", "OCTAVIA COMBI"), ("SKODA", "FABIA COMBI"),
                 ("TOYOTA", "COROLLA 1.4 KAT"), ("TOYOTA", "YARIS HYBRID"), ("KIA", "CEE'D"),
                 ("OPEL", "ASTRA+"), ("FIAT", "LINEA"), ("LEXUS", "NX200T"), ("LEXUS", "NX300"),
                 ("MAZDA", "CX-5"), ("HONDA", "CR-V"), ("HYUNDAI", "IX35"), ("SUZUKI", "GRAND VITARA"),
                 ("NISSAN", "X-TRAIL"), ("BMW", "M135I")]


def clean_join_codes(brand, raw_brand, model):
    """Wariant: skleja kody typu 'NX 300H' -> 'NX300H', 'I 30' -> 'I30' (poza Mercedesem, gdzie celowo jest 'A 180')."""
    m = ORIG_CLEAN(brand, raw_brand, model)
    if brand != "MERCEDES-BENZ":
        m = re.sub(r"^([A-Z]{1,3}) (\d)", r"\1\2", m)
    return m


# słowa wyposażenia / napędu / skrzyni: ucinane z nazwy (nigdy pierwsze słowo).
# Celowo BEZ "SPORT", "COMBI", "KOMBI", "GT" itp., bo bywają częścią prawdziwej nazwy (DISCOVERY SPORT, OCTAVIA COMBI).
STRIP = {"AUTO", "S-A", "CVT", "DSG", "XDRIVE", "SDRIVE", "QUATTRO", "4MATIC", "4X4", "AWD", "FWD", "4WD",
         "TDI", "TSI", "TFSI", "CDI", "HDI", "CRDI", "DCI", "BLUETEC", "BLUEHDI", "ECOBOOST", "TDCI",
         "SE", "SEL", "LUXURY", "PREMIUM", "EDITION", "TECH", "DYN", "DYNAM", "HSE", "LIMITED", "CR", "A"}


def strip_trims(m):
    toks = m.split()
    return " ".join(toks[:1] + [t for t in toks[1:] if t not in STRIP])


def make_v4_clean(raw):
    """V4: obecne czyszczenie + ucinanie słów wyposażenia + sklejanie zapisów różniących się spacją/myślnikiem
    (np. X TRAIL / X-TRAIL, NX 300H / NX300H) do najczęstszej formy w EEA."""
    forms = defaultdict(float)
    for (mk, cn, ft), a in raw.items():
        if not mk or not cn:
            continue
        b = fcm.BRANDS.get(mk, mk)
        b = "VOLKSWAGEN" if b.startswith("VOLKSWAGEN") else b
        m = strip_trims(ORIG_CLEAN(b, mk, cn))
        forms[(b, re.sub(r"[\s\-]", "", m), m)] += a["n"]
    rep = {}
    for (b, key, m), n in sorted(forms.items(), key=lambda x: x[1]):
        rep[(b, key)] = m  # najczęstsza forma nadpisuje rzadsze

    def clean(brand, raw_brand, model):
        m = strip_trims(ORIG_CLEAN(brand, raw_brand, model))
        return rep.get((brand, re.sub(r"[\s\-]", "", m)), m)
    return clean


# V5: kody silników (Land Rover / Jaguar / BMW) i aliasy brytyjskich skrótów Land Rovera
ENGINE_CODE = re.compile(r"^(SDV\d|TDV\d|TD\d|SD\d|SI\d|[PD]\d{3}E?)$")
LR_ALIASES = [(r"^(R ROVER|RROVER|R-ROVER)\b", "RANGE ROVER"), (r"^DISCO-Y\b", "DISCOVERY")]


def strip_v5(brand, m):
    if brand == "LAND ROVER":
        for pat, rep in LR_ALIASES:
            m = re.sub(pat, rep, m)
    m = m.replace(" F SPORT", "")
    toks = m.split()
    toks = toks[:1] + [t for t in toks[1:] if t not in STRIP and t not in {"BLACK", "ABIO", "ABIOG"}
                       and not ENGINE_CODE.match(t)]
    return " ".join(toks)


def make_v5_clean(raw):
    """V5: jak V4, ale (a) przy sklejaniu wariantów wygrywa forma z największą liczbą odstępów
    (I30 CW, a nie I30CW — regresja z V4), (b) aliasy Land Rovera, (c) ucinanie kodów silników."""
    forms = defaultdict(float)
    for (mk, cn, ft), a in raw.items():
        if not mk or not cn:
            continue
        b = fcm.BRANDS.get(mk, mk)
        b = "VOLKSWAGEN" if b.startswith("VOLKSWAGEN") else b
        m = strip_v5(b, ORIG_CLEAN(b, mk, cn))
        forms[(b, re.sub(r"[\s\-]", "", m), m)] += a["n"]
    best = {}
    for (b, key, m), n in forms.items():
        score = (len(re.findall(r"[\s\-]", m)), n)  # najpierw więcej odstępów, potem częstość
        if (b, key) not in best or score > best[(b, key)][0]:
            best[(b, key)] = (score, m)
    rep = {k: m for k, (_, m) in best.items()}

    def clean(brand, raw_brand, model):
        m = strip_v5(brand, ORIG_CLEAN(brand, raw_brand, model))
        return rep.get((brand, re.sub(r"[\s\-]", "", m)), m)
    return clean


def norm_v6(brand, m):
    """Deterministyczny zapis: myślniki bez spacji wokół, bez wiszących '-', sklejone kody litery+cyfry
    (NX 300H -> NX300H, I 30 -> I30; Mercedes celowo zostaje 'A 180'). Osobnych słów NIE skleja (I30 CW)."""
    m = re.sub(r"\s*-\s*", "-", m).strip(" -")
    if brand != "MERCEDES-BENZ":
        m = re.sub(r"\b([A-Z]{1,3}) (\d)", r"\1\2", m)
    return re.sub(r"\s+", " ", m)


def make_v6_clean(raw):
    """V6: V5 bez złej reguły odstępów. Formy różniące się tylko myślnikiem/spacją (X TRAIL / X-TRAIL)
    sklejane do najczęstszej; formy różniące się podziałem na słowa (I30 CW / I30CW) zostają osobno."""
    forms = defaultdict(float)
    for (mk, cn, ft), a in raw.items():
        if not mk or not cn:
            continue
        b = fcm.BRANDS.get(mk, mk)
        b = "VOLKSWAGEN" if b.startswith("VOLKSWAGEN") else b
        m = norm_v6(b, strip_v5(b, ORIG_CLEAN(b, mk, cn)))
        forms[(b, m.replace("-", " "), m)] += a["n"]
    rep = {}
    for (b, key, m), n in sorted(forms.items(), key=lambda x: x[1]):
        rep[(b, key)] = m

    def clean(brand, raw_brand, model):
        m = norm_v6(brand, strip_v5(brand, ORIG_CLEAN(brand, raw_brand, model)))
        return rep.get((brand, m.replace("-", " ")), m)
    return clean


def norm_v7(brand, m):
    """V6 + wąskie sklejanie kodów rozbitych spacją (przed wyborem formy, żeby nie powtórzyć regresji z V5)."""
    m = norm_v6(brand, m)
    m = re.sub(r"\b([A-Z]) ([A-Z]\d)", r"\1\2", m)       # I X35 -> IX35
    m = re.sub(r"^(\d) (\d)$", r"\1\2", m)                # 4 0 -> 40
    m = re.sub(r"\b([EXS]DRIVE) (\d)", r"\1\2", m)        # EDRIVE 40 -> EDRIVE40
    if brand == "BMW":
        m = re.sub(r"^M(\d) (\d{2}[A-Z])", r"M\1\2", m)   # M1 35I -> M135I (tylko BMW, Audi 'A6 40' zostaje)
    return m


def make_v7_clean(raw):
    """V7: formy o tym samym zapisie bez odstępów (GRANDVITARA / GRAND VITARA, CX5 / CX-5) sklejane do formy
    z największą liczbą odstępów, przy remisie do najczęstszej. Bezpieczne, bo kody są już sklejone w norm_v7."""
    forms = defaultdict(float)
    for (mk, cn, ft), a in raw.items():
        if not mk or not cn:
            continue
        b = fcm.BRANDS.get(mk, mk)
        b = "VOLKSWAGEN" if b.startswith("VOLKSWAGEN") else b
        m = norm_v7(b, strip_v5(b, ORIG_CLEAN(b, mk, cn)))
        forms[(b, re.sub(r"[\s\-]", "", m), m)] += a["n"]
    best = {}
    for (b, key, m), n in forms.items():
        score = (len(re.findall(r"[\s\-]", m)), n)
        if (b, key) not in best or score > best[(b, key)][0]:
            best[(b, key)] = (score, m)
    rep = {k: m for k, (_, m) in best.items()}

    def clean(brand, raw_brand, model):
        m = norm_v7(brand, strip_v5(brand, ORIG_CLEAN(brand, raw_brand, model)))
        return rep.get((brand, re.sub(r"[\s\-]", "", m)), m)
    return clean


def variants(raw):
    v4 = make_v4_clean(raw)
    v5 = make_v5_clean(raw)
    v6 = make_v6_clean(raw)
    v7 = make_v7_clean(raw)
    return {
        "V0 obecne (próg modelu 20 tys.)": dict(MODEL_MIN=20_000, clean=ORIG_CLEAN),
        "V1 próg 10 tys.": dict(MODEL_MIN=10_000, clean=ORIG_CLEAN),
        "V2 próg 5 tys.": dict(MODEL_MIN=5_000, clean=ORIG_CLEAN),
        "V3 próg 5 tys. + sklejanie kodów": dict(MODEL_MIN=5_000, clean=clean_join_codes),
        "V4a reguły na śmieci, próg 10 tys.": dict(MODEL_MIN=10_000, clean=v4),
        "V4b reguły na śmieci, próg 5 tys.": dict(MODEL_MIN=5_000, clean=v4),
        "V5a V4 + poprawki, próg 10 tys.": dict(MODEL_MIN=10_000, clean=v5),
        "V5b V4 + poprawki, próg 5 tys.": dict(MODEL_MIN=5_000, clean=v5),
        "V6a reguły deterministyczne, próg 10 tys.": dict(MODEL_MIN=10_000, clean=v6),
        "V6b reguły deterministyczne, próg 5 tys.": dict(MODEL_MIN=5_000, clean=v6),
        "V7a V6 + duplikaty, próg 10 tys.": dict(MODEL_MIN=10_000, clean=v7),
        "V7b V6 + duplikaty, próg 5 tys.": dict(MODEL_MIN=5_000, clean=v7),
    }


def load_eea_raw():
    raw = defaultdict(lambda: defaultdict(float))
    with (ROOT / "data/eea_raw.csv").open(encoding="utf-8") as f:
        for r in csv.DictReader(f):
            key = (r["mk"] or "", r["cn"] or "", r["ft"] or "")
            for k in ("n", "n_fc", "fc_sum", "n_co2", "co2_sum", "n_z", "z_sum"):
                raw[key][k] += float(r[k] or 0)
    return raw


def build_dictionary(raw, variant):
    """Odtwarza main() z fetch_car_models.py w pamięci: normalize + progi końcowe."""
    fcm.MODEL_MIN, fcm.clean_model = variant["MODEL_MIN"], variant["clean"]
    try:
        acc = fcm.normalize(raw)
    finally:
        fcm.MODEL_MIN, fcm.clean_model = ORIG_MODEL_MIN, ORIG_CLEAN
    out = set()
    for (brand, model, fuel), a in acc.items():
        if a["n"] < fcm.MIN_CARS or a["n_co2"] == 0:
            continue
        if fuel == "ELECTRIC" and a["co2_sum"] / a["n_co2"] >= 1:
            continue
        out.add((brand, model, fuel))
    return out


def eea_names_by_brand(raw, clean):
    """Wszystkie nazwy z EEA po czyszczeniu tekstu, ale PRZED progami: czy model w ogóle występuje w EEA."""
    names = defaultdict(set)
    for (mk, cn, ft) in raw:
        if not mk or not cn:
            continue
        b = fcm.BRANDS.get(mk, mk)
        b = "VOLKSWAGEN" if b.startswith("VOLKSWAGEN") else b
        names[b].add(clean(b, mk, cn))
    return names


def load_cepik():
    rows = defaultdict(int)
    with (ROOT / "data/cepik/warszawa_osobowe_2022.csv").open(encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["wyrejestrowany"] != "0":
                continue
            try:
                if int(r["rok_produkcji"]) < 2010:
                    continue
            except ValueError:
                continue
            rows[(r["marka"].upper().strip(), r["model"].upper().strip())] += 1
    return rows


def match_cepik(cepik, dictionary, clean):
    brands = {b for b, _, _ in dictionary}
    models = defaultdict(set)
    for b, m, _ in dictionary:
        models[b].add(m)
    models = {b: sorted(ms, key=len) for b, ms in models.items()}

    def brand(mk):
        b = fcm.BRANDS.get(mk, mk)
        b = "VOLKSWAGEN" if b.startswith("VOLKSWAGEN") else b
        if b in brands:
            return b
        return next((c for c in sorted(brands, key=len) if fcm.starts_with_word(b, c)), "")

    res = {}
    for (mk, md), n in cepik.items():
        b = brand(mk)
        m_clean = clean(b, mk, md) if b else ""
        m_clean = fcm.MODEL_FIX.get((b, m_clean), m_clean) or ""
        hit = next((c for c in models.get(b, []) if fcm.starts_with_word(m_clean, c)), "") if b else ""
        res[(mk, md)] = (b, m_clean, hit, n)
    return res


def junk(dictionary, clean_dups=True):
    models = {(b, m) for b, m, _ in dictionary}
    by_key = defaultdict(set)
    for b, m in models:
        by_key[(b, re.sub(r"[\s\-./']", "", m))].add(m)
    dups = sorted(v for v in by_key.values() if len(v) > 1)
    trims = sorted(f"{b} {m}" for b, m in models if TRIM_WORDS & set(m.split()))
    same = sorted(f"{b} {m}" for b, m in models if m == b)
    return len(models), dups, trims, same


def main():
    raw = load_eea_raw()
    cepik = load_cepik()
    total = sum(cepik.values())
    lines = ["# Test czyszczenia nazw aut (EEA → `car_models`)", "",
             f"Flota odniesienia: CEPiK, Warszawa, osobowe zarejestrowane, rocznik ≥ 2010: **{total:,} aut**.", "",
             "Niczego nie zapisano do bazy ani do `data/`; warianty liczone w pamięci.", ""]
    summary = []
    for name, v in variants(raw).items():
        d = build_dictionary(raw, v)
        eea = eea_names_by_brand(raw, v["clean"])
        res = match_cepik(cepik, d, v["clean"])
        matched = sum(n for (_, _, hit, n) in res.values() if hit)
        unmatched = [(mk, md, b, mc, n) for (mk, md), (b, mc, hit, n) in res.items() if not hit]
        def raw_brand(mk):  # marka niezależna od tego, co przeszło przez czyszczenie
            b = fcm.BRANDS.get(mk, mk)
            return "VOLKSWAGEN" if b.startswith("VOLKSWAGEN") else b

        def present_in_eea(mk, md):
            b = raw_brand(mk)
            m = v["clean"](b, mk, md) if b else ""
            return bool(b and m) and any(e == m or fcm.starts_with_word(e, m) for e in eea.get(b, ()))

        in_eea = [u for u in unmatched if present_in_eea(u[0], u[1])]
        not_eea = [u for u in unmatched if u not in in_eea]
        n_models, dups, trims, same = junk(d)
        ctrl = {f"{b} {m}": any(bb == b and mm == m for bb, mm, _ in d) for b, m in CONTROL}
        # None = takiej nazwy nie ma w danych (rocznik >= 2010) -> przypadek nieważny, nie porażka
        ctrl_cepik = {f"{mk} | {md}": (bool(res[(mk, md)][2]) if (mk, md) in res else None) for mk, md in CONTROL_CEPIK}
        summary.append((name, len(d), n_models, matched / total, sum(u[4] for u in in_eea) / total,
                        sum(u[4] for u in not_eea) / total, len(dups), len(trims), len(same), ctrl, ctrl_cepik))
        lines += [f"## {name}", "",
                  f"- wierszy w słowniku: {len(d):,}, modeli: {n_models:,}",
                  f"- pokrycie floty: **{matched / total:.2%}**",
                  f"- niedopasowane, ale **są w EEA** (gubi czyszczenie): {sum(u[4] for u in in_eea) / total:.2%} floty",
                  f"- niedopasowane, **brak w EEA** (spoza UE / spoza zakresu): {sum(u[4] for u in not_eea) / total:.2%} floty",
                  f"- śmieci: duplikaty po spacjach {len(dups)}, słowa wyposażenia {len(trims)}, model = marka {len(same)}",
                  f"- przypadki kontrolne (słownik): " + ", ".join(f"{k} {'✅' if ok else '❌'}" for k, ok in ctrl.items()),
                  f"- przypadki kontrolne (nazwy z CEPiK): " + ", ".join(f"{k} {'—' if ok is None else '✅' if ok else '❌'}" for k, ok in ctrl_cepik.items()), "",
                  "Top 10 gubionych przez czyszczenie (są w EEA):", ""]
        lines += [f"  - {mk} | {md} ({n} aut)" for mk, md, _, _, n in sorted(in_eea, key=lambda u: -u[4])[:10]]
        lines += ["", "Top 10 spoza EEA:", ""]
        lines += [f"  - {mk} | {md} ({n} aut)" for mk, md, _, _, n in sorted(not_eea, key=lambda u: -u[4])[:10]]
        lines += ["", "Przykłady śmieci (słowa wyposażenia): " + ", ".join(trims[:12]),
                  "Przykłady duplikatów: " + "; ".join(" / ".join(sorted(x)) for x in dups[:8]), ""]
    lines[6:6] = ["## Podsumowanie", "",
                  "| wariant | modeli | pokrycie floty | gubi czyszczenie | spoza EEA | duplikaty | słowa wyposażenia | kontrolne słownik | kontrolne CEPiK |",
                  "|---|---|---|---|---|---|---|---|---|"] + [
        f"| {s[0]} | {s[2]} | {s[3]:.2%} | {s[4]:.2%} | {s[5]:.2%} | {s[6]} | {s[7]} | "
        f"{sum(s[9].values())}/{len(s[9])} | {sum(1 for x in s[10].values() if x)}/{sum(1 for x in s[10].values() if x is not None)} |"
        for s in summary] + ["", "Kontrolne CEPiK liczone tylko dla nazw, które występują w danych (rocznik ≥ 2010).", ""]
    out = ROOT / "docs/test_czyszczenia_raport.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[6:6 + 4 + len(summary)]))
    print(f"\nraport: {out}")


if __name__ == "__main__":
    main()
