# Návrh záznamu pre Chrome Web Store

Stav: **pracovný návrh – neodosielať na posúdenie**

## Zostávajúce podmienky

- kontaktný e-mail vývojára;
- finálne anonymizované screenshoty;
- úspešný test aktuálneho ZIP balíka na oboch cieľových stránkach;
- Privacy deklarácia v Store Dashboarde zhodná so skutočným správaním;
- kontrola, že Store ZIP vznikol z rovnakého označeného commitu ako verejný
  zdrojový kód.

Písomný súhlas Freemap Slovakia bol prijatý 17. augusta 2026 a jeho podmienky
sú zapracované v kóde aj v
[zhrnutí súhlasu](freemap-permission-summary.md).

## Verejné odkazy

- Repozitár: <https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect>
- Zásady ochrany súkromia: <https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect/blob/main/PRIVACY.md>
- Podpora: <https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect/issues>

## Identita

Názov odsúhlasený Freemap Slovakia:

`Outdoor tiles from Freemap.sk for Garmin Connect`

Rozšírenie nepoužíva logo Freemap. V popise je jasne označené ako neoficiálny
komunitný projekt a nevyvoláva dojem produktu Garmin alebo Freemap Slovakia.

## Krátky popis

`Pridá neoficiálny prepínač Freemap.sk Outdoor do máp Garmin Connect bez zmeny trás a routingu.`

## Jediný účel

Rozšírenie umožňuje prepínať pôvodný mapový podklad vo webovom Garmin Connect
na Freemap.sk Outdoor, pričom zachová Garmin trasu, body, ovládanie a routing.

## Dlhý popis

Outdoor tiles from Freemap.sk for Garmin Connect je neoficiálne open-source
rozšírenie, ktoré pridáva do podporovaných máp Garmin Connect prepínač
Garmin/Freemap.

Hlavné funkcie:

- Freemap.sk Outdoor na detaile aktivity a v plánovači trás;
- zachovanie Garmin trás, bodov, prekrytí, ovládania a routingu;
- rozsah zoomu 5–18 a automatické prispôsobenie pri prepnutí;
- ostré dlaždice `@2x`, `@3x` alebo `@4x` podľa displeja;
- bezpečný návrat na pôvodnú mapu pri chybe dlaždice;
- úvodná informácia pred prvým pripojením k serveru Freemap;
- lokálne zapamätanie potvrdenia a posledného podkladu;
- viditeľná atribúcia Freemap, OpenStreetMap/ODbL a zdrojov výškových dát;
- bez analytiky, reklám, API kľúčov a servera prevádzkovaného vývojárom.

Pri zapnutom Freemap prehliadač požaduje iba viditeľné mapové dlaždice priamo
zo servera Freemap Slovakia. Rozšírenie nie je vytvorené, podporované ani
schválené spoločnosťou Garmin ani OpenStreetMap Foundation a nie je oficiálnym
produktom Freemap Slovakia.

## Zdôvodnenie oprávnení

### `storage`

Ukladá iba `preferredMapMode` (`garmin` alebo `freemap`) a
`freemapDisclosureAccepted` (či bola potvrdená úvodná informácia). Hodnoty
zostávajú lokálne v Chrome. Neukladajú sa trasy, polohy, účty ani história.

### Prístup k Garmin Connect

Obsahové skripty sú obmedzené na `https://connect.garmin.com/*`. Rozpoznajú
podkladové mapové obrázky, pridajú prepínač a zachovajú existujúce Garmin
vrstvy. Nečítajú prihlasovacie údaje a nemenia routing.

### Vzdialené zdroje

Rozšírenie nespúšťa vzdialený kód. Z `https://tiles.freemap.sk` načítava iba
obrázky aktuálne viditeľných dlaždíc. URL obsahuje statický parameter
`app=garmin-connect-ext` na identifikáciu prevádzky rozšírenia. Obrázky majú
`referrerpolicy=no-referrer`.

## Návrh Privacy deklarácie

Deklarácia v Dashboarde musí presne zodpovedať súboru `PRIVACY.md`:

- lokálne uložená preferencia a potvrdenie úvodnej informácie;
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
  1. úvodná informácia pred prvým zapnutím;
  2. detail aktivity s Freemap a viditeľnou atribúciou;
  3. plánovač trás s Freemap, bodmi a trasou;
  4. správanie na hranici zoomu;
  5. automatický návrat na Garmin pri chybe.

Na screenshotoch treba skryť meno, profilovú fotografiu, súkromné názvy trás,
domácu polohu a ostatné osobné údaje.

## Testovacie pokyny pre posudzovateľa

1. Prihlásiť sa do Garmin Connect vlastným testovacím účtom.
2. Otvoriť detail aktivity alebo plánovač trás.
3. Kliknúť Freemap, prečítať úvodnú informáciu a potvrdiť ju.
4. Overiť, že sa zmení iba podklad a trasa aj routing zostanú zachované.
5. Overiť viditeľnú atribúciu a návrat cez tlačidlo Garmin.

Rozšírenie neposkytuje ani nevyžaduje testovacie Garmin prihlasovacie údaje.

## Distribúcia

Prvé vydanie bude bezplatné a nekomerčné. Najprv prebehne obmedzený test s
dôveryhodnými testermi. Samotné odoslanie na posúdenie ani publikovanie nie je
súčasťou tejto prípravy.
