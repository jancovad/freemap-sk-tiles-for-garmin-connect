# Návrh záznamu pre Chrome Web Store

Stav: **pracovný návrh – neodosielať na posúdenie**

## Zostávajúce podmienky

- aktivovaný účet vývojára v Chrome Web Store;
- finálne anonymizované screenshoty;
- Privacy deklarácia v Store Dashboarde zhodná so skutočným správaním;
- kontrola, že Store ZIP vznikol z rovnakého označeného commitu ako verejný
  zdrojový kód.

Písomný súhlas Freemap Slovakia bol prijatý 17. augusta 2026 a jeho podmienky
sú zapracované v kóde aj v
[zhrnutí súhlasu](freemap-permission-summary.md).

Testovací ZIP verzie 0.6.0 bol na detaile aktivity aj v plánovači trás overený
dôveryhodnými testermi bez hlásených chýb.

## Verejné odkazy

- Repozitár: <https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect>
- Zásady ochrany súkromia: <https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect/blob/main/PRIVACY.md>
- Kontakt: <mailto:jancovic@gmail.com>
- Podpora: <https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect/issues>

## Identita

Názov odsúhlasený Freemap Slovakia:

`Outdoor tiles from Freemap.sk for Garmin Connect`

Držiteľ copyrightu zdrojového kódu: **Vladimír Jančovič**.

Rozšírenie nepoužíva logo Freemap. V popise je jasne označené ako neoficiálny
komunitný projekt a nevyvoláva dojem produktu Garmin alebo Freemap Slovakia.

## Krátky popis

`Pridá Freemap.sk Outdoor medzi poskytovateľov máp Garmin Connect bez zmeny trás a routingu.`

## Jediný účel

Rozšírenie umožňuje prepínať pôvodný mapový podklad vo webovom Garmin Connect
na Freemap.sk Outdoor, pričom zachová Garmin trasu, body, ovládanie a routing.

## Povinné prominentné zverejnenie

Nasledujúci text musí byť výrazne uvedený v Store zázname ešte pred inštaláciou:

> Po zapnutí podkladu Freemap prehliadač odošle Freemap Slovakia súradnice
> aktuálne viditeľných mapových dlaždíc, statický identifikátor rozšírenia
> `garmin-connect-ext` a štandardné sieťové údaje, napríklad IP adresu. Je to
> potrebné výhradne na načítanie zvoleného mapového podkladu. Rozšírenie
> neposiela Garmin účet, cookies, trasu ani URL stránky a nepoužíva analytiku
> ani reklamu.

Tento text spolu s Privacy deklaráciou a inštaláciou zo Store nahrádza
samostatné potvrdenie v mape podľa aktuálnych pokynov Chrome Web Store.

## Dlhý popis

Outdoor tiles from Freemap.sk for Garmin Connect je neoficiálne open-source
rozšírenie, ktoré pridáva Freemap.sk medzi poskytovateľov v natívnych
nastaveniach mapy Garmin Connect.

Hlavné funkcie:

- Freemap.sk Outdoor na detaile aktivity a v plánovači trás;
- zachovanie Garmin trás, bodov, prekrytí, ovládania a routingu;
- rozsah zoomu 5–18 a automatické prispôsobenie pri prepnutí;
- ostré dlaždice `@2x`, `@3x` alebo `@4x` podľa displeja;
- bezpečný návrat na pôvodnú mapu pri chybe dlaždice;
- lokálne zapamätanie posledného podkladu;
- viditeľná atribúcia Freemap, OpenStreetMap/ODbL a zdrojov výškových dát;
- bez analytiky, reklám, API kľúčov a servera prevádzkovaného vývojárom.

Pri zapnutom Freemap prehliadač požaduje iba viditeľné mapové dlaždice priamo
zo servera Freemap Slovakia. Rozšírenie nie je vytvorené, podporované ani
schválené spoločnosťou Garmin ani OpenStreetMap Foundation a nie je oficiálnym
produktom Freemap Slovakia.

## Zdôvodnenie oprávnení

### `storage`

Ukladá iba `preferredMapMode` (`garmin` alebo `freemap`). Hodnota zostáva
lokálne v Chrome. Verzia 0.5.2 jednorazovo odstráni zastaranú disclosure
hodnotu z nevydanej testovacej verzie. Neukladajú sa trasy, polohy, účty ani
história.

### Prístup k Garmin Connect

Obsahové skripty sú obmedzené na `https://connect.garmin.com/*`. Rozpoznajú
podkladové mapové obrázky, doplnia Freemap.sk do natívneho výberu poskytovateľa
a zachovajú existujúce Garmin vrstvy. Nečítajú prihlasovacie údaje a nemenia
routing.

### Vzdialené zdroje

Rozšírenie nespúšťa vzdialený kód. Z `https://outdoor.tiles.freemap.sk` načítava iba
obrázky aktuálne viditeľných dlaždíc. URL obsahuje statický parameter
`app=garmin-connect-ext` na identifikáciu prevádzky rozšírenia. Obrázky majú
`referrerpolicy=no-referrer`.

## Návrh Privacy deklarácie

Deklarácia v Dashboarde musí presne zodpovedať súboru `PRIVACY.md`:

- lokálne uložená preferencia mapového podkladu;
- Freemap Slovakia dostane súradnice viditeľných dlaždíc `z/x/y`, statický app
  parameter a štandardné sieťové údaje vrátane IP adresy;
- súradnice môžu približne identifikovať zobrazovanú geografickú oblasť;
- nepoužíva sa geolokačné API zariadenia;
- žiadna analytika, reklama, predaj údajov ani prístup vývojára k údajom;
- neposielajú sa Garmin prihlasovacie údaje, cookies, trasy, profil ani URL
  stránky.

Ak Dashboard klasifikuje zobrazenú oblasť mapy ako údaje o polohe, treba túto
kategóriu transparentne označiť a vysvetliť, že nejde o polohu získanú zo
zariadenia. Pred odoslaním treba formulár porovnať s aktuálnymi pravidlami.

## Grafické podklady

- Store ikona: `assets/icon128.png`;
- minimálne jeden screenshot 1280 × 800 px, najviac päť;
- odporúčané screenshoty:
  1. natívne nastavenia mapy s poskytovateľom Freemap.sk na detaile aktivity;
  2. detail aktivity s Freemap, trasou a viditeľnou atribúciou;
  3. plánovač trás s Freemap, bodmi, trasou a otvorenými nastaveniami mapy;
  4. správanie na hranici zoomu;
  5. automatický návrat na Garmin pri chybe.

Na screenshotoch treba skryť meno, profilovú fotografiu, súkromné názvy trás,
domácu polohu a ostatné osobné údaje.

## Testovacie pokyny pre posudzovateľa

1. Prihlásiť sa do Garmin Connect vlastným testovacím účtom.
2. Otvoriť detail aktivity alebo plánovač trás.
3. Otvoriť natívne nastavenia mapy cez ikonu vrstiev a ako poskytovateľa vybrať
   Freemap.sk.
4. Overiť, že sa zmení iba podklad a trasa aj routing zostanú zachované.
5. Overiť viditeľnú atribúciu a návrat výberom pôvodného poskytovateľa v
   nastaveniach mapy.

Rozšírenie neposkytuje ani nevyžaduje testovacie Garmin prihlasovacie údaje.

## Distribúcia

Prvé vydanie bude bezplatné a nekomerčné. Najprv prebehne obmedzený test s
dôveryhodnými testermi. Samotné odoslanie na posúdenie ani publikovanie nie je
súčasťou tejto prípravy.
