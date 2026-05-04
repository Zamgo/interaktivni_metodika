---
title: "X.Y.Z - Krátký název úkolu"
typ: ukol
popis: ""
zdroj: ""
faze: []
etapa: []
R - Odpovědnost za provádění činnosti: []
A - Právní odpovědnost za dokončení činnosti: []
C - Konzultace v průběhu činnosti: []
I - Informování po dokončení činnosti: []
stav: draft
rezim_cinnosti: ""
spousteci_udalost: []
opakovatelnost: ""
ukoncovaci_podminka: ""
oznaceni: ""
oblast: ""
cinnost: ""
---

> Šablona pro nový úkol. Před uložením do `03_Katalog všech činností/` přejmenuj soubor (`X.Y.Z - Nazev ukolu.md`) a vyplň pole dle tabulky níže. Pole označená [doporučené] vyplň, pokud existuje smysluplná hodnota — chybějící hodnota nesmí blokovat publikaci.

## Vyplňovací návod

### Identitní vrstva (povinné)

| Klíč | Co vyplnit | Příklad |
|---|---|---|
| `title` | Plný název s ID na začátku | `"4.5.1 - Sloučení TIDP do MIDP"` |
| `typ` | Vždy `ukol` u listových činností | `ukol` |

### Kontextová vrstva

| Klíč | Co vyplnit | Číselník |
|---|---|---|
| `faze` | Hrubá fáze ISO 19650 | [[Ciselnik fazi]] |
| `etapa` | Detailní etapa stavebního projektu | [[Ciselnik etap]] |
| `zdroj` | Volný text s konkrétní referencí | - |

### RACI (vyplň celou matici podle reality)

| Klíč | Co vyplnit |
|---|---|
| `R/A/C/I` role | Wikilinky na role z [[Ciselnik roli]] |

### Časové chování

| Klíč | Co vyplnit | Číselník |
|---|---|---|
| `rezim_cinnosti` | Jak se činnost chová v čase | [[Ciselnik rezimu cinnosti]] |
| `spousteci_udalost` | 1–3 hodnoty, co aktivuje [doporučené] | [[Ciselnik spousteci udalost]] |
| `opakovatelnost` | Frekvence opakování [doporučené] | [[Ciselnik opakovatelnosti]] |
| `ukoncovaci_podminka` | Kdy je činnost dokončená [doporučené] | [[Ciselnik ukoncovacich podminek]] |

### Volitelné klíče (přidej do frontmatteru jen tehdy, když mají hodnotu — Obsidian je pak zobrazí v Properties)

| Klíč | Kdy | Číselník / poznámka |
|---|---|---|
| `navazane_workflow` | Odkaz na CDE workflow | [[Ciselnik workflow]] + sekce v těle stránky se stejným odkazem |
| `casove_pravidlo` | Odchylka od defaultu `po` | [[Ciselnik casoveho pravidla]] |
| `casova_poznamka` | Slovní upřesnění času | volný text |
| `lhuta` | Konkrétní lhůta (včetně povahy — smluvní/zákonná — lze uvést přímo do textu lhůty) | volný text |

### Rezervované klíče (zatím prázdné — doplníme při napojení na RACI / oblasti ISO)

Na konec frontmatteru drž `oznaceni`, `oblast` a `cinnost` jako prázdné řetězce, dokud nebudeme mapovat na strukturu z [[03_Oblasti správy informací]].

| Klíč | Stav |
|---|---|
| `oznaceni` | `""` do budoucna |
| `oblast` | `""` do budoucna |
| `cinnost` | `""` do budoucna |

## Pravidla zápisu

- Klíče i ID hodnoty číselníků jsou **česky bez diakritiky** (snake_case): `bim_odevzdani_modelu`, `ve_lhute`, `po_uzavreni_smlouvy`.
- Pole označená v [[Pravidla metadat]] jako seznam se vždy zapisují jako seznam (`[]` i pro prázdnou hodnotu, `[hodnota]` i pro jednu).
- `casove_pravidlo` se nevyplňuje, pokud platí default `po` (reaktivní činnost).
- Pokud činnost potřebuje hodnotu, která není v číselníku — **nejprve doplň hodnotu do číselníku**, pak ji použij ve frontmatteru.
- Workflow pro novou hodnotu: **číselník → seed → první použití v činnosti**. Seed soubor je `[[00_Podklady/_seed_metadata_hodnoty]]`.
- Nepoužívej anglické technické názvy klíčů (`affected_phases`, `trigger_events`, …) — vault drží českou konvenci.

## Tělo stránky (doporučená struktura)

```markdown
# Popis
(Co činnost dělá, kdo ji řídí, proč existuje.)

# Vstupy
- Konkrétní dokumenty/artefakty

# Postup
(Kroky, role.)

# Výstupy
- Konkrétní výstupy

# Úkoly
- [ ] Ověřit podklady
- [ ] Provést kontrolu
- [ ] Zapsat výsledek
```

## Navázané workflow v těle stránky

Když vyplníš `navazane_workflow` ve frontmatteru, uveď stejný odkaz i do těla (např. sekce `# Navázané CDE workflow`), aby byl vidět při čtení poznámky i na webu.

## Příklady plně vyplněných činností

- ISO 19650 reaktivní: viz [[Pravidla metadat]] sekce „Příklad frontmatteru – Úkol".
- FIDIC se smluvní lhůtou: viz [[Pravidla metadat]] sekce „Úkol s FIDIC vazbou a smluvní lhůtou".
