---
title: "Katalog činností stavebního projektu – časové chování činností"
type: "metodika"
status: "návrh"
version: "0.1"
created: "2026-04-29"
tags:
  - BIM
  - stavebni-projekt
  - katalog-cinnosti
  - databaze
  - metodika
  - Obsidian
  - Cursor
---

# Katalog činností stavebního projektu – časové chování činností

Tento dokument popisuje dohodnutou strukturu části databáze, která se týká **časového chování činností** v katalogu činností stavebního projektu.

Cílem není vytvořit projektový řídicí systém, ale **metodický katalog činností**, na který se dá nahlížet z různých pohledů:

- podle dotčených fází,
- podle režimu činnosti,
- podle spouštěcí události,
- podle opakovatelnosti,
- podle časového pravidla,
- podle lhůty,
- podle ukončovací podmínky.

---

## 1. Základní princip

Každá činnost v katalogu má být popsána tak, aby bylo jasné:

1. **Kde je relevantní** – pomocí pole `Dotčené fáze`.
2. **Jak se chová v čase** – pomocí pole `Režim činnosti`.
3. **Co ji aktivuje** – pomocí pole `Spouštěcí událost`.
4. **Jak často se opakuje** – pomocí pole `Opakovatelnost`.
5. **Kdy se má provést** – pomocí polí `Časové pravidlo`, `Časová poznámka` a `Lhůta`.
6. **Kdy je hotová** – pomocí polí `Ukončovací podmínka` a `Poznámka k ukončení`.

Základní formulace:

> **Dotčené fáze říkají, kde je činnost relevantní. Režim činnosti říká, jak se chová. Spouštěcí událost říká, co ji aktivuje. Opakovatelnost říká, jak často se vrací. Časové pravidlo a lhůta říkají, kdy se má provést. Ukončovací podmínka říká, kdy je hotová.**

---

## 2. Dohodnutá zjednodušení

V návrhu jsme se rozhodli pro jednoduchou strukturu:

- nepoužívat pole `Hlavní fáze`,
- nepoužívat samostatné pole `Kategorie spouštěcí události`,
- používat jedno pole `Dotčené fáze` jako multi-select,
- používat jedno pole `Spouštěcí událost` jako multi-select,
- kategorii spouštěcí události zapisovat přímo do názvu hodnoty, například:
  - `BIM – odevzdání modelu`,
  - `Smlouva – vznik změny`,
  - `Dokumentace – odevzdání dokumentace`.

Důvod:

> Každé pole navíc zvyšuje složitost vyplňování, riziko nekonzistence a odpor uživatelů. Proto má být struktura co nejštíhlejší.

---

## 3. Finální sada polí

| Pole | Typ pole | Povinnost | Smysl |
|---|---|---:|---|
| `Dotčené fáze` | multi-select | ano | Ve kterých fázích může být činnost relevantní |
| `Režim činnosti` | single-select | ano | Jak se činnost v projektu chová |
| `Spouštěcí událost` | multi-select | doporučeno | Co činnost aktivuje |
| `Opakovatelnost` | single-select | ano | Jak často se činnost typicky provádí |
| `Časové pravidlo` | single-select | doporučeno | Kdy se činnost provádí vůči fázi, události, schválení nebo předání |
| `Časová poznámka` | text | volitelné | Volné upřesnění časového pravidla |
| `Lhůta` | text | volitelné | Konkrétní časový limit, pokud existuje |
| `Ukončovací podmínka` | single-select | doporučeno | Kdy se činnost považuje za dokončenou |
| `Poznámka k ukončení` | text | volitelné | Volné upřesnění ukončení činnosti |

---

# 4. Číselník: Dotčené fáze

**Typ pole:** `multi-select`

Pole určuje, ve kterých fázích je činnost relevantní. Používají se celé názvy fází, nikoliv pouze zkratky.

## Hodnoty

| Hodnota |
|---|
| Strategická příprava / investiční záměr |
| Příprava zakázky |
| Dokumentace návrhu stavby / studie |
| Dokumentace pro povolení záměru / stavby |
| Dokumentace pro provádění stavby |
| Soupis prací a dodávek |
| Realizace / dozor projektanta |
| Předání a uvedení do provozu |
| Provoz a správa aktiv |

## Poznámka

Pole `Dotčené fáze` může obsahovat více hodnot. Například činnost „Definovat požadavky zadavatele na informace“ může být relevantní ve fázích:

- Strategická příprava / investiční záměr,
- Příprava zakázky,
- Dokumentace návrhu stavby / studie.

---

# 5. Číselník: Režim činnosti

**Typ pole:** `single-select`

Pole popisuje, jak se činnost chová v čase.

## Hodnoty

| Hodnota | Význam | Příklad |
|---|---|---|
| Fázová | Činnost se váže hlavně na určitou fázi projektu | zpracovat dokumentaci pro povolení záměru / stavby |
| Milníková | Činnost se váže na významný rozhodovací nebo předávací bod | schválit investiční záměr, předat stavbu |
| Událostní | Činnost se spustí konkrétní událostí | odevzdání modelu → kontrola modelu |
| Periodická | Činnost se opakuje v pravidelném intervalu | měsíční report |
| Průběžná | Činnost probíhá soustavně během určité části projektu | správa CDE, vedení issue registru |
| Podmíněná | Činnost se řeší pouze tehdy, když nastane určitá situace | claim, změna, vada, prodlení |
| Aktualizační | Činnost se provádí při změně existujícího výstupu, požadavku nebo nastavení | aktualizovat BEP při změně požadavků |

---

# 6. Číselník: Spouštěcí událost

**Typ pole:** `multi-select`

Pole určuje konkrétní událost nebo situaci, která činnost aktivuje.

Kategorii spouštěcí události nevedeme jako samostatné pole. Je součástí názvu hodnoty.

Doporučený formát zápisu:

```text
Oblast – konkrétní událost
```

Příklady:

```text
Projekt – zahájení projektu
Dokumentace – odevzdání dokumentace
BIM – odevzdání modelu
CDE – změna stavu informačního kontejneru
Smlouva – vznik claimové události
Kontrola – kontrola souladu s EIR
Periodicky – měsíční reporting
Provoz – předání asset dat
```

Doporučení pro praxi:

> U jedné činnosti vybírat obvykle 1–3 spouštěcí události. Pokud jich je výrazně více, činnost je pravděpodobně příliš obecná a měla by se rozdělit.

---

## 6.1 Projektové spouštěcí události

| Hodnota |
|---|
| Projekt – zahájení projektu |
| Projekt – schválení investičního záměru |
| Projekt – schválení stavebního programu |
| Projekt – zahájení přípravy zadání |
| Projekt – zahájení přípravy zadávací dokumentace |
| Projekt – vyhlášení zakázky |
| Projekt – výběr dodavatele |
| Projekt – uzavření smlouvy |
| Projekt – předání staveniště |
| Projekt – zahájení realizace |
| Projekt – ukončení realizace |
| Projekt – zahájení předání stavby |
| Projekt – uvedení stavby do provozu |
| Projekt – zahájení provozní fáze |

---

## 6.2 Fázové spouštěcí události

| Hodnota |
|---|
| Fáze – zahájení fáze |
| Fáze – ukončení fáze |
| Fáze – přechod do další fáze |
| Fáze – kontrola připravenosti |
| Fáze – schválení výstupů fáze |
| Fáze – rozhodnutí o pokračování projektu |
| Fáze – pozastavení projektu |
| Fáze – obnovení projektu |

---

## 6.3 Dokumentační spouštěcí události

| Hodnota |
|---|
| Dokumentace – vznik nového dokumentu |
| Dokumentace – odevzdání dokumentace |
| Dokumentace – předložení dokumentace ke kontrole |
| Dokumentace – předložení dokumentace ke schválení |
| Dokumentace – vrácení dokumentace s připomínkami |
| Dokumentace – vypořádání připomínek |
| Dokumentace – schválení dokumentace |
| Dokumentace – zamítnutí dokumentace |
| Dokumentace – revize dokumentace |
| Dokumentace – změna dokumentace |
| Dokumentace – vydání nové verze dokumentace |
| Dokumentace – archivace dokumentace |

---

## 6.4 BIM / informační spouštěcí události

| Hodnota |
|---|
| BIM – definice informačních požadavků |
| BIM – předložení BEP |
| BIM – schválení BEP |
| BIM – aktualizace BEP |
| BIM – odevzdání modelu |
| BIM – odevzdání koordinačního modelu |
| BIM – odevzdání IFC |
| BIM – odevzdání datové sady |
| BIM – milník informačního předání |
| BIM – zjištění kolize |
| BIM – vytvoření issue |
| BIM – vypořádání issue |
| BIM – schválení modelu |
| BIM – zamítnutí modelu |
| BIM – změna požadavků na informace |
| BIM – změna datového standardu |
| BIM – předání dat pro provoz |

---

## 6.5 CDE spouštěcí události

| Hodnota |
|---|
| CDE – založení projektu v CDE |
| CDE – nastavení práv |
| CDE – změna práv |
| CDE – nahrání informačního kontejneru |
| CDE – změna stavu informačního kontejneru |
| CDE – předání informačního kontejneru ke kontrole |
| CDE – schválení informačního kontejneru |
| CDE – vrácení informačního kontejneru |
| CDE – publikace dokumentu nebo modelu |
| CDE – archivace informačního kontejneru |
| CDE – audit CDE |

---

## 6.6 Smluvní spouštěcí události

| Hodnota |
|---|
| Smlouva – uzavření smlouvy |
| Smlouva – pokyn objednatele |
| Smlouva – pokyn správce stavby |
| Smlouva – žádost o změnu |
| Smlouva – vznik změny |
| Smlouva – schválení změny |
| Smlouva – zamítnutí změny |
| Smlouva – vznik claimové události |
| Smlouva – oznámení claimu |
| Smlouva – předložení claimu |
| Smlouva – rozhodnutí o claimu |
| Smlouva – prodlení |
| Smlouva – přerušení prací |
| Smlouva – obnovení prací |
| Smlouva – nepředvídatelná okolnost |
| Smlouva – spor |
| Smlouva – dohoda stran |

---

## 6.7 Kontrolní spouštěcí události

| Hodnota |
|---|
| Kontrola – interní kontrola |
| Kontrola – externí kontrola |
| Kontrola – technické review |
| Kontrola – BIM review |
| Kontrola – kontrola kvality |
| Kontrola – kontrola úplnosti |
| Kontrola – kontrola souladu se zadáním |
| Kontrola – kontrola souladu se smlouvou |
| Kontrola – kontrola souladu s EIR |
| Kontrola – kontrola souladu s BEP |
| Kontrola – kontrola před fázovou bránou |
| Kontrola – audit |
| Kontrola – přejímka |
| Kontrola – zkouška |
| Kontrola – inspekce |

---

## 6.8 Periodické spouštěcí události

| Hodnota |
|---|
| Periodicky – denní kontrola |
| Periodicky – týdenní kontrolní den |
| Periodicky – týdenní BIM koordinace |
| Periodicky – měsíční reporting |
| Periodicky – měsíční uzávěrka |
| Periodicky – kvartální review |
| Periodicky – roční aktualizace |
| Periodicky – pravidelná aktualizace registru |
| Periodicky – pravidelná aktualizace harmonogramu |
| Periodicky – pravidelná aktualizace rizik |

---

## 6.9 Provozní spouštěcí události

| Hodnota |
|---|
| Provoz – předání stavby |
| Provoz – předání provozní dokumentace |
| Provoz – předání asset dat |
| Provoz – import dat do CAFM |
| Provoz – zahájení zkušebního provozu |
| Provoz – ukončení zkušebního provozu |
| Provoz – zahájení běžného provozu |
| Provoz – změna aktiva |
| Provoz – údržbový zásah |
| Provoz – porucha |
| Provoz – reklamace |
| Provoz – revize zařízení |
| Provoz – aktualizace pasportu |
| Provoz – vyřazení aktiva |

---

# 7. Číselník: Opakovatelnost

**Typ pole:** `single-select`

Pole říká, jak často se činnost typicky provádí.

## Hodnoty

| Hodnota | Význam | Příklad |
|---|---|---|
| Jednorázově | Typicky jednou za projekt nebo jednou za hlavní rozhodnutí | schválit investiční záměr |
| Jednou za fázi | Jednou v každé relevantní fázi | fázová kontrola připravenosti |
| Při každém výskytu spouštěcí události | Pokaždé, když nastane daná událost | kontrola modelu při každém odevzdání |
| Při změně | Když se změní požadavek, dokument, tým, stav nebo řešení | aktualizovat BEP |
| Periodicky | V pravidelném intervalu | měsíční report |
| Průběžně | Běží soustavně bez přesného počtu opakování | správa CDE, evidence připomínek |
| Podle potřeby | Provádí se ad hoc | svolat koordinační jednání |

---

# 8. Číselník: Časové pravidlo

**Typ pole:** `single-select`

Pole říká, kdy se má činnost provést vzhledem ke spouštěcí události, fázi, schválení nebo předání.

## Hodnoty

| Hodnota | Význam |
|---|---|
| Před spouštěcí událostí | Činnost musí proběhnout před danou událostí |
| Při spouštěcí události | Činnost probíhá současně s událostí |
| Bezprostředně po spouštěcí události | Činnost následuje hned po události |
| Po spouštěcí události | Činnost se provádí po události, bez přesného určení |
| Před zahájením fáze | Činnost je podmínkou pro zahájení fáze |
| Během fáze | Činnost probíhá v průběhu fáze |
| Před ukončením fáze | Činnost má být dokončena před uzavřením fáze |
| Po ukončení fáze | Činnost navazuje na dokončení fáze |
| Před schválením | Činnost musí proběhnout před formálním schválením |
| Po schválení | Činnost navazuje na formální schválení |
| Před předáním | Činnost musí být hotová před předáním výstupu, dat nebo stavby |
| Při předání | Činnost probíhá v okamžiku předání |
| Po předání | Činnost navazuje na předání |
| Průběžně | Činnost nemá jeden konkrétní okamžik |
| Ve smluvní lhůtě | Činnost se provádí ve lhůtě podle smlouvy |
| V zákonné lhůtě | Činnost se provádí ve lhůtě podle právního předpisu |
| V dohodnuté lhůtě | Činnost se provádí ve lhůtě dohodnuté na projektu |

## Doplněk

K poli `Časové pravidlo` je vhodné mít textové pole `Časová poznámka`.

Příklady:

| Časové pravidlo | Časová poznámka |
|---|---|
| Po spouštěcí události | do 5 pracovních dnů od odevzdání modelu |
| Před schválením | kontrola musí proběhnout před změnou stavu v CDE |
| Ve smluvní lhůtě | konkrétní lhůta dle smlouvy |

---

# 9. Pole: Lhůta

**Typ pole:** `text`

Pole obsahuje konkrétní časový limit, pokud existuje.

Lhůtu necháváme jako textové pole, protože může být:

- smluvní,
- zákonná,
- projektová,
- interní,
- navázaná na harmonogram,
- navázaná na CDE workflow.

## Doporučené vzory zápisu

| Hodnota / vzor |
|---|
| Bez lhůty |
| Ihned |
| Bez zbytečného odkladu |
| Dle smlouvy |
| Dle zákona |
| Dle harmonogramu |
| Dle CDE workflow |
| Dle interní metodiky |
| Do 5 pracovních dnů |
| Do 10 pracovních dnů |
| Do 14 kalendářních dnů |
| Do 28 kalendářních dnů |
| Před vyhlášením zakázky |
| Před zahájením fáze |
| Před předáním |
| K datu uvedenému ve smlouvě |
| Měsíčně do 5. pracovního dne |
| Průběžně po dobu dotčené fáze |

---

# 10. Číselník: Ukončovací podmínka

**Typ pole:** `single-select`

Pole říká, kdy se činnost považuje za dokončenou.

## Hodnoty

| Hodnota |
|---|
| Výstup vytvořen |
| Výstup odevzdán |
| Výstup zkontrolován |
| Výstup schválen |
| Výstup publikován |
| Připomínky vypořádány |
| Issue uzavřeno |
| Změna schválena |
| Změna zamítnuta |
| Claim oznámen |
| Claim vyhodnocen |
| Rozhodnutí vydáno |
| Záznam proveden |
| Data importována |
| Předání potvrzeno |
| Kontrola bez zjištění |
| Nápravné opatření provedeno |
| Fáze uzavřena |
| Činnost není dále relevantní |

## Doplněk

K poli `Ukončovací podmínka` je vhodné mít textové pole `Poznámka k ukončení`.

Příklady:

| Ukončovací podmínka | Poznámka k ukončení |
|---|---|
| Výstup schválen | schváleno zadavatelem v CDE |
| Připomínky vypořádány | všechny připomínky mají stav uzavřeno |
| Data importována | import do CAFM proběhl bez chyb |
| Claim oznámen | notice bylo odesláno ve smluvní lhůtě |

---

# 11. Doporučený datový model pro aplikaci

Níže je jednoduchý návrh názvů polí pro databázovou nebo aplikační implementaci.

| Český název pole | Doporučený technický název | Typ |
|---|---|---|
| Dotčené fáze | `affected_phases` | array of enum/string |
| Režim činnosti | `activity_mode` | enum/string |
| Spouštěcí událost | `trigger_events` | array of enum/string |
| Opakovatelnost | `repeatability` | enum/string |
| Časové pravidlo | `timing_rule` | enum/string |
| Časová poznámka | `timing_note` | string |
| Lhůta | `deadline` | string |
| Ukončovací podmínka | `completion_condition` | enum/string |
| Poznámka k ukončení | `completion_note` | string |

---

# 12. Příklad záznamu činnosti

## Příklad 1: Definovat požadavky zadavatele na informace

| Pole | Hodnota |
|---|---|
| Dotčené fáze | Strategická příprava / investiční záměr; Příprava zakázky; Dokumentace návrhu stavby / studie |
| Režim činnosti | Fázová |
| Spouštěcí událost | Projekt – zahájení přípravy zadávací dokumentace; BIM – definice informačních požadavků |
| Opakovatelnost | Jednorázově |
| Časové pravidlo | Před spouštěcí událostí |
| Časová poznámka | Má být hotové před vyhlášením zakázky nebo před oslovením dodavatelů. |
| Lhůta | Před vyhlášením zakázky |
| Ukončovací podmínka | Výstup schválen |
| Poznámka k ukončení | Požadavky zadavatele na informace jsou schváleny a promítnuty do zadávací dokumentace. |

---

## Příklad 2: Provést kontrolu modelu

| Pole | Hodnota |
|---|---|
| Dotčené fáze | Dokumentace pro povolení záměru / stavby; Dokumentace pro provádění stavby; Realizace / dozor projektanta; Předání a uvedení do provozu |
| Režim činnosti | Událostní |
| Spouštěcí událost | BIM – odevzdání modelu; BIM – milník informačního předání |
| Opakovatelnost | Při každém výskytu spouštěcí události |
| Časové pravidlo | Po spouštěcí události |
| Časová poznámka | Kontrola probíhá po odevzdání modelu a před jeho schválením nebo publikací. |
| Lhůta | Dle CDE workflow |
| Ukončovací podmínka | Výstup zkontrolován |
| Poznámka k ukončení | Kontrolní report je vytvořen a případné issue jsou založeny v registru. |

---

## Příklad 3: Vést issue register

| Pole | Hodnota |
|---|---|
| Dotčené fáze | Dokumentace návrhu stavby / studie; Dokumentace pro povolení záměru / stavby; Dokumentace pro provádění stavby; Realizace / dozor projektanta |
| Režim činnosti | Průběžná |
| Spouštěcí událost | BIM – vytvoření issue; Dokumentace – vrácení dokumentace s připomínkami; Kontrola – BIM review |
| Opakovatelnost | Průběžně |
| Časové pravidlo | Průběžně |
| Časová poznámka | Issue register se vede po dobu dotčených fází a aktualizuje se při vzniku nebo vypořádání issue. |
| Lhůta | Průběžně po dobu dotčené fáze |
| Ukončovací podmínka | Issue uzavřeno |
| Poznámka k ukončení | Jednotlivé issue je uzavřeno po vypořádání a schválení odpovědnou osobou. |

---

## Příklad 4: Měsíční report projektu

| Pole | Hodnota |
|---|---|
| Dotčené fáze | Dokumentace pro povolení záměru / stavby; Dokumentace pro provádění stavby; Realizace / dozor projektanta |
| Režim činnosti | Periodická |
| Spouštěcí událost | Periodicky – měsíční reporting |
| Opakovatelnost | Periodicky |
| Časové pravidlo | Po spouštěcí události |
| Časová poznámka | Report se zpracovává po skončení reportingového období. |
| Lhůta | Měsíčně do 5. pracovního dne |
| Ukončovací podmínka | Výstup odevzdán |
| Poznámka k ukončení | Měsíční report je odevzdán zadavateli nebo projektovému týmu. |

---

## Příklad 5: Oznámit claim

| Pole | Hodnota |
|---|---|
| Dotčené fáze | Realizace / dozor projektanta |
| Režim činnosti | Podmíněná |
| Spouštěcí událost | Smlouva – vznik claimové události; Smlouva – prodlení; Smlouva – nepředvídatelná okolnost |
| Opakovatelnost | Při každém výskytu spouštěcí události |
| Časové pravidlo | Ve smluvní lhůtě |
| Časová poznámka | Konkrétní postup a lhůta závisí na smluvních podmínkách daného projektu. |
| Lhůta | Dle smlouvy |
| Ukončovací podmínka | Claim oznámen |
| Poznámka k ukončení | Notice bylo odesláno příslušné smluvní straně ve smluvní lhůtě. |

---

## Příklad 6: Aktualizovat BEP

| Pole | Hodnota |
|---|---|
| Dotčené fáze | Příprava zakázky; Dokumentace návrhu stavby / studie; Dokumentace pro povolení záměru / stavby; Dokumentace pro provádění stavby; Realizace / dozor projektanta |
| Režim činnosti | Aktualizační |
| Spouštěcí událost | BIM – změna požadavků na informace; BIM – aktualizace BEP; Projekt – výběr dodavatele |
| Opakovatelnost | Při změně |
| Časové pravidlo | Po spouštěcí události |
| Časová poznámka | BEP se aktualizuje po změně požadavků, týmu, odpovědností nebo způsobu dodání informací. |
| Lhůta | Dle interní metodiky |
| Ukončovací podmínka | Výstup schválen |
| Poznámka k ukončení | Aktualizovaný BEP je schválen odpovědnou osobou a zpřístupněn projektovému týmu. |

---

# 13. Poznámky pro Obsidian

Doporučený způsob použití v Obsidianu:

- tento dokument může sloužit jako metodická stránka,
- jednotlivé činnosti mohou být samostatné poznámky,
- pole lze zapisovat do YAML frontmatteru každé činnosti,
- hodnoty u multi-select polí lze zapisovat jako seznam.

## Příklad YAML frontmatteru pro jednu činnost

```yaml
---
title: "Provést kontrolu modelu"
affected_phases:
  - "Dokumentace pro povolení záměru / stavby"
  - "Dokumentace pro provádění stavby"
  - "Realizace / dozor projektanta"
  - "Předání a uvedení do provozu"
activity_mode: "Událostní"
trigger_events:
  - "BIM – odevzdání modelu"
  - "BIM – milník informačního předání"
repeatability: "Při každém výskytu spouštěcí události"
timing_rule: "Po spouštěcí události"
timing_note: "Kontrola probíhá po odevzdání modelu a před jeho schválením nebo publikací."
deadline: "Dle CDE workflow"
completion_condition: "Výstup zkontrolován"
completion_note: "Kontrolní report je vytvořen a případné issue jsou založeny v registru."
---
```

---

# 14. Poznámky pro Cursor / aplikaci

Pro aplikaci je vhodné začít jednoduše:

- enum hodnoty držet centrálně,
- nepřidávat samostatnou kategorii spouštěcí události,
- kategorii události odvozovat z prefixu před znakem `–`, pokud bude někdy potřeba,
- u pole `trigger_events` povolit více hodnot,
- u pole `affected_phases` povolit více hodnot,
- u polí `activity_mode`, `repeatability`, `timing_rule` a `completion_condition` povolit pouze jednu hodnotu.

## Doporučený JSON tvar jedné činnosti

```json
{
  "title": "Provést kontrolu modelu",
  "affected_phases": [
    "Dokumentace pro povolení záměru / stavby",
    "Dokumentace pro provádění stavby",
    "Realizace / dozor projektanta",
    "Předání a uvedení do provozu"
  ],
  "activity_mode": "Událostní",
  "trigger_events": [
    "BIM – odevzdání modelu",
    "BIM – milník informačního předání"
  ],
  "repeatability": "Při každém výskytu spouštěcí události",
  "timing_rule": "Po spouštěcí události",
  "timing_note": "Kontrola probíhá po odevzdání modelu a před jeho schválením nebo publikací.",
  "deadline": "Dle CDE workflow",
  "completion_condition": "Výstup zkontrolován",
  "completion_note": "Kontrolní report je vytvořen a případné issue jsou založeny v registru."
}
```

---

# 15. Shrnutí finální logiky

Finální návrh je jednoduchý:

```text
Činnost
→ Dotčené fáze
→ Režim činnosti
→ Spouštěcí událost
→ Opakovatelnost
→ Časové pravidlo
→ Lhůta
→ Ukončovací podmínka
```

Bez pole `Hlavní fáze`.

Bez pole `Kategorie spouštěcí události`.

Kategorie spouštěcí události je součástí jejího názvu:

```text
BIM – odevzdání modelu
Smlouva – vznik změny
Dokumentace – odevzdání dokumentace
Provoz – předání asset dat
```

Tato struktura je dostatečně jednoduchá pro ruční plnění, ale zároveň dostatečně přesná pro filtrování, databázové pohledy a budoucí aplikaci.

---

# 16. Poznámka k mapování FIDIC Red RSD

Při přenosu činností z podkladů FIDIC Red RSD se časové bloky ze vstupní tabulky mapují do stávajících metadat bez přidání nových polí:

- `spousteci_udalost` nese primární časový kontext,
- `etapa` nese projektové zasazení činnosti,
- `casove_pravidlo` upřesňuje vztah k události (typicky `po`),
- `zdroj` má formát `FIDIC_red_RSD; <cislo_bodu>; <clanek_smlouvy>`.

Tím je zachována kompatibilita katalogu pro ISO 19650 i FIDIC bez změny struktury frontmatteru.
