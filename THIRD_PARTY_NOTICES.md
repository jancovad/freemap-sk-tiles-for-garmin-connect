# Third-party notices

Projekt neobsahuje mapové dáta ani dlaždice. Prehliadač ich pri zapnutom
Freemap načítava priamo od ich prevádzkovateľa.

## Freemap Slovakia

Outdoor mapové dlaždice poskytuje **Freemap Slovakia**:

- služba: `https://tiles.freemap.sk/{z}/{x}/{y}[@2x|@3x|@4x]`;
- projekt a aktuálne zdroje výškových dát: <https://www.freemap.sk/>;
- OZ Freemap Slovakia: <https://oz.freemap.sk/>.

Freemap Slovakia 17. augusta 2026 písomne udelila nevýhradný a bezodplatný
súhlas s použitím verejného Outdoor tile servera pre toto bezplatné,
nekomerčné rozšírenie. Súhlas môže byť odvolaný, najmä pri neprimeranej záťaži,
a služba nemá SLA ani garanciu dostupnosti. Rozšírenie nesťahuje dlaždice
hromadne, offline ani preventívne. Ak prevádzka výraznejšie narastie, vývojár sa
má vopred dohodnúť s Freemap Slovakia.

Podmienky sú zhrnuté v
[docs/freemap-permission-summary.md](docs/freemap-permission-summary.md).
Súhlas sa automaticky neprenáša na forky, iné aplikácie ani komerčné použitie;
tie si musia overiť vlastné oprávnenie na používanie služby.

Pri zapnutom Freemap sa priamo nad mapou zobrazuje:

`© Freemap Slovakia · © prispievatelia OpenStreetMap, dáta ODbL · Zdroje výškových dát`

Všetky tri časti sú odkazy na Freemap.sk alebo stránku OpenStreetMap copyright.
Samostatná atribúcia SRTM sa neuvádza, pretože sa pre tieto dlaždice nepoužíva.

## OpenStreetMap

Mapové údaje pochádzajú od prispievateľov **OpenStreetMap** a sú dostupné pod
Open Database License:

- copyright a licencia: <https://www.openstreetmap.org/copyright>;
- text ODbL: <https://opendatacommons.org/licenses/odbl/>.

## Garmin

Garmin a Garmin Connect sú označenia ich príslušných vlastníkov. Projekt je
neoficiálny, nie je podporovaný ani schválený spoločnosťou Garmin a neobsahuje
jej zdrojový kód, mapové dáta, logá ani prihlasovacie údaje. Názov Garmin
Connect sa používa iba na opis kompatibility.

## Zdrojový kód tretích strán

Balík neobsahuje knižnice ani vzdialený spustiteľný kód tretích strán. Využíva
iba webové API Chrome a mapovú knižnicu, ktorú načítal Garmin Connect.
