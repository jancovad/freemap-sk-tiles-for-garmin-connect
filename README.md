# Garmin Freemap Outdoor

Experimentálne Chrome rozšírenie pre webový Garmin Connect. Do Leaflet mapy
pridáva prepínač **Garmin / Freemap** a mení výhradne podkladové dlaždice na
Freemap.sk Outdoor.

## Rozsah MVP

- Chrome Manifest V3.
- Detail aktivity a plánovač/editor trás.
- Zachovanie Garmin trasy, bodov, prekrytí, ovládania mapy a routingu.
- Viditeľná atribúcia Freemap Slovakia a OpenStreetMap pri zapnutom Freemap.
- Synchrónna výmena URL pred načítaním obrázka, aby Leaflet zachoval natívny
  priebeh zoomu bez periodického pollingu.
- Automatický návrat celej mapy na Garmin už pri prvej chybnej Freemap
  dlaždici, aby sa podklady nezmiešali.
- Overený rozsah Freemap je zoom 2 až 20. Na hranici rozšírenie zablokuje iba
  ďalší pohyb smerom mimo rozsahu; opačný smer zostáva funkčný.
- Žiadny externý server rozšírenia, API kľúč, telemetria ani analytika.

Manifest nežiada žiadne položky v `permissions` ani `host_permissions`.
Obsahový skript je obmedzený match vzorom na `https://connect.garmin.com/*`.

## Súkromie

Rozšírenie nič neukladá a nikam neposiela Garmin prihlasovacie údaje, trasu ani
iné používateľské dáta. Pri zapnutí Freemap prehliadač nevyhnutne požaduje
zvolené mapové dlaždice (teda ich `z/x/y`) zo servera Freemap.sk. Pre tieto
obrázky rozšírenie nastaví `referrerpolicy=no-referrer`, aby požiadavka
neobsahovala URL stránky Garmin Connect.

## Automatické testy

Testy možno bez inštalácie otvoriť v prehliadači zo súboru
`test/browser.html`. Výsledok musí byť `PASS: 22 testov, 0 chýb`.

Ak je dostupný Node.js, rovnakú produkčnú prevodovú logiku overí aj jeho
vstavaný test runner; žiadne balíčky sa neinštalujú.

```powershell
npm test
npm run check
```

Testy pokrývajú aktuálny Google `vt?pb=` formát, odmietnutie neznámych alebo
neplatných URL a samostatný historický hexadecimálny parser. Historický parser
nie je zapojený do produkčnej výmeny dlaždíc.

## Načítanie cez Load unpacked

1. V Chrome otvor `chrome://extensions`.
2. Vpravo hore zapni **Developer mode**.
3. Klikni **Load unpacked**.
4. Vyber celý priečinok `D:\dev\GarminFreemap`.
5. Otvor alebo obnov Garmin Connect. Na podporovanej Leaflet mape sa hore
   uprostred zobrazí prepínač **Garmin / Freemap**.

Po úprave zdrojov treba na `chrome://extensions` kliknúť pri rozšírení na
ikonu obnovenia a následne obnoviť stránku Garmin Connect.

## Manuálny test

Na detaile aktivity aj v plánovači over:

1. Garmin mapa je predvolená.
2. **Freemap** zmení iba podklad a zobrazí atribúciu.
3. Trasa, body a prekrytia zostanú na rovnakom mieste.
4. Zoom a posúvanie načítajú nové Freemap dlaždice.
5. Na zoome 20 už Freemap nepovolí zoom in a na zoome 2 nepovolí zoom out;
   mapa sa pritom sama neprepne na Garmin.
6. Ak Freemap zapneš z Garmin zoomu mimo rozsahu 2–20, mapa sa najprv presunie
   na najbližší podporovaný zoom a až potom zmení podklad.
7. **Garmin** okamžite vráti pôvodný podklad.
8. Zmena podkladu nemení výsledok routingu v plánovači.

Fallback možno otestovať v DevTools cez **Network request blocking** pre vzor
`*://outdoor.tiles.freemap.sk/*`. Po prvej chybnej dlaždici sa má aktivovať
Garmin mapa a zobraziť krátke upozornenie. Po teste blokovanie vypni.

Podrobnosti prieskumu sú v [docs/technical-research.md](docs/technical-research.md).
