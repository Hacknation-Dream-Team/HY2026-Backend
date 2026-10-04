# Commute Together (HY2026)

Nowoczesna platforma do współdzielenia przejazdów (carpooling), łącząca kierowców i pasażerów w celu optymalizacji dojazdów (np. do pracy, tzw. BBP).

Wykorzystane technologie

Frontend
- React - biblioteka do budowy interfejsów użytkownika.
- TypeScript - statycznie typowany superset języka JavaScript, zapewniający bezpieczeństwo i czytelność kodu.
- Vite - superszybkie narzędzie do budowania i serwowania aplikacji frontowej.
- Lucide React - zbiór nowoczesnych ikon wykorzystywanych w UI.
- PWA (Progressive Web App) - wsparcie dla instalacji aplikacji offline (Service Workers).

Backend
- C# & ASP.NET Core - solidne i wydajne środowisko serwerowe realizujące architekturę REST API.
- Entity Framework Core - ORM wykorzystywany do mapowania obiektowo-relacyjnego i obsługi bazy danych.
- OSRM (Open Source Routing Machine) - potężny silnik do wyznaczania tras geograficznych, wykorzystywany do obliczania optymalnych dróg pomiędzy punktami.
- SignalR - mechanizmy komunikacji w czasie rzeczywistym.

---

Podczas prac nad projektem oraz w jego strukturze wspierano modelami sztucznej inteligencji, w tym:

- Gemini Pro 3.1
- Flash 3.6
- Flash 3.7
- Flash 3.8
- Gemini Omni 1.1 Flash
- Sonet 5.5
- Fade 5.1

# Instrukcja uruchomienia w środowisku lokalnym

### 1. Baza danych (PostgreSQL)

```bash
docker run -d --name hy2026-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=neondb -p 5432:5432 postgis/postgis:latest
```

---

### 2. Backend (.NET)

W pliku [Backend/appsettings.json](file:///home/a15/programing/HackYeah2026/HY2026-Backend/Backend/appsettings.json) ustaw połączenie do lokalnej bazy w `DefaultConnection`:
```json
"DefaultConnection": "Host=localhost;Port=5432;Database=neondb;Username=postgres;Password=postgres"
```

Uruchomienie backendu:
```bash
cd Backend
dotnet run
```

---

### 3. Frontend (React / Vite)

```bash
cd frontend
npm install
npm run dev
```