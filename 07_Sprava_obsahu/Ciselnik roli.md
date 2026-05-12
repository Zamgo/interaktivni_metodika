---
title: Ciselnik roli
typ: catalog
faze: []
stav: draft
permalink: /sprava-obsahu/ciselnik-roli
aliases: [Číselník rolí]
---

## Použití

Tento číselník je jediný zdroj hodnot pro metadata `role` (např. v RACI maticích činností) a pro konzistentní odkazy na pojmové stránky. Rozlišujeme dvě kategorie:

- **Role v týmu** (`typ: role`) — funkční role v rámci týmu správce stavby.
- **Smluvní strany** (`typ: smluvni_strana`) — smluvní subjekty; sjednocené přes ISO 19650 kanonické názvy (FIDIC názvy zůstávají jako aliases).

## Role v týmu

ID a odpovídající pojmové stránky:

- `spravce stavby` → [[Správce stavby]]
- `spravce cde` → [[Člen týmu správce stavby – Koordinátor CDE]]
- `bim koordinator` → [[Člen týmu správce stavby – Koordinátor BIM]]
- `bozp koordinator` → [[Člen týmu správce stavby – Koordinátor BOZP]]
- `zastupce vedouciho tymu` → [[Asistent správce stavby – Zástupce vedoucího Týmu správce stavby]]
- `specialista v oboru` → [[Asistent správce stavby – Specialista v oboru]]
- `pomocny asistent` → [[Pomocný asistent Správce stavby]]
- `technicky dozor` → [[Technický dozor]] *(pojmová stránka může ještě chybět)*
- `projektant` → [[Projektant v oboru]] *(pojmová stránka může ještě chybět)*

## Smluvní strany

ID a odpovídající kanonické pojmové stránky (ISO 19650). FIDIC názvy jsou dostupné přes `aliases` — `[[Pověřující strana|Objednatel]]` i `[[Zhotovitel]]` fungují a resolvují na tyto kanonické stránky.

- `poverujici strana` (FIDIC: **Objednatel**, ŘSD) → [[Objednatel]]
- `vedouci poverena strana` (FIDIC: **Zhotovitel**, hlavní zhotovitel) → [[Zhotovitel]]
- `poverena strana` → [[Podzhotovitel]]
