## Panel floty

Zbuduj małą aplikację dla dyspozytora floty pojazdów. Ma dwa widoki: tabelę pojazdów, w której można edytować pojazd, i mapę, na której pojazdy jeżdżą na żywo.

| Dostajesz | Piszesz | Oddajesz |
|---|---|---|
| Serwer z danymi (`fleet-api`) i opis jego API (`API.pdf`). | Cały frontend, zaczynając od pustego folderu. | Kod z testami i plikiem README. |

## Zanim zaczniesz

1. Zainstaluj Node.js w wersji 22 lub nowszej.
2. Uruchom serwer: w folderze `fleet-api` wpisz `npm install`, a potem `npm start`.
3. Serwer działa pod adresem `http://localhost:4000`. Wszystko o jego API jest w `API.pdf`.

## Co ma umieć aplikacja

### Część 1 – Pojazdy

- Pokazuje pojazdy w tabeli.
- Pozwala edytować pojazd w formularzu i zapisać zmiany.

### Część 2 – Mapa

- Po lewej lista pojazdów, obok mapa, na której widać, jak pojazdy się poruszają, na żywo.
- Lista i mapa są połączone: pojazd wybrany na liście jest wybrany na mapie i odwrotnie.

## Technologie

React i TypeScript. Mapa w MapLibre GL JS, bezpośrednio albo przez wrapper dla Reacta (np. `react-map-gl`). Resztę wybierz według uznania.

Możesz użyć darmowego stylu mapy, który nie wymaga klucza: <https://tiles.openfreemap.org/styles/liberty>. Pojazdy jeżdżą po Trójmieście.

## Co oddajesz

Kod z testami tego, co uważasz za najważniejsze, w repozytorium (np. GitHub) albo w archiwum ZIP. Odeślij go w odpowiedzi na wiadomość z zadaniem.

**README:** jak uruchomić aplikację i testy, jakie decyzje podjęto i dlaczego, co jeszcze warto zrobić. Jeśli coś w zadaniu jest niejasne, przyjmij rozsądne założenie i zapisz je tutaj.
