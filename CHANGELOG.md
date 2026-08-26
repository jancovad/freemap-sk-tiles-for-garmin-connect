# Changelog

Všetky významné zmeny projektu budú zaznamenané v tomto súbore. Projekt používa
verziovanie v tvare `MAJOR.MINOR.PATCH`.

## Unreleased

## 0.6.0 – 2026-08-26

- Verzia 0.6.0 bola schválená a verejne publikovaná v Chrome Web Store.
- Čistá inštalácia z Chrome Web Store bola úspešne overená a Freemap Slovakia
  bola informovaná o verejnom vydaní.
- `Freemap.sk` sa zobrazuje priamo medzi poskytovateľmi v natívnom dialógu
  „Nastavenia mapy“ Garmin Connect.
- Integrácia používa iba overené ARIA roly, väzbu `aria-controls` a natívne
  hodnoty `google`/`here`/`osm`; nezávisí od dynamických CSS tried Garminu ani
  od lokalizovaného textu dialógu.
- Pri Freemap sa skryje nepoužiteľná sekcia typu mapy. Výber Google, HERE alebo
  OpenStreetMap Freemap bezpečne vypne a pôvodné Garmin kliknutie pokračuje.
- Pri prechode z HERE/OSM na Freemap sa najprv použije natívna voľba Google,
  ktorej overený dlaždicový formát následne spracuje existujúci prekladač.
- Po úspešnom živom teste na detaile aktivity aj v plánovači bol duplicitný
  horný prepínač odstránený; podklad sa ovláda iba cez Garmin nastavenia mapy.
- Pridaný samostatný DOM regresný test natívneho dialógu a jeho React
  opätovného vykreslenia.
- Plánovač používa rovnaký Garmin listbox poskytovateľov, ale bez dialogových
  ARIA atribútov; detekcia je preto viazaná na `aria-controls` a presnú trojicu
  natívnych hodnôt `google`/`here`/`osm`.

## 0.5.5 – 2026-08-17

- Vydaná testovacia verzia manifestu 0.5.5.
- Detail aktivity bez dostupných Leaflet `+`/`−` prvkov používa na automatické
  nastavenie hranice overenú syntetickú udalosť kolieska na mape.
- Automatické nastavenie Garmin zoomu mimo rozsahu teraz používa samostatný
  kontrolovaný režim, presnú cieľovú úroveň 5/18 a časovo obmedzené opakovanie.
- Rýchle série kolieska, tlačidiel, klávesov a dotykových gest už nemôžu
  prekročiť Freemap zoom 5–18 počas čakania na nové dlaždice.
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
- Rušivé potvrdenie v mape odstránené po kontrole pravidiel Chrome Web Store;
  povinné zverejnenie údajov je pripravené priamo v Store zázname a privacy
  dokumentácii.
- Pri aktualizácii sa jednorazovo odstráni zastaraná lokálna hodnota
  `freemapDisclosureAccepted` z nevydanej testovacej verzie.
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
