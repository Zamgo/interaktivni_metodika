/**
 * BACKUP: Split-pane result panel — původní implementace kroku 5 wizardu
 *
 * Tento soubor NENÍ nikde importován. Zachovává původní split-pane kód
 * který byl nahrazen timeline layout.
 *
 * Jak obnovit split-pane:
 *  1. Zkopírujte funkce z tohoto souboru zpět do homeLanding.inline.ts
 *  2. V HomeLanding.tsx odkomentujte blok BACKUP-SPLITPANE a smažte .wiz-tl-wrap div
 *  3. Styly .home-wizard-result-* v homeLanding.scss jsou stále přítomny (nebyly odstraněny)
 */

/* ═══════════ Typy (stejné jako v homeLanding.inline.ts) ═══════════ */

type _BakWizardRole = { key: string; title: string; aliases: string[] }
type _BakWizardActivity = {
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

type _BakIndexItem = {
  title?: string
  content?: string
  tags?: string[]
}
type _BakWizardContentIndex = Record<string, _BakIndexItem>

/* ═══════════ Proměnné ═══════════ */

// let indexPromise: Promise<_BakWizardContentIndex> | null = null
// const pagePreviewCache = new Map<string, string>()
// const popoverParser = new DOMParser()
// let activePreviewPopoverLink: HTMLAnchorElement | null = null

/* ═══════════ Funkce — načítání indexu a preview ═══════════ */

function _bak_getContentIndex(): Promise<_BakWizardContentIndex> {
  // if (!indexPromise) {
  //   indexPromise = fetch(new URL("../static/contentIndex.json", window.location.href).toString())
  //     .then((res) => {
  //       if (!res.ok) throw new Error("Nepodarilo se nacist index vyhledavani")
  //       return res.json() as Promise<_BakWizardContentIndex>
  //     })
  //     .catch(() => ({} as _BakWizardContentIndex))
  // }
  // return indexPromise
  return Promise.resolve({})
}

function _bak_absolutizeRelativeUrls(container: HTMLElement, pageUrl: string) {
  for (const el of container.querySelectorAll<HTMLElement>("[href], [src]")) {
    const href = el.getAttribute("href")
    if (href) {
      try {
        el.setAttribute("href", new URL(href, pageUrl).toString())
      } catch {
        /* ignore */
      }
    }
    const src = el.getAttribute("src")
    if (src) {
      try {
        el.setAttribute("src", new URL(src, pageUrl).toString())
      } catch {
        /* ignore */
      }
    }
  }
}

function _bak_makeExcerpt(text: string, maxLen = 520): string {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLen) return normalized
  return `${normalized.slice(0, maxLen).trimEnd()}…`
}

function _bak_renderTextFallback(title: string, rawContent: string): string {
  const excerpt = _bak_makeExcerpt(rawContent || "Tato stránka zatím neobsahuje delší text.")
  return `
    <div class="home-wizard-result-preview-inner home-wizard-result-preview-fallback">
      <h3>${_bak_escapeHtml(title)}</h3>
      <p>${_bak_escapeHtml(excerpt)}</p>
    </div>
  `
}

function _bak_escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function _bak_cleanupPreviewDom(container: HTMLElement) {
  container
    .querySelectorAll(
      ".page-header, .content-meta, .metadata-panel, .page-footer, hr, nav, .breadcrumb-container",
    )
    .forEach((el) => el.remove())
}

async function _bak_fetchCanonical(url: URL): Promise<Response> {
  const canonicalPath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`
  const canonicalUrl = new URL(`${canonicalPath}${url.hash}`, url)
  try {
    const res = await fetch(canonicalUrl.toString())
    if (res.ok) return res
  } catch {
    // fall back to non-canonical path below
  }
  return fetch(url.toString())
}

async function _bak_positionPopover(anchor: HTMLElement, popover: HTMLElement, x: number, y: number) {
  const { computePosition, inline, shift, flip } = await import("@floating-ui/dom")
  const position = await computePosition(anchor, popover, {
    strategy: "fixed",
    middleware: [inline({ x, y }), shift(), flip()],
  })
  popover.style.transform = `translate(${position.x.toFixed()}px, ${position.y.toFixed()}px)`
}

function _bak_clearPreviewPopovers() {
  // activePreviewPopoverLink = null
  document.querySelectorAll(".popover.active-popover").forEach((el) => {
    el.classList.remove("active-popover")
  })
}

function _bak_normalizeRelativeUrlsToAbsolute(container: HTMLElement, base: URL) {
  container.querySelectorAll<HTMLElement>("[href], [src]").forEach((el) => {
    const href = el.getAttribute("href")
    if (href) {
      try {
        el.setAttribute("href", new URL(href, base).toString())
      } catch {}
    }
    const src = el.getAttribute("src")
    if (src) {
      try {
        el.setAttribute("src", new URL(src, base).toString())
      } catch {}
    }
  })
}

async function _bak_showPreviewPopover(
  link: HTMLAnchorElement,
  event: MouseEvent,
  _popoverParser: DOMParser,
) {
  if (link.dataset.noPopover === "true") return
  // activePreviewPopoverLink = link

  const targetUrl = new URL(link.href)
  const hash = decodeURIComponent(targetUrl.hash)
  targetUrl.hash = ""
  targetUrl.search = ""
  const popoverId = `popover-${link.pathname}`

  const renderExisting = (el: HTMLElement) => {
    _bak_clearPreviewPopovers()
    // activePreviewPopoverLink = link
    el.classList.add("active-popover")
    void _bak_positionPopover(link, el, event.clientX, event.clientY)
    if (!hash) return
    const inner = el.querySelector(".popover-inner") as HTMLElement | null
    const heading = inner?.querySelector(`#popover-internal-${hash.slice(1)}`) as HTMLElement | null
    if (inner && heading) inner.scroll({ top: heading.offsetTop - 12, behavior: "instant" })
  }

  const existing = document.getElementById(popoverId)
  if (existing) {
    renderExisting(existing as HTMLElement)
    return
  }

  const response = await _bak_fetchCanonical(targetUrl).catch(() => null)
  if (!response?.ok) return

  const [contentType] = (response.headers.get("Content-Type") ?? "").split(";")
  const [category, typeInfo] = contentType.split("/")
  const popoverEl = document.createElement("div")
  popoverEl.id = popoverId
  popoverEl.classList.add("popover")
  const inner = document.createElement("div")
  inner.classList.add("popover-inner")
  inner.dataset.contentType = contentType
  popoverEl.appendChild(inner)

  if (category === "image") {
    const img = document.createElement("img")
    img.src = targetUrl.toString()
    inner.appendChild(img)
  } else if (category === "application" && typeInfo === "pdf") {
    const pdf = document.createElement("iframe")
    pdf.src = targetUrl.toString()
    inner.appendChild(pdf)
  } else {
    const html = await response.text()
    const doc = _popoverParser.parseFromString(html, "text/html")
    const hints = Array.from(doc.getElementsByClassName("popover-hint")) as HTMLElement[]
    if (hints.length === 0) return
    hints.forEach((hint) => {
      hint.querySelectorAll("[id]").forEach((el) => {
        ;(el as HTMLElement).id = `popover-internal-${(el as HTMLElement).id}`
      })
      _bak_normalizeRelativeUrlsToAbsolute(hint, targetUrl)
      inner.appendChild(hint)
    })
  }

  if (document.getElementById(popoverId)) return
  document.body.appendChild(popoverEl)
  renderExisting(popoverEl)
}

function _bak_attachPreviewPopovers(scope: HTMLElement, _popoverParser: DOMParser) {
  const links = scope.querySelectorAll("a.internal") as NodeListOf<HTMLAnchorElement>
  links.forEach((link) => {
    if ((link as HTMLAnchorElement & { __previewPopoverBound?: boolean }).__previewPopoverBound) return
    ;(link as HTMLAnchorElement & { __previewPopoverBound?: boolean }).__previewPopoverBound = true
    link.addEventListener("mouseenter", (e) => void _bak_showPreviewPopover(link, e, _popoverParser))
    link.addEventListener("mouseleave", _bak_clearPreviewPopovers)
  })
}

async function _bak_loadPreviewHtml(
  href: string,
  title: string,
  fallbackContent: string,
  _pagePreviewCache: Map<string, string>,
): Promise<string> {
  if (_pagePreviewCache.has(href)) return _pagePreviewCache.get(href)!
  const html = await fetch(href)
    .then((res) => (res.ok ? res.text() : ""))
    .catch(() => "")
  if (!html) return _bak_renderTextFallback(title, fallbackContent)
  const doc = new DOMParser().parseFromString(html, "text/html")
  const hints = Array.from(doc.getElementsByClassName("popover-hint")) as HTMLElement[]
  if (hints.length === 0) return _bak_renderTextFallback(title, fallbackContent)
  const wrapper = document.createElement("div")
  wrapper.className = "home-wizard-result-preview-inner"
  wrapper.innerHTML = hints.map((hint) => hint.outerHTML).join("")
  _bak_absolutizeRelativeUrls(wrapper, href)
  const textLen = wrapper.textContent?.trim().length ?? 0
  const output = textLen < 40 ? _bak_renderTextFallback(title, fallbackContent) : wrapper.outerHTML
  _pagePreviewCache.set(href, output)
  return output
}

/* ═══════════ Split-pane části wireWizard ═══════════ */
/*
 * Tyto proměnné byly součástí wireWizard():
 *
 *   const listEl   = root.querySelector<HTMLElement>("[data-wizard-list]")
 *   const previewEl = root.querySelector<HTMLElement>("[data-wizard-preview]")
 *
 *   const previewEmptyHtml = `<p class="home-wizard-result-preview-empty">Vyberte úkol v levém seznamu pro náhled.</p>`
 *   const listEmptyHtml    = `<li class="home-wizard-result-empty">Pro zvolenou kombinaci jsme nenašli žádné úkoly.</li>`
 *   const listEmptyRaciHtml = `<li class="home-wizard-result-empty">Vyberte alespoň jednu roli v RACI (R, A, C nebo I) pro zobrazení úkolů.</li>`
 *
 * Null-guard zahrnoval:
 *   if (!listEl || !previewEl || ...) return
 *
 * Reset v toggleRole (else branch):
 *   listEl!.innerHTML    = listEmptyHtml
 *   previewEl!.innerHTML = previewEmptyHtml
 *
 * Reset v togglePhase (else branch):
 *   listEl!.innerHTML    = listEmptyHtml
 *   previewEl!.innerHTML = previewEmptyHtml
 */

// function markActiveItem(target: HTMLElement, listEl: HTMLElement) {
//   for (const el of listEl.querySelectorAll<HTMLElement>(".home-wizard-result-item")) {
//     el.classList.toggle("active", el === target)
//   }
// }

// async function showPreview(
//   item: HTMLElement,
//   activity: _BakWizardActivity,
//   listEl: HTMLElement,
//   previewEl: HTMLElement,
//   pagePreviewCache: Map<string, string>,
//   silent = false,
// ): Promise<void> {
//   if (!silent) markActiveItem(item, listEl)
//   if (!silent) {
//     previewEl.innerHTML = `<p class="home-wizard-result-preview-loading">Načítám náhled…</p>`
//   }
//   const index = await _bak_getContentIndex()
//   const fallbackContent = index[activity.slug]?.content ?? activity.popis ?? ""
//   const html = await _bak_loadPreviewHtml(activity.href, activity.title, fallbackContent, pagePreviewCache)
//   const stillActive = listEl.querySelector<HTMLElement>(".home-wizard-result-item.active")
//   if (!silent && stillActive !== item) return
//   if (silent && !stillActive) {
//     markActiveItem(item, listEl)
//   } else if (silent) {
//     return
//   }
//   previewEl.innerHTML = `
//     <a class="home-wizard-result-preview-open" href="${activity.href}">Otevřít celou stránku →</a>
//     ${html}
//   `
//   _bak_attachPreviewPopovers(previewEl, new DOMParser())
// }

/*
 * Původní tělo renderResult() — část stavějící seznam úkolů:
 *
 *   listEl!.innerHTML = ""
 *   if (filtered.length === 0) {
 *     listEl!.innerHTML = state.raciKeys.size === 0 ? listEmptyRaciHtml : listEmptyHtml
 *     previewEl!.innerHTML = previewEmptyHtml
 *     return
 *   }
 *   for (const act of filtered) {
 *     const li = document.createElement("li")
 *     li.className = "home-wizard-result-item"
 *     li.tabIndex = 0
 *     li.setAttribute("role", "button")
 *     li.dataset.href  = act.href
 *     li.dataset.title = act.title
 *     li.dataset.fallback = act.popis ?? ""
 *     const rMatch = selectedRoles.some((role) => isRoleIn(role, act.rRoles))
 *     const aMatch = selectedRoles.some((role) => isRoleIn(role, act.aRoles))
 *     const cMatch = selectedRoles.some((role) => isRoleIn(role, act.cRoles ?? []))
 *     const iMatch = selectedRoles.some((role) => isRoleIn(role, act.iRoles ?? []))
 *     const tagsHtml: string[] = []
 *     if (rMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag raci-r">R</span>`)
 *     if (aMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag raci-a">A</span>`)
 *     if (cMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag raci-c">C</span>`)
 *     if (iMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag raci-i">I</span>`)
 *     li.innerHTML = `
 *       ${act.oznaceni ? `<span class="home-wizard-result-item-num">${escapeHtml(act.oznaceni)}</span>` : ""}
 *       <span class="home-wizard-result-item-body">
 *         <span class="home-wizard-result-item-title">${escapeHtml(act.title)}</span>
 *         ${tagsHtml.length > 0 ? `<span class="home-wizard-result-item-tags">${tagsHtml.join("")}</span>` : ""}
 *       </span>
 *     `
 *     const activate = () => void showPreview(li, act, listEl!, previewEl!, pagePreviewCache)
 *     li.addEventListener("click", activate)
 *     li.addEventListener("keydown", (e: KeyboardEvent) => {
 *       if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate() }
 *     })
 *     li.addEventListener("mouseenter", () => void showPreview(li, act, listEl!, previewEl!, pagePreviewCache, true))
 *     listEl!.appendChild(li)
 *   }
 *   // Automaticky vybrat první položku
 *   const first = listEl!.querySelector<HTMLElement>(".home-wizard-result-item")
 *   if (first) {
 *     void showPreview(first, filtered[0], listEl!, previewEl!, pagePreviewCache)
 *   } else {
 *     previewEl!.innerHTML = previewEmptyHtml
 *   }
 */

export {}
