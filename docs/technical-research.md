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

Historický formát `L11/R0000030F/C000001E4.png` nebol na aktuálnych stránkach
pozorovaný. Jeho parser zostáva izolovaný a produkčný obsahový skript ho
nepoužíva.

## Rozhodnutie pre MVP

Obsahový skript pracuje v izolovanom svete rozšírenia a sleduje iba elementy
`img`, ktorých URL presne zodpovedá overenej doméne, ceste, štruktúre parametra
`pb` a veľkosti 256 px. Mení len ich `src`. SVG, canvas, markery, trasa, routing
a ostatné požiadavky Garminu nemení.

Prepínač sa pripája iba k verejnému koreňovému elementu Leafletu
`.leaflet-container`. Ak Garmin knižnicu alebo DOM zmení, prototyp zlyhá
bezpečne: nepripojí ovládanie a pôvodnú mapu nezmení. Presnú podporu plánovača
treba potvrdiť prvým testom cez Load unpacked.

Tri chyby Freemap dlaždíc počas desiatich sekúnd aktivujú istič, vypnú Freemap
a obnovia uložené pôvodné Garmin URL. Jednotlivá chybná dlaždica sa obnoví
okamžite.

Garmin pri zoome niektoré nové alebo recyklované obrázky podkladu sprístupní až
po prvotnej DOM mutácii. Preto je popri `MutationObserver` aktívny aj úzky
250 ms watchdog, ale iba počas zapnutého Freemap. Kontroluje výhradne `img[src]`
vnútri `.leaflet-container`; nevykonáva sieťové volania a pri návrate na Garmin
sa zastaví.
