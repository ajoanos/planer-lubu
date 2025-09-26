=== Allemedia Wedding Timeline ===
Contributors: allemedia
Tags: wedding, timeline, planner
Requires at least: 6.2
Tested up to: 6.4
Requires PHP: 8.0
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

== Opis ==
Wtyczka tworzy zaawansowany harmonogram dnia ślubu z wizualizacjami (oś czasu, zegar kołowy, swimlane'y), eksportem do kalendarzy (ICS), trybem LIVE oraz publicznym udostępnieniem (link/QR). Kod frontendowy napisany jest w TypeScript + React i budowany przez Vite.

== Instalacja ==
1. Sklonuj lub skopiuj katalog `allemedia-wedding-timeline` do `wp-content/plugins/`.
2. W katalogu wtyczki uruchom `npm install`, a następnie `npm run build`, aby wygenerować bundel frontendu.
3. W panelu WordPressa aktywuj wtyczkę **Allemedia Wedding Timeline**.
4. Przejdź do menu "Wedding Timeline" w panelu, aby uruchomić kreator.

== Użycie ==
* Utwórz nowy harmonogram lub użyj przycisku "Załaduj demo".
* Dziel się harmonogramem poprzez publiczny link i kod QR.
* Eksportuj wydarzenia do ICS lub drukuj widok PDF dla gości/ekipy.

== REST API ==
* `POST /allemedia/v1/timelines` – tworzenie timeline'u (parametr `demo` = true tworzy przykładowy plan).
* `GET /allemedia/v1/timelines/{id}` – pobranie timeline'u.
* `PUT /allemedia/v1/timelines/{id}` – aktualizacja timeline'u.
* `POST /allemedia/v1/timelines/{id}/export/ics` – wygenerowanie pliku ICS (zwracany jako base64).
* `GET /allemedia/v1/public/{publicId}` – publiczny odczyt.
* `POST /allemedia/v1/public/{publicId}/comments` – dodanie komentarza po PIN.

== Testy ==
Uruchom `npm test`, aby wykonać testy jednostkowe funkcji pomocniczych (bufory, kolizje, opóźnienia, ICS).

== Znane ograniczenia ==
* Generator QR jest uproszczony (pseudo-QR) i wymaga zamiany na pełną implementację standardu.
* Algorytm złotej/niebieskiej godziny to aproksymacja; zalecana integracja z dokładną biblioteką astronomiczną.
* Eksport PDF bazuje na `window.print()` – w przyszłości można dodać generowanie serwerowe.

== TODO ==
* Integracja precyzyjnych obliczeń pozycji słońca.
* Synchronizacja z Google Maps API dla realnych czasów przejazdu.
* Eksport do formatu XLSX / CSV.
* Pełny generator QR zgodny z normą ISO/IEC 18004.
