# Changelog

Všetky významné zmeny projektu budú zaznamenané v tomto súbore. Projekt používa
verziovanie v tvare `MAJOR.MINOR.PATCH`.

## Unreleased

- Príprava verejnej open-source dokumentácie a podkladov pre budúce posúdenie
  v Chrome Web Store.
- Publikovanie zostáva zablokované do potvrdenia použitia dlaždíc Freemap
  Slovakia a požadovanej atribúcie.

## 0.4.0 – 2026-08-14

- Lokálne zapamätanie posledného podkladu `garmin` alebo `freemap`.
- Ikony rozšírenia vo veľkostiach 16, 32, 48 a 128 px.
- Samostatný test obnovenia uloženej preferencie.
- Reprodukovateľný lokálny ZIP build s kontrolným súčtom SHA-256.

## 0.3.1 – 2026-08-13

- Automatické prispôsobenie Garmin zoomu na podporovaný Freemap rozsah 2–20
  ešte pred prepnutím podkladu.
- Blokovanie ďalšieho zoomu mimo rozsahu Freemap.

## 0.2.1 – 2026-08-13

- Zachovanie natívneho životného cyklu Google Mutant/Leaflet dlaždíc.
- Oprava plynulého zoomu a odstraňovanie zmiešaných podkladov.
