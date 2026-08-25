# Outdoor tiles from Freemap.sk for Garmin Connect

Neoficiálne komunitné Chrome rozšírenie pre webový Garmin Connect. Do natívneho
dialógu **Nastavenia mapy** pridáva poskytovateľa **Freemap.sk** a mení výhradne
podkladové dlaždice na Freemap.sk Outdoor.

Nie je vytvorené, podporované ani schválené spoločnosťou Garmin ani
OpenStreetMap Foundation. Freemap Slovakia písomne povolila použitie svojho
verejného tile servera pre toto bezplatné nekomerčné rozšírenie za podmienok
zhrnutých v [dokumentácii súhlasu](docs/freemap-permission-summary.md). Súhlas
neznamená, že ide o oficiálny produkt Freemap Slovakia.

Zdrojový kód je licencovaný pod [MIT licenciou](LICENSE). Táto licencia sa
nevzťahuje na mapové dáta ani na právo používať tile server v inom alebo
komerčnom projekte.

Verejný repozitár: <https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect>

## Funkcie

- Chrome Manifest V3.
- Detail aktivity a plánovač/editor trás.
- Voľba Freemap.sk priamo v natívnom zozname poskytovateľov mapy Garmin Connect.
- Zachovanie Garmin trasy, bodov, prekrytí, ovládania mapy a routingu.
- Viditeľná atribúcia Freemap Slovakia, OpenStreetMap/ODbL a odkaz na aktuálne
  zdroje výškových dát.
- Freemap zoom 5 až 18. Na hranici sa zablokuje iba pohyb mimo rozsahu.
- Ak sa Freemap zapína z Garmin zoomu mimo rozsahu, mapa sa najprv presunie na
  najbližší podporovaný zoom.
- Dlaždice `@2x`, `@3x` alebo `@4x` podľa `devicePixelRatio` displeja.
- Automatický návrat celej mapy na Garmin už pri prvej chybnej Freemap
  dlaždici, aby sa podklady nezmiešali.
- Lokálne zapamätanie posledného ručne zvoleného podkladu.
- Žiadny externý server rozšírenia, API kľúč, telemetria, reklama ani analytika.
- Žiadne hromadné, offline ani preventívne sťahovanie dlaždíc.

Manifest žiada iba oprávnenie `storage` a nežiada `host_permissions`. Obsahové
skripty sú obmedzené na `https://connect.garmin.com/*`.

## Dlaždice a súkromie

Po kliknutí na **Freemap** prehliadač požaduje viditeľné dlaždice priamo zo
servera Freemap Slovakia v tvare:

`https://outdoor.tiles.freemap.sk/{z}/{x}/{y}[@2x|@3x|@4x]?app=garmin-connect-ext`

Parameter `app` je rovnaký pre všetkých používateľov a umožňuje Freemap Slovakia
rozpoznať prevádzku rozšírenia; nejde o identifikátor používateľa. Obrázky majú
`referrerpolicy=no-referrer`, takže požiadavka neobsahuje URL Garmin Connect.
Server pri bežnej HTTPS komunikácii môže spracovať súradnice dlaždíc, IP adresu
a štandardné sieťové hlavičky. Rozšírenie neposiela Garmin účet, cookies, trasu
ani URL stránky. Podrobnosti sú v [zásadách ochrany súkromia](PRIVACY.md).

## Automatické testy

Bez inštalácie otvor v Chrome súbor `test/browser.html`. Očakávaný výsledok je
`PASS: 30 testov, 0 chýb`. Súbor `test/preference-browser.html` samostatne
overuje obnovenie uloženej voľby Freemap a odstránenie zastaranej hodnoty
z predchádzajúcej testovacej verzie. Súbor `test/native-provider-browser.html`
overuje vloženie Freemap.sk do Garmin listboxu, synchronizáciu dialógu, návrat
na natívneho poskytovateľa a obnovu po React prekreslení; očakáva sa
`PASS: 6 testov, 0 chýb`.

Ak je dostupný Node.js, prevodovú logiku overí jeho vstavaný test runner bez
inštalovania balíkov:

```powershell
npm test
npm run check
```

Testy pokrývajú aktuálny Google `vt?pb=` formát, zoom 5–18, retina prípony,
identifikátor aplikácie, priame prepnutie bez modalu, fallback a samostatný historický
hexadecimálny parser. Historický parser sa v produkcii nepoužíva.

## Načítanie cez Load unpacked

1. V Chrome otvor `chrome://extensions`.
2. Zapni **Developer mode**.
3. Klikni **Load unpacked**.
4. Vyber celý priečinok `D:\dev\GarminFreemap`.
5. Otvor alebo obnov Garmin Connect. V **Nastaveniach mapy** sa medzi
   poskytovateľmi zobrazí **Freemap.sk**.

Po zmene zdrojov klikni pri rozšírení na ikonu obnovenia a obnov aj stránku
Garmin Connect.

## Lokálny release balík

Produkčný ZIP bez testov, dokumentácie a vývojových súborov vytvorí PowerShell
skript bez externých závislostí:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-release.ps1
```

Skript overí Manifest V3, minimálne oprávnenia, Garmin Connect match vzory,
lokálne manifestové súbory a presný whitelist obsahu. Do `dist/` uloží ZIP a
jeho `.sha256`. Na čistý test rozbaľ ZIP do nového priečinka a cez **Load
unpacked** vyber tento rozbalený priečinok.

## Manuálny test

Na detaile aktivity aj v plánovači over:

1. Garmin mapa je predvolená.
2. Otvor natívne **Nastavenia mapy** cez ikonu vrstiev a vyber **Freemap.sk**.
3. Freemap okamžite zmení iba podklad, v dialógu skryje sekciu typu mapy a
   zobrazí všetky tri atribučné odkazy.
4. Trasa, body, prekrytia a routing zostanú nezmenené.
5. Zoom a posúvanie plynulo načítajú nové dlaždice so správnou retina príponou.
6. Na zoome 18 sa zablokuje zoom in a na zoome 5 zoom out bez prepnutia na
   Garmin.
7. Rýchla séria zoomovania z úrovne 17 alebo 6 skončí na hranici 18 alebo 5
   a podklad zostane Freemap.
8. Prepnutie z Garmin zoomu nad 18 alebo pod 5 najprv nastaví najbližšiu
   podporovanú hranicu.
9. Výber Google, HERE alebo OpenStreetMap v natívnom dialógu okamžite vypne
   Freemap a zachová zvolený Garmin podklad.
10. Voľba sa zachová po obnovení stránky a mapa nemá duplicitný horný prepínač.

V Network paneli filtruj `outdoor.tiles.freemap.sk`. URL má obsahovať
`?app=garmin-connect-ext` a podľa `window.devicePixelRatio` žiadnu príponu,
`@2x`, `@3x` alebo `@4x`.

Fallback otestuje Network request blocking so vzorom
`*://outdoor.tiles.freemap.sk/*`. Po prvej chybnej dlaždici sa má obnoviť Garmin mapa a
zobraziť upozornenie. Po teste blokovanie vypni.

Technické pozadie je v [docs/technical-research.md](docs/technical-research.md).

## Verejné vydanie

Freemap Slovakia súhlasila s použitím servera pre bezplatné nekomerčné
rozšírenie. Stabilnú verziu 0.6.0 overili dôveryhodní testeri bez hlásených
chýb. Pred odoslaním do Chrome Web Store ešte treba aktivovať účet vývojára,
dokončiť anonymizované screenshoty a Store privacy deklaráciu. Store
záznam musí ešte pred inštaláciou prominentne uviesť, že Freemap dostane
súradnice viditeľných dlaždíc a štandardné sieťové údaje.

- [zásady ochrany súkromia](PRIVACY.md)
- [third-party notices](THIRD_PARTY_NOTICES.md)
- [zhrnutie súhlasu Freemap Slovakia](docs/freemap-permission-summary.md)
- [pôvodná žiadosť](docs/freemap-permission-request-sk.md)
- [návrh záznamu Chrome Web Store](docs/chrome-web-store-draft-sk.md)
- [checklist verejného vydania](docs/public-release-checklist.md)
- [história zmien](CHANGELOG.md)
