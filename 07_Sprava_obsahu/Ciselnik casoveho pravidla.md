---
title: Ciselnik casoveho pravidla
typ: catalog
faze: []
stav: draft
permalink: /sprava-obsahu/ciselnik-casoveho-pravidla
aliases: [Číselník časového pravidla]
---

## Použití

Tento číselník je jediný zdroj hodnot pro metadata `casove_pravidlo`. Říká, kdy se má činnost provést vzhledem ke `spousteci_udalost`.

Pole je single-select a **volitelné**. Default je `po` (reaktivní činnost po události). Vyplňuj jen tam, kde se činnost odchyluje od defaultu — typicky preventivní/přípravné činnosti, průběžné aktivity a smluvní/zákonné lhůty.

## Princip redukce hodnot

Sada hodnot je redukovaná z původně navrhovaných 17 na 6. Kontext kotvy (zda jde o událost, fázi, schválení nebo předání) nese `spousteci_udalost`, takže pozice tady stačí v obecné formě.

Příklad:

```yaml
title: "Definovat požadavky zadavatele"
spousteci_udalost: [projekt_vyhlaseni_zakazky]
casove_pravidlo: pred                          # PŘED vyhlášením, abych ho připravil
```

```yaml
title: "Provést kontrolu modelu"
spousteci_udalost: [bim_odevzdani_modelu]
casove_pravidlo: po                            # PO odevzdání, jako reakce (default)
```

## Hodnoty (ID)

| ID | label | význam |
|---|---|---|
| `pred` | Před | Činnost musí proběhnout před spouštěcí událostí (typicky preventivní/přípravná) |
| `pri` | Při | Činnost probíhá souběžně se spouštěcí událostí |
| `ihned_po` | Ihned po | Činnost následuje bezprostředně po události |
| `po` | Po | Činnost se provádí po události, bez přesného určení (default) |
| `prubezne` | Průběžně | Činnost nemá jeden konkrétní okamžik |
| `ve_lhute` | Ve lhůtě | Činnost se provádí ve lhůtě — konkrétní text a povaha lhůty jsou ve volném poli `lhuta` |

## Vazba na související klíče

- `spousteci_udalost` — vůči čemu se pozice měří.
- `casova_poznamka` — volný text pro slovní upřesnění (např. „do 5 pracovních dnů od odevzdání modelu“).
- `lhuta` — konkrétní lhůta (volný text; typ lhůty lze uvést přímo v textu, např. „smluvní — do 28 dnů …”) pro hodnotu `ve_lhute`.
