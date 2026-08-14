# Návrh záznamu pre Chrome Web Store

Stav: **pracovný návrh – neodosielať na posúdenie**

## Blokujúce podmienky

- písomné potvrdenie Freemap Slovakia o použití tile servera a atribúcii;
- kontaktný e-mail vývojára;
- finálne screenshoty z aktuálnej verzie;
- kontrola, že Store ZIP vznikol z rovnakého commitu ako verejný zdrojový kód.

## Verejné odkazy

- Repozitár: <https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect>
- Zásady ochrany súkromia: <https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect/blob/main/PRIVACY.md>
- Podpora: <https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect/issues>

## Identita

Vybraný názov:

`Freemap.sk tiles for Garmin Connect`

Manifestový názov je zjednotený s vybraným názvom.
Názov nesmie vyvolávať dojem, že ide o oficiálny produkt Garmin alebo Freemap
Slovakia.

## Krátky popis

`Pridá prepínač Freemap.sk Outdoor do máp Garmin Connect bez zmeny trás a routingu.`

Krátky popis má menej ako 132 znakov a neobsahuje marketingové superlatívy.

## Jediný účel

Rozšírenie umožňuje používateľovi prepínať pôvodný mapový podklad vo webovom
Garmin Connect na Freemap.sk Outdoor, pričom zachová Garmin trasu, body,
ovládanie mapy a routing.

## Dlhý popis

Freemap.sk tiles for Garmin Connect je neoficiálne open-source rozšírenie,
ktoré pridáva do podporovaných máp Garmin Connect prepínač Garmin/Freemap.

Hlavné funkcie:

- podklad Freemap.sk Outdoor na detaile aktivity a v plánovači trás;
- zachovanie Garmin trás, bodov, prekrytí, ovládania a routingu;
- automatické prispôsobenie zoomu na podporovaný rozsah Freemap 2–20;
- bezpečný návrat na pôvodnú mapu pri chybe dlaždice;
- lokálne zapamätanie posledného zvoleného podkladu;
- povinná viditeľná atribúcia mapových zdrojov;
- bez analytiky, reklám, API kľúčov a servera prevádzkovaného vývojárom.

Pri zapnutom Freemap prehliadač požaduje viditeľné mapové dlaždice priamo zo
servera Freemap Slovakia. Rozšírenie nie je vytvorené, podporované ani schválené
spoločnosťou Garmin, Freemap Slovakia alebo OpenStreetMap Foundation.

## Zdôvodnenie oprávnení

### `storage`

Ukladá iba jednu hodnotu `preferredMapMode` s obsahom `garmin` alebo `freemap`,
aby sa pri ďalšom otvorení mapy obnovila používateľova voľba. Neukladajú sa
trasy, polohy, účty ani história.

### Prístup k Garmin Connect

Obsahové skripty sú obmedzené na `https://connect.garmin.com/*`. Prístup je
potrebný na rozpoznanie podkladových mapových obrázkov, pridanie prepínača a
zachovanie existujúcich Garmin vrstiev. Rozšírenie nečíta prihlasovacie údaje a
nemení routing.

### Vzdialené zdroje

Rozšírenie nespúšťa vzdialený kód. Zo servera
`https://outdoor.tiles.freemap.sk` načítava iba mapové obrázky potrebné pre
aktuálne zobrazenie.

## Návrh Privacy deklarácie

Deklarácia v Dashboarde musí presne zodpovedať súboru `PRIVACY.md`:

- lokálne uložená preferencia mapového podkladu;
- pri Freemap sa tretej strane odošlú súradnice viditeľných dlaždíc `z/x/y` a
  bežné sieťové metadáta HTTPS požiadavky;
- súradnice dlaždíc môžu približne identifikovať zobrazovanú geografickú oblasť;
- nepoužíva sa geolokačné API zariadenia;
- žiadna analytika, reklama, predaj údajov ani prístup vývojára k údajom;
- žiadne Garmin prihlasovacie údaje, trasy alebo profilové dáta sa neposielajú
  vývojárovi ani na jeho server.

Ak Dashboard klasifikuje mapové dlaždice ako údaje o polohe, treba túto
kategóriu radšej transparentne označiť a vysvetliť, že ide o zobrazovanú oblasť,
nie polohu získanú zo zariadenia. Pred odoslaním treba porovnať všetky zaškrtnuté
kategórie s aktuálnym formulárom Chrome Web Store.

## Grafické podklady

- Store ikona: `assets/icon128.png`;
- minimálne jeden screenshot 1280 × 800 px, najviac päť;
- odporúčané screenshoty:
  1. detail aktivity s Garmin podkladom a prepínačom;
  2. rovnaký detail s Freemap a viditeľnou atribúciou;
  3. plánovač trás s Freemap, bodmi a trasou;
  4. správanie na hranici zoomu;
  5. automatický návrat na Garmin pri chybe;
- voliteľný malý promo obrázok 440 × 280 px;
- voliteľný marquee obrázok 1400 × 560 px.

Na screenshotoch treba skryť meno, profilovú fotografiu, názvy súkromných trás,
presnú domácu polohu a ostatné osobné údaje.

## Testovacie pokyny pre posudzovateľa

1. Prihlásiť sa do Garmin Connect vlastným testovacím účtom.
2. Otvoriť detail aktivity alebo plánovač trás.
3. Použiť prepínač Garmin/Freemap nad mapou.
4. Overiť, že sa zmení iba podklad a trasa aj routing zostanú zachované.

Rozšírenie neposkytuje ani nevyžaduje testovacie Garmin prihlasovacie údaje.

## Distribúcia

Prvé vydanie má byť bezplatné. Odporúčaný postup je najprv obmedzený test s
dôveryhodnými testermi a až po výsledku kontroly a súhlase Freemap Slovakia
verejná distribúcia. Samotné odoslanie na posúdenie ani publikovanie nie je
súčasťou tejto prípravy.
