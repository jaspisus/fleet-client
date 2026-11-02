# Stack technologiczny — Panel floty

## Core

- **React 19** i **TypeScript**: biblioteka UI i typowanie całej aplikacji.
- **Vite**: dev server i build.

## Stan i dane

- **Zustand**: stan klienta (np. wybrany pojazd współdzielony przez listę i mapę, pozycje z LiveTrack).
- **TanStack Query**: pobieranie i cache danych z REST API (pojazdy, kierowcy, floty, słowniki) oraz mutacje (`PUT /api/vehicles/{id}`).

## Routing, tabela, formularze

- **TanStack Router**: typowany routing między widokami (tabela pojazdów, mapa).
- **TanStack Table**: tabela pojazdów.
- **TanStack Form**: formularz edycji pojazdu z walidacją.

## Testy

- **Vitest**: testy jednostkowe i komponentów.
- **Visual regression testing**: testy wizualne kluczowych widoków.

## Kompilacja i architektura

- **React Compiler**: automatyczna memoizacja komponentów.
- **Feature-Sliced Design**: struktura katalogów i podział kodu na warstwy (`app`, `pages`, `widgets`, `features`, `entities`, `shared`).
