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

type WizardPhase = {
  key: string
  label: string
  match: string[]
}

type WizardData = {
  roles: WizardRole[]
  activities: WizardActivity[]
  phases: WizardPhase[]
  etapy: Array<{ key: string; label: string; phaseKeys: string[] }>
}

type IndexItem = {
  title?: string
  content?: string
  tags?: string[]
}

type WizardContentIndex = Record<string, IndexItem>

let indexPromise: Promise<WizardContentIndex> | null = null
const pagePreviewCache = new Map<string, string>()
const RACI_ORDER = ["R", "A", "C", "I"] as const
const popoverParser = new DOMParser()
let activePreviewPopoverLink: HTMLAnchorElement | null = null
const TRIGGER_CATEGORY_ORDER = [
  "projekt",
  "faze",
  "dokumentace",
  "bim",
  "cde",
  "smlouva",
  "kontrola",
  "periodicky",
  "provoz",
] as const
const TRIGGER_CATEGORY_LABELS: Record<string, string> = {
  projekt: "Projekt",
  faze: "Fáze",
  dokumentace: "Dokumentace",
  bim: "BIM",
  cde: "CDE",
  smlouva: "Smlouva",
  kontrola: "Kontrola",
  periodicky: "Periodicky",
  provoz: "Provoz",
}

function getContentIndex(): Promise<WizardContentIndex> {
  if (!indexPromise) {
    indexPromise = fetch(new URL("../static/contentIndex.json", window.location.href).toString())
      .then((res) => {
        if (!res.ok) throw new Error("Nepodarilo se nacist index vyhledavani")
        return res.json() as Promise<WizardContentIndex>
      })
      .catch(() => ({} as WizardContentIndex))
  }
  return indexPromise
}

function parseWizardData(): WizardData | null {
  const dataEl = document.getElementById("home-wizard-data")
  if (!dataEl) return null
  try {
    return JSON.parse(dataEl.textContent || "{}") as WizardData
  } catch {
    return null
  }
}

/* ═══════════ Preview helpery ═══════════ */
function absolutizeRelativeUrls(container: HTMLElement, pageUrl: string) {
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

function makeExcerpt(text: string, maxLen = 520): string {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLen) return normalized
  return `${normalized.slice(0, maxLen).trimEnd()}…`
}

function renderTextFallback(title: string, rawContent: string): string {
  const excerpt = makeExcerpt(rawContent || "Tato stránka zatím neobsahuje delší text.")
  return `
    <div class="home-wizard-result-preview-inner home-wizard-result-preview-fallback">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(excerpt)}</p>
    </div>
  `
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function formatRaciKeys(keys: Set<string>): string {
  return RACI_ORDER.filter((key) => keys.has(key)).join(", ")
}

function cleanupPreviewDom(container: HTMLElement) {
  container
    .querySelectorAll(
      ".page-header, .content-meta, .metadata-panel, .page-footer, hr, nav, .breadcrumb-container",
    )
    .forEach((el) => el.remove())
}

async function fetchCanonical(url: URL): Promise<Response> {
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

async function positionPopover(anchor: HTMLElement, popover: HTMLElement, x: number, y: number) {
  const { computePosition, inline, shift, flip } = await import("@floating-ui/dom")
  const position = await computePosition(anchor, popover, {
    strategy: "fixed",
    middleware: [inline({ x, y }), shift(), flip()],
  })
  popover.style.transform = `translate(${position.x.toFixed()}px, ${position.y.toFixed()}px)`
}

function clearPreviewPopovers() {
  activePreviewPopoverLink = null
  document.querySelectorAll(".popover.active-popover").forEach((el) => {
    el.classList.remove("active-popover")
  })
}

function normalizeRelativeUrlsToAbsolute(container: HTMLElement, base: URL) {
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

async function showPreviewPopover(link: HTMLAnchorElement, event: MouseEvent) {
  if (link.dataset.noPopover === "true") return
  activePreviewPopoverLink = link

  const targetUrl = new URL(link.href)
  const hash = decodeURIComponent(targetUrl.hash)
  targetUrl.hash = ""
  targetUrl.search = ""
  const popoverId = `popover-${link.pathname}`

  const renderExisting = (el: HTMLElement) => {
    clearPreviewPopovers()
    activePreviewPopoverLink = link
    el.classList.add("active-popover")
    void positionPopover(link, el, event.clientX, event.clientY)
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

  const response = await fetchCanonical(targetUrl).catch(() => null)
  if (!response?.ok || activePreviewPopoverLink !== link) return

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
    const doc = popoverParser.parseFromString(html, "text/html")
    const hints = Array.from(doc.getElementsByClassName("popover-hint")) as HTMLElement[]
    if (hints.length === 0) return
    hints.forEach((hint) => {
      hint.querySelectorAll("[id]").forEach((el) => {
        ;(el as HTMLElement).id = `popover-internal-${(el as HTMLElement).id}`
      })
      normalizeRelativeUrlsToAbsolute(hint, targetUrl)
      inner.appendChild(hint)
    })
  }

  if (document.getElementById(popoverId) || activePreviewPopoverLink !== link) return
  document.body.appendChild(popoverEl)
  renderExisting(popoverEl)
}

function attachPreviewPopovers(scope: HTMLElement) {
  const links = scope.querySelectorAll("a.internal") as NodeListOf<HTMLAnchorElement>
  links.forEach((link) => {
    if ((link as HTMLAnchorElement & { __previewPopoverBound?: boolean }).__previewPopoverBound) return
    ;(link as HTMLAnchorElement & { __previewPopoverBound?: boolean }).__previewPopoverBound = true
    link.addEventListener("mouseenter", (e) => void showPreviewPopover(link, e))
    link.addEventListener("mouseleave", clearPreviewPopovers)
  })
}

async function loadPreviewHtml(
  href: string,
  title: string,
  fallbackContent: string,
): Promise<string> {
  if (pagePreviewCache.has(href)) return pagePreviewCache.get(href)!
  const html = await fetch(href)
    .then((res) => (res.ok ? res.text() : ""))
    .catch(() => "")
  if (!html) return renderTextFallback(title, fallbackContent)
  const doc = new DOMParser().parseFromString(html, "text/html")
  const hints = Array.from(doc.getElementsByClassName("popover-hint")) as HTMLElement[]
  if (hints.length === 0) return renderTextFallback(title, fallbackContent)
  const wrapper = document.createElement("div")
  wrapper.className = "home-wizard-result-preview-inner"
  wrapper.innerHTML = hints.map((hint) => hint.outerHTML).join("")
  absolutizeRelativeUrls(wrapper, href)
  const textLen = wrapper.textContent?.trim().length ?? 0
  const output = textLen < 40 ? renderTextFallback(title, fallbackContent) : wrapper.outerHTML
  pagePreviewCache.set(href, output)
  return output
}

/* ═══════════ Filtrace činností ═══════════ */
function normalizeLower(s: string): string {
  return s.trim().toLowerCase()
}

function normalizeMetaId(s: string): string {
  return s.trim().toLowerCase()
}

function getTriggerCategoryKey(eventId: string): string {
  const raw = normalizeMetaId(eventId)
  const sep = raw.indexOf("_")
  return sep > 0 ? raw.slice(0, sep) : raw
}

function getTriggerCategoryLabel(categoryKey: string): string {
  return TRIGGER_CATEGORY_LABELS[categoryKey] ?? categoryKey
}

function prettifyTriggerEvent(eventId: string): string {
  const normalized = normalizeMetaId(eventId)
  const category = getTriggerCategoryKey(normalized)
  const prefixLen = category.length + 1
  const tail = normalized.length > prefixLen ? normalized.slice(prefixLen) : normalized
  const readable = tail.replace(/_/g, " ").trim()
  if (!readable) return getTriggerCategoryLabel(category)
  return `${getTriggerCategoryLabel(category)} - ${readable}`
}

function summarizeLabels(labels: string[], max = 2): string {
  if (labels.length <= max) return labels.join(", ")
  const first = labels.slice(0, max).join(", ")
  return `${first} +${labels.length - max}`
}

function activityMatchesRole(activity: WizardActivity, role: WizardRole): boolean {
  const roleNames = new Set<string>([role.title, ...role.aliases].map(normalizeLower))
  const haystack = [...activity.rRoles, ...activity.aRoles, ...activity.cRoles, ...activity.iRoles].map(
    normalizeLower,
  )
  for (const h of haystack) {
    if (roleNames.has(h)) return true
  }
  return false
}

function activityMatchesPhase(activity: WizardActivity, phase: WizardPhase): boolean {
  const needles = phase.match.map(normalizeLower)
  for (const f of activity.faze) {
    const fl = normalizeLower(f)
    if (needles.some((n) => fl === n || fl.includes(n))) return true
  }
  return false
}

function filterActivities(
  data: WizardData,
  roleKeys: Set<string>,
  phaseKeys: Set<string>,
  raciKeys: Set<string>,
  etapaKeys: Set<string>,
  triggerCategoryKeys: Set<string>,
  triggerEventKeys: Set<string>,
): WizardActivity[] {
  if (roleKeys.size === 0 || phaseKeys.size === 0) return []
  if (raciKeys.size === 0) return []
  const selectedRoles = data.roles.filter((r) => roleKeys.has(r.key))
  const selectedPhases = data.phases.filter((p) => phaseKeys.has(p.key))
  if (selectedRoles.length === 0 || selectedPhases.length === 0) return []
  return data.activities.filter(
    (a) =>
      selectedRoles.some((role) => activityMatchesRole(a, role)) &&
      selectedPhases.some((phase) => activityMatchesPhase(a, phase)) &&
      activityMatchesAnySelectedRoleRaci(a, selectedRoles, raciKeys) &&
      activityMatchesEtapa(a, etapaKeys) &&
      activityMatchesTrigger(a, triggerCategoryKeys, triggerEventKeys),
  )
}

function activityMatchesEtapa(activity: WizardActivity, etapaKeys: Set<string>): boolean {
  if (etapaKeys.size === 0) return true
  if (!Array.isArray(activity.etapa) || activity.etapa.length === 0) return false
  const ids = new Set(activity.etapa.map(normalizeMetaId))
  for (const key of etapaKeys) {
    if (ids.has(normalizeMetaId(key))) return true
  }
  return false
}

function activityMatchesTrigger(
  activity: WizardActivity,
  triggerCategoryKeys: Set<string>,
  triggerEventKeys: Set<string>,
): boolean {
  if (triggerCategoryKeys.size === 0 && triggerEventKeys.size === 0) return true
  if (!Array.isArray(activity.spousteciUdalost) || activity.spousteciUdalost.length === 0) return false
  const eventIds = activity.spousteciUdalost.map(normalizeMetaId)
  if (triggerEventKeys.size > 0) {
    for (const eventId of eventIds) {
      if (triggerEventKeys.has(eventId)) return true
    }
  }
  if (triggerCategoryKeys.size > 0) {
    for (const eventId of eventIds) {
      if (triggerCategoryKeys.has(getTriggerCategoryKey(eventId))) return true
    }
  }
  return false
}

function activityMatchesRaci(activity: WizardActivity, role: WizardRole, raciKeys: Set<string>): boolean {
  if (raciKeys.has("R") && isRoleIn(role, activity.rRoles)) return true
  if (raciKeys.has("A") && isRoleIn(role, activity.aRoles)) return true
  if (raciKeys.has("C") && isRoleIn(role, activity.cRoles ?? [])) return true
  if (raciKeys.has("I") && isRoleIn(role, activity.iRoles ?? [])) return true
  return false
}

function activityMatchesAnySelectedRoleRaci(
  activity: WizardActivity,
  roles: WizardRole[],
  raciKeys: Set<string>,
): boolean {
  return roles.some((role) => activityMatchesRaci(activity, role, raciKeys))
}

/* ═══════════ Wizard main ═══════════ */
function wireWizard() {
  const root = document.querySelector<HTMLElement>(".home-landing")
  if (!root) return

  const data = parseWizardData()
  if (!data) return

  const state: {
    roleKeys: Set<string>
    phaseKeys: Set<string>
    raciKeys: Set<string>
    etapaKeys: Set<string>
    triggerCategoryKeys: Set<string>
    triggerEventKeys: Set<string>
    triggerSearchQuery: string
  } = {
    roleKeys: new Set<string>(),
    phaseKeys: new Set<string>(),
    raciKeys: new Set<string>(["R", "A", "C", "I"]),
    etapaKeys: new Set<string>(),
    triggerCategoryKeys: new Set<string>(),
    triggerEventKeys: new Set<string>(),
    triggerSearchQuery: "",
  }

  const step2 = root.querySelector<HTMLElement>('[data-wizard-step="2"]')
  const step3 = root.querySelector<HTMLElement>('[data-wizard-step="3"]')
  const step4 = root.querySelector<HTMLElement>('[data-wizard-step="4"]')
  const step5 = root.querySelector<HTMLElement>('[data-wizard-step="5"]')
  const roleCards = Array.from(root.querySelectorAll<HTMLButtonElement>(".home-wizard-role-card"))
  const phaseCards = Array.from(root.querySelectorAll<HTMLButtonElement>(".home-wizard-phase-card"))
  const etapaCards = Array.from(root.querySelectorAll<HTMLButtonElement>(".home-wizard-etapa-card"))
  const raciCards = Array.from(root.querySelectorAll<HTMLButtonElement>(".home-wizard-raci-card"))
  const listEl = root.querySelector<HTMLElement>("[data-wizard-list]")
  const previewEl = root.querySelector<HTMLElement>("[data-wizard-preview]")
  const summaryEl = root.querySelector<HTMLElement>("[data-wizard-summary]")
  const triggerCategoryCardsEl = root.querySelector<HTMLElement>("[data-wizard-trigger-category-cards]")
  const triggerEventCardsEl = root.querySelector<HTMLElement>("[data-wizard-trigger-event-cards]")
  const triggerSearchInput = root.querySelector<HTMLInputElement>("[data-wizard-trigger-search]")
  const triggerResetBtn = root.querySelector<HTMLButtonElement>("[data-wizard-trigger-reset]")

  if (
    !step2 ||
    !step3 ||
    !step4 ||
    !step5 ||
    !listEl ||
    !previewEl ||
    !summaryEl ||
    !triggerCategoryCardsEl ||
    !triggerEventCardsEl ||
    !triggerSearchInput ||
    !triggerResetBtn
  ) {
    return
  }
  const wizardData = data
  const triggerCategoryCards = triggerCategoryCardsEl
  const triggerEventCards = triggerEventCardsEl
  const triggerSearch = triggerSearchInput
  const triggerReset = triggerResetBtn
  const allTriggerEventCount = new Map<string, number>()
  for (const act of wizardData.activities) {
    for (const raw of act.spousteciUdalost ?? []) {
      const id = normalizeMetaId(raw)
      allTriggerEventCount.set(id, (allTriggerEventCount.get(id) ?? 0) + 1)
    }
  }
  const allTriggerEventIds = [...allTriggerEventCount.keys()].sort((a, b) =>
    prettifyTriggerEvent(a).localeCompare(prettifyTriggerEvent(b), "cs"),
  )

  const previewEmptyHtml = `<p class="home-wizard-result-preview-empty">Vyberte úkol v levém seznamu pro náhled.</p>`
  const listEmptyHtml = `<li class="home-wizard-result-empty">Pro zvolenou kombinaci jsme nenašli žádné úkoly.</li>`
  const listEmptyRaciHtml = `<li class="home-wizard-result-empty">Vyberte alespoň jednu roli v RACI (R, A, C nebo I) pro zobrazení úkolů.</li>`

  function updateStepVisibility() {
    const hasRole = state.roleKeys.size > 0
    const hasPhase = state.phaseKeys.size > 0
    const hasEtapa = state.etapaKeys.size > 0
    step2!.hidden = !hasRole
    step3!.hidden = !hasPhase
    step4!.hidden = !hasEtapa
    step5!.hidden = !hasEtapa
  }

  function syncRoleCards() {
    for (const card of roleCards) {
      const roleKey = card.dataset.roleKey || ""
      const isActive = state.roleKeys.has(roleKey)
      card.classList.toggle("selected", isActive)
      card.setAttribute("aria-pressed", isActive ? "true" : "false")
    }
  }

  function toggleRole(key: string) {
    if (state.roleKeys.has(key)) {
      state.roleKeys.delete(key)
    } else {
      state.roleKeys.add(key)
    }
    syncRoleCards()
    updateStepVisibility()
    // Při změně role pokud je zvolená alespoň jedna fáze, přerenderuj výsledek
    if (state.phaseKeys.size > 0) renderResult()
    // Plynule scrollnout na step 2, aby uživatel viděl co má dál vybrat
    if (state.roleKeys.size > 0) {
      requestAnimationFrame(() => {
        step2!.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    } else {
      state.phaseKeys.clear()
      state.etapaKeys.clear()
      state.triggerCategoryKeys.clear()
      state.triggerEventKeys.clear()
      state.triggerSearchQuery = ""
      triggerSearch.value = ""
      updateStepVisibility()
      listEl!.innerHTML = listEmptyHtml
      previewEl!.innerHTML = previewEmptyHtml
      summaryEl!.innerHTML = ""
      triggerCategoryCards.innerHTML = ""
      triggerEventCards.innerHTML = ""
      triggerReset.hidden = true
      syncEtapaCards()
    }
  }

  function syncPhaseCards() {
    for (const card of phaseCards) {
      const phaseKey = card.dataset.phaseKey || ""
      const isActive = state.phaseKeys.has(phaseKey)
      card.classList.toggle("selected", isActive)
      card.setAttribute("aria-pressed", isActive ? "true" : "false")
    }
  }

  function syncEtapaCards() {
    const allowed = new Set<string>()
    for (const etapaDef of wizardData.etapy) {
      if (etapaDef.phaseKeys.some((phaseKey) => state.phaseKeys.has(phaseKey))) {
        allowed.add(normalizeMetaId(etapaDef.key))
      }
    }
    for (const selected of [...state.etapaKeys]) {
      if (!allowed.has(normalizeMetaId(selected))) state.etapaKeys.delete(selected)
    }
    for (const card of etapaCards) {
      const key = normalizeMetaId(card.dataset.etapaKey ?? "")
      const isAllowed = state.phaseKeys.size > 0 && allowed.has(key)
      card.hidden = !isAllowed
      if (!isAllowed) {
        card.classList.remove("selected")
        card.setAttribute("aria-pressed", "false")
        continue
      }
      const isSelected = state.etapaKeys.has(key)
      card.classList.toggle("selected", isSelected)
      card.setAttribute("aria-pressed", isSelected ? "true" : "false")
    }
  }

  function togglePhase(key: string) {
    if (state.phaseKeys.has(key)) {
      state.phaseKeys.delete(key)
    } else {
      state.phaseKeys.add(key)
    }
    syncPhaseCards()
    syncEtapaCards()
    updateStepVisibility()
    if (state.phaseKeys.size > 0) {
      renderResult()
      requestAnimationFrame(() => {
        step3!.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    } else {
      state.etapaKeys.clear()
      state.triggerCategoryKeys.clear()
      state.triggerEventKeys.clear()
      state.triggerSearchQuery = ""
      triggerSearch.value = ""
      listEl!.innerHTML = listEmptyHtml
      previewEl!.innerHTML = previewEmptyHtml
      summaryEl!.innerHTML = ""
      triggerCategoryCards.innerHTML = ""
      triggerEventCards.innerHTML = ""
      triggerReset.hidden = true
    }
  }

  function syncRaciCards() {
    for (const card of raciCards) {
      const key = (card.dataset.raciKey || "").toUpperCase()
      const isSelected = state.raciKeys.has(key)
      card.classList.toggle("selected", isSelected)
      card.setAttribute("aria-pressed", isSelected ? "true" : "false")
    }
  }

  function toggleRaciKey(key: string) {
    if (state.raciKeys.has(key)) {
      state.raciKeys.delete(key)
    } else {
      state.raciKeys.add(key)
    }
    syncRaciCards()
    if (state.phaseKeys.size > 0) renderResult()
  }

  function baseScopedActivities(selectedRoles: WizardRole[], selectedPhases: WizardPhase[]) {
    return wizardData.activities.filter(
      (a) =>
        selectedRoles.some((role) => activityMatchesRole(a, role)) &&
        selectedPhases.some((phase) => activityMatchesPhase(a, phase)) &&
        activityMatchesAnySelectedRoleRaci(a, selectedRoles, state.raciKeys),
    )
  }

  function renderTriggerCards(baseRowsWithEtapa: WizardActivity[]) {
    const eventCount = new Map<string, number>()
    for (const row of baseRowsWithEtapa) {
      for (const eventIdRaw of row.spousteciUdalost ?? []) {
        const eventId = normalizeMetaId(eventIdRaw)
        eventCount.set(eventId, (eventCount.get(eventId) ?? 0) + 1)
      }
    }

    const availableEventIdsRaw = [...eventCount.keys()].sort((a, b) =>
      prettifyTriggerEvent(a).localeCompare(prettifyTriggerEvent(b), "cs"),
    )
    const availableEventIds =
      availableEventIdsRaw.length > 0 ? availableEventIdsRaw : [...allTriggerEventIds]
    const availableEventSet = new Set(availableEventIds)
    for (const selected of [...state.triggerEventKeys]) {
      if (!availableEventSet.has(selected)) state.triggerEventKeys.delete(selected)
    }

    const availableCategorySet = new Set<string>()
    for (const eventId of availableEventIdsRaw) {
      availableCategorySet.add(getTriggerCategoryKey(eventId))
    }
    for (const selected of [...state.triggerCategoryKeys]) {
      if (!availableCategorySet.has(selected)) state.triggerCategoryKeys.delete(selected)
    }

    triggerCategoryCards.innerHTML = ""
    const orderedCategories = [...TRIGGER_CATEGORY_ORDER]
    for (const categoryKey of orderedCategories) {
      const btn = document.createElement("button")
      btn.type = "button"
      btn.className =
        "home-wizard-trigger-card home-wizard-trigger-card-category" +
        (state.triggerCategoryKeys.has(categoryKey) ? " selected" : "")
      if (!availableCategorySet.has(categoryKey)) btn.classList.add("is-empty")
      btn.setAttribute("aria-pressed", state.triggerCategoryKeys.has(categoryKey) ? "true" : "false")
      btn.textContent = getTriggerCategoryLabel(categoryKey)
      btn.addEventListener("click", () => {
        const hadAnyTrigger = state.triggerCategoryKeys.size > 0 || state.triggerEventKeys.size > 0
        if (state.triggerCategoryKeys.has(categoryKey)) state.triggerCategoryKeys.delete(categoryKey)
        else state.triggerCategoryKeys.add(categoryKey)
        renderResult()
        if (!hadAnyTrigger && (state.triggerCategoryKeys.size > 0 || state.triggerEventKeys.size > 0)) {
          requestAnimationFrame(() => {
            step5!.scrollIntoView({ behavior: "smooth", block: "start" })
          })
        }
      })
      triggerCategoryCards.appendChild(btn)
    }
    triggerEventCards.innerHTML = ""
    const q = state.triggerSearchQuery.trim().toLowerCase()
    const filteredEventIds = availableEventIds.filter((eventId) => {
      if (!q) return true
      return prettifyTriggerEvent(eventId).toLowerCase().includes(q)
    })
    for (const eventId of filteredEventIds) {
      const btn = document.createElement("button")
      btn.type = "button"
      btn.className = "home-wizard-trigger-card home-wizard-trigger-card-event"
      if (state.triggerEventKeys.has(eventId)) btn.classList.add("selected")
      btn.setAttribute("aria-pressed", state.triggerEventKeys.has(eventId) ? "true" : "false")
      const count = eventCount.get(eventId) ?? allTriggerEventCount.get(eventId) ?? 0
      btn.textContent = `${prettifyTriggerEvent(eventId)} (${count})`
      btn.addEventListener("click", () => {
        const hadAnyTrigger = state.triggerCategoryKeys.size > 0 || state.triggerEventKeys.size > 0
        if (state.triggerEventKeys.has(eventId)) state.triggerEventKeys.delete(eventId)
        else state.triggerEventKeys.add(eventId)
        renderResult()
        if (!hadAnyTrigger && (state.triggerCategoryKeys.size > 0 || state.triggerEventKeys.size > 0)) {
          requestAnimationFrame(() => {
            step5!.scrollIntoView({ behavior: "smooth", block: "start" })
          })
        }
      })
      triggerEventCards.appendChild(btn)
    }
    if (filteredEventIds.length === 0) {
      triggerEventCards.innerHTML = `<span class="home-wizard-filter-empty">Žádná spouštěcí událost neodpovídá hledání.</span>`
    }
  }

  function renderAdvancedFilters(selectedRoles: WizardRole[], selectedPhases: WizardPhase[]) {
    const baseRows = baseScopedActivities(selectedRoles, selectedPhases)
    const etapaScopedRows = baseRows.filter((a) => activityMatchesEtapa(a, state.etapaKeys))
    renderTriggerCards(etapaScopedRows)
    triggerReset.hidden =
      state.etapaKeys.size === 0 &&
      state.triggerCategoryKeys.size === 0 &&
      state.triggerEventKeys.size === 0 &&
      state.triggerSearchQuery.trim() === ""
  }

  function renderResult() {
    if (state.roleKeys.size === 0 || state.phaseKeys.size === 0) return

    const selectedRoles = wizardData.roles.filter((r) => state.roleKeys.has(r.key))
    const selectedPhases = wizardData.phases.filter((p) => state.phaseKeys.has(p.key))
    renderAdvancedFilters(selectedRoles, selectedPhases)
    const filtered = filterActivities(
      wizardData,
      state.roleKeys,
      state.phaseKeys,
      state.raciKeys,
      state.etapaKeys,
      state.triggerCategoryKeys,
      state.triggerEventKeys,
    )
    const roleLabels = selectedRoles.map((r) => r.title).join(", ")
    const phaseLabels = selectedPhases.map((p) => p.label).join(", ")

    // Summary
    if (selectedRoles.length > 0 && selectedPhases.length > 0) {
      const etapaLabels = wizardData.etapy
        .filter((e) => state.etapaKeys.has(normalizeMetaId(e.key)))
        .map((e) => e.label)
      const triggerCategoryLabels = [...state.triggerCategoryKeys].map((k) => getTriggerCategoryLabel(k))
      const triggerEventLabels = [...state.triggerEventKeys].map((k) => prettifyTriggerEvent(k))
      const summaryTags = [
        roleLabels,
        phaseLabels,
        formatRaciKeys(state.raciKeys) || "—",
        ...(etapaLabels.length > 0 ? [`Etapa: ${summarizeLabels(etapaLabels)}`] : []),
        ...(triggerCategoryLabels.length > 0
          ? [`Kategorie: ${summarizeLabels(triggerCategoryLabels)}`]
          : []),
        ...(triggerEventLabels.length > 0 ? [`Události: ${summarizeLabels(triggerEventLabels)}`] : []),
      ]
      summaryEl!.innerHTML = `
        ${summaryTags.map((tag) => `<span class="home-wizard-result-tag">${escapeHtml(tag)}</span>`).join(" · ")}
        — ${filtered.length} ${pluralCinnosti(filtered.length)}
      `
    }

    // List
    listEl!.innerHTML = ""
    if (filtered.length === 0) {
      listEl!.innerHTML = state.raciKeys.size === 0 ? listEmptyRaciHtml : listEmptyHtml
      previewEl!.innerHTML = previewEmptyHtml
      return
    }

    for (const act of filtered) {
      const li = document.createElement("li")
      li.className = "home-wizard-result-item"
      li.tabIndex = 0
      li.setAttribute("role", "button")
      li.dataset.href = act.href
      li.dataset.title = act.title
      li.dataset.fallback = act.popis ?? ""

      // Označení role na aktivitě dle vybraných rolí — R/A/C/I
      const rMatch = selectedRoles.some((role) => isRoleIn(role, act.rRoles))
      const aMatch = selectedRoles.some((role) => isRoleIn(role, act.aRoles))
      const cMatch = selectedRoles.some((role) => isRoleIn(role, act.cRoles ?? []))
      const iMatch = selectedRoles.some((role) => isRoleIn(role, act.iRoles ?? []))
      const tagsHtml: string[] = []
      if (rMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag raci-r">R</span>`)
      if (aMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag raci-a">A</span>`)
      if (cMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag raci-c">C</span>`)
      if (iMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag raci-i">I</span>`)

      li.innerHTML = `
        ${act.oznaceni ? `<span class="home-wizard-result-item-num">${escapeHtml(act.oznaceni)}</span>` : ""}
        <span class="home-wizard-result-item-body">
          <span class="home-wizard-result-item-title">${escapeHtml(act.title)}</span>
          ${tagsHtml.length > 0 ? `<span class="home-wizard-result-item-tags">${tagsHtml.join("")}</span>` : ""}
        </span>
      `

      const activate = () => void showPreview(li, act)
      li.addEventListener("click", activate)
      li.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          activate()
        }
      })
      li.addEventListener("mouseenter", () => void showPreview(li, act, /*silent*/ true))
      listEl!.appendChild(li)
    }

    // Automaticky vybrat první položku
    const first = listEl!.querySelector<HTMLElement>(".home-wizard-result-item")
    if (first) {
      void showPreview(first, filtered[0])
    } else {
      previewEl!.innerHTML = previewEmptyHtml
    }
  }

  function markActiveItem(target: HTMLElement) {
    for (const el of listEl!.querySelectorAll<HTMLElement>(".home-wizard-result-item")) {
      el.classList.toggle("active", el === target)
    }
  }

  async function showPreview(
    item: HTMLElement,
    activity: WizardActivity,
    silent = false,
  ): Promise<void> {
    if (!silent) markActiveItem(item)
    if (!silent) {
      previewEl!.innerHTML = `<p class="home-wizard-result-preview-loading">Načítám náhled…</p>`
    }
    const index = await getContentIndex()
    const fallbackContent = index[activity.slug]?.content ?? activity.popis ?? ""
    const html = await loadPreviewHtml(activity.href, activity.title, fallbackContent)
    // Pokud uživatel mezitím kliknul jinam, nepřepisuj preview
    const stillActive = listEl!.querySelector<HTMLElement>(".home-wizard-result-item.active")
    if (!silent && stillActive !== item) return
    if (silent && !stillActive) {
      markActiveItem(item)
    } else if (silent) {
      return
    }

    previewEl!.innerHTML = `
      <a class="home-wizard-result-preview-open" href="${activity.href}">Otevřít celou stránku →</a>
      ${html}
    `
    attachPreviewPopovers(previewEl!)
  }

  /* Připojení kliků */
  for (const card of roleCards) {
    card.addEventListener("click", () => {
      const key = card.dataset.roleKey
      if (key) toggleRole(key)
    })
  }
  for (const card of phaseCards) {
    card.addEventListener("click", () => {
      const key = card.dataset.phaseKey
      if (key) togglePhase(key)
    })
  }
  for (const card of etapaCards) {
    card.addEventListener("click", () => {
      const key = normalizeMetaId(card.dataset.etapaKey ?? "")
      if (!key || card.hidden) return
      const hadAnyEtapa = state.etapaKeys.size > 0
      if (state.etapaKeys.has(key)) state.etapaKeys.delete(key)
      else state.etapaKeys.add(key)
      syncEtapaCards()
      updateStepVisibility()
      if (state.phaseKeys.size > 0) {
        renderResult()
        if (!hadAnyEtapa && state.etapaKeys.size > 0) {
          requestAnimationFrame(() => {
            step4!.scrollIntoView({ behavior: "smooth", block: "start" })
          })
        }
      }
    })
  }
  for (const card of raciCards) {
    card.addEventListener("click", () => {
      const key = (card.dataset.raciKey || "").toUpperCase()
      if (!key) return
      toggleRaciKey(key)
    })
  }
  triggerSearch.addEventListener("input", () => {
    state.triggerSearchQuery = triggerSearch.value
    renderResult()
  })
  triggerReset.addEventListener("click", () => {
    state.etapaKeys.clear()
    state.triggerCategoryKeys.clear()
    state.triggerEventKeys.clear()
    state.triggerSearchQuery = ""
    triggerSearch.value = ""
    updateStepVisibility()
    renderResult()
  })
  syncRoleCards()
  syncPhaseCards()
  syncEtapaCards()
  syncRaciCards()
}

function isRoleIn(role: WizardRole, list: string[]): boolean {
  const names = new Set<string>([role.title, ...role.aliases].map((s) => s.trim().toLowerCase()))
  return list.some((r) => names.has(r.trim().toLowerCase()))
}

function pluralCinnosti(n: number): string {
  if (n === 1) return "úkol"
  if (n >= 2 && n <= 4) return "úkoly"
  return "úkolů"
}

document.addEventListener("nav", wireWizard)
