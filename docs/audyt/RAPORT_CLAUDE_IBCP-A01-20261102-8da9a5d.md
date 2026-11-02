# RAPORT CLAUDE'A: IBCP-A01-20261102-8da9a5d

Wersja kodu: 8da9a5dd20a6bcc509fc93750a5c95ba8b981a09 (21 plików, sumy SHA-256 zgodne z MANIFEST.json; sprawdzone)
Data audytu: 02.11.2026
Audytor: Claude (niezależny od wykonawcy). Raport Codex traktowałem jako materiał wejściowy, nie jako dowód.

## Werdykt

**Do pokazu nadaje się:** ścieżka pracownika do złożenia deklaracji, porównanie wariantów, zaproszenie rodziny, panel kadr na dane listopad/grudzień, lista płac z rozbiciem na składkę własną i rodziny, uczciwe oznaczenia symulacji. Wygląd zgodny z księgą znaku 1.1 w sprawdzonych punktach. Aplikacja nie wysyła żadnych żądań poza własny serwer (sprawdzone w przeglądarce), więc dane wpisane w publicznym demo nie opuszczają urządzenia.

**Do poprawy w demo przed pokazem Klientowi:** wszystko, co dzieje się po przyjęciu deklaracji. Po zmianie wariantu aplikacja pokazuje stary wariant i starą kwotę (AUD-003). Po rezygnacji osoba nadal widnieje jako „Przyjęta”, a przyciski zmiany i rezygnacji działają dalej (AUD-004). Po odrzuceniu przez TU pracownik nie ma drogi do korekty (AUD-002). Zmiany i rezygnacje nigdy nie trafiają do eksportu TU, a TU „potwierdza” rzeczy, których nie otrzymało (AUD-001). Kadrowa osoba, która przetestuje demo dłużej niż pięć minut, trafi na co najmniej jeden z tych błędów.

**Blokuje pilot z prawdziwymi danymi:** brak backendu, uwierzytelniania, uprawnień i dziennika (znane i opisane przez wykonawcę), a ponadto: logika `core.mjs` nie realizuje modelu z `architecture.html` (status deklaracji = status ochrony, brak pozycji eksportu), brak zapisu oświadczeń członka rodziny i dowodu doręczenia warunków (AUD-006, AUD-016), brak encji Ubezpieczający odrębnej od Pracodawcy (AUD-015), brak wskazanego opiekuna technicznego dla stacku Next.js + Supabase + Render (AUD-017).

**Testy:** 9 testów autora przechodzi, ale 7 z 10 celowo wprowadzonych błędów w `core.mjs` przechodzi przez ten zestaw niezauważonych (AUD-012). Dołączam 17 testów regresyjnych; 13 z nich dziś nie przechodzi, co dokumentuje błędy.

---

## Ustalenia potwierdzone

### AUD-001
- **Obszar:** DEMO (przyczyna strukturalna dotyczy też ARCHITEKTURY)
- **Waga:** wysoka
- **Tytuł:** Zmiany i rezygnacje omijają eksport TU; TU „przyjmuje” deklaracje i zmiany, których nie otrzymało
- **Plik / linia / funkcja:** `dist/core.mjs` l. 39 `makeExport` (gałąź TU filtruje tylko `records` ze statusem `pending`); l. 28 `confirm`; l. 35 `confirmChange`; `dist/app.mjs` l. 83–84
- **Dowód / kroki:** (1) Złóż deklarację, w Kadrach od razu „Przyjmij · symulacja” bez żadnego eksportu: przyjęta. (2) Zgłoś zmianę wariantu lub rezygnację, pobierz „CSV dla TU”: plik nie zawiera `ZM-1`. (3) „Potwierdź · symulacja” zmiany działa bez eksportu. Testy `AUD-001 *` w `audit.regression.test.mjs` nie przechodzą.
- **Skutek:** Demo pokazuje proces, w którym ochrona i jej zakończenie zmieniają się bez przekazania do TU. To dokładnie ten błąd, przed którym ostrzega własny dokument architektury („pobranie pliku nie jest wysłaniem do TU”, „status transmisji i status ochrony są osobnymi polami”). Lista płac zmienia kwotę na podstawie zmiany, o której TU nie wie. Przy pilocie: potrącenie wyższej lub niższej składki niż ta, którą TU nalicza, albo rezygnacja potrącana dalej po stronie TU.
- **Proponowana poprawka (strukturalna, bez przepisywania całości):** w `core.mjs` dodać stan przekazania na deklaracji i zmianie (`transmission: 'new' | 'sent'`) oraz listę pozycji w eksporcie (`exp.items = [{ref, kind}]`). `makeExport('tu')` obejmuje deklaracje i zmiany o `transmission === 'new'`, ustawia je na `'sent'`, zapisuje pozycje. `confirm` i `confirmChange` odrzucają rekord, który nie jest `'sent'`. W panelu kadr przyciski symulacji TU aktywne dopiero po eksporcie, z podpisem „Najpierw przygotuj eksport do TU”.
- **Jak sprawdzić:** testy `AUD-001 *` przechodzą; ręcznie: złożenie, próba przyjęcia (blokada), eksport, przyjęcie.
- **Pewność:** potwierdzone (test jednostkowy i przeglądarka)

### AUD-002
- **Obszar:** DEMO
- **Waga:** wysoka
- **Tytuł:** Po odrzuceniu deklaracji przez TU pracownik nie może złożyć korekty; rodzina odrzuconego płatnika utyka
- **Plik / linia / funkcja:** `dist/core.mjs` l. 24 `if(employeeRecord(s))return employeeRecord(s);`, l. 19 `employeeRecord`, l. 31; `dist/app.mjs` l. 28 `flow()`
- **Dowód / kroki:** złóż deklarację, w Kadrach „Odrzuć · symulacja”, wróć do pracownika. Ekran nadal pokazuje „Pierwszy krok za Tobą”, nie ma ścieżki korekty; `submitDeclaration` zwraca odrzucony rekord. Następnie zaproś rodzinę i złóż jej deklarację: przechodzi; „Przyjmij” rodziny zwraca błąd „Najpierw potwierdź deklarację pracownika” na zawsze.
- **Skutek:** Najczęstszy realny przypadek wyjątku (odrzucenie z powodu braków) kończy się martwym punktem. Wymaganie 8 Aneksu A (kto zamyka sprawę przy odrzuceniu) nie jest pokazane.
- **Proponowana poprawka:** `employeeRecord` zwraca najnowszą wersję deklaracji osoby; `submitDeclaration` pozwala złożyć nową wersję, gdy ostatnia jest `rejected` (pole `previousId`, zgodnie z `declarations.poprzednia_wersja_id` z architektury). Zaproszenie i deklaracja rodziny blokowane, gdy deklaracja płatnika jest odrzucona; na ekranie pracownika komunikat z powodem i przycisk „Popraw i złóż ponownie”.
- **Jak sprawdzić:** testy `AUD-002 *`.
- **Pewność:** potwierdzone

### AUD-003
- **Obszar:** DEMO
- **Waga:** wysoka
- **Tytuł:** Po przyjętej zmianie wariantu aplikacja pokazuje i waliduje wariant z przystąpienia
- **Plik / linia / funkcja:** `dist/app.mjs` l. 36 `program()` (`plan(r.planId)`), l. 48 `tableBody()`, l. 55, l. 56, l. 57 `changeModal` (`PLANS.filter(p=>p.id!==r.planId)`); `dist/core.mjs` l. 34 `requestChange` (`planId===r.planId`)
- **Dowód / kroki (Playwright, lokalnie):** przystąpienie na „Kompletny” 120 zł, przyjęcie, zmiana na „Podstawowy”, potwierdzenie. „Mój program” nadal: „Wariant kompletny, 120 zł / miesiąc”. Tabela kadr: „Kompletny 120 zł”. Lista płac: 60 zł. Modal kolejnej zmiany oferuje „Podstawowy” (obowiązujący) i „Rozszerzony”, a nie oferuje „Kompletny”. W `core`: zmiana na pierwotny wariant rzuca „Wybierz inny wariant”, zmiana na bieżący przechodzi.
- **Skutek:** Pracownik widzi inną składkę niż ta, którą mu potrącono. Kadry widzą inną kwotę niż w pliku płacowym. To wprost podważa argument „odciąża kadry tak jak eVIDA”.
- **Proponowana poprawka:** jedna funkcja w `core.mjs`, np. `currentState(s, r, period)` zwracająca `{plan, coverage: 'pending'|'future'|'active'|'ended'|'rejected', effective, pendingChange}`, używana przez wszystkie widoki i przez `requestChange`. `r.planId` zostaje jako zapis z chwili złożenia (test autora nr 5 słusznie tego pilnuje), ale żaden ekran „stanu obecnego” go nie czyta. Okres widoku pracownika: najbliższy okres rozliczeniowy, nie stała.
- **Jak sprawdzić:** testy `AUD-003 *`; ręcznie scenariusz z kroków, oczekiwane 60 zł w trzech miejscach.
- **Pewność:** potwierdzone

### AUD-004
- **Obszar:** DEMO
- **Waga:** wysoka
- **Tytuł:** Rezygnacja nie zmienia statusu; można rezygnować wielokrotnie i zmieniać wariant po rezygnacji; ochrona rodziny gaśnie bez zdarzenia
- **Plik / linia / funkcja:** `dist/core.mjs` l. 34 (brak sprawdzenia przyjętej rezygnacji), l. 36 `coverage` (rodzina wyłączana pośrednio); `dist/app.mjs` l. 42 `statusBadge`, l. 36
- **Dowód / kroki:** po przyjętej rezygnacji (grudzień 2026): plakietka pracownika „Przyjęta · od 1.12”, przyciski „Zmień wariant” i „Zrezygnuj” aktywne. Tabela kadr: pracownik 120 zł i członek rodziny 60 zł, oba „Przyjęta · od 1.12”, podczas gdy statystyka „Pracownicy w ochronie” i lista płac już ich nie liczą. W `core` trzy kolejne przyjęte zmiany (rezygnacja, rezygnacja, zmiana wariantu) na jednym rekordzie.
- **Skutek:** Raport kadr przeczy liście płac w tym samym widoku. Zakończenie ochrony rodziny nie ma ani zdarzenia, ani pozycji dla TU, więc w realnym procesie TU nie dowiedziałoby się o zakończeniu ochrony małżonka.
- **Proponowana poprawka:** status z `currentState` (AUD-003). `requestChange` odrzuca zgłoszenia po przyjętej rezygnacji. Rezygnacja płatnika tworzy jawne zmiany `cancel` (powód `payer_ended`) dla przyjętych deklaracji rodziny, które przechodzą przez eksport TU jak każda zmiana. Czy rodzina może kontynuować z innym płatnikiem, to pytanie do TU (dopisać do listy w `architecture.html`).
- **Jak sprawdzić:** testy `AUD-004 *`; w kadrach po rezygnacji obie osoby ze statusem „Ochrona zakończona od 1.12”.
- **Pewność:** potwierdzone

### AUD-005
- **Obszar:** DEMO (przed pilotem waga wysoka)
- **Waga:** średnia
- **Tytuł:** Zgoda na potrącenie nie jest związana z kwotą
- **Plik / linia / funkcja:** `dist/app.mjs` l. 32 (`checked` z `state.consents.payroll`), l. 78; `dist/core.mjs` l. 25 (`consents:{...s.consents}`)
- **Dowód / kroki (Playwright):** zaznacz zgodę przy „Rozszerzony” (tekst: „potrącenie 90 zł”), wróć do wariantów, wybierz „Kompletny”: zgoda pozostaje zaznaczona, tekst mówi już „120 zł”. Rekord zapisuje `payroll: true` bez kwoty.
- **Skutek:** Zgoda udzielona dla jednej kwoty jest zapisana jako zgoda na inną. W pilocie to słaby dowód przy sporze o potrącenie.
- **Proponowana poprawka:** zmiana wariantu kasuje `consents.payroll`; deklaracja zapisuje `payrollAmount`, `payrollPlanId` i wersję treści oświadczenia. Diff w sekcji propozycji.
- **Jak sprawdzić:** test `AUD-005`; ręcznie powtórzyć kroki, checkbox ma być pusty.
- **Pewność:** potwierdzone

### AUD-006
- **Obszar:** DEMO / PRZED PILOTEM
- **Waga:** średnia (przed pilotem wysoka)
- **Tytuł:** Deklaracja członka rodziny nie zapisuje jego oświadczeń; ścieżkę rodziny wykonuje się w sesji pracownika
- **Plik / linia / funkcja:** `dist/core.mjs` l. 25 (`consents: {demo:true}` dla `family`); `dist/app.mjs` l. 39 (checkboxy `adult`, `docs` nie trafiają do rekordu), l. 67, l. 80
- **Dowód / kroki:** złóż deklarację rodziny z zaznaczonymi oświadczeniami; w `localStorage` rekord rodziny ma `consents: {"demo": true}` i `beneficiaries: []`. Ścieżkę otwiera przycisk na koncie pracownika, a kod weryfikacyjny jest wyświetlony na ekranie.
- **Skutek:** Brak dowodu, że ubezpieczony członek rodziny sam się zgodził i otrzymał warunki. Ustawa o działalności ubezpieczeniowej i reasekuracyjnej (plik projektu, tekst Kancelarii Sejmu, stan 2026-03-05, s. 24) art. 19: jeżeli wymagana jest zgoda ubezpieczonego albo ubezpieczony finansuje składkę, a warunków umowy nie doręczono mu przed wyrażeniem zgody, TU nie może powoływać się na postanowienia ograniczające lub wyłączające odpowiedzialność. Zapis „kto, kiedy, jaką wersję dokumentu otrzymał” jest więc dowodem w interesie TU i BCP, a nie formalnością.
- **Proponowana poprawka:** demo: zapisać oświadczenia rodziny (`adult`, `docs`, wersja dokumentu, czas). Pilot: osobne konto członka rodziny przez jednorazowy link z terminem ważności (jest w modelu `invitations`), zapis potwierdzenia zapoznania (`acknowledgements`) przed złożeniem deklaracji.
- **Jak sprawdzić:** test `AUD-006`; w pilocie test, że konto pracownika nie może złożyć deklaracji za członka rodziny.
- **Pewność:** potwierdzone (kod); skutek prawny oparty na art. 19 z pliku ustawy, jego zastosowanie do tego programu do potwierdzenia przez kancelarię

### AUD-007
- **Obszar:** DEMO
- **Waga:** średnia
- **Tytuł:** Druga karta przeglądarki nadpisuje stan; deklaracja rodziny znika
- **Plik / linia / funkcja:** `dist/app.mjs` l. 4 (stan czytany raz), l. 11 `save()`; brak obsługi zdarzenia `storage`
- **Dowód / kroki (Playwright):** karta A: przystąpienie i zaproszenie, „Kopiuj link demo”. Karta B: link, złożenie deklaracji rodziny (w `localStorage` 1 rekord rodziny). Karta A: przygotowanie drugiego zaproszenia. Wynik: 0 rekordów rodziny, pierwsze zaproszenie z powrotem `prepared`.
- **Skutek:** Interfejs sam zachęca do otwarcia linku (przycisk „Kopiuj link demo”), a taki pokaz kończy się utratą danych przy Kliencie.
- **Proponowana poprawka:** nasłuch `storage` z przeładowaniem stanu i ponownym renderem; przed zapisem porównanie licznika wersji stanu. Diff w sekcji propozycji.
- **Jak sprawdzić:** powtórzyć kroki; rekord rodziny ma pozostać.
- **Pewność:** potwierdzone

### AUD-008
- **Obszar:** DEMO
- **Waga:** średnia
- **Tytuł:** Lista powodów odrzucenia ma jedną opcję zamiast trzech (błędny HTML)
- **Plik / linia / funkcja:** `dist/app.mjs` l. 56 `recordModal`
- **Dowód:** w przeglądarce `#reject-reason` zawiera jedną opcję „Niekompletne dane”; dwie pozostałe nie mają otwierającego `<option>` i są odrzucane przez parser.
- **Skutek:** Nie da się pokazać różnych ścieżek odrzucenia; pole „powód” jest zawsze niepuste, więc walidacja „Podaj powód odrzucenia” w `confirm` nigdy nie działa w UI.
- **Proponowana poprawka:** diff w sekcji propozycji; docelowo kody powodów (`reason_code`) jak w modelu `insurer_acknowledgements`.
- **Jak sprawdzić:** w modalu trzy opcje.
- **Pewność:** potwierdzone

### AUD-009
- **Obszar:** DEMO
- **Waga:** średnia
- **Tytuł:** Eksport TU powtarza te same pozycje, ignoruje okres i wypuszcza wewnętrzny identyfikator `ME`
- **Plik / linia / funkcja:** `dist/core.mjs` l. 39; `dist/app.mjs` l. 60 (nazwa pliku z okresem)
- **Dowód:** dwa eksporty TU za listopad i grudzień mają identyczne wiersze; plik nazywa się `...-tu-2026-12-...`, choć okres nie wpływa na treść. Kolumna `ID_PLATNIKA` dla pracownika i rodziny to `ME`. Brak identyfikatora pracodawcy, numeru kadrowego płatnika i relacji rodzinnej.
- **Skutek:** Plik nie nadaje się do pokazania TU jako wzoru; w realnej wymianie duplikaty i identyfikator bez znaczenia poza przeglądarką.
- **Proponowana poprawka:** w ramach AUD-001: pozycje już przekazane nie wracają (korekta jako nowy eksport z odwołaniem); identyfikatory osób stabilne (`P-131` zamiast `ME`), kolumny `ID_PRACODAWCY`, `NR_KADROWY_PLATNIKA`, `RELACJA`, `TYP_ZDARZENIA` (przystąpienie / zmiana / rezygnacja). Okres usunąć z nazwy pliku TU albo realnie filtrować.
- **Jak sprawdzić:** testy `AUD-009 *`.
- **Pewność:** potwierdzone

### AUD-010
- **Obszar:** DEMO
- **Waga:** niska
- **Tytuł:** Historia pracownika pomija deklarację i decyzję TU dla rodziny
- **Plik / linia / funkcja:** `dist/app.mjs` l. 41 `history()` (porównuje `l.recordId` z identyfikatorem zaproszenia, a zdarzenia rodziny mają identyfikator deklaracji `D-…`)
- **Dowód (Playwright):** po złożeniu i przyjęciu deklaracji rodziny historia pracownika zawiera tylko „Przygotowanie zaproszenia”.
- **Skutek:** Płatnik nie widzi, od kiedy płaci za rodzinę.
- **Proponowana poprawka:** diff w sekcji propozycji. Zakres informacji płatnika o rodzinie do potwierdzenia przez kancelarię (architektura słusznie zaznacza, że płatnik nie ma automatycznego dostępu do danych pełnoletniego członka rodziny); w demo wystarczy status i kwota.
- **Pewność:** potwierdzone

### AUD-011
- **Obszar:** DEMO
- **Waga:** niska
- **Tytuł:** Drobne niespójności raportu kadr
- **Plik / linia / funkcja:** `dist/app.mjs` l. 47 (licznik `state.records.length` bez filtra pracodawcy), l. 44 (mianownik partycypacji 200 na stałe, „Oczekujące” bez okresu), l. 42 (tekst „od 1.12” wpisany na stałe), l. 45 (`changesTable` podpisuje każdą zmianę nazwiskiem bieżącego użytkownika demo), `dist/brand.css` l. 1 (`--amber` = granat: „Oczekuje na TU” i „Przyjęta · od 1.12” mają tę samą barwę).
- **Skutek:** dziś niewidoczne przy jednym pracodawcy i jednym użytkowniku; staną się błędami przy drugim Kliencie lub drugim zgłaszającym.
- **Proponowana poprawka:** mianownik z konfiguracji pracodawcy (`liczba_uprawnionych`, `stan_na_dzień`, jak w modelu); data w plakietce z rekordu; nazwisko z `c.recordId`; odrębny wariant plakietki dla oczekujących (np. obwódka i ikona zegara).
- **Pewność:** potwierdzone

### AUD-012
- **Obszar:** DEMO (proces jakości)
- **Waga:** wysoka
- **Tytuł:** Testy nie wykrywają większości błędów logiki i nie obejmują interfejsu
- **Plik / linia / funkcja:** `core.test.mjs`
- **Dowód:** test mutacyjny: wprowadziłem 10 pojedynczych błędów do `core.mjs`, 7 przeszło przez 9 testów autora niezauważonych: wyłączenie warunku płatnika dla rodziny w `coverage`; zdjęcie ochrony CSV dla `-`; dla `+` i `@`; zmiany działające wstecz (bez daty skuteczności); brak walidacji nazwy uposażonego; zmiana na ten sam wariant; `confirm` bez filtra pracodawcy. Wykryte zostały tylko 3. Żaden test nie dotyka `app.mjs`, a błędy AUD-003, AUD-004, AUD-007, AUD-008 i AUD-010 są wyłącznie w warstwie interfejsu lub na styku.
- **Skutek:** „9/9 zaliczonych” nie jest dowodem poprawności, co zresztą raport autora uczciwie zastrzega.
- **Proponowana poprawka:** dołączyć `audit.regression.test.mjs` (z tej paczki) do repozytorium; dodać jeden test E2E Playwright na scenariusz: przystąpienie, rodzina, przyjęcie, zmiana, rezygnacja, eksporty, z asercją zgodności kwot w „Mój program”, tabeli kadr i CSV płac. Przy każdej rundzie powtarzać test mutacyjny (skrypt można odtworzyć z listy mutacji powyżej).
- **Jak sprawdzić:** wszystkie 17 testów regresyjnych przechodzi; ponowny test mutacyjny wykrywa co najmniej 9 z 10 mutacji.
- **Pewność:** potwierdzone

### AUD-013
- **Obszar:** DEMO / PRZED PILOTEM
- **Waga:** niska (przed pilotem średnia)
- **Tytuł:** Dwa zegary i identyfikatory z długości tablic
- **Plik / linia / funkcja:** `dist/core.mjs` l. 1–2 (`TODAY`, `EFFECTIVE` stałe), l. 25 (`submittedAt` z zegara rzeczywistego), l. 18, 25, 34, 39 (identyfikatory `length+1`), l. 36 (zmiany stosowane w kolejności wstawienia, nie dat)
- **Skutek:** Każda zmiana ma skuteczność 1.12.2026 niezależnie od dnia zgłoszenia; deklaracja ma datę złożenia 02.11 i godzinę z dnia pokazu. Przy usuwaniu lub scalaniu rekordów identyfikatory zaczną się powtarzać. Dla demo akceptowalne, ale nie przenosić do pilota.
- **Proponowana poprawka:** funkcja `effectiveDateFor(program, requestedAt)` z regułą programu (np. 1. dzień następnego miesiąca); sortowanie zmian po dacie skuteczności; UUID (zgodnie z konwencją modelu).
- **Pewność:** potwierdzone (kod), skutek przy usuwaniu to hipoteza, bo demo nie usuwa rekordów

### AUD-014
- **Obszar:** DEMO (wersja publiczna)
- **Waga:** średnia
- **Tytuł:** Publiczna wersja pokazuje nazwę i znak „PZU” obok fikcyjnych świadczeń
- **Plik / linia / funkcja:** `dist/app.mjs` l. 24, 27 (`insurer-mark` „PZU”), 29, 36; publikacja `access_mode: public` (`weryfikacja/publikacja.json`)
- **Dowód:** strona otwarta bez bramki, na domenie `chatgpt.site`, z logo BCP i oznaczeniem „PZU Życie” przy kwotach 50 000 do 150 000 zł. Zastrzeżenia „fikcyjne” są na stronie, ale zrzut ekranu ich nie przenosi.
- **Skutek:** Ryzyko, że zrzut krąży jako „program BCP w PZU” z wymyślonymi świadczeniami; użycie nazwy TU bez jego wiedzy. Nie oceniam skutku prawnego (brak źródła w paczce).
- **Proponowana poprawka:** w wersji publicznej „TU Demo” zamiast PZU, albo przywrócenie bramki dostępu i PZU tylko w pokazie prywatnym. Decyzja należy do Bartosza.
- **Jak sprawdzić:** brak ciągu „PZU” w opublikowanym HTML/JS wersji publicznej.
- **Pewność:** potwierdzone (fakty); skutek to ocena ryzyka

### AUD-015
- **Obszar:** ARCHITEKTURA
- **Waga:** wysoka
- **Tytuł:** Demo nie realizuje własnego modelu danych; model nie ma Ubezpieczającego odrębnego od Pracodawcy
- **Plik / linia / funkcja:** `dist/core.mjs` (rekord deklaracji niesie status ochrony); `dist/architecture.html` i `research.json` sekcja `entities` (Program należy do jednego `employer_id`)
- **Dowód:** architektura deklaruje osobne `declarations`, `enrollments` (status ochrony), `export_items`, `payer_assignments`; `core.mjs` ma jeden rekord, w którym `status: 'accepted'` oznacza jednocześnie przyjęcie deklaracji i ochronę. AUD-001 do AUD-004 wynikają bezpośrednio z tego skrótu. Osobno: klienci BCP z segmentu dealerskiego to często grupy kilku spółek pod jedną umową grupową; w modelu umowę zawiera „Pracodawca”, a ubezpieczający (strona umowy z TU) i pracodawca ubezpieczonego to w takiej grupie różne podmioty.
- **Skutek:** Jeżeli przejście na Next.js zacznie od przeniesienia `core.mjs`, skrót przejdzie do produkcji. Bez encji Ubezpieczający nie da się poprawnie obsłużyć programu dla grupy spółek (raport partycypacji per spółka, eksport płac per spółka, jedna umowa z TU).
- **Proponowana poprawka:** (1) teraz, w demo: przebudować `core.mjs` na deklarację + uczestnictwo + pozycje eksportu (zakres AUD-001/003/004; to kilkadziesiąt linii, nie przepisywanie aplikacji). (2) w modelu: encja `policyholders` (ubezpieczający, numer umowy z TU), relacja Program N:1 Ubezpieczający i Program N:M Pracodawca przez `program_employers`; `employer_id` jako granica danych kadr pozostaje.
- **Jak sprawdzić:** w demo testy regresyjne; w modelu przypadek testowy „jedna umowa, dwie spółki, dwie listy płac, jeden eksport TU”.
- **Pewność:** potwierdzone (rozbieżność); potrzeba encji Ubezpieczający wynika z profilu klientów BCP, nie z dokumentu w paczce

### AUD-016
- **Obszar:** PRZED PILOTEM
- **Waga:** wysoka
- **Tytuł:** Brak w procesie i modelu obowiązków informacyjnych przed przystąpieniem i dowodu ich wykonania
- **Plik / linia / funkcja:** `dist/app.mjs` l. 32 (dokumenty jako makiety), l. 53; `architecture.html` sekcje „Model danych” i „Pytania przed pilotem”
- **Dowód (źródło: plik projektu „USTAWA z dnia 11 września 2015 r. o działalności ubezpieczeniowej i reasekuracyjnej.pdf”, tekst Kancelarii Sejmu, stan 2026-03-05, s. 24):** art. 17 ust. 2: w ubezpieczeniu grupowym TU przekazuje informacje za pośrednictwem ubezpieczającego przed przystąpieniem, na piśmie lub, za zgodą osoby, na innym trwałym nośniku. Art. 18 ust. 4: przed przystąpieniem do grupówki pracowniczej ubezpieczający przekazuje informację o firmie i adresie TU, charakterze wynagrodzenia w rozumieniu ustawy o dystrybucji ubezpieczeń oraz o reklamacjach, skargach i pozasądowym rozwiązywaniu sporów. Art. 19: skutek niedoręczenia warunków przed zgodą (opisany w AUD-006). Model ma `documents/acknowledgements`, ale nie ma: zgody na trwały nośnik, osobnego dokumentu informacji z art. 18 ust. 4, zapisu, kto (ubezpieczający czy BCP w jego imieniu) wykonał obowiązek.
- **Skutek:** e-deklaracja bez tych zapisów przenosi ryzyko sporu o zakres ochrony na TU, a pośrednio na relację BCP z TU i Klientem.
- **Proponowana poprawka:** dodać do modelu `durable_medium_consents` (osoba, kanał, czas, wersja treści) i typ dokumentu `art18_info` w `documents`; w ścieżce pracownika i rodziny krok „Informacje przed przystąpieniem” z zapisem potwierdzenia. Dopisać do pytań kancelarii: kto formalnie wykonuje obowiązek z art. 18 ust. 4, gdy kanałem jest aplikacja brokera. Wymóg art. 77² k.c. z Aneksu A nadal nie ma źródła w paczce ani w plikach projektu; zostaje „do weryfikacji”.
- **Pewność:** treść przepisów potwierdzona z pliku; zastosowanie do iBCP do potwierdzenia przez kancelarię

### AUD-017
- **Obszar:** ARCHITEKTURA
- **Waga:** średnia
- **Tytuł:** Stack: ceny potwierdzone, nie ma właściciela utrzymania i oceny Supabase Pro pod kątem wymagań TU
- **Plik / linia / funkcja:** `research.json` `decision`, `options`
- **Dowód (strony dostawców sprawdzone 02.11.2026):** Render: plan Pro 25 USD/mies., instancja 1 CPU / 2 GB 25 USD/mies. (render.com/pricing); Supabase Pro od 25 USD/mies., PITR od 100 USD/mies. (supabase.com/pricing). Kwota 75 USD/mies. jest więc poprawnie policzona. Ta sama strona Supabase wskazuje SOC2, ISO 27001 i HIPAA jako niedostępne w planie Pro (dostępne od planu Team); strona cennika nie wspomina o umowie powierzenia (DPA). Stron Base44, Bubble i Azure nie sprawdzałem.
- **Skutek:** Jeżeli TU lub Klient poprosi o raport SOC2 dostawcy, koszt infrastruktury rośnie skokowo, czego porównanie nie pokazuje. Większe ryzyko: stack wymaga programisty do aktualizacji, łatek i reakcji na incydenty, a dokument nie wskazuje, kto to robi w BCP bez działu IT.
- **Proponowana poprawka:** dopisać w porównaniu: (a) koszt planu wymaganego do udostępnienia raportów bezpieczeństwa dostawcy, (b) wymóg DPA od Supabase i Render z listą podprocesorów, (c) wiersz „kto utrzymuje” z nazwą podmiotu lub osoby i czasem reakcji. Wybór stacku zostaje decyzją Bartosza; nie podważam kierunku, wskazuję brakujące koszty i warunek przed pilotem.
- **Pewność:** ceny potwierdzone; brak właściciela utrzymania potwierdzony w dokumencie

### AUD-018
- **Obszar:** WYGLĄD
- **Waga:** niska
- **Tytuł:** Zgodność z księgą znaku 1.1 dobra; trzy drobne odstępstwa
- **Dowód (Chromium, 1280 / 390 / 320 px, zrzuty `shots/`):** zgodne: oryginalne SVG, wariant opisowy w nawigacji 64,75 px (minimum 64 px, s. 07 i 11 księgi), WORTH MORE w stopce 68,7 px, Poppins 400/500/600 załadowany lokalnie, Georgia w prozie (s. 19), promień 4 px i brak cienia kart (s. 22), CTA w ciemnej magencie #C400B6 (s. 17), statusy z etykietą tekstową, brak przewijania poziomego przy 320 px. Odstępstwa: (1) `<strong>` ma obliczoną grubość 700 (s. 19: „nie stosujemy 700”); przy `font-synthesis:none` renderuje się jako 600, więc różnica jest tylko w kodzie; (2) „Oczekuje na TU” i „Przyjęta · od 1.12” w tym samym kolorze (AUD-011); (3) w jednym widoku cztery tła (szary, biały, granat, jasnoniebieski), księga s. 22 mówi o najwyżej dwóch w pojedynczej kompozycji; dla interfejsu aplikacji uważam to za dopuszczalne, ale to interpretacja.
- **Proponowana poprawka:** `strong{font-weight:600}` w `brand.css`; odrębna plakietka oczekiwania.
- **Pewność:** potwierdzone w lokalnym renderze tego samego commitu; publicznego adresu nie otwierałem

---

## Hipotezy i brakujące ustalenia

- **H-1:** Hosting `chatgpt.site` może logować adresy i nagłówki żądań; danych formularzy nie przesyła (zero żądań zewnętrznych w teście). Brak danych o regionie i logach hostingu; dla demo na fikcyjnych danych bez znaczenia, dla pilota hosting i tak się zmienia.
- **H-2:** Pobrana deklaracja HTML zawiera stały tekst „Potwierdzono dokumenty…, potrącenie…” zamiast treści z `r.consents` (`app.mjs` l. 100). Przy AUD-005 potwierdzone w kodzie; wydruku nie oglądałem.
- **Brak ustaleń:** akceptacja e-deklaracji przez PZU, specyfikacja pliku PZU, wymóg art. 77² k.c., reguły rodziny po odejściu płatnika. To pytania do TU i kancelarii, nie błędy aplikacji.

## Zgodność z Aneksem A, punkty 5–9 (model i architektura, nie demo)

| Nr | Ocena | Poprawka |
|---|---|---|
| 5 Model, Ubezpieczony ≠ Płatnik | Zgodne co do Płatnika (`payers`, `payer_assignments`); brak Ubezpieczającego | AUD-015 |
| 6 Reguły programu, dwa tryby, korekty | Zgodne w modelu (`program_versions.tryb_płatności`, `charges/payments/allocations`); demo ma stałe daty | AUD-013 |
| 7 Bezpieczeństwo | Zgodne w opisie (RLS, MFA TOTP, audyt z aktorem, UE); nic nie wdrożone, co autor przyznaje | AUD-017 (utrzymanie) |
| 8 Przepływ obsługi | Częściowo: tabela czynności jest, „kto zamyka sprawę” tylko jako `exceptions.assigned_role` bez przypisania ról do czynności | dopisać kolumnę „zamyka” do tabeli przepływów |
| 9 Dane osobowe, forma deklaracji | Zgodne co do danych zdrowotnych i PESEL; brak obowiązków art. 17–19 UDUiR; art. 77² k.c. bez źródła | AUD-016 |

---

## Propozycje zmian (diff poglądowy, NIE jest to aktualny kod)

```diff
--- a/dist/app.mjs  (l. 56, AUD-008)
-<select id='reject-reason'><option>Niekompletne dane — przykład demo</option>Brak uprawnienia do programu — przykład demo</option>Wymagana korekta deklaracji — przykład demo</option></select>
+<select id='reject-reason'><option>Niekompletne dane — przykład demo</option><option>Brak uprawnienia do programu — przykład demo</option><option>Wymagana korekta deklaracji — przykład demo</option></select>

--- a/dist/app.mjs  (l. 78, AUD-005)
- if(el.dataset.plan){state.selectedPlan=el.dataset.plan;save();render();return;}
+ if(el.dataset.plan){if(state.selectedPlan!==el.dataset.plan)state.consents.payroll=false;state.selectedPlan=el.dataset.plan;save();render();return;}

--- a/dist/core.mjs  (l. 25, AUD-005)
-consents:kind==='employee'?{...s.consents}:{demo:true}
+consents:kind==='employee'?{...s.consents,payrollAmount:plan(planId).price,payrollPlanId:planId}:{...familyConsents}   // familyConsents przekazane z formularza rodziny (AUD-006)

--- a/dist/app.mjs  (l. 41, AUD-010)
-||state.invites.some(i=>i.id===l.recordId)
+||state.invites.some(i=>i.id===l.recordId)||state.records.some(r=>r.id===l.recordId&&r.kind==='family'&&r.payerId===me?.personId)

--- a/dist/app.mjs  (po l. 4, AUD-007)
+window.addEventListener('storage',e=>{if(e.key!==KEY)return;try{const n=JSON.parse(e.newValue);state=n?.schema===1?n:freshState();}catch{state=freshState();}render();});
```

AUD-001, 003 i 004 nie mają sensownej łaty jednoliniowej; poprawka to `currentState()` plus stan przekazania i pozycje eksportu w `core.mjs`, opisane w ustaleniach.

---

## Przeczytane materiały
`01_POLECENIE_DLA_CLAUDE.txt`, `00_ZACZNIJ_TUTAJ.txt`, `02_RAPORT_STANU.txt`, `03_WYMAGANIA.txt`, `04_FORMAT_USTALEN.txt`, `MANIFEST.json`, `kod/dist/core.mjs` (całość), `kod/dist/app.mjs` (całość), `kod/core.test.mjs`, `kod/dist/index.html`, `kod/dist/architecture.html` (treść), `kod/research.json`, `kod/brand-sources.json`, `kod/.openai/hosting.json`, `kod/RUN.txt`, `weryfikacja/*.json`, `weryfikacja/testy-node.txt`, `marka/BCP_Polska_Ksiega_znaku.pdf` (tekst s. 1–24), wybiórczo `kod/dist/styles.css` i `brand.css` (reguły wag, kolorów, tokenów). Nie czytałem treści `print-brand.mjs` (base64 fontów i logo). Źródła prawne: pliki projektu (UDUiR, UoDU).

## Uruchomione kontrole i wyniki
1. Sumy SHA-256 21 plików względem `MANIFEST.json`: zgodne.
2. `node --test core.test.mjs` (Node 22.23.4): 9/9.
3. 14 testów własnych hipotez na `core.mjs`: wszystkie hipotezy potwierdzone.
4. Test mutacyjny, 10 mutacji: 3 wykryte, 7 przeżyło.
5. `audit.regression.test.mjs`, 17 testów zachowania oczekiwanego: 13 nie przechodzi (dowód błędów), 4 przechodzą (strażnicy mutacji).
6. Playwright / Chromium na lokalnym serwerze z `RUN.txt`: pełna ścieżka pracownika, rodziny, kadr, zmiany, rezygnacji, eksportów; dwie karty; odświeżenie w trakcie deklaracji (stan zachowany, poprawnie); 390 i 320 px (brak przewijania poziomego); konsola bez błędów; zero żądań poza 127.0.0.1; pomiar stylów obliczonych.
7. Ceny Render i Supabase na stronach dostawców.

## Niesprawdzone obszary
Publiczny adres demo (oceniałem lokalny render tego samego commitu); Firefox i Safari; czytniki ekranu i pełna dostępność; wydruk pobranej deklaracji HTML; `architecture.html` w widoku wizualnym; strony Base44, Bubble, Azure, Next.js; region i logi hostingu `chatgpt.site`.

## Kolejność poprawek
1. AUD-008, AUD-005, AUD-010, AUD-007 (łaty z diffu, godzina pracy, przed najbliższym pokazem).
2. AUD-014 (decyzja Bartosza o PZU w wersji publicznej; zmiana tekstu trywialna).
3. AUD-015 część demo, która zamyka AUD-001, AUD-003, AUD-004, AUD-002, AUD-009: przebudowa `core.mjs` na deklarację + uczestnictwo + pozycje eksportu, z `audit.regression.test.mjs` jako kryterium odbioru i jednym testem E2E (AUD-012).
4. AUD-006 i AUD-011 w demo.
5. Przed pilotem: AUD-016 (z kancelarią), AUD-015 część modelu (Ubezpieczający), AUD-017 (utrzymanie, DPA, raporty bezpieczeństwa), AUD-013.
