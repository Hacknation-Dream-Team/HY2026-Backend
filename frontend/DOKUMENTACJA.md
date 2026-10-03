# Dokumentacja Projektu - Frontend (Hacknation Dream Team)

## Architektura i Główne Założenia
Projekt został zbudowany z wykorzystaniem **React** (z TypeScript) oraz narzędzia **Vite**. Aplikacja jest przystosowana do działania jako PWA (Progressive Web App).

W najnowszej aktualizacji kod został znacząco uproszczony i zmodularyzowany, wprowadzając czytelny podział na główne widoki w ramach dolnego paska nawigacji (Bottom Navigation).

## Struktura Katalogów i Plików
- `src/App.tsx` - Główny komponent ładujący strukturę aplikacji.
- `src/Wizard.tsx` - Rozbudowany kreator onboardingu użytkownika (rejestracja, rola, auto, harmonogram).
- `src/MainView.tsx` - Główny widok po zalogowaniu, pełniący rolę menedżera zakładek (Odkryj, Chaty, Profil).
- `src/views/DiscoverView.tsx` - Zakładka "Odkryj". Odpowiada za zarządzanie przejazdami z perspektywy Kierowcy oraz Pasażera.
- `src/views/ChatsView.tsx` - Zakładka "Chaty". Zawiera listę konwersacji oraz widok szczegółowy chatu (informacje o przejeździe, dacie, trasie i rozmówcy).
- `src/views/ProfileView.tsx` - Zakładka "Profil". Wyświetla podstawowe dane użytkownika oraz opcje ustawień/wylogowania.

## Funkcjonalności

### 1. Nawigacja Dolna (Bottom Navigation)
- **Odkryj:** Główny hub dla planowania podróży.
- **Chaty:** Komunikacja z użytkownikami.
- **Profil:** Zarządzanie kontem.

### 2. Widok "Odkryj"
Podzielony na dwie zakładki na górze ekranu:
- **Kierowca (Driver):** 
  - Wyświetla zaplanowane cykle przejazdów (np. Poniedziałek - Piątek).
  - Umożliwia odwołanie całego cyklu.
  - Umożliwia odwołanie pojedynczego przejazdu w danym dniu.
  - Pozwala na ogłoszenie nowego przejazdu (formularz).
- **Pasażer (Passenger):**
  - Wyszukiwarka przejazdów (skąd, dokąd).
  - Integracja z API w celu pobierania i wyświetlania dopasowanych tras, kierowców i godzin.
  - Przekierowanie do chatu z wybranym kierowcą po kliknięciu.

### 3. Widok "Chaty"
- Przegląd wszystkich aktywnych konwersacji.
- **Szczegóły chatu:** 
  - Oprócz wymiany wiadomości, ekran udostępnia kartę z kluczowymi informacjami: konto osoby, rola, data przejazdu, trasa oraz godziny odjazdu/przyjazdu.

### 4. Widok "Profil"
- Podgląd zdjęcia profilowego, imienia, adresu e-mail i numeru telefonu.
- Przyciski ustawień i wylogowania.

## UI/UX
- Zastosowano ikony z biblioteki `lucide-react`.
- Responsywny design dostosowany do urządzeń mobilnych.
- Czytelne karty (cards), zaokrąglone rogi i subtelne cienie poprawiające czytelność interfejsu.
