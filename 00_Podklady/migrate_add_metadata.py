"""
Údržbové úpravy poznámek v 03_Oblasti správy informací (pokud složka existuje).

Dříve skript doplňoval odstraněná pole (vstupy, výstupy, navazane_workflow,
predchozi/nasledujici_cinnost, nastroj). Ta už se nepoužívají — viz
07_Sprava_obsahu/Pravidla metadat.md.

Aktuální chování:
  1. Opravit mojibake v těle poznámky
  2. U typu dilci_cinnost se řídkému tělu doplnit sekce Účel / Postup / Kontrolní body

Workflow soubory (03_CDE_workflow): doplnění prázdného navazane_cinnosti pokud chybí.

Usage:
  python migrate_add_metadata.py              # dry-run (default)
  python migrate_add_metadata.py --apply      # write changes to disk
"""

import argparse
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VAULT_ROOT = os.path.dirname(SCRIPT_DIR)
OBLASTI_DIR = os.path.join(VAULT_ROOT, "03_Oblasti správy informací")
WORKFLOW_DIR = os.path.join(VAULT_ROOT, "03_CDE_workflow")
REPORT_PATH = os.path.join(WORKFLOW_DIR, "_report_migrace_metadat.txt")

MOJIBAKE_REPLACEMENTS_MULTI = [
    ("Å\u0099", "ř"),
    ("Å¡", "š"),
    ("Å¥", "ť"),
    ("Å¾", "ž"),
    ("Å\u0088", "ň"),
    ("Å¯", "ů"),
    ("Å™", "ř"),
    ("Ã¡", "á"),
    ("Ã©", "é"),
    ("Ã\u00ad", "í"),
    ("Ã­", "í"),
    ("Ã³", "ó"),
    ("Ãº", "ú"),
    ("Ã½", "ý"),
    ("Ä\u008d", "č"),
    ("ÄŤ", "č"),
    ("Ä\u009b", "ě"),
    ("Ä›", "ě"),
    ("Ä¯", "ď"),
    ("ÄŒ", "Č"),
    ("ÄŒinnost", "Činnost"),
]

MOJIBAKE_REPLACEMENTS_POST = [
    ("NadÅazená", "Nadřazená"),
    ("NadÅazenÃ¡", "Nadřazená"),
]


def parse_frontmatter(content: str):
    """Split file into frontmatter lines and body. Returns (fm_lines, body, has_fm)."""
    text = content.lstrip("\ufeff")
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    if not text.startswith("---"):
        return [], text, False

    end_idx = text.find("\n---", 3)
    if end_idx == -1:
        return [], text, False

    fm_block = text[4:end_idx]
    fm_lines = fm_block.split("\n")
    body = text[end_idx + 4:]
    if body.startswith("\n"):
        body = body[1:]
    return fm_lines, body, True


def reassemble(fm_lines: list, body: str) -> str:
    return "---\n" + "\n".join(fm_lines) + "\n---\n" + body


def extract_fm_value(fm_lines: list, key: str) -> str:
    """Extract a scalar value for a given key from frontmatter lines."""
    for line in fm_lines:
        if line.startswith(key + ":"):
            val = line[len(key) + 1:].strip()
            return val
    return ""


def fm_has_key(fm_lines: list, key: str) -> bool:
    for line in fm_lines:
        if line.startswith(key + ":"):
            return True
    return False


def fix_mojibake(text: str) -> str:
    result = text
    for bad, good in MOJIBAKE_REPLACEMENTS_MULTI:
        result = result.replace(bad, good)
    for bad, good in MOJIBAKE_REPLACEMENTS_POST:
        result = result.replace(bad, good)
    return result


def body_is_sparse(body: str) -> bool:
    """Check if body has only minimal auto-generated sections (Popis/Zdroj/Návaznosti)."""
    stripped = body.strip()
    if not stripped:
        return True

    lines = [l.strip() for l in stripped.split("\n") if l.strip()]
    meaningful = []
    for line in lines:
        if line.startswith("##"):
            continue
        if line in ("n/a", "—", "(K doplnění)"):
            continue
        if line.startswith("- Nad") and "sekce:" in line:
            continue
        if re.match(r'^ČSN EN ISO \d', line):
            continue
        if line in ("R", ""):
            continue
        meaningful.append(line)

    return len(meaningful) == 0


def body_has_section(body: str, heading: str) -> bool:
    return heading in body


def process_oblasti(dry_run: bool) -> dict:
    """Process all files in 03_Oblasti správy informací/. Returns stats dict."""
    stats = {
        "total": 0,
        "mojibake_fixed": 0,
        "body_templates_added": 0,
        "errors": [],
    }

    if not os.path.isdir(OBLASTI_DIR):
        stats["errors"].append(f"Složka neexistuje (přeskočeno): {OBLASTI_DIR}")
        return stats

    for fname in os.listdir(OBLASTI_DIR):
        if not fname.endswith(".md"):
            continue
        fpath = os.path.join(OBLASTI_DIR, fname)
        with open(fpath, "r", encoding="utf-8-sig") as f:
            content = f.read()
        fm_lines, body, has_fm = parse_frontmatter(content)
        if not has_fm:
            stats["errors"].append(f"No frontmatter: {fname}")
            continue

        stats["total"] += 1
        typ = extract_fm_value(fm_lines, "typ").strip('"').strip("'")

        changed = False
        new_body = fix_mojibake(body)
        if new_body != body:
            body = new_body
            changed = True
            stats["mojibake_fixed"] += 1

        if typ == "dilci_cinnost" and body_is_sparse(body):
            needs_ucel = not body_has_section(body, "## Účel")
            needs_postup = not body_has_section(body, "## Postup")
            needs_kontrolni = not body_has_section(body, "## Kontrolní body")

            if needs_ucel or needs_postup or needs_kontrolni:
                sections_to_add = []
                if needs_ucel:
                    sections_to_add.append("\n## Účel\n\n(K doplnění)\n")
                if needs_postup:
                    sections_to_add.append("\n## Postup\n\n(K doplnění)\n")
                if needs_kontrolni:
                    sections_to_add.append("\n## Kontrolní body pro správce stavby\n\n(K doplnění)\n")

                body = body.rstrip() + "\n" + "\n".join(sections_to_add) + "\n"
                changed = True
                stats["body_templates_added"] += 1

        if changed:
            new_content = reassemble(fm_lines, body)
            if not dry_run:
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(new_content)

    return stats


def process_workflows(dry_run: bool) -> dict:
    """Process workflow files in 03_CDE_workflow/. Returns stats dict."""
    stats = {"total": 0, "fm_updated": 0, "skipped": 0, "errors": []}

    if not os.path.isdir(WORKFLOW_DIR):
        stats["errors"].append(f"Složka neexistuje: {WORKFLOW_DIR}")
        return stats

    for fname in os.listdir(WORKFLOW_DIR):
        if not fname.endswith(".md"):
            continue
        fpath = os.path.join(WORKFLOW_DIR, fname)
        with open(fpath, "r", encoding="utf-8-sig") as f:
            content = f.read()

        fm_lines, body, has_fm = parse_frontmatter(content)
        if not has_fm:
            stats["errors"].append(f"No frontmatter: {fname}")
            continue

        stats["total"] += 1

        if fm_has_key(fm_lines, "navazane_cinnosti"):
            stats["skipped"] += 1
            continue

        fm_lines.append("navazane_cinnosti: []")
        new_content = reassemble(fm_lines, body)

        if not dry_run:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(new_content)

        stats["fm_updated"] += 1

    return stats


def write_report(oblasti_stats: dict, wf_stats: dict, dry_run: bool):
    lines = [
        f"=== Migrace metadat {'(DRY RUN)' if dry_run else '(APPLIED)'} ===",
        "",
        "--- 03_Oblasti správy informací ---",
        f"  Celkem souborů:         {oblasti_stats['total']}",
        f"  Mojibake opraveno:      {oblasti_stats['mojibake_fixed']}",
        f"  Body template přidáno:  {oblasti_stats['body_templates_added']}",
    ]
    if oblasti_stats["errors"]:
        lines.append(f"  Poznámky: {len(oblasti_stats['errors'])}")
        for e in oblasti_stats["errors"]:
            lines.append(f"    - {e}")

    lines.extend([
        "",
        "--- 03_CDE_workflow ---",
        f"  Celkem souborů:     {wf_stats['total']}",
        f"  FM aktualizováno:   {wf_stats['fm_updated']}",
        f"  Přeskočeno:         {wf_stats['skipped']}",
    ])
    if wf_stats["errors"]:
        lines.append(f"  Chyby: {len(wf_stats['errors'])}")
        for e in wf_stats["errors"]:
            lines.append(f"    - {e}")

    report = "\n".join(lines) + "\n"
    print(report)

    if not dry_run and os.path.isdir(WORKFLOW_DIR):
        with open(REPORT_PATH, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"Report uložen: {REPORT_PATH}")


def main():
    parser = argparse.ArgumentParser(description="Údržba MD v oblasti/workflow (bez legacy frontmatteru).")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually write changes. Without this flag, runs in dry-run mode.",
    )
    args = parser.parse_args()
    dry_run = not args.apply

    if dry_run:
        print("=== DRY RUN (žádné změny se nezapíší) ===\n")
    else:
        print("=== APPLYING CHANGES ===\n")

    oblasti_stats = process_oblasti(dry_run)
    wf_stats = process_workflows(dry_run)
    write_report(oblasti_stats, wf_stats, dry_run)


if __name__ == "__main__":
    main()
