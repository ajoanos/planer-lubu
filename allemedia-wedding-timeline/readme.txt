=== Allemedia Wedding Timeline ===
Contributors: allemedia
Tags: wedding, timeline, planner, live, ics
Requires at least: 6.0
Tested up to: 6.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Generator harmonogramu dnia ślubu z trybem LIVE, eksportem ICS, drukiem i publicznym linkiem z QR.

== Instalacja ==
1. Skopiuj folder `allemedia-wedding-timeline` do katalogu `wp-content/plugins/`.
2. Włącz plugin w panelu WordPress.
3. Przejdź do "Wedding Timeline" w menu administratora.
4. Użyj przycisku "Załaduj demo", aby wczytać przykładowy harmonogram z Oazy Leńcze.

== Użytkowanie ==
* Kreator (3 kroki) pozwala zdefiniować typ ceremonii, lokalizacje i styl dnia.
* Edytor oferuje oś pionową, swimlane'y ról, zegar kołowy SVG oraz tryb LIVE z przesunięciami +5/+15/+30 minut.
* Eksport ICS dostępny jest z poziomu panelu oraz przez przycisk REST (`POST /allemedia/v1/timelines/{id}/export/ics`).
* Drukuj widok w dwóch wariantach (Goście/Ekipa) – wykorzystaj przyciski drukowania.
* Publiczny link generowany jest z parametrem `?t={publicId}`; na stronie widoku publicznego pojawia się kod QR do zeskanowania.
* Komentarze wymagają PIN-u (4–6 cyfr) – dostępne są w publicznym widoku po podaniu PIN-u.

== Shortcode ==
`[allemedia_timeline id="123" view="editor" print="guest"]`
* `view="editor"` – pełny edytor (wymaga zalogowania i uprawnień edycji).
* `view="public"` – widok tylko-do-odczytu. Użyj z publicznym parametrem `?t=PUBLICID`.
* `print="guest|crew"` – domyślny wariant stylów drukowania.

== REST API ==
* `POST /allemedia/v1/timelines` – tworzenie nowego timeline (JSON payload). Wymaga `X-WP-Nonce`.
* `GET /allemedia/v1/timelines/{id}` – pobranie timeline (admin).
* `PUT /allemedia/v1/timelines/{id}` – aktualizacja timeline.
* `POST /allemedia/v1/timelines/{id}/export/ics` – generowanie ICS.
* `GET /allemedia/v1/public/{publicId}` – publiczny odczyt timeline (brak auth).
* `POST /allemedia/v1/public/{publicId}/comments` – dodanie komentarza (PIN w payloadzie).

== Tryb LIVE ==
Wybierz wydarzenie i użyj przycisków +5/+15/+30. System przesuwa wskazany event i wszystkie kolejne (z pominięciem wydarzeń oznaczonych jako "fixed"). Historia pokazuje, ile minut temu zapisano zmiany.

== Eksport i druk ==
* ICS – zgodny z Google/Apple/Outlook (UID, LOCATION, DESCRIPTION, VALARM -30 min).
* Druk – 1 strona A4, klasy `print-guest` / `print-crew` aktywują dedykowane style.

== Publiczny link i QR ==
* Dla udostępnionego timeline'u użyj parametru `?t=` w URL.
* Plugin generuje kod QR (SVG) z docelowym adresem. Zeskanuj, aby otworzyć harmonogram w trybie tylko-do-odczytu.

== Przykłady cURL ==
```
curl -X POST \
  -H "X-WP-Nonce: <nonce>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Timeline Ania&Jan","events":[]}' \
  https://twojadomena.pl/wp-json/allemedia/v1/timelines
```

```
curl https://twojadomena.pl/wp-json/allemedia/v1/public/PUBLIC123
```

== Ograniczenia i TODO ==
* Przybliżony algorytm golden/blue hour – do zastąpienia dokładniejszym rozwiązaniem.
* Brak integracji z mapami – ETA i kilometry wprowadź ręcznie.
* Eksport XLSX/CSV – planowane jako rozszerzenie.
