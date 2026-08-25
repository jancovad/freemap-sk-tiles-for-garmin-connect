# Zásady ochrany súkromia

Posledná aktualizácia: 25. augusta 2026

Tieto zásady sa vzťahujú na neoficiálne Chrome rozšírenie **Outdoor tiles from
Freemap.sk for Garmin Connect**. Jeho jediným účelom je zobraziť Freemap.sk
Outdoor ako voliteľný mapový podklad vo webovom Garmin Connect.

## Transparentnosť pred inštaláciou

Záznam v Chrome Web Store musí pred inštaláciou výrazne uviesť, že zapnutie
Freemap odošle Freemap Slovakia súradnice viditeľných dlaždíc, statický
identifikátor aplikácie a štandardné sieťové údaje. Rovnaké informácie sú
uvedené v týchto zásadách a v Store Privacy deklarácii.

## Údaje ukladané rozšírením

Rozšírenie ukladá do `chrome.storage.local` iba `preferredMapMode` s hodnotou
`garmin` alebo `freemap`. Verzia 0.5.2 pri prvom načítaní odstráni zastaranú
hodnotu `freemapDisclosureAccepted`, ktorú používala nevydaná testovacia verzia.

Vývojár túto hodnotu neprijíma a nemá k nej vzdialený prístup. Používateľ ju môže
zmeniť výberom poskytovateľa v natívnych nastaveniach mapy Garmin Connect alebo
odstrániť vymazaním údajov či odinštalovaním rozšírenia. Bezpečnostný návrat pri
chybe nemení uloženú preferenciu.

## Spracovanie mapových údajov

Pri zapnutom Freemap rozšírenie lokálne prevedie súradnice viditeľných Garmin
dlaždíc na `z/x/y`. Neukladá ich do databázy, histórie ani analytiky. Prehliadač
potom požaduje iba dlaždice potrebné pre aktuálne zobrazenie priamo zo servera:

`https://outdoor.tiles.freemap.sk/{z}/{x}/{y}[@2x|@3x|@4x]?app=garmin-connect-ext`

Voliteľná prípona zodpovedá rozlíšeniu displeja. Parameter
`app=garmin-connect-ext` je statický identifikátor rovnaký pre všetkých
používateľov; Freemap Slovakia ním vie priradiť prevádzku tomuto rozšíreniu.
Nie je to používateľský ani reklamný identifikátor.

Súradnice dlaždíc môžu približne vyjadrovať geografickú oblasť, ktorú si
používateľ pozerá. Server Freemap Slovakia môže pri bežnej HTTPS požiadavke
spracovať štandardné sieťové údaje, napríklad IP adresu, čas a hlavičky
prehliadača. Rozšírenie nastavuje `referrerpolicy=no-referrer`, nepridáva Garmin
cookies ani prihlasovacie údaje a neposiela URL stránky Garmin Connect.

Spracovanie na serveroch Garmin Connect, Freemap Slovakia a OpenStreetMap sa
riadi vlastnými podmienkami týchto prevádzkovateľov.

## Údaje, ktoré rozšírenie nezhromažďuje

Vývojár prostredníctvom rozšírenia nezhromažďuje ani neprijíma:

- Garmin prihlasovacie údaje alebo cookies;
- obsah aktivít, trás, bodov či profilu;
- polohu získanú z geolokačného API zariadenia;
- históriu prehliadania;
- analytiku, telemetriu alebo reklamné identifikátory.

Rozšírenie nemá vlastný server, údaje nepredáva a nepoužíva ich na reklamu.
Nevykonáva hromadné, offline ani preventívne sťahovanie mapových dlaždíc.

## Oprávnenia

- `storage` – iba na vyššie uvedenú lokálnu preferenciu a jednorazové
  odstránenie zastaranej testovacej hodnoty;
- obsahové skripty sú obmedzené na `https://connect.garmin.com/*` a slúžia na
  prepnutie podkladových obrázkov pri zachovaní Garmin vrstiev.

Manifest nežiada `host_permissions` a rozšírenie nespúšťa vzdialený kód.

## Obmedzené použitie údajov

Používanie údajov týmto rozšírením je obmedzené výhradne na jeho jediný
zverejnený účel: zobrazenie voliteľného podkladu Freemap.sk Outdoor vo webovom
Garmin Connect. Rozšírenie a vývojár dodržiavajú pravidlá Chrome Web Store User
Data Policy vrátane požiadaviek Limited Use.

Údaje sa nepredávajú, nepoužívajú na personalizovanú reklamu, hodnotenie
úverovej schopnosti ani na účely nesúvisiace s touto funkciou. Tretím stranám sa
prenášajú iba viditeľné súradnice dlaždíc a štandardné sieťové údaje serveru
Freemap Slovakia v rozsahu nevyhnutnom na načítanie používateľom zvoleného
mapového podkladu.

## Zmeny a kontakt

Zmeny budú zaznamenané vo
[verejnom repozitári projektu](https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect).
Otázky a problémy možno nahlásiť cez
[GitHub Issues](https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect/issues).
Vývojára možno kontaktovať na
[jancovic@gmail.com](mailto:jancovic@gmail.com).
