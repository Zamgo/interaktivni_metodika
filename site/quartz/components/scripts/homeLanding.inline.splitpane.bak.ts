/**
 * ARCHIV — split-pane výsledkový panel (wizard krok 5)
 *
 * Tento soubor je NEAKTIVNÍ záloha původní logiky výsledkového panelu.
 * Aktuálně používaná implementace je v homeLanding.inline.ts (timeline karet).
 *
 * Jak obnovit:
 *  1. V HomeLanding.tsx odkomentuj blok BACKUP-SPLITPANE (HTML split-pane struktura)
 *     a odstraň <div class="wiz-tl-wrap" data-wizard-timeline>.
 *  2. Nahraď funkce renderTimeline / groupByMilestone / buildCardHtml / buildRaciFooterHtml
 *     / attachArrowKeyNav níže uvedenými funkcemi.
 *  3. Styly .home-wizard-result-split / -list* / -preview* jsou zachovány v homeLanding.scss.
 */

// ---------------------------------------------------------------------------
// Typy (shodné s hlavním souborem)
// ---------------------------------------------------------------------------

type WizardRole = {
  key: string
  title: string
  aliases: string[]
}

type WizardActivity = {
  slug: string
  href: string
  title: string
  oznaceni: string
  faze: string[]
  etapa: string[]
  spousteciUdalost: string[]
  rRoles: string[]
  aRoles: string[]
  cRoles: string[]
  iRoles: string[]
  popis: string
}

// ---------------------------------------------------------------------------
// Pomocné funkce
// ---------------------------------------------------------------------------

function escapeHtmlBak(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function isRoleInBak(role: WizardRole, list: string[]): boolean {
  const names = new Set<string>([role.title, ...role.aliases].map((s) => s.trim().toLowerCase()))
  return list.some((r) => names.has(r.trim().toLowerCase()))
}

// ---------------------------------------------------------------------------
// Budování HTML položky v levém seznamu
// ---------------------------------------------------------------------------

function buildListItemHtml(act: WizardActivity, selectedRoles: WizardRole[]): string {
  const raciKeys: string[] = []
  for (const role of selectedRoles) {
    if (isRoleInBak(role, act.rRoles)) raciKeys.push("R")
    if (isRoleInBak(role, act.aRoles)) raciKeys.push("A")
    if (isRoleInBak(role, act.cRoles ?? [])) raciKeys.push("C")
    if (isRoleInBak(role, act.iRoles ?? [])) raciKeys.push("I")
  }
  const uniqueRaci = [...new Set(raciKeys)]

  const numHtml = act.oznaceni
    ? `<span class="home-wizard-result-item-num">${escapeHtmlBak(act.oznaceni)}</span>`
    : ""

  const tagsHtml =
    uniqueRaci.length > 0
      ? `<span class="home-wizard-result-item-tags">${uniqueRaci
          .map(
            (k) =>
              `<span class="home-wizard-result-item-tag raci-${k.toLowerCase()}">${k}</span>`,
          )
          .join("")}</span>`
      : ""

  return (
    `<div class="home-wizard-result-item-body">` +
    `<span class="home-wizard-result-item-title">${escapeHtmlBak(act.title)}</span>` +
    tagsHtml +
    `</div>` +
    numHtml
  )
}

// ---------------------------------------------------------------------------
// Fetch + render inline preview pravého panelu
// ---------------------------------------------------------------------------

let _currentPreviewHref: string | null = null
let _previewAbortController: AbortController | null = null

async function loadPreview(
  previewEl: HTMLElement,
  act: WizardActivity,
): Promise<void> {
  if (_currentPreviewHref === act.href) return
  _currentPreviewHref = act.href

  if (_previewAbortController) {
    _previewAbortController.abort()
  }
  _previewAbortController = new AbortController()
  const signal = _previewAbortController.signal

  previewEl.innerHTML = `
    <a class="home-wizard-result-preview-open" href="${escapeHtmlBak(act.href)}">
      Otevřít stránku →
    </a>
    <p class="home-wizard-result-preview-loading">Načítám náhled…</p>
  `

  try {
    const resp = await fetch(act.href, { signal })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const html = await resp.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")

    // Preferujeme .popover-hint, fallback .article-surface, fallback <article>
    const content =
      doc.querySelector(".popover-hint") ??
      doc.querySelector(".article-surface") ??
      doc.querySelector("article")

    if (!content) {
      throw new Error("Obsah stránky nebyl nalezen.")
    }

    // Odstraníme metadata panel a navigaci z náhledu
    content.querySelectorAll("[data-metadata-panel], nav, .sidebar").forEach((el) => el.remove())

    const inner = document.createElement("div")
    inner.className = "home-wizard-result-preview-inner"
    inner.innerHTML = content.innerHTML

    // Přepíšeme relative linky na absolutní (aby fungovaly uvnitř preview)
    inner.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
      try {
        a.href = new URL(a.getAttribute("href") ?? "", window.location.origin + act.href).href
      } catch {
        // ignorujeme neplatné href
      }
    })

    if (signal.aborted) return
    previewEl.innerHTML = ""
    const openLink = document.createElement("a")
    openLink.className = "home-wizard-result-preview-open"
    openLink.href = act.href
    openLink.textContent = "Otevřít stránku →"
    previewEl.appendChild(openLink)
    previewEl.appendChild(inner)
  } catch (err) {
    if (signal.aborted) return
    const fallback = document.createElement("div")
    fallback.className = "home-wizard-result-preview-fallback"
    fallback.innerHTML =
      `<a class="home-wizard-result-preview-open" href="${escapeHtmlBak(act.href)}">Otevřít stránku →</a>` +
      `<h3>${escapeHtmlBak(act.title)}</h3>` +
      (act.popis ? `<p>${escapeHtmlBak(act.popis)}</p>` : "")
    previewEl.innerHTML = ""
    previewEl.appendChild(fallback)
  }
}

// ---------------------------------------------------------------------------
// Hlavní render funkce (náhrada za renderTimeline)
// ---------------------------------------------------------------------------

/**
 * Vykreslí split-pane: levý seznam úkolů + pravý inline náhled stránky.
 * Nahraďte volání renderTimeline() tímto voláním v renderResult().
 *
 * @param splitEl  Element [data-wizard-split] (div.home-wizard-result-split)
 * @param listEl   Element [data-wizard-list] (ul.home-wizard-result-list)
 * @param previewEl Element [data-wizard-preview] (div.home-wizard-result-preview)
 */
function renderSplitPane(
  splitEl: HTMLElement,
  listEl: HTMLElement,
  previewEl: HTMLElement,
  activities: WizardActivity[],
  selectedRoles: WizardRole[],
): void {
  _currentPreviewHref = null
  listEl.innerHTML = ""
  previewEl.innerHTML = `<p class="home-wizard-result-preview-empty">Vyberte úkol v levém seznamu pro náhled.</p>`

  for (const act of activities) {
    const item = document.createElement("li")
    item.className = "home-wizard-result-item"
    item.tabIndex = 0
    item.dataset.href = act.href
    item.setAttribute("role", "button")
    item.setAttribute("aria-label", act.title)
    item.innerHTML = buildListItemHtml(act, selectedRoles)

    const activate = () => {
      listEl.querySelectorAll(".home-wizard-result-item").forEach((el) => {
        el.classList.remove("active")
      })
      item.classList.add("active")
      loadPreview(previewEl, act)
    }

    item.addEventListener("click", activate)
    item.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        activate()
      }
    })
    listEl.appendChild(item)
  }

  // Automaticky zobraz první položku
  const firstItem = listEl.querySelector<HTMLElement>(".home-wizard-result-item")
  if (firstItem) {
    firstItem.classList.add("active")
    const firstAct = activities[0]
    if (firstAct) loadPreview(previewEl, firstAct)
  }
}

// Zamezení nepoužité proměnné (tento soubor není importován)
void renderSplitPane
