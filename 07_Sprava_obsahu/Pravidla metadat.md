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
| `navazane_workflow` | Wikilinky na workflow stránky v `05_Knihovna průvodce/CDE workflow/` (jen kde má činnost vazbu — bez prázdného `[]`) | seznam wikilinků | `ukol` |
| `etapa` | Etapa stavebního projektu (jemnější granularita než `faze`); viz [[Ciselnik etap]] | seznam | `cinnost`, `ukol` |

## Klíče časového chování (typ `ukol`)

Tato vrstva metadat popisuje, **kdy** se činnost provádí, **čím** je aktivovaná a **kdy** je dokončená.

| Klíč | Popis | Typ | Povinnost |
|------|-------|-----|-----------|
| `charakter` | Zda a jak se činnost vyskytuje na projektu (`jednorazove`, `opakujici`, `podminena`); viz [[Ciselnik charakteru cinnosti]] | text | **povinné** pro `ukol` |
| `spousteci_udalost` | Co činnost aktivuje (1–3 hodnoty); viz [[Ciselnik spousteci udalost]] | seznam | viz pravidlo níže |
| `casove_pravidlo` | Pozice činnosti vůči `spousteci_udalost` (`pred`, `pri`, `ihned_po`, `po`, `prubezne`, `ve_lhute`); viz [[Ciselnik casoveho pravidla]]. Default `po` (reaktivní) — pokud sedí default, klíč nevyplňovat. | text | volitelné |
| `casova_poznamka` | Volné slovní upřesnění časového pravidla (např. „do 5 pracovních dnů od odevzdání modelu") | text | volitelné |
| `lhuta` | Konkrétní časový limit včetně povahy lhůty v jednom textu (např. „Smluvní: do 28 kalendářních dnů od oznámení") | text | volitelné |
| `ukoncovaci_podminka` | Kdy se činnost považuje za dokončenou; viz [[Ciselnik ukoncovacich podminek]] | text | doporučené |

Úmyslně se nepoužívá sekvenční vazba mezi úkoly (`predchozi_cinnost` / `nasledujici_cinnost`): pořadí vyjadřuje kombinace `spousteci_udalost`, `etapa` a případně tvrdých závislostí v textu poznámky.

### Pravidlo pro `spousteci_udalost`

| `charakter` | Pravidlo vyplnění `spousteci_udalost` |
|---|---|
| `jednorazove` | Vyplnit jen pokud trigger = konkrétní akce smluvní strany; pokud timing = „vstup do fáze", nevyplňovat (kryje `etapa`) |
| `opakujici` | Vyplnit jen pokud má každý cyklus konkrétní smluvní trigger |
| `podminena` | **Vždy vyplnit** — bez triggeru není podmíněná povinnost použitelná |

### Kdy vyplnit `casove_pravidlo`

Vyplňuj jen tam, kde:

- činnost je **proaktivní/přípravná** (`pred` — typicky před zahájením fáze),
- má **smluvní/zákonnou lhůtu** (`ve_lhute` — typicky FIDIC SC 14.6: 28 dní pro certifikát, SC 20.2.1: 28 dní pro Notice of Claim),
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
- `navazane_workflow`
- `navazane_cinnosti`
- `spousteci_udalost`

## Vazba na číselníky

Hodnoty pro řízené klíče se berou **výhradně** z číselníků. Volný text se použije jen tam, kde to klíč explicitně připouští (`zdroj`, `casova_poznamka`, `lhuta`).

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

### Úkol (příklad s časovým chováním)

```yaml
---
title: "4.5.1 - Sloučení TIDP do MIDP"
typ: ukol
popis: ""
zdroj: "ČSN EN ISO 19650-2; 5.4.5"
faze: [priprava]
etapa: [po_uzavreni_smlouvy]
R - Odpovědnost za provádění činnosti: []
A - Právní odpovědnost za dokončení činnosti: []
C - Konzultace v průběhu činnosti: []
I - Informování po dokončení činnosti: []
stav: draft
rezim_cinnosti: udalostni
spousteci_udalost: [bim_milnik_informacniho_predani]
opakovatelnost: pri_kazde_udalosti
# casove_pravidlo neuvedeno — platí default `po`
ukoncovaci_podminka: vystup_schvalen
oznaceni: ""
oblast: ""
cinnost: ""
---
```

Volitelně lze doplnit např. `navazane_workflow`, `casove_pravidlo`, `casova_poznamka` nebo `lhuta` — jen pokud mají hodnotu (Obsidian Properties je pak zobrazí).

Úplné vyplnění `oznaceni` / `oblast` / `cinnost` přijde při napojení na RACI strukturu z ISO vrstvy vaultu.

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
rezim_cinnosti: podminena
spousteci_udalost: [smlouva_vznik_claimove_udalosti, smlouva_prodleni, smlouva_nepredvidatelna_okolnost]
opakovatelnost: pri_kazde_udalosti
casove_pravidlo: ve_lhute
casova_poznamka: "Lhůta běží od okamžiku, kdy si zhotovitel měl nebo mohl být vědom události."
lhuta: "Smluvní — do 28 kalendářních dnů od vzniku události; notice předat správci stavby ve lhůtě."
ukoncovaci_podminka: claim_oznamen
oblast: ""
cinnost: ""
---
```
