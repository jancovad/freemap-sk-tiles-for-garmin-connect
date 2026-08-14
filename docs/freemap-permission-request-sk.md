# Žiadosť Freemap Slovakia o potvrdenie použitia dlaždíc

Stav: **návrh – neodoslané**

- Komu: `freemap@freemap.sk`
- Predmet: `Žiadosť o súhlas s použitím Freemap Outdoor dlaždíc v Chrome rozšírení`
- Oficiálny zdroj kontaktu: <https://oz.freemap.sk/>

## Text správy

Dobrý deň,

volám sa Vladimír Jančovič a pripravujem bezplatné open-source rozšírenie pre
Chrome s názvom **Freemap.sk tiles for Garmin Connect**. Jeho jedinou funkciou je
pridať do webového Garmin Connect prepínač pôvodného mapového podkladu a
Freemap.sk Outdoor.

Rozšírenie používa zdroj:

`https://outdoor.tiles.freemap.sk/{z}/{x}/{y}`

Technické správanie:

- načítava iba dlaždice aktuálne viditeľné pri bežnom posúvaní a zoome mapy;
- nevykonáva hromadné, offline ani preventívne sťahovanie;
- nemá vlastný server, proxy, analytiku ani telemetriu;
- používa iba štandardnú cache prehliadača;
- pri požiadavkách nastavuje `referrerpolicy=no-referrer`;
- nemení Garmin routing, trasu, body ani ostatné mapové vrstvy;
- pri chybe dlaždice automaticky obnoví pôvodnú Garmin mapu;
- zdrojový kód bude verejný pod MIT licenciou a rozšírenie bude bezplatné.

Aktuálne rozšírenie zobrazuje nad mapou viditeľnú atribúciu:

`© Freemap Slovakia · © OpenStreetMap contributors`

Pred prípadným zverejnením v Chrome Web Store Vás prosím o potvrdenie:

1. Súhlasíte s použitím verejného Outdoor tile servera týmto spôsobom vo
   verejne dostupnom Chrome rozšírení?
2. Aké presné znenie, odkazy a licencie má obsahovať viditeľná atribúcia?
   Má byť osobitne uvedený aj SRTM alebo iný zdroj?
3. Je pre tento zdroj správny podporovaný rozsah zoomu 2 až 20, ktorý sme
   overili bežnými jednotlivými požiadavkami?
4. Požadujete ďalšie technické obmedzenia, identifikáciu klienta, cache pravidlá
   alebo maximálnu prevádzku?
5. Je pomenovanie „Freemap.sk tiles for Garmin Connect“ z Vášho pohľadu prijateľné, ak bude
   všade jasne uvedené, že ide o neoficiálny komunitný projekt a ikona nepoužíva
   logo Freemap Slovakia?

Predpokladaná počiatočná prevádzka je malá. Ak by používanie výraznejšie
vzrástlo, radi vopred dohodneme vhodný spôsob ďalšej prevádzky.

Na požiadanie pošlem zdrojový kód, lokálny balík alebo ďalšie technické
podrobnosti. Rozšírenie do Chrome Web Store neodošlem, kým nebudú podmienky
použitia a atribúcie potvrdené.

Ďakujem za Váš čas a za prevádzku Freemap.sk.

S pozdravom

Vladimír Jančovič

## Pred odoslaním doplniť

- verejnú URL repozitára, ak už bude vytvorený;
- kontaktný e-mail odosielateľa;
- prípadne odkaz na screenshot atribúcie.

Odpoveď Freemap Slovakia treba uložiť alebo presne zhrnúť v projektovej
dokumentácii pred prípravou verejného Store balíka.
