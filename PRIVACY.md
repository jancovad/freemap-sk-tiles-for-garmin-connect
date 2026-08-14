# Zásady ochrany súkromia

Posledná aktualizácia: 14. augusta 2026

Tieto zásady sa vzťahujú na neoficiálne Chrome rozšírenie **Garmin Freemap
Outdoor**. Rozšírenie má jediný účel: umožniť používateľovi zobraziť Freemap.sk
Outdoor ako alternatívny mapový podklad vo webovom Garmin Connect.

## Údaje ukladané rozšírením

Rozšírenie ukladá do `chrome.storage.local` iba jednu používateľskú preferenciu:

- `preferredMapMode`: hodnota `garmin` alebo `freemap`.

Táto hodnota zostáva lokálne v profile Chrome. Vývojár ju neprijíma a nemá k
nej vzdialený prístup. Používateľ ju môže zmeniť prepínačom podkladu alebo
odstrániť vymazaním údajov či odinštalovaním rozšírenia.

## Spracovanie mapových údajov

Pri zapnutom podklade Freemap rozšírenie lokálne prečíta súradnice Garmin
podkladových dlaždíc a prevedie ich na formát `z/x/y`. Neukladá ich do histórie,
databázy ani analytiky.

Prehliadač následne požaduje iba dlaždice potrebné pre aktuálne zobrazenú časť
mapy priamo zo servera:

`https://outdoor.tiles.freemap.sk/{z}/{x}/{y}`

Súradnice dlaždíc môžu približne vyjadrovať geografickú oblasť, ktorú si
používateľ pozerá. Server Freemap Slovakia pri bežnej HTTPS požiadavke môže
spracovať aj štandardné sieťové údaje, napríklad IP adresu, čas požiadavky a
hlavičky prehliadača. Rozšírenie nastavuje `referrerpolicy=no-referrer`,
nepridáva Garmin prihlasovacie údaje a neposiela URL stránky Garmin Connect.

Spracovanie na serveroch Garmin Connect, Freemap Slovakia a OpenStreetMap sa
riadi vlastnými podmienkami týchto prevádzkovateľov a nie týmito zásadami.

## Údaje, ktoré rozšírenie nezhromažďuje

Vývojár prostredníctvom rozšírenia nezhromažďuje ani neprijíma:

- Garmin prihlasovacie údaje alebo cookies;
- obsah aktivít, trás, bodov či profilu;
- presnú polohu zariadenia;
- históriu prehliadania;
- analytiku, telemetriu alebo reklamné identifikátory.

Rozšírenie nemá vlastný server a údaje nepredáva ani neposkytuje na reklamné
účely. Nevykonáva hromadné ani offline sťahovanie mapových dlaždíc.

## Oprávnenia

- `storage` – výhradne na uloženie hodnoty `garmin` alebo `freemap`.
- obsahový skript je obmedzený na `https://connect.garmin.com/*` a slúži iba na
  prepnutie mapového podkladu.

Manifest nežiada `host_permissions` a rozšírenie nespúšťa vzdialený kód.

## Zmeny a kontakt

Zmeny týchto zásad budú zaznamenané v repozitári projektu. Pred verejným
zverejnením treba na toto miesto doplniť URL verejného repozitára a kontaktný
e-mail vývojára. Kým tieto údaje nie sú doplnené, dokument je pracovným návrhom
a rozšírenie nemá byť odoslané do Chrome Web Store.
