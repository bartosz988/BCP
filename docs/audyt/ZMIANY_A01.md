# Zmiany względem 8da9a5d po audycie IBCP-A01

Gałąź: `poprawki-audyt-8da9a5d`. Kryterium odbioru: `node --test` (9 testów autora dostosowanych do AUD-001 + 18 testów regresyjnych z audytu), wynik 27/27, oraz scenariusz Playwright opisany niżej.

| ID | Status | Co zmieniono |
|---|---|---|
| AUD-001 | zamknięte w demo | Deklaracja i zmiana mają `transmission: new/sent`. Eksport TU obejmuje przystąpienia, zmiany wariantu i rezygnacje; wynik TU (`confirm`, `confirmChange`) tylko dla pozycji przekazanych. W kadrach przyciski symulacji TU nieaktywne przed eksportem. |
| AUD-002 | zamknięte | Po odrzuceniu lub zakończeniu ochrony nowa wersja deklaracji (`previousId`), przycisk „Popraw i złóż ponownie” / „Dołącz ponownie”. Zaproszenia rodziny nieaktywne przy odrzuconej lub zakończonej deklaracji płatnika. |
| AUD-003 | zamknięte | `currentState()` i `planAt()` w `core.mjs`; wszystkie widoki i `requestChange` używają wariantu obowiązującego. `r.planId` zostaje jako zapis z chwili złożenia. |
| AUD-004 | zamknięte | Status „Zakończona od …”, brak zmian po rezygnacji, rezygnacja płatnika tworzy jawne zmiany `cancel` (`payer_ended`) dla rodziny, przekazywane do TU. |
| AUD-005 | zamknięte | Zmiana wariantu kasuje zgodę na potrącenie; deklaracja zapisuje `payrollAmount`, `payrollPlanId`, `docVersion`. |
| AUD-006 | zamknięte w demo; pilot otwarty | Deklaracja rodziny zapisuje oświadczenia (`adult`, `docs`, `docVersion`, czas). Osobne konto członka rodziny wymaga backendu. |
| AUD-007 | zamknięte | Licznik wersji stanu (`rev`) i nasłuch `storage`; druga karta nie nadpisuje danych. |
| AUD-008 | zamknięte | Trzy powody odrzucenia. |
| AUD-009 | zamknięte | Format `IBCP-TU-DEMO-v2`: typ zdarzenia, pracodawca, nr kadrowy płatnika, relacja; brak `ME`; brak powtórzeń; nazwa pliku TU bez okresu. |
| AUD-010 | zamknięte | Historia płatnika obejmuje deklaracje i zmiany rodziny; data, godzina i aktor zdarzenia. |
| AUD-011 | zamknięte | Mianownik z `EMPLOYER.eligible`, licznik po pracodawcy, daty w plakietkach z rekordu, nazwiska w zmianach z rekordu, plakietka „w toku” w magencie (token `status-attention`). |
| AUD-012 | zamknięte | `audit.regression.test.mjs`; test mutacyjny: 10 z 12 mutacji wykrytych (M6 równoważna po zmianie modelu). |
| AUD-013 | częściowo | Identyfikatory z maksimum numerów zamiast długości tablicy, zmiany sortowane po dacie skuteczności. Stałe daty programu zostają (demo). |
| AUD-014 | otwarte | Decyzja Bartosza: „PZU” w wersji publicznej. |
| AUD-015 | demo zamknięte; model otwarty | Encja Ubezpieczający w `architecture.html` do dopisania. |
| AUD-016 | otwarte | Wymaga kancelarii; zmiany w modelu i ścieżce po decyzji. |
| AUD-017 | otwarte | Utrzymanie, DPA, raporty bezpieczeństwa dostawców. |
| AUD-018 | zamknięte | `strong` 600. |

Zmiana schematu stanu w przeglądarce: `schema: 2`. Stary zapis z wersji 8da9a5d jest pomijany i demo startuje od danych początkowych.

Scenariusz Playwright (Chromium, 1280 i 320 px), wynik bez błędów konsoli: przystąpienie z zmianą wariantu po zgodzie, próba decyzji TU przed eksportem (zablokowana), eksport, przyjęcie, ponowny eksport (brak pozycji), rodzina, zmiana wariantu na Podstawowy (60 zł w „Mój program”, tabeli kadr i liście płac), rezygnacja z automatycznym zakończeniem ochrony rodziny, odrzucenie i ponowne złożenie, dwie karty.
