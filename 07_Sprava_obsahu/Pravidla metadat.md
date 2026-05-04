---
title: Pravidla metadat
typ: catalog
faze: []
stav: draft
permalink: /sprava-obsahu/pravidla-metadat
---

## Účel

Tato stránka definuje jednotná pravidla pro frontmatter ve všech stránkách vaultu. Cílem je konzistence v Obsidianu a připravenost pro pozdější publikaci přes Quartz.

## Povinné klíče frontmatteru (všechny stránky)

| Klíč | Popis | Typ |
|------|-------|-----|
| `title` | Název stránky | text |
| `typ` | Typ stránky (viz níže) | text |
| `faze` | Fáze projektu, ve kterých je obsah relevantní | seznam |
| `stav` | Redakční stav | text |
| `permalink` | Stabilní URL pro Quartz | text |
| `tags` | Volné štítky pro vyhledávání | seznam |

## Volitelné klíče

| Klíč | Popis |
|------|-------|
| `aliases` | Alternativní názvy/zkratky (pro vyhledávání) |
| `description` | Popis stránky (pro SEO/meta tagy) |
| `zdroj` | Odkaz na zdroj požadavku (text, např. `ČSN EN ISO 19650-2; 5.1.1`) |

## Klíče specifické pro typ `oblast`, `cinnost`, `ukol`

| Klíč | Popis | Typ | Platí pro |
|------|-------|-----|-----------|
| `oznaceni` | Hierarchické ID činnosti z RACI matice (např. `1.1.1`) | text | všechny |
| `popis` | Popis činnosti | text | všechny |
| `garant` | Wikilink na garanta činnosti (vlastník/owner činnosti na úrovni `cinnost`) | wikilink | `cinnost` |
| `R - Odpovědnost za provádění činnosti` | Seznam rolí s odpovědností R | seznam | `ukol` |
| `A - Právní odpovědnost za dokončení činnosti` | Seznam rolí s odpovědností A | seznam | `ukol` |
| `C - Konzultace v průběhu činnosti` | Seznam rolí pro konzultaci C | seznam | `ukol` |
| `I - Informování po dokončení činnosti` | Seznam rolí pro informování I | seznam | `ukol` |
| `oblast` | Wikilink na nadřazenou oblast | wikilink | všechny |
| `cinnost` | Wikilink na nadřazenou činnost | wikilink | `cinnost`, `ukol` |
| `vstupy` | Wikilinky na vstupní dokumenty/artefakty | seznam wikilinků | všechny |
| `vystupy` | Wikilinky na výstupní artefakty | seznam wikilinků | všechny |
| `navazane_workflow` | Wikilinky na workflow stránky v `05_Knihovna průvodce/CDE workflow/` | seznam wikilinků | všechny |
| `nastroj` | CDE nástroje relevantní pro činnost (`controlis`, `aspehub`, ...) | seznam | `ukol` |
| `etapa` | Etapa stavebního projektu (jemnější granularita než `faze`); viz [[Ciselnik etap]] | seznam | `cinnost`, `ukol` |

## Klíče časového chování (typ `ukol`)

Tato vrstva metadat popisuje, **kdy** se činnost provádí, **čím** je aktivovaná a **kdy** je dokončená. Vrstva je doplňková a v MVP žádný klíč není striktně povinný — `spousteci_udalost`, `opakovatelnost` a `ukoncovaci_podminka` jsou ale doporučené pro každou novou činnost.

| Klíč | Popis | Typ | Povinnost |
|------|-------|-----|-----------|
| `rezim_cinnosti` | Jak se činnost chová v čase (`fazova`, `milnikova`, `udalostni`, `periodicka`, `prubezna`, `podminena`, `aktualizacni`); viz [[Ciselnik rezimu cinnosti]] | text | volitelné |
| `spousteci_udalost` | Co činnost aktivuje (1–3 hodnoty); viz [[Ciselnik spousteci udalost]] | seznam | doporučené |
| `opakovatelnost` | Jak často se činnost provádí; viz [[Ciselnik opakovatelnosti]]. | text | doporučené |
| `casove_pravidlo` | Pozice činnosti vůči `spousteci_udalost` (`pred`, `pri`, `ihned_po`, `po`, `prubezne`, `ve_lhute`); viz [[Ciselnik casoveho pravidla]]. Default `po` (reaktivní) — pokud sedí default, klíč nevyplňovat. | text | volitelné |
| `casova_poznamka` | Volné slovní upřesnění časového pravidla (např. „do 5 pracovních dnů od odevzdání modelu") | text | volitelné |
| `lhuta` | Konkrétní časový limit (volný text, např. „Do 28 kalendářních dnů od oznámení") | text | volitelné |
| `lhuta_typ` | Klasifikace lhůty pro filtrování (`smluvni`, `zakonna`, `interni`, `projektova`, `bez_lhuty`); viz [[Ciselnik typu lhut]] | text | volitelné |
| `ukoncovaci_podminka` | Kdy se činnost považuje za dokončenou; viz [[Ciselnik ukoncovacich podminek]] | text | doporučené |
| `poznamka_k_ukonceni` | Volné slovní upřesnění ukončení (např. „schváleno zadavatelem v CDE") | text | volitelné |

### Princip vrstev metadat

Časová vrstva je **doplňkem**, ne náhradou stávající kontextové a procesní vrstvy. Existující soubory bez těchto klíčů zůstávají platné — doplňují se postupně, jak procházíš jednotlivé činnosti. Žádný hromadný refactor 120 stávajících souborů se v MVP nedělá.

### Vztah k `rezim_cinnosti`

V praxi je `casove_pravidlo` často odvoditelné z `rezim_cinnosti` (např. periodická → `po`, průběžná → `prubezne`). Vyplňuj `casove_pravidlo` jen tam, kde:

- činnost je **proaktivní/přípravná** (`pred` — typicky před vyhlášením zakázky, před zahájením fáze),
- má **smluvní/zákonnou lhůtu** (`ve_lhute` — typicky FIDIC SC 20.2.1, 28 dní pro Notice of Claim),
- jde o **synchronní** činnost (`pri` — výjimečně).

## Klíče specifické pro typ `workflow`

| Klíč | Popis | Typ |
|------|-------|-----|
| `navazane_cinnosti` | Zpětné wikilinky na činnosti, které workflow využívají | seznam wikilinků |

Identita workflow je daná souborem a `permalink`.

## Povolené hodnoty `typ`

`typ` může být pouze jedna z těchto hodnot:

- `index`
- `process`
- `oblast`
- `cinnost`
- `ukol`
- `workflow`
- `term` — obecný pojem (CDE, BEP, DiMS, PIR, ...)
- `role` — funkční role v týmu (Správce stavby, Koordinátor CDE, Koordinátor BIM, ...)
- `smluvni_strana` — smluvní subjekt (Pověřující strana / Objednatel, Vedoucí pověřená strana / Zhotovitel, ...)
- `reference`
- `appendix`
- `catalog`

## Klíče specifické pro typ `role` a `smluvni_strana`

Tyto klíče slouží pro úvodní rozcestník (HomeLanding) a role portál.

| Klíč | Popis | Typ | Platí pro |
|------|-------|-----|-----------|
| `show_na_rozcestniku` | Pokud `true`, karta role/smluvní strany se zobrazí na úvodní stránce. Default `false`. | bool | `role`, `smluvni_strana` |
| `order` | Pořadí karty na úvodní stránce (nižší číslo = dříve). Default `999`. | number | `role`, `smluvni_strana` |
| `popis_karta` | Jedna věta pro kartu na rozcestníku. Pokud chybí, komponenta fallbackne na `description`. | text | `role`, `smluvni_strana` |
| `ikona` | Volitelná ikona pro kartu (Lucide icon name, např. `hard-hat`, nebo emoji). Pokud chybí, zobrazí se iniciály. | text | `role`, `smluvni_strana` |
| `ramec` | Smluvní rámec: `FIDIC` nebo `ISO19650`. Slouží pro překladovou vrstvu. | text | `smluvni_strana` |
| `ekvivalent` | Wikilink na ekvivalentní stránku v jiném rámci (např. v `Pověřující strana` odkaz na FIDIC ekvivalent — pokud ještě jako samostatná stránka existuje). | wikilink | `smluvni_strana` |
| `nadrizena_role` | Wikilink na nadřízenou roli v hierarchii týmu. | wikilink | `role` |
| `klicove_pojmy` | Kurátorovaný whitelist pojmů, které by měl držitel role znát (zobrazí se v sekci „Co byste měli znát" v role portálu). | seznam wikilinků | `role`, `smluvni_strana` |
| `sablony` | Odkazy na šablony a podklady ke stažení (např. do `00_Podklady/`). | seznam wikilinků | `role`, `smluvni_strana` |

### Aliases a sjednocení FIDIC ↔ ISO 19650

Pro smluvní strany, které existují pod více názvy (FIDIC ↔ ISO 19650), se používá **jedna kanonická stránka** a ostatní názvy se přidávají přes `aliases`. Tím:

- `[[Pověřující strana|Objednatel]]` i `[[Pověřující strana]]` resolvují na tutéž stránku.
- `AliasRedirects` vygeneruje URL redirect z aliasu na kanonickou adresu.

Doporučená kanonizace:

- **Pověřující strana** (ISO 19650) s `aliases: [Objednatel, ŘSD]`
- **Vedoucí pověřená strana** (ISO 19650) s `aliases: [Zhotovitel, Hlavní zhotovitel]`

## Zápis seznamů

Následující pole se vždy zapisují jako seznamy (i když obsahují jen jednu hodnotu):

- `faze`
- `etapa`
- `role`
- `tags`
- `vstupy`
- `vystupy`
- `navazane_workflow`
- `navazane_cinnosti`
- `nastroj`
- `spousteci_udalost`

## Vazba na číselníky

Hodnoty pro řízené klíče se berou **výhradně** z číselníků. Volný text se použije jen tam, kde to klíč explicitně připouští (`zdroj`, `casova_poznamka`, `lhuta`, `poznamka_k_ukonceni`).

### Základní číselníky

- [[Ciselnik fazi]] — pro `faze`
- [[Ciselnik etap]] — pro `etapa` (včetně mapování `etapa → faze`)
- [[Ciselnik roli]] — pro RACI klíče a smluvní strany
- [[Ciselnik_RACI_hodnot]] — povolené R/A/C/I hodnoty

### Číselníky časového chování

- [[Ciselnik rezimu cinnosti]] — pro `rezim_cinnosti`
- [[Ciselnik spousteci udalost]] — pro `spousteci_udalost`
- [[Ciselnik opakovatelnosti]] — pro `opakovatelnost`
- [[Ciselnik casoveho pravidla]] — pro `casove_pravidlo`
- [[Ciselnik typu lhut]] — pro `lhuta_typ`
- [[Ciselnik ukoncovacich podminek]] — pro `ukoncovaci_podminka`

### Pravidlo přidávání nové hodnoty

Pokud je potřeba nová hodnota:

1. Nejprve ji doplnit do příslušného číselníku.
2. Až poté ji použít ve stránkách.

Hodnoty číselníků se zapisují **česky bez diakritiky v ID stylu** (snake_case, např. `bim_odevzdani_modelu`, `ve_lhute`). Lidský label v číselníku může mít diakritiku a mezery a je určen pro zobrazení v UI / Bases sloupcích.

## Seed governance (Obsidian selecty)

Pro stabilní nabídku hodnot v Obsidian Properties se používá seed soubor:

- [[00_Podklady/_seed_metadata_hodnoty]]

Pravidla údržby:

1. Seed soubor **nemazat** (slouží jako bootstrap hodnot pro selecty).
2. Nová hodnota v číselníku => doplnit stejnou hodnotu i do seedu.
3. Teprve poté použít hodnotu v běžné činnosti.

Číselník zůstává canonical source; seed pouze materializuje hodnoty pro UI.

## Pravidla pro `permalink` (Quartz)

- `permalink` má být **stabilní a jednoduchý**.
- Používat malá písmena bez diakritiky a s pomlčkami.
- Doporučené prefixy:
  - procesy: `/proces/<faze>/<slug>`
  - workflow: `/workflow/<workflow>`
  - pojmy: `/pojem/<slug>`
  - správa obsahu: `/sprava-obsahu/<slug>`
  - reference: `/reference/<slug>`
  - přílohy: `/priloha/<slug>`

## Pravidla pro `stav`

Používané hodnoty (v prvním průchodu):

- `draft`
- `ready`

## Příklad frontmatteru

### Workflow stránka

```yaml
---
title: ZBV
typ: workflow
faze: [realizace]
stav: draft
permalink: /workflow/zbv
---
```

### Úkol (se skeleton poli pro vstupy/výstupy/návaznosti a časové chování)

```yaml
---
title: "4.5.1 - Sloučení TIDP do MIDP"
typ: ukol
oznaceni: "4.5.1"
popis: ""
zdroj: "ČSN EN ISO 19650-2; 5.4.5"
faze: [priprava]
etapa: [po_uzavreni_smlouvy]
R - Odpovědnost za provádění činnosti: []
A - Právní odpovědnost za dokončení činnosti: []
C - Konzultace v průběhu činnosti: []
I - Informování po dokončení činnosti: []
stav: draft
oblast: "[[4 - Proces managementu informací – Pověření]]"
cinnost: "[[4.5 - Stanovení hlavního plánu předávání informací (MIDP)]]"
vstupy: []
vystupy: []
navazane_workflow: []
predchozi_cinnost: ""
nasledujici_cinnost: "[[4.5.2 - Zakotveni vystupu a dat v MIDP]]"
nastroj: []
# časové chování — doplnit dle reálné činnosti
rezim_cinnosti: udalostni
spousteci_udalost: [bim_milnik_informacniho_predani]
opakovatelnost: pri_kazde_udalosti
casove_pravidlo: ""              # default `po`, nevyplňovat
casova_poznamka: ""
lhuta: ""
lhuta_typ: ""
ukoncovaci_podminka: vystup_schvalen
poznamka_k_ukonceni: ""
---
```

### Úkol s FIDIC vazbou a smluvní lhůtou (vzor pro Notice of Claim)

```yaml
---
title: "Oznámit claim — Notice of Claim"
typ: ukol
oznaceni: "9.1.1"
popis: "Vedoucí pověřená strana písemně oznámí pověřující straně událost vedoucí k nároku."
zdroj: "FIDIC Red Book SC 20.2.1; ŘSD Zvláštní podmínky 5. vyd."
faze: [realizace]
etapa: [po_zahajeni_praci]
stav: draft
# časové chování
rezim_cinnosti: podminena
spousteci_udalost: [smlouva_vznik_claimove_udalosti, smlouva_prodleni, smlouva_nepredvidatelna_okolnost]
opakovatelnost: pri_kazde_udalosti
casove_pravidlo: ve_lhute
casova_poznamka: "Lhůta běží od okamžiku, kdy si zhotovitel měl nebo mohl být vědom události."
lhuta: "Do 28 kalendářních dnů od vzniku události"
lhuta_typ: smluvni
ukoncovaci_podminka: claim_oznamen
poznamka_k_ukonceni: "Notice odesláno správci stavby ve smluvní lhůtě."
---
```
