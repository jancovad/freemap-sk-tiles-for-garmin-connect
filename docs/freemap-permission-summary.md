# Zhrnutie súhlasu Freemap Slovakia

Stav: **písomný súhlas prijatý 17. augusta 2026**

Odpoveď poskytol Martin Ždila za OZ Freemap Slovakia. Pôvodná e-mailová
komunikácia zostáva uložená súkromne u vlastníka projektu; tento súbor je
verejné vecné zhrnutie podmienok, nie náhrada pôvodného e-mailu.

## Povolený rozsah

- Nevýhradný a bezodplatný súhlas platí pre toto bezplatné, nekomerčné Chrome
  rozšírenie.
- Freemap Slovakia môže súhlas odvolať, napríklad pri neprimeranej záťaži.
- Verejný tile server nemá SLA ani garanciu dostupnosti.
- Rozšírenie nesmie vykonávať hromadné, offline ani preventívne sťahovanie.
- Pri výraznejšom raste používania sa má vývojár ozvať vopred a dohodnúť ďalší
  postup.

Súhlas sa automaticky neprenáša prostredníctvom MIT licencie na mapové dáta,
forky, iné aplikácie ani komerčné použitie.

## Technické podmienky

- Pôvodná žiadosť aj funkčná Outdoor služba používajú
  `https://outdoor.tiles.freemap.sk/{z}/{x}/{y}`.
- Dodatočný opravný e-mail textovo uviedol `https://tiles.freemap.sk`, ale
  živé overenie 17. augusta 2026 na tomto hoste zobrazilo iba zástupný podklad
  „no map data“. Outdoor host pre rovnakú dlaždicu vrátil správny podklad a
  retina rozmery 256, 512, 768 a 1024 px. Projekt preto používa explicitný
  `outdoor.tiles.freemap.sk`; rozpor je vhodné potvrdiť s Freemap Slovakia.
- Povolený rozsah Outdoor vrstvy pre rozšírenie je zoom **5 až 18**. Zoomy 19
  a 20 sú vyhradené pre premium používateľov.
- Vyššie rozlíšenie používa prípony `@2x`, `@3x` a `@4x` podľa
  `devicePixelRatio`. Leaflet `detectRetina` sa nemá používať.
- Na identifikáciu prevádzky bolo možné ponechať referrer alebo pridať statický
  parameter. Projekt zvolil `referrerpolicy=no-referrer` a
  `?app=garmin-connect-ext`, aby neposielal URL Garmin Connect.

## Atribúcia

Viditeľná skrátená atribúcia má obsahovať prepojené časti:

`© Freemap Slovakia · © prispievatelia OpenStreetMap, dáta ODbL · Zdroje výškových dát`

Freemap a zdroje výškových dát odkazujú na <https://www.freemap.sk/>. OSM časť
odkazuje na <https://www.openstreetmap.org/copyright>. Zoznam zdrojov tieňovania
a vrstevníc sa nemá uvádzať natvrdo, pretože sa priebežne mení. SRTM netreba
uvádzať, pretože sa pre tieto dlaždice nepoužíva.

## Názov a status projektu

Freemap Slovakia odsúhlasila názov **Outdoor tiles from Freemap.sk for Garmin
Connect** za predpokladu, že projekt nepoužíva logo Freemap a jasne sa označuje
ako neoficiálny komunitný projekt.
