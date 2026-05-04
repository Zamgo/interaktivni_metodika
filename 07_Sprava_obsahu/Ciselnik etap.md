---
title: Ciselnik etap
typ: catalog
faze: []
stav: draft
permalink: /sprava-obsahu/ciselnik-etap
aliases: [Číselník etap]
---

## Použití

Tento číselník je jediný zdroj hodnot pro metadata `etapa` u činností a úkolů. Etapa je jemnější granularitou než `faze` — vychází z FIDIC Red Book smluvního rámce používaného na projektech ŘSD.

Pole `etapa` je multi-select (zapisuje se vždy jako seznam, i u jedné hodnoty). Pole je doplňkové k `faze`, ne náhrada — obě pole zůstávají ve frontmatteru.

## Hodnoty (ID) a mapování na fáze

Etapy odpovídají sekčnímu dělení Excel podkladu ŘSD (činnosti správce stavby dle FIDIC Red Book):

| etapa (ID)               | label                                                   | patri_do_faze |
| ------------------------ | ------------------------------------------------------- | ------------- |
| `po_uzavreni_smlouvy`    | Po uzavření smlouvy před zahájením prací                | `priprava`    |
| `po_zahajeni_praci`      | Po zahájení prací                                       | `realizace`   |
| `zkousky_a_prejimky`     | Zkoušky, přejímací zkoušky a přejímací řízení           | `realizace`   |
| `po_dokonceni_dila`      | Po dokončení díla / Záruční doba                        | `provoz`      |

## Pravidlo pro vyplňování

- `etapa` a `faze` se vyplňují **souběžně**. Mapování je jednoznačné:
  - `po_uzavreni_smlouvy` → `faze: [priprava]`
  - `po_zahajeni_praci` → `faze: [realizace]`
  - `zkousky_a_prejimky` → `faze: [realizace]`
  - `po_dokonceni_dila` → `faze: [provoz]`
- Každý úkol má zpravidla **jednu etapu** (výjimky jsou krajní případy přechodu mezi etapami).

## Vazba na Excel podklad ŘSD

Etapy přímo odpovídají číslovaným sekcím v souboru `00_Podklady/činnosti RSD.xlsx`:

| Excel sekce | etapa |
|---|---|
| 2 — po uzavření Smlouvy před zahájením prací | `po_uzavreni_smlouvy` |
| 3 — po zahájení prací (po Datu zahájení prací) | `po_zahajeni_praci` |
| 5 — Zkoušky, přejímací zkoušky a přejímací řízení | `zkousky_a_prejimky` |
| 6 — po dokončení Díla | `po_dokonceni_dila` |

## Vazba na související číselníky

- [[Ciselnik fazi]] — hrubší 3-úrovňový lifecycle (`priprava`, `realizace`, `provoz`).
- [[Pravidla metadat]] — pravidla zápisu klíče `etapa` ve frontmatteru.
