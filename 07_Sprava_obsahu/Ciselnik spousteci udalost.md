---
title: Ciselnik spousteci udalost
typ: catalog
faze: []
stav: draft
permalink: /sprava-obsahu/ciselnik-spousteci-udalost
aliases: [Číselník spouštěcích událostí]
---

## Použití

Tento číselník je jediný zdroj hodnot pro metadata `spousteci_udalost`. Popisuje konkrétní událost nebo situaci, která činnost aktivuje.

Pole je multi-select. **Doporučení: 1–3 hodnoty na činnost.** Pokud má činnost 5+ spouštěcích událostí, je pravděpodobně příliš obecná a měla by se rozdělit na více činností.

## Konvence zápisu

Hodnoty mají pevný formát `<kategorie>_<konkretni_udalost>` v ID stylu (snake_case bez diakritiky).

Lidský label je tvořen prefixem kategorie před em-dash, např. `Projekt – zahájení realizace`. Kategorie nese sémantiku — kategorii nevedeme jako samostatný klíč, je součástí ID hodnoty.

## Kategorie

- **Projekt** (`projekt_*`) — milníky životního cyklu projektu od uzavření smlouvy
- **Smlouva** (`smlouva_*`) — smluvní události a FIDIC (pokyny, změny, claimy)
- **Kontrola** (`kontrola_*`) — kontrolní, zkušební a přejímací události
- **BIM** (`bim_*`) — události BIM/informačního workflow
- **Provoz** (`provoz_*`) — provozní události po předání stavby

---

## Projektové spouštěcí události

| ID | Label |
|---|---|
| `projekt_uzavreni_smlouvy` | Projekt – uzavření smlouvy |
| `projekt_predani_staveniste` | Projekt – předání staveniště |
| `projekt_zahajeni_realizace` | Projekt – zahájení realizace |
| `projekt_ukonceni_realizace` | Projekt – ukončení realizace |
| `projekt_zahajeni_predani_stavby` | Projekt – zahájení předání stavby |
| `projekt_uvedeni_stavby_do_provozu` | Projekt – uvedení stavby do provozu |

## Smluvní spouštěcí události

| ID | Label |
|---|---|
| `smlouva_pokyn_spravce_stavby` | Smlouva – pokyn správce stavby |
| `smlouva_pokyn_objednatele` | Smlouva – pokyn objednatele |
| `smlouva_zadost_o_zmenu` | Smlouva – žádost o změnu (variace) |
| `smlouva_vznik_claimove_udalosti` | Smlouva – vznik claimové události |
| `smlouva_prodleni` | Smlouva – prodlení |
| `smlouva_preruseni_praci` | Smlouva – přerušení prací |
| `smlouva_nepredvidatelna_okolnost` | Smlouva – nepředvídatelná okolnost |

## Kontrolní spouštěcí události

| ID                          | Label                       |
| --------------------------- | --------------------------- |
| `kontrola_bim_review`       | Kontrola – BIM review       |
| `kontrola_technicke_review` | Kontrola – technické review |
| `kontrola_zkouska`          | Kontrola – zkouška / měření |
| `kontrola_prejimka`         | Kontrola – přejímka         |
| `kontrola_inspekce`         | Kontrola – inspekce         |

## BIM / informační spouštěcí události

| ID | Label |
|---|---|
| `bim_odevzdani_modelu` | BIM – odevzdání modelu |
| `bim_milnik_informacniho_predani` | BIM – milník informačního předání |
| `bim_schvaleni_modelu` | BIM – schválení modelu |
| `bim_zamitnuti_modelu` | BIM – zamítnutí modelu |

## Provozní spouštěcí události

| ID                                   | Label                                                  |
| ------------------------------------ | ------------------------------------------------------ |
| `provoz_predani_stavby`              | Provoz – předání stavby                                |
| `provoz_zahajeni_zkusebniho_provozu` | Provoz – zahájení zkušebního provozu                   |
| `provoz_predani_IMS`                 | Provoz – předání provozního informačního modelu stavby |
