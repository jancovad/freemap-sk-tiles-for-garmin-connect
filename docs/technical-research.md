# Technický prieskum Garmin Connect

Stav k 13. augustu 2026. Zistenia pochádzajú z Chrome DevTools na prihlásených
stránkach Garmin Connect; nejde o predpokladané interné API.

## Aktualizácia 17. augusta 2026

Freemap Slovakia následne potvrdila produkčné podmienky, ktoré majú prednosť
pred pôvodnými odhadmi z jednotlivých HTTP požiadaviek:

- endpoint `https://outdoor.tiles.freemap.sk/{z}/{x}/{y}`;
- generický host `https://tiles.freemap.sk` vracia pre rovnaké súradnice
  zástupný podklad „no map data“ a nesmie sa používať ako Outdoor vrstva;
- zoom 5–18; zoomy 19–20 sú vyhradené pre premium používateľov;
- prípony `@2x`, `@3x`, `@4x` podľa `devicePixelRatio`, bez `detectRetina`;
- statický parameter `?app=garmin-connect-ext` pri zachovaní no-referrer;
- rozšírená atribúcia a odkaz na aktuálne zdroje výškových dát.

Kontrola pravidiel Chrome Web Store z 17. augusta 2026 potvrdila, že zber
údajov musí byť prominentne zverejnený, no oficiálne pokyny pripúšťajú
zverejnenie v Store zázname pred inštaláciou. Samostatný modal v mape bol preto
odstránený ako rušivý; Store draft a privacy policy obsahujú úplný opis.

Použité oficiálne zdroje:

- <https://developer.chrome.com/blog/cws-policy-updates-2026>;
- <https://developer.chrome.com/docs/webstore/troubleshooting/#user-data-policy-prominent-disclosure>.

## Overené zistenia

- Detail aktivity zobrazuje mapu cez Leaflet.
- Podkladové obrázky prichádzajú z `https://maps.googleapis.com/maps/vt`.
- Parameter `pb` obsahuje dlaždicu v tvare
  `!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256`.
- Na detaile aktivity bola pozorovaná dlaždica `z=12, x=2264, y=1404`.
- Pri ďalšom zoome bola pozorovaná dlaždica `z=14, x=9055, y=5621`.
- Plánovač trás načítava rovnaký druh `maps.googleapis.com/maps/vt` dlaždíc.
- Trasa, body, červené mapové prekrytia a ovládacie prvky sú vizuálne oddelené
  od podkladových dlaždíc.
- `https://outdoor.tiles.freemap.sk/12/2264/1404` odpovedal stavom HTTP 200
  a typom `image/jpeg` aj bez prípony súboru.
- Pri pôvodnom overení rovnakého bodu cez `HEAD` server odpovedal pre zoom 2 až
  20. Z toho odvodený rozsah 2–20 však nevyjadroval licenčné a produktové
  obmedzenia a bol nahradený prevádzkovateľom potvrdeným rozsahom 5–18.

Historický formát `L11/R0000030F/C000001E4.png` nebol na aktuálnych stránkach
pozorovaný. Jeho parser zostáva izolovaný a produkčný obsahový skript ho
nepoužíva.

## Rozhodnutie pre MVP

Malý skript v `MAIN` svete sa načíta pri `document_start` a synchrónne zachytí
iba nastavenie `src` na viditeľnej kópii pod `.leaflet-tile`, ktorej URL presne
zodpovedá overenej doméne, ceste, štruktúre parametra `pb` a veľkosti 256 px.
Skrytý Google Mutant zdroj nechá nedotknutý, aby Garminov adaptér dokončil svoj
natívny `load` a klonovací cyklus. Až URL viditeľnej kópie prevedie na Freemap.
SVG, canvas, markery, trasa, routing a ostatné požiadavky Garminu nemení.

Prepínač a atribúcia zostávajú v izolovanom svete rozšírenia. S hlavným skriptom
komunikujú iba troma lokálnymi DOM udalosťami: zapnúť, vypnúť a chyba. Žiadny
obsah ani používateľské dáta sa cez ne neprenášajú.

Prepínač sa pripája iba k verejnému koreňovému elementu Leafletu
`.leaflet-container`. Ak Garmin knižnicu alebo DOM zmení, prototyp zlyhá
bezpečne: nepripojí ovládanie a pôvodnú mapu nezmení. Presnú podporu plánovača
treba potvrdiť prvým testom cez Load unpacked.

Chyba Freemap dlaždice aktivuje istič, vypne Freemap a obnoví celú Garmin mapu,
aby nevznikla zmiešaná mozaika. Pôvodná Garmin URL je počas prepnutia uložená
v pamäti aj v dočasnom atribúte príslušného `img`. Leafletový klon dlaždice tak
zdedí informáciu potrebnú na obnovu. Atribút sa pri návrate na Garmin odstráni;
nič sa neukladá na disk ani neodosiela.

Prvá verzia menila `src` až cez `MutationObserver`. Ďalšia verzia menila aj
skryté zdrojové Google obrázky, čím prerušila Garminov klonovací cyklus. Aktuálna
verzia zachytáva setter iba na viditeľnej Leaflet dlaždici a používa úzky
`MutationObserver` ako fallback, keď wrapper dostane triedu až po nastavení URL.
Nevykonáva polling.

Po prepnutí na Garmin prebehne ešte niekoľko krátkych obnovovacích kontrol počas
1,5 sekundy. Zachytia dlaždice, ktoré Leaflet vytvorí až pri dobiehajúcej zoom
animácii.

Pri zapnutom Freemap izolovaný UI skript na zoomoch 5 a 18 zachytí vstupy smerom
mimo podporovaného rozsahu ešte pred Leafletom. Platí to pre tlačidlá `+/-`,
koliesko, dvojklik, klávesnicu a dotykové gesto. Garmin routing ani vrstva trasy
sa nemenia. Po prepnutí na Garmin sa obmedzenie odstráni.

Od verzie 0.5.3 si UI pri každom povolenom vstupe synchronicky eviduje očakávaný
zoom. Ďalší impulz preto zablokuje už pri očakávanej hranici 5 alebo 18, aj keď
Leaflet ešte nestihol vytvoriť dlaždice novej úrovne. Stav sa zosúladí s novými
dlaždicami a pri každom prepnutí podkladu sa zahodí.

Ak používateľ zapne Freemap z Garmin zoomu mimo rozsahu 5–18, UI najprv cez
existujúce Leaflet tlačidlo `+` alebo `−` nastaví najbližšiu hranicu. Freemap
zapne až po rozpoznaní dlaždíc cieľového zoomu. Pri chýbajúcom ovládaní alebo
časovom limite zostane bezpečne zapnutá Garmin mapa.

Od verzie 0.5.4 prebiehajú tieto interné kliknutia vo vlastnom režime s vypnutou
Freemap ochranou hraníc. UI cieli presne na zoom 5 alebo 18, stav priebežne
kontroluje a pri oneskorenej Garmin animácii môže kliknutie v krátkom časovom
limite zopakovať. Freemap sa zapne až po rozpoznaní presnej cieľovej úrovne.

Od verzie 0.5.2 izolovaný UI skript používa `chrome.storage.local` iba na
zapamätanie hodnoty `garmin` alebo `freemap`. Pri prvom načítaní odstráni
zastaranú hodnotu `freemapDisclosureAccepted` z nevydanej testovacej verzie.
Nastavenie sa aplikuje až po nájdení podporovanej Leaflet mapy. Chyba dlaždice
preferenciu neprepíše. Manifest preto stále obsahuje jediné oprávnenie
`storage`.
