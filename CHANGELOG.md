# Changelog

Všetky významné zmeny projektu budú zaznamenané v tomto súbore. Projekt používa
verziovanie v tvare `MAJOR.MINOR.PATCH`.

## Unreleased

- Verzia manifestu pripravená ako 0.5.1.
- Názov zmenený na `Outdoor tiles from Freemap.sk for Garmin Connect` podľa
  odporúčania Freemap Slovakia.
- Outdoor endpoint nastavený na `https://outdoor.tiles.freemap.sk`; generický
  `https://tiles.freemap.sk`, ktorý vracia zástupné „no map data“ dlaždice, je
  výslovne odmietnutý testami aj release validáciou.
- Každý request obsahuje statický identifikátor `?app=garmin-connect-ext` pri
  zachovaní `referrerpolicy=no-referrer`.
- Rozsah zoomu upravený z pôvodne odvodených 2–20 na potvrdených 5–18.
- Podpora `@2x`, `@3x` a `@4x` dlaždíc podľa `devicePixelRatio` bez
  Leaflet `detectRetina`.
- Atribúcia rozšírená o ODbL a odkaz na aktuálne zdroje výškových dát.
- Pred prvým zapnutím Freemap sa zobrazí informácia o sieťovej komunikácii;
  potvrdenie sa ukladá iba lokálne.
- Privacy policy, third-party notices, Store návrh a testy aktualizované podľa
  písomného súhlasu Freemap Slovakia z 17. augusta 2026.

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
