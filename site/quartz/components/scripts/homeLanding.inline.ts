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

type TimelineGroup = {
  milestoneId: string
  milestoneLabel: string
  cards: WizardActivity[]
}

const RACI_ORDER = ["R", "A", "C", "I"] as const
const TRIGGER_CATEGORY_ORDER = [
  "projekt",
  "smlouva",
  "kontrola",
  "bim",
  "provoz",
] as const
const TRIGGER_CATEGORY_LABELS: Record<string, string> = {
  projekt: "Projekt",
  smlouva: "Smlouva",
  kontrola: "Kontrola",
  bim: "BIM",
  provoz: "Provoz",
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

/* ═══════════ Utility helpery ═══════════ */

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

/* ═══════════ Timeline helpery ═══════════ */

/**
 * Rozdělí aktivity do skupin dle první spouštěcí události.
 * Pořadí skupin odpovídá prvnímu výskytu klíče v setříděném seznamu aktivit.
 */
function groupByMilestone(activities: WizardActivity[]): TimelineGroup[] {
  const NONE_KEY = "_none_"
  const groups = new Map<string, TimelineGroup>()

  for (const act of activities) {
    const rawKey =
      Array.isArray(act.spousteciUdalost) && act.spousteciUdalost.length > 0
        ? normalizeMetaId(act.spousteciUdalost[0])
        : NONE_KEY
    if (!groups.has(rawKey)) {
      const label = rawKey === NONE_KEY ? "Ostatní" : prettifyTriggerEvent(rawKey)
      groups.set(rawKey, { milestoneId: rawKey, milestoneLabel: label, cards: [] })
    }
    groups.get(rawKey)!.cards.push(act)
  }

  return [...groups.values()]
}

function buildRaciFooterHtml(act: WizardActivity, selectedRoles: WizardRole[]): string {
  const raciDefs = [
    { key: "R", keyLower: "r", roles: act.rRoles ?? [] },
    { key: "A", keyLower: "a", roles: act.aRoles ?? [] },
    { key: "C", keyLower: "c", roles: act.cRoles ?? [] },
    { key: "I", keyLower: "i", roles: act.iRoles ?? [] },
  ]
  const parts: string[] = []
  for (const { key, keyLower, roles } of raciDefs) {
    if (roles.length === 0) continue
    const matchesSelected = selectedRoles.some((role) => isRoleIn(role, roles))
    const matchClass = matchesSelected ? " wiz-tl-raci-badge--match" : ""
    parts.push(
      `<span class="wiz-tl-raci-group">` +
        `<span class="wiz-tl-raci-badge raci-${keyLower}${matchClass}">${key}</span>` +
        `<span class="wiz-tl-raci-roles">${escapeHtml(roles.join(", "))}</span>` +
        `</span>`,
    )
  }
  return parts.length > 0 ? `<footer class="wiz-tl-card-raci">${parts.join("")}</footer>` : ""
}

function buildCardHtml(act: WizardActivity, selectedRoles: WizardRole[]): string {
  const MAX_POPIS = 130
  const rawPopis = act.popis ?? ""
  const isTruncated = rawPopis.length > MAX_POPIS
  const displayPopis = isTruncated ? rawPopis.slice(0, MAX_POPIS).trimEnd() + "…" : rawPopis

  const numHtml = act.oznaceni
    ? `<span class="wiz-tl-card-num">${escapeHtml(act.oznaceni)}</span>`
    : ""
  const popisHtml = displayPopis
    ? `<p class="wiz-tl-card-popis"${isTruncated ? ` title="${escapeHtml(rawPopis)}"` : ""}>${escapeHtml(displayPopis)}</p>`
    : ""
  const raciHtml = buildRaciFooterHtml(act, selectedRoles)

  return (
    `<header class="wiz-tl-card-head">${numHtml}` +
    `<h3 class="wiz-tl-card-title">${escapeHtml(act.title)}</h3></header>` +
    popisHtml +
    raciHtml
  )
}

/**
 * Připojí navigaci šipkami (←/→) pro horizontální procházení karet.
 * Volá se pouze jednou na kontejner (flag data-arrow-nav-bound).
 */
function attachArrowKeyNav(container: HTMLElement) {
  if (container.dataset.arrowNavBound) return
  container.dataset.arrowNavBound = "1"
  container.addEventListener("keydown", (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (!target.classList.contains("wiz-tl-card")) return
    const allCards = Array.from(container.querySelectorAll<HTMLElement>(".wiz-tl-card"))
    const idx = allCards.indexOf(target)
    if (idx < 0) return
    if (e.key === "ArrowRight" && idx < allCards.length - 1) {
      e.preventDefault()
      allCards[idx + 1].focus()
      allCards[idx + 1].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault()
      allCards[idx - 1].focus()
      allCards[idx - 1].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  })
}

/**
 * Vykreslí timeline karet do kontejneru.
 * Zachovává třídu wiz-tl-grid mezi re-rendery (přepínání layoutu).
 */
function renderTimeline(container: HTMLElement, activities: WizardActivity[], selectedRoles: WizardRole[]) {
  const wasGrid = container.classList.contains("wiz-tl-grid")
  container.innerHTML = ""
  attachArrowKeyNav(container)
  if (wasGrid) container.classList.add("wiz-tl-grid")

  // Layout toggle button
  const toggleBtn = document.createElement("button")
  toggleBtn.type = "button"
  toggleBtn.className = "wiz-tl-toggle-btn"
  const updateToggleLabel = (isGrid: boolean) => {
    toggleBtn.textContent = isGrid ? "↔ Timeline" : "⊞ Mřížka"
    toggleBtn.setAttribute(
      "aria-label",
      isGrid ? "Přepnout na horizontální timeline" : "Přepnout na mřížku",
    )
  }
  updateToggleLabel(wasGrid)
  toggleBtn.addEventListener("click", () => {
    const nowGrid = container.classList.toggle("wiz-tl-grid")
    updateToggleLabel(nowGrid)
  })
  container.appendChild(toggleBtn)

  const groups = groupByMilestone(activities)
  const track = document.createElement("div")
  track.className = "wiz-tl-track"

  for (const group of groups) {
    const groupEl = document.createElement("div")
    groupEl.className = "wiz-tl-group"

    // Milestone node
    const milestoneEl = document.createElement("div")
    milestoneEl.className = "wiz-tl-milestone"
    milestoneEl.innerHTML =
      `<div class="wiz-tl-milestone-dot"></div>` +
      `<span class="wiz-tl-milestone-label">${escapeHtml(group.milestoneLabel)}</span>`
    groupEl.appendChild(milestoneEl)

    // Cards container (flex row → grid in grid mode via CSS)
    const cardsEl = document.createElement("div")
    cardsEl.className = "wiz-tl-cards"

    for (const act of group.cards) {
      const card = document.createElement("article")
      card.className = "wiz-tl-card"
      card.tabIndex = 0
      card.dataset.href = act.href
      card.setAttribute("role", "button")
      card.setAttribute("aria-label", `Přejít na: ${act.title}`)
      card.innerHTML = buildCardHtml(act, selectedRoles)

      const navigate = () => {
        window.location.href = act.href
      }
      card.addEventListener("click", navigate)
      card.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          navigate()
        }
      })

      cardsEl.appendChild(card)
    }

    groupEl.appendChild(cardsEl)
    track.appendChild(groupEl)
  }

  container.appendChild(track)
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
  const timelineEl = root.querySelector<HTMLElement>("[data-wizard-timeline]")
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
    !timelineEl ||
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

  // Prázdné stavy timeline
  const tlEmptyNoSelection = `<p class="home-wizard-result-empty">Vyberte roli pro zobrazení úkolů.</p>`
  const tlEmptyNoPhase = `<p class="home-wizard-result-empty">Vyberte fázi pro zobrazení úkolů.</p>`

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
      timelineEl!.innerHTML = tlEmptyNoSelection
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
      timelineEl!.innerHTML = tlEmptyNoPhase
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

    // Timeline
    if (filtered.length === 0) {
      timelineEl!.innerHTML =
        state.raciKeys.size === 0
          ? `<p class="home-wizard-result-empty">Vyberte alespoň jednu roli v RACI (R, A, C nebo I) pro zobrazení úkolů.</p>`
          : `<p class="home-wizard-result-empty">Pro zvolenou kombinaci jsme nenašli žádné úkoly.</p>`
      return
    }

    renderTimeline(timelineEl!, filtered, selectedRoles)
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
