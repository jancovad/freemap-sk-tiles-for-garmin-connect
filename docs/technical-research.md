# Technický prieskum Garmin Connect

Stav k 13. augustu 2026. Zistenia pochádzajú z Chrome DevTools na prihlásených
stránkach Garmin Connect; nejde o predpokladané interné API.

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
- Pri overení rovnakého bodu cez `HEAD` vrátil Freemap dlaždice pre zoom 2 až
  20; zoomy 0–1 neboli dostupné a zoomy 21–22 vrátili HTTP 404. Produkčný
  rozsah je preto explicitne 2–20.

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

Pri zapnutom Freemap izolovaný UI skript na zoomoch 2 a 20 zachytí vstupy smerom
mimo podporovaného rozsahu ešte pred Leafletom. Platí to pre tlačidlá `+/-`,
koliesko, dvojklik, klávesnicu a dotykové gesto. Garmin routing ani vrstva trasy
sa nemenia. Po prepnutí na Garmin sa obmedzenie odstráni.
