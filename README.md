# iBCP: demonstrator Auto Demo

Statyczny demonstrator samoobsługi grupowych ubezpieczeń życia i zdrowia dla Klientów BCP Polska.
Wyłącznie fikcyjne dane. Brak backendu, rzeczywistego logowania, MFA, integracji z TU i wysyłki wiadomości.

Źródło importu: paczka audytowa IBCP-A01-20261102-8da9a5d, kod z commitu ChatGPT/Codex
`8da9a5dd20a6bcc509fc93750a5c95ba8b981a09` (sumy SHA-256 21 plików zgodne z manifestem paczki).
Pierwotna historia commitów nie była dostępna w paczce.

Uruchomienie: `python3 -m http.server 8787 --bind 127.0.0.1 --directory dist`, potem http://127.0.0.1:8787/
Kod firmy AUTO200, kod weryfikacyjny 246810. Testy: `node --test`.

Dokumentacja architektury docelowej: `dist/architecture.html`, `research.json`.
