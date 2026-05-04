"""
FRR charakter refactor — jednorázový migrační skript.

Provede na všech 29 FRR-*.md v 03_Katalog všech činností/FIDIC Red RSD/:
  1. Odebere `rezim_cinnosti` a `opakovatelnost`
  2. Přidá `charakter` (dle tabulky CHARAKTER_MAP) za klíč `stav`
  3. Opraví / odebere `spousteci_udalost` (dle SPOUSTECI_MAP)
  4. Opraví `ukoncovaci_podminka` pro FRR-15, 16, 17, 23
  5. Opraví `faze` FRR-26 (realizace → provoz)
  6. Opraví RACI formátování FRR-18 (wikilinky → plain text, A → [])
  7. Doplní `I - Informování po dokončení činnosti` pro zřejmé případy

Usage:
  python frr_charakter_refactor.py              # dry-run
  python frr_charakter_refactor.py --apply      # zapsat změny
"""

import argparse
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VAULT_ROOT = os.path.dirname(SCRIPT_DIR)
FRR_DIR = os.path.join(VAULT_ROOT, "03_Katalog všech činností", "FIDIC Red RSD")

# charakter hodnota pro každé číslo FRR
CHARAKTER_MAP = {
    1: "jednorazove",
    2: "jednorazove",
    3: "jednorazove",
    4: "jednorazove",
    5: "jednorazove",
    6: "jednorazove",
    7: "jednorazove",
    8: "jednorazove",
    9: "jednorazove",
    10: "podminena",
    11: "jednorazove",
    12: "jednorazove",
    13: "opakujici",
    14: "podminena",
    15: "opakujici",
    16: "podminena",
    17: "podminena",
    18: "podminena",
    19: "podminena",
    20: "podminena",
    21: "podminena",
    22: "podminena",
    23: "podminena",
    24: "podminena",
    25: "jednorazove",
    26: "jednorazove",
    27: "podminena",
    28: "jednorazove",
    29: "jednorazove",
}

# spousteci_udalost hodnota; None = odebrat celý klíč
SPOUSTECI_MAP = {
    1: None,
    2: None,
    3: None,
    4: None,
    5: None,
    6: None,
    7: None,
    8: None,
    9: None,
    10: "smlouva_zadost_podzhotovitele",
    11: "smlouva_predlozeni_harmonogramu",
    12: None,
    13: "smlouva_predlozeni_vyuctovani",
    14: "smlouva_predlozeni_vyuctovani",
    15: "smlouva_oznameni_zhotovitele",
    16: "smlouva_nepredvidatelna_okolnost",
    17: "smlouva_predlozeni_harmonogramu",
    18: "kontrola_technicke_review",
    19: "kontrola_zkouska",
    20: "kontrola_zkouska",
    21: "kontrola_zkouska",
    22: "kontrola_zkouska",
    23: "kontrola_inspekce",
    24: "kontrola_inspekce",
    25: "smlouva_zadost_o_prevzeti",
    26: "smlouva_predlozeni_vyuctovani",
    27: "provoz_zjisteni_vady",
    28: None,
    29: "smlouva_predlozeni_vyuctovani",
}

# ukoncovaci_podminka opravy
UKONCOVACI_MAP = {
    15: "rozhodnuti_vydano",
    16: "rozhodnuti_vydano",
    17: "rozhodnuti_vydano",
    23: "rozhodnuti_vydano",
}

# faze opravy
FAZE_MAP = {
    26: "provoz",
}

# I - Informování doplnění
INFORMOVANI_MAP = {
    2:  ["Objednatel", "Zhotovitel"],
    9:  ["Zhotovitel"],
    13: ["Objednatel"],
    25: ["Objednatel"],
    28: ["Objednatel"],
    29: ["Objednatel"],
}


def parse_frontmatter(content: str):
    text = content.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n")
    if not text.startswith("---"):
        return [], text, False
    end_idx = text.find("\n---", 3)
    if end_idx == -1:
        return [], text, False
    fm_lines = text[4:end_idx].split("\n")
    body = text[end_idx + 4:]
    if body.startswith("\n"):
        body = body[1:]
    return fm_lines, body, True


def reassemble(fm_lines, body):
    return "---\n" + "\n".join(fm_lines) + "\n---\n" + body


def get_frr_number(fname):
    m = re.match(r"FRR-(\d+)", fname, re.IGNORECASE)
    return int(m.group(1)) if m else None


def strip_key_block(fm_lines, key):
    """Remove a key and all its list-item continuation lines."""
    result = []
    skip = False
    for line in fm_lines:
        if line.startswith(key + ":"):
            skip = True
            continue
        if skip:
            stripped = line.strip()
            if stripped.startswith("- ") or stripped == "-":
                continue
            else:
                skip = False
        result.append(line)
    return result


def set_scalar_value(fm_lines, key, value):
    """Replace a scalar key's value. If key absent, do nothing."""
    result = []
    for line in fm_lines:
        if line.startswith(key + ":"):
            result.append(f"{key}: {value}")
        else:
            result.append(line)
    return result


def set_list_value(fm_lines, key, values):
    """Replace a list key's value with new list. If key absent, do nothing."""
    result = []
    skip = False
    for line in fm_lines:
        if line.startswith(key + ":"):
            skip = True
            result.append(f"{key}:")
            for v in values:
                result.append(f"- {v}")
            continue
        if skip:
            stripped = line.strip()
            if stripped.startswith("- ") or stripped == "-":
                continue
            else:
                skip = False
        result.append(line)
    return result


def insert_after_key(fm_lines, after_key, new_lines):
    """Insert new_lines immediately after the line starting with after_key."""
    result = []
    for line in fm_lines:
        result.append(line)
        if line.startswith(after_key + ":") or line.startswith(after_key + " "):
            result.extend(new_lines)
    return result


def has_key(fm_lines, key):
    return any(line.startswith(key + ":") for line in fm_lines)


def get_scalar_value(fm_lines, key):
    for line in fm_lines:
        if line.startswith(key + ":"):
            return line[len(key) + 1:].strip()
    return None


def process_file(fpath, frr_num, dry_run):
    with open(fpath, "r", encoding="utf-8-sig") as f:
        content = f.read()

    fm_lines, body, has_fm = parse_frontmatter(content)
    if not has_fm:
        print(f"  SKIP (no frontmatter): {os.path.basename(fpath)}")
        return

    changes = []

    # 1. Remove rezim_cinnosti
    if has_key(fm_lines, "rezim_cinnosti"):
        fm_lines = strip_key_block(fm_lines, "rezim_cinnosti")
        changes.append("odebráno rezim_cinnosti")

    # 2. Remove opakovatelnost
    if has_key(fm_lines, "opakovatelnost"):
        fm_lines = strip_key_block(fm_lines, "opakovatelnost")
        changes.append("odebráno opakovatelnost")

    # 3. Add charakter after stav (if not already present)
    charakter_val = CHARAKTER_MAP.get(frr_num)
    if charakter_val and not has_key(fm_lines, "charakter"):
        fm_lines = insert_after_key(fm_lines, "stav", [f"charakter: {charakter_val}"])
        changes.append(f"přidáno charakter: {charakter_val}")
    elif charakter_val and has_key(fm_lines, "charakter"):
        fm_lines = set_scalar_value(fm_lines, "charakter", charakter_val)
        changes.append(f"aktualizováno charakter: {charakter_val}")

    # 4. Fix / remove spousteci_udalost
    new_spousteci = SPOUSTECI_MAP.get(frr_num, "KEEP")
    if new_spousteci is None:
        if has_key(fm_lines, "spousteci_udalost"):
            fm_lines = strip_key_block(fm_lines, "spousteci_udalost")
            changes.append("odebráno spousteci_udalost")
    elif new_spousteci != "KEEP":
        if has_key(fm_lines, "spousteci_udalost"):
            fm_lines = set_list_value(fm_lines, "spousteci_udalost", [new_spousteci])
            changes.append(f"opraveno spousteci_udalost: {new_spousteci}")
        else:
            # insert before ukoncovaci_podminka or before oznaceni
            anchor = "ukoncovaci_podminka" if has_key(fm_lines, "ukoncovaci_podminka") else "oznaceni"
            new_block = ["spousteci_udalost:", f"- {new_spousteci}"]
            result = []
            inserted = False
            for line in fm_lines:
                if not inserted and line.startswith(anchor + ":"):
                    result.extend(new_block)
                    inserted = True
                result.append(line)
            fm_lines = result
            changes.append(f"přidáno spousteci_udalost: {new_spousteci}")

    # 5. Fix ukoncovaci_podminka
    new_uk = UKONCOVACI_MAP.get(frr_num)
    if new_uk:
        old_uk = get_scalar_value(fm_lines, "ukoncovaci_podminka")
        if old_uk != new_uk:
            fm_lines = set_scalar_value(fm_lines, "ukoncovaci_podminka", new_uk)
            changes.append(f"opraveno ukoncovaci_podminka: {old_uk} -> {new_uk}")

    # 6. Fix faze
    new_faze = FAZE_MAP.get(frr_num)
    if new_faze:
        fm_lines = set_list_value(fm_lines, "faze", [new_faze])
        changes.append(f"opravena faze: {new_faze}")

    # 7. Fix FRR-18 RACI wikilinks
    if frr_num == 18:
        new_lines = []
        for line in fm_lines:
            if line.startswith("R - Odpovědnost"):
                line = re.sub(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]", r"\1", line)
            elif line.startswith("A - Právní odpovědnost"):
                # Clear A entirely to []
                line = "A - Právní odpovědnost za dokončení činnosti: []"
                changes.append("opraven RACI formát FRR-18 (A vyprázdněno, R wikilink odstraněn)")
            new_lines.append(line)
        fm_lines = new_lines

    # 8. Fill I - Informování
    informovani = INFORMOVANI_MAP.get(frr_num)
    if informovani:
        current_i = get_scalar_value(fm_lines, "I - Informování po dokončení činnosti")
        is_empty = current_i == "[]" or current_i is None
        if is_empty:
            fm_lines = set_list_value(fm_lines, "I - Informování po dokončení činnosti", informovani)
            changes.append(f"doplněno I: {informovani}")

    if changes:
        new_content = reassemble(fm_lines, body)
        print(f"  {os.path.basename(fpath)}: {'; '.join(changes)}")
        if not dry_run:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(new_content)
    else:
        print(f"  {os.path.basename(fpath)}: beze změny")


def main():
    parser = argparse.ArgumentParser(description="FRR charakter refactor")
    parser.add_argument("--apply", action="store_true", help="Zapsat změny (default: dry-run)")
    args = parser.parse_args()
    dry_run = not args.apply

    if dry_run:
        print("=== DRY RUN — žádné změny se nezapíší ===\n")
    else:
        print("=== APPLYING CHANGES ===\n")

    if not os.path.isdir(FRR_DIR):
        print(f"CHYBA: složka nenalezena: {FRR_DIR}")
        return

    processed = 0
    for fname in sorted(os.listdir(FRR_DIR)):
        if not fname.endswith(".md"):
            continue
        frr_num = get_frr_number(fname)
        if frr_num is None:
            continue
        fpath = os.path.join(FRR_DIR, fname)
        process_file(fpath, frr_num, dry_run)
        processed += 1

    print(f"\nCelkem zpracováno: {processed} souborů")
    if dry_run:
        print("Spusťte s --apply pro zapsání změn.")


if __name__ == "__main__":
    main()
