---
title: Ciselnik charakteru cinnosti
typ: catalog
faze: []
stav: draft
permalink: /sprava-obsahu/ciselnik-charakteru-cinnosti
aliases: [Číselník charakteru činnosti]
---

## Použití

Tento číselník je jediný zdroj hodnot pro metadata `charakter`. Říká, **zda a jak se činnost vyskytuje na každém projektu** — a tím přímo určuje, do kterého operativního seznamu patří.

Pole je single-select a **povinné pro každý `typ: ukol`**.

## Hodnoty (ID)

| ID | Label | Operativní čtení | Příklady (FIDIC) |
|---|---|---|---|
| `jednorazove` | Jednorázové | Na každém projektu, provede se jednou — patří do **checklistu** | Pověření asistentů, Organigram, Datum zahájení, Potvrzení o splnění smlouvy |
| `opakujici` | Opakující se | Na každém projektu, opakuje se průběžně — patří do **checklistu** | Potvrzení průběžné platby, Reakce na oznámení stavu |
| `podminena` | Podmíněná | Jen když nastane konkrétní situace — patří do **kontrolního seznamu** | Odsouhlasení podzhotovitele, Zkoušky, Odmítnutí prací, Vady v záruční době |

## Vztah k dalším klíčům

- `charakter` popisuje **zda** a **jak často** se činnost provede. `etapa` a `faze` říkají **kdy v projektu**.
- Pro `jednorazove` a `opakujici`: `etapa` určuje timing — `spousteci_udalost` vyplňovat jen pokud trigger = **konkrétní akce smluvní strany** (nestačí jen „vstup do fáze").
- Pro `opakujici`: `spousteci_udalost` vyplnit jen pokud má každý cyklus konkrétní smluvní trigger.
- Pro `podminena`: `spousteci_udalost` **vždy vyplnit** — bez triggeru není podmíněná povinnost použitelná.

## Vztah k Bases pohledům

- Pohled **„Checklist — každý projekt"**: filtr `charakter == "jednorazove" OR charakter == "opakujici"`
- Pohled **„Zkontroluj jestli se týká tohoto projektu"**: filtr `charakter == "podminena"`

## Poznámka k FIDIC Red Book

V kontextu povinností Správce stavby (Engineer) odpovídají hodnoty třem typům povinností z FIDIC Guidance Memorandum:

- `jednorazove` / `opakujici` → **Standing / milestone-bound obligations** — platí na každém projektu
- `podminena` → **Event-triggered / conditional obligations** — aktivují se až konkrétní smluvní nebo fyzickou událostí
