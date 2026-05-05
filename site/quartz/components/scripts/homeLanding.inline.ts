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
  zdroj: string
  faze: string[]
  etapa: string[]
  charakter: string
  spousteciUdalost: string[]
  rRoles: string[]
  aRoles: string[]
  cRoles: string[]
  iRoles: string[]
  popis: string
  predchoziCinnost: string[]
  nasledujiciCinnost: string[]
  navazaneWorkflow: Array<{ label: string; href: string }>
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
  etapaKey: string
  etapaLabel: string
  phaseColor: "blue" | "orange" | "green"
  cards: WizardActivity[]
}

const RACI_ORDER = ["R", "A", "C", "I"] as const

/** Syntetický klíč: úkol bez vyplněného charakteru ve frontmatteru. */
const KEY_NONE_CHAR = "_none_char_"

/** Popisky hodnot `charakter` z katalogu (normalizovaný klíč → čeština). */
const CHARAKTER_LABELS: Record<string, string> = {
  jednorazove: "Jednorázový úkol",
  opakujici: "Opakující se úkol",
  podminena: "Podmíněný úkol",
}

/**
 * Popisky ID spouštěcích událostí — doplňovat podle YAML.
 * Neznámá ID se zobrazí přes `humanizeEventId`.
 */
const SPOUSTECI_UDALOST_LABELS: Record<string, string> = {
  smlouva_predlozeni_harmonogramu: "Předložení harmonogramu (smlouva)",
  smlouva_predlozeni_vyuctovani: "Předložení vyúčtování",
  kontrola_zkouska: "Zkouška / kontrola zkoušky",
  kontrola_inspekce: "Inspekce / kontrola",
  smlouva_oznameni_zhotovitele: "Oznámení zhotovitele (smlouva)",
  provoz_zjisteni_vady: "Zjištění vady v záruce / provozu",
  smlouva_zadost_o_prevzeti: "Žádost o převzetí díla",
  smlouva_nepredvidatelna_okolnost: "Nepředvídatelná fyzická okolnost",
  smlouva_zadost_podzhotovitele: "Žádost / poddodavatel",
  kontrola_technicke_review: "Technická kontrola / review",
}

const COMPLETED_ACTIVITIES_STORAGE_KEY = "homeWizard.completedActivities.v1"

function humanizeEventId(id: string): string {
  const t = id.trim()
  if (!t) return ""
  return t
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function labelCharakterKey(key: string): string {
  if (key === KEY_NONE_CHAR) return "Bez uvedeného charakteru"
  return CHARAKTER_LABELS[key] ?? humanizeEventId(key)
}

function isCompletableActivity(activity: WizardActivity): boolean {
  return normalizeMetaId(activity.charakter ?? "") === "jednorazove"
}

function loadCompletedActivities(): Set<string> {
  try {
    const raw = window.localStorage.getItem(COMPLETED_ACTIVITIES_STORAGE_KEY)
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set<string>()
    const ids = parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    return new Set<string>(ids)
  } catch {
    return new Set<string>()
  }
}

function saveCompletedActivities(completedIds: Set<string>) {
  try {
    window.localStorage.setItem(COMPLETED_ACTIVITIES_STORAGE_KEY, JSON.stringify([...completedIds]))
  } catch {
    // Ignore localStorage write errors (privacy mode, quota, ...)
  }
}

function syncDoneCardState(card: HTMLElement, isDone: boolean) {
  card.classList.toggle("wiz-tl-card--done", isDone)
  card.setAttribute("aria-pressed", isDone ? "true" : "false")
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

function summarizeLabels(labels: string[], max = 2): string {
  if (labels.length <= max) return labels.join(", ")
  const first = labels.slice(0, max).join(", ")
  return `${first} +${labels.length - max}`
}

/** Mapuje phaseKeys etapy na barevný klíč pro CSS třídu. */
function phaseToColor(phaseKeys: string[]): "blue" | "orange" | "green" {
  if (phaseKeys.some((k) => k === "provoz")) return "green"
  if (phaseKeys.some((k) => k === "realizace")) return "orange"
  return "blue"
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
  /** Frontmatter často používá kanonický klíč fáze (priprava, realizace, provoz), ne český popisek. */
  const phaseKeyNorm = normalizeLower(phase.key)
  const needles = phase.match.map(normalizeLower)
  for (const f of activity.faze) {
    const fl = normalizeLower(f)
    if (fl === phaseKeyNorm) return true
    if (needles.some((n) => fl === n || fl.includes(n))) return true
  }
  return false
}

function filterActivities(
  data: WizardData,
  roleKeys: Set<string>,
  raciKeys: Set<string>,
  etapaKeys: Set<string>,
): WizardActivity[] {
  if (roleKeys.size === 0 || etapaKeys.size === 0) return []
  if (raciKeys.size === 0) return []
  const selectedRoles = data.roles.filter((r) => roleKeys.has(r.key))
  if (selectedRoles.length === 0) return []
  // Odvodit fáze z vybraných etap
  const derivedPhaseKeys = new Set<string>()
  for (const etapaKey of etapaKeys) {
    const etapaDef = data.etapy.find((e) => normalizeMetaId(e.key) === normalizeMetaId(etapaKey))
    if (etapaDef) etapaDef.phaseKeys.forEach((k) => derivedPhaseKeys.add(k))
  }
  const selectedPhases = data.phases.filter((p) => derivedPhaseKeys.has(p.key))
  return data.activities.filter(
    (a) =>
      selectedRoles.some((role) => activityMatchesRole(a, role)) &&
      (selectedPhases.length === 0 || selectedPhases.some((phase) => activityMatchesPhase(a, phase))) &&
      activityMatchesAnySelectedRoleRaci(a, selectedRoles, raciKeys) &&
      activityMatchesEtapa(a, etapaKeys),
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
 * Extrahuje číselnou část z označení FRR-XX (nebo jiného formátu s číslem).
 * Vrací číslo pro porovnání, nebo Infinity pokud nenalezeno.
 */
function extractSeqNum(oznaceni: string): number {
  const m = oznaceni.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : Infinity
}

/**
 * Seřadí aktivity dle FIDIC sekvence (predchozi_cinnost / nasledujici_cinnost linked-list).
 *
 * Algoritmus:
 *  1. Sestaví mapu oznaceni → aktivita pro aktuální filtrovanou sadu.
 *  2. Pro každou aktivitu zkusí matchovat hodnoty nasledujiciCinnost na oznaceni sousedů.
 *     Match: první token tvaru FRR-XX (nebo libovolné číslo) se porovná s oznaceni souseda.
 *  3. Najde "kořeny" — aktivity, na které žádná jiná neodkazuje přes nasledujiciCinnost.
 *  4. Prochází řetězce BFS od kořenů.
 *  5. Nenavštívené aktivity (izolované nebo v cyklu) se přidají na konec seřazené dle oznaceni.
 */
function sortBySequence(activities: WizardActivity[]): WizardActivity[] {
  if (activities.length <= 1) return activities

  // Mapa normalizovaného čísla → aktivita
  const byNum = new Map<number, WizardActivity>()
  for (const act of activities) {
    const n = extractSeqNum(act.oznaceni)
    if (n !== Infinity) byNum.set(n, act)
  }

  // Pro každou aktivitu sestavíme next ukazatel: index cíle v byNum
  const nextOf = new Map<WizardActivity, WizardActivity>()
  for (const act of activities) {
    for (const raw of act.nasledujiciCinnost ?? []) {
      // Vezmi první číslo z raw textu (např. "FRR-03 Název..." → 3)
      const m = raw.match(/(\d+)/)
      if (!m) continue
      const targetNum = parseInt(m[1], 10)
      const target = byNum.get(targetNum)
      if (target && target !== act) {
        nextOf.set(act, target)
        break
      }
    }
  }

  // Množina aktivit, na které někdo ukazuje přes next (= mají predecessora)
  const hasIncoming = new Set<WizardActivity>(nextOf.values())

  // Kořeny: aktivity bez predecessora v aktuální sadě
  const roots = activities.filter((a) => !hasIncoming.has(a))

  // BFS walk od kořenů
  const visited = new Set<WizardActivity>()
  const result: WizardActivity[] = []

  const walk = (start: WizardActivity) => {
    let cur: WizardActivity | undefined = start
    while (cur && !visited.has(cur)) {
      visited.add(cur)
      result.push(cur)
      cur = nextOf.get(cur)
    }
  }

  // Seřaď kořeny dle oznaceni pro deterministický výstup
  roots.sort((a, b) => extractSeqNum(a.oznaceni) - extractSeqNum(b.oznaceni))
  for (const root of roots) walk(root)

  // Zbylé (izolované / v cyklu) — seřadit dle oznaceni
  const remaining = activities
    .filter((a) => !visited.has(a))
    .sort((a, b) => extractSeqNum(a.oznaceni) - extractSeqNum(b.oznaceni))
  result.push(...remaining)

  return result
}

/** Pořadí podskupin — známé hodnoty charakteru první, ostatní abecedně za nimi. */
const META_CHAR_ORDER = ["jednorazove", "opakujici", "podminena", KEY_NONE_CHAR] as const

function metaGroupKey(act: WizardActivity): string {
  const ch = (act.charakter ?? "").trim()
  return ch ? normalizeMetaId(ch) : KEY_NONE_CHAR
}

function metaGroupTitleFromKey(metaKey: string): string {
  return labelCharakterKey(metaKey)
}

function compareMetaGroupKeys(ka: string, kb: string): number {
  const aCh = ka
  const bCh = kb
  const ia = (META_CHAR_ORDER as readonly string[]).indexOf(aCh)
  const ib = (META_CHAR_ORDER as readonly string[]).indexOf(bCh)
  const ra = ia >= 0 ? ia : 100
  const rb = ib >= 0 ? ib : 100
  if (ra !== rb) return ra - rb
  return aCh.localeCompare(bCh, "cs")
}

/**
 * Rozdělí aktivity jedné etapy do podskupin pouze dle charakteru.
 */
function splitIntoMetaSubGroups(cards: WizardActivity[]): Array<{ metaKey: string; title: string; cards: WizardActivity[] }> {
  const bucket = new Map<string, WizardActivity[]>()
  for (const act of cards) {
    const k = metaGroupKey(act)
    if (!bucket.has(k)) bucket.set(k, [])
    bucket.get(k)!.push(act)
  }
  const keys = [...bucket.keys()].sort(compareMetaGroupKeys)
  return keys.map((metaKey) => ({
    metaKey,
    title: metaGroupTitleFromKey(metaKey),
    cards: sortBySequence(bucket.get(metaKey)!),
  }))
}

/**
 * Rozdělí aktivity do skupin dle etapy.
 * Pořadí skupin respektuje pořadí etap z definice; uvnitř skupiny jsou aktivity seřazeny
 * dle FIDIC sekvence (sortBySequence).
 */
function groupByEtapa(
  activities: WizardActivity[],
  etapy: Array<{ key: string; label: string; phaseKeys: string[] }>,
): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>()

  // Předpřiprav skupiny v pořadí dle definice etap
  for (const def of etapy) {
    const key = normalizeMetaId(def.key)
    groups.set(key, {
      etapaKey: key,
      etapaLabel: def.label,
      phaseColor: phaseToColor(def.phaseKeys),
      cards: [],
    })
  }

  const sorted = sortBySequence(activities)

  for (const act of sorted) {
    const rawKey = act.etapa?.[0] ? normalizeMetaId(act.etapa[0]) : "_none_"
    if (groups.has(rawKey)) {
      groups.get(rawKey)!.cards.push(act)
    } else {
      if (!groups.has("_none_")) {
        groups.set("_none_", { etapaKey: "_none_", etapaLabel: "Ostatní", phaseColor: "blue", cards: [] })
      }
      groups.get("_none_")!.cards.push(act)
    }
  }

  return [...groups.values()].filter((g) => g.cards.length > 0)
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
    const badgeMatch = matchesSelected ? " wiz-tl-raci-badge--match" : ""
    const groupMatch = matchesSelected ? " wiz-tl-raci-group--match" : ""
    const rolesMatch = matchesSelected ? " wiz-tl-raci-roles--match" : ""
    parts.push(
      `<span class="wiz-tl-raci-group${groupMatch}">` +
        `<span class="wiz-tl-raci-badge raci-${keyLower}${badgeMatch}">${key}</span>` +
        `<span class="wiz-tl-raci-roles${rolesMatch}">${escapeHtml(roles.join(", "))}</span>` +
        `</span>`,
    )
  }
  return parts.length > 0 ? `<footer class="wiz-tl-card-raci">${parts.join("")}</footer>` : ""
}

function buildWorkflowLinksHtml(act: WizardActivity): string {
  const links = act.navazaneWorkflow ?? []
  if (links.length === 0) return ""
  const items = links
    .map(
      ({ label, href }) =>
        `<a class="wiz-tl-workflow-link" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`,
    )
    .join("")
  return (
    `<div class="wiz-tl-card-workflows">` +
    `<span class="wiz-tl-workflow-label">Navázané workflow</span>` +
    items +
    `</div>`
  )
}

function buildCardMetaHtml(act: WizardActivity): string {
  const parts: string[] = []
  const ch = (act.charakter ?? "").trim()
  if (ch) {
    const nk = normalizeMetaId(ch)
    const label = CHARAKTER_LABELS[nk] ?? humanizeEventId(nk)
    parts.push(
      `<p class="wiz-tl-card-meta-line"><span class="wiz-tl-card-meta-label">Charakter:</span> ${escapeHtml(label)}</p>`,
    )
  }
  const evs = (act.spousteciUdalost ?? []).map((s) => s.trim()).filter(Boolean)
  if (evs.length > 0) {
    const text = evs
      .map((id) => {
        const nk = normalizeMetaId(id)
        return SPOUSTECI_UDALOST_LABELS[nk] ?? humanizeEventId(nk)
      })
      .join(", ")
    parts.push(
      `<p class="wiz-tl-card-meta-line"><span class="wiz-tl-card-meta-label">Spouštěcí událost:</span> ${escapeHtml(text)}</p>`,
    )
  }
  if (parts.length === 0) return ""
  return `<div class="wiz-tl-card-meta">${parts.join("")}</div>`
}

function buildCardHtml(act: WizardActivity, selectedRoles: WizardRole[]): string {
  const MAX_POPIS = 180
  const rawPopis = act.popis ?? ""
  const isTruncated = rawPopis.length > MAX_POPIS
  const displayPopis = isTruncated ? rawPopis.slice(0, MAX_POPIS).trimEnd() + "…" : rawPopis

  const numHtml = act.oznaceni
    ? `<span class="wiz-tl-card-num">${escapeHtml(act.oznaceni)}</span>`
    : ""
  const popisHtml = displayPopis
    ? `<p class="wiz-tl-card-popis"${isTruncated ? ` title="${escapeHtml(rawPopis)}"` : ""}>${escapeHtml(displayPopis)}</p>`
    : ""
  const zdrojHtml = act.zdroj
    ? `<p class="wiz-tl-card-zdroj"><span class="wiz-tl-card-zdroj-label">Zdroj:</span> ${escapeHtml(act.zdroj)}</p>`
    : ""
  const metaHtml = buildCardMetaHtml(act)
  const raciHtml = buildRaciFooterHtml(act, selectedRoles)
  const workflowHtml = buildWorkflowLinksHtml(act)
  const completionToggleHtml = isCompletableActivity(act)
    ? `<label class="wiz-tl-card-done-toggle" title="Označit činnost jako hotovou">` +
        `<input class="wiz-tl-card-done-checkbox" type="checkbox" aria-label="Činnost hotová" />` +
      `</label>`
    : ""

  return (
    completionToggleHtml +
    `<header class="wiz-tl-card-head">${numHtml}` +
    `<h3 class="wiz-tl-card-title">${escapeHtml(act.title)}</h3></header>` +
    popisHtml +
    zdrojHtml +
    metaHtml +
    raciHtml +
    workflowHtml
  )
}

/* ═══════════ Card hover popover ═══════════ */

/** Sdílený singleton popover element pro všechny wizard karty. */
let _wizPopoverEl: HTMLElement | null = null
let _wizPopoverTimer: ReturnType<typeof setTimeout> | null = null
/** Cache: href → innerHTML pro .popover-inner */
const _wizPopoverCache = new Map<string, string>()

function getWizPopover(): HTMLElement {
  if (!_wizPopoverEl) {
    _wizPopoverEl = document.createElement("div")
    _wizPopoverEl.className = "popover wiz-card-popover"
    const inner = document.createElement("div")
    inner.className = "popover-inner"
    _wizPopoverEl.appendChild(inner)
    document.body.appendChild(_wizPopoverEl)
    // Skrýt popover při opuštění jeho vlastní plochy
    _wizPopoverEl.addEventListener("mouseleave", hideWizPopover)
  }
  return _wizPopoverEl
}

async function fetchWizPopoverHtml(href: string): Promise<string | null> {
  if (_wizPopoverCache.has(href)) return _wizPopoverCache.get(href)!
  try {
    const resp = await fetch(href)
    if (!resp.ok) return null
    const text = await resp.text()
    const doc = new DOMParser().parseFromString(text, "text/html")
    // Normalize relative links so they work from any page context
    doc.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
      try {
        a.href = new URL(a.getAttribute("href") ?? "", href).href
      } catch { /* ignore */ }
    })
    const hints = [...doc.querySelectorAll(".popover-hint")]
    if (hints.length === 0) return null
    const html = hints.map((el) => el.outerHTML).join("")
    _wizPopoverCache.set(href, html)
    return html
  } catch {
    return null
  }
}

function positionWizPopover(popover: HTMLElement, anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect()
  const pw = Math.min(480, window.innerWidth - 32)
  const ph = 320

  let left = rect.left
  let top = rect.bottom + 10

  // Prevent going off right edge
  if (left + pw > window.innerWidth - 16) left = window.innerWidth - pw - 16
  left = Math.max(16, left)

  // Show above card if not enough space below
  if (top + ph > window.innerHeight - 16) top = Math.max(8, rect.top - ph - 10)

  popover.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`
}

function hideWizPopover() {
  if (_wizPopoverTimer) {
    clearTimeout(_wizPopoverTimer)
    _wizPopoverTimer = null
  }
  _wizPopoverEl?.classList.remove("active-popover")
}

/**
 * Popover pouze u odkazy „Navázané workflow“ na kartě (např. HMG).
 * Reuse existující .popover CSS ze Quartz.
 */
function attachWorkflowLinkPopovers(card: HTMLElement) {
  const links = card.querySelectorAll<HTMLAnchorElement>("a.wiz-tl-workflow-link")
  for (const link of links) {
    // Klik na odkaz nesmí bublovat na kartu (ta by přesměrovala na stránku činnosti).
    link.addEventListener("click", (e) => e.stopPropagation())

    link.addEventListener("mouseenter", () => {
      const href = link.href
      if (!href) return
      if (_wizPopoverTimer) clearTimeout(_wizPopoverTimer)
      _wizPopoverTimer = setTimeout(async () => {
        const popover = getWizPopover()
        const inner = popover.querySelector(".popover-inner") as HTMLElement

        let html = _wizPopoverCache.get(href) ?? null
        if (!html) {
          html = await fetchWizPopoverHtml(href)
        }
        if (!html) return

        inner.innerHTML = html
        positionWizPopover(popover, link)
        popover.classList.add("active-popover")
      }, 280)
    })

    link.addEventListener("mouseleave", (e) => {
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null
      if (related && _wizPopoverEl?.contains(related)) return
      hideWizPopover()
    })
  }
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
 * Vykreslí sekce etap s barevnými hlavičkami a kartami aktivit.
 * Etapy jsou barevně rozlišeny dle fáze (modrá/oranžová/zelená).
 */
function renderTimeline(
  container: HTMLElement,
  activities: WizardActivity[],
  selectedRoles: WizardRole[],
  etapy: Array<{ key: string; label: string; phaseKeys: string[] }>,
  completedActivityIds: Set<string>,
) {
  container.innerHTML = ""
  attachArrowKeyNav(container)

  const groups = groupByEtapa(activities, etapy)
  const track = document.createElement("div")
  track.className = "wiz-tl-track"

  const chevronSvg =
    `<svg class="wiz-tl-group-chevron-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">` +
    `<path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/>` +
    `</svg>`

  for (const group of groups) {
    const groupEl = document.createElement("div")
    groupEl.className = `wiz-tl-group wiz-tl-group--${group.phaseColor}`

    const panelId = `wiz-tl-panel-${group.etapaKey}`

    // Barevná hlavička sekce — rozbalení/sbalení karet
    const headerEl = document.createElement("button")
    headerEl.type = "button"
    headerEl.className = `wiz-tl-group-header wiz-tl-group-header--${group.phaseColor}`
    headerEl.setAttribute("aria-expanded", "true")
    headerEl.setAttribute("aria-controls", panelId)
    headerEl.innerHTML =
      `<span class="wiz-tl-group-header-start">` +
      `<span class="wiz-tl-group-chevron">${chevronSvg}</span>` +
      `<span class="wiz-tl-group-label">${escapeHtml(group.etapaLabel)}</span>` +
      `</span>` +
      `<span class="wiz-tl-group-count">${group.cards.length} ${pluralCinnosti(group.cards.length)}</span>`
    groupEl.appendChild(headerEl)

    const cardsWrap = document.createElement("div")
    cardsWrap.className = "wiz-tl-cards-stack"
    cardsWrap.id = panelId

    const subgroups = splitIntoMetaSubGroups(group.cards)
    for (const [subIndex, sub] of subgroups.entries()) {
      const subEl = document.createElement("div")
      subEl.className = "wiz-tl-meta-subgroup"

      const subCardsId = `${panelId}-meta-${subIndex}`
      const subHead = document.createElement("button")
      subHead.type = "button"
      subHead.className = "wiz-tl-meta-subgroup-head"
      subHead.setAttribute("aria-expanded", "true")
      subHead.setAttribute("aria-controls", subCardsId)
      subHead.innerHTML =
        `<span class="wiz-tl-meta-subgroup-head-start">` +
        `<span class="wiz-tl-meta-subgroup-chevron">${chevronSvg}</span>` +
        `<span class="wiz-tl-meta-subgroup-title">${escapeHtml(sub.title)}</span>` +
        `</span>` +
        `<span class="wiz-tl-meta-subgroup-count">${sub.cards.length} ${pluralCinnosti(sub.cards.length)}</span>`
      subEl.appendChild(subHead)

      const cardsEl = document.createElement("div")
      cardsEl.className = "wiz-tl-cards"
      cardsEl.id = subCardsId

      for (const act of sub.cards) {
        const card = document.createElement("article")
        card.className = "wiz-tl-card"
        card.tabIndex = 0
        card.dataset.href = act.href
        card.dataset.activityId = act.slug
        card.dataset.completable = isCompletableActivity(act) ? "true" : "false"
        card.setAttribute("role", "button")
        card.setAttribute("aria-label", `Přejít na: ${act.title}`)
        card.innerHTML = buildCardHtml(act, selectedRoles)
        syncDoneCardState(card, completedActivityIds.has(act.slug))

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

        const doneCheckbox = card.querySelector<HTMLInputElement>(".wiz-tl-card-done-checkbox")
        if (doneCheckbox) {
          doneCheckbox.checked = completedActivityIds.has(act.slug)
          doneCheckbox.addEventListener("click", (e) => e.stopPropagation())
          doneCheckbox.addEventListener("keydown", (e) => e.stopPropagation())
          doneCheckbox.addEventListener("change", () => {
            const isChecked = doneCheckbox.checked
            if (isChecked) completedActivityIds.add(act.slug)
            else completedActivityIds.delete(act.slug)
            saveCompletedActivities(completedActivityIds)
            syncDoneCardState(card, isChecked)
          })
        }
        attachWorkflowLinkPopovers(card)

        cardsEl.appendChild(card)
      }

      subEl.appendChild(cardsEl)
      subHead.addEventListener("click", () => {
        const expanded = subHead.getAttribute("aria-expanded") === "true"
        const next = !expanded
        subHead.setAttribute("aria-expanded", String(next))
        cardsEl.hidden = !next
        subEl.classList.toggle("wiz-tl-meta-subgroup--collapsed", !next)
      })
      cardsWrap.appendChild(subEl)
    }

    groupEl.appendChild(cardsWrap)
    track.appendChild(groupEl)

    headerEl.addEventListener("click", () => {
      const expanded = headerEl.getAttribute("aria-expanded") === "true"
      const next = !expanded
      headerEl.setAttribute("aria-expanded", String(next))
      cardsWrap.hidden = !next
      groupEl.classList.toggle("wiz-tl-group--collapsed", !next)
    })
  }

  container.appendChild(track)
}

function setAllTimelineGroupsExpanded(container: HTMLElement, expanded: boolean) {
  const groupHeaders = Array.from(container.querySelectorAll<HTMLButtonElement>(".wiz-tl-group-header"))
  for (const header of groupHeaders) {
    const group = header.closest<HTMLElement>(".wiz-tl-group")
    const panelId = header.getAttribute("aria-controls")
    if (!group || !panelId) continue
    const panel = container.querySelector<HTMLElement>(`#${CSS.escape(panelId)}`)
    if (!panel) continue
    header.setAttribute("aria-expanded", expanded ? "true" : "false")
    panel.hidden = !expanded
    group.classList.toggle("wiz-tl-group--collapsed", !expanded)
  }

  const subgroupHeaders = Array.from(
    container.querySelectorAll<HTMLButtonElement>(".wiz-tl-meta-subgroup-head"),
  )
  for (const header of subgroupHeaders) {
    const subgroup = header.closest<HTMLElement>(".wiz-tl-meta-subgroup")
    const panelId = header.getAttribute("aria-controls")
    if (!subgroup || !panelId) continue
    const panel = container.querySelector<HTMLElement>(`#${CSS.escape(panelId)}`)
    if (!panel) continue
    header.setAttribute("aria-expanded", expanded ? "true" : "false")
    panel.hidden = !expanded
    subgroup.classList.toggle("wiz-tl-meta-subgroup--collapsed", !expanded)
  }
}

/* ═══════════ Wizard main ═══════════ */

function wireWizard() {
  const root = document.querySelector<HTMLElement>(".home-landing")
  if (!root) return

  const data = parseWizardData()
  if (!data) return

  const state: {
    roleKeys: Set<string>
    raciKeys: Set<string>
    etapaKeys: Set<string>
    completedActivityIds: Set<string>
  } = {
    roleKeys: new Set<string>(),
    raciKeys: new Set<string>(),
    etapaKeys: new Set<string>(),
    completedActivityIds: loadCompletedActivities(),
  }

  const step2 = root.querySelector<HTMLElement>('[data-wizard-step="2"]')
  const step3 = root.querySelector<HTMLElement>('[data-wizard-step="3"]')
  const roleCards = Array.from(root.querySelectorAll<HTMLButtonElement>(".home-wizard-role-card"))
  const etapaCards = Array.from(root.querySelectorAll<HTMLButtonElement>(".home-wizard-etapa-card"))
  const raciCards = Array.from(root.querySelectorAll<HTMLButtonElement>(".home-wizard-raci-card"))
  const raciHintEl = root.querySelector<HTMLElement>("[data-wizard-raci-hint]")
  const resultContentEl = root.querySelector<HTMLElement>("[data-wizard-result-content]")
  const timelineEl = root.querySelector<HTMLElement>("[data-wizard-timeline]")
  const summaryEl = root.querySelector<HTMLElement>("[data-wizard-summary]")
  const collapseAllBtn = root.querySelector<HTMLButtonElement>("[data-wizard-collapse-all]")
  const expandAllBtn = root.querySelector<HTMLButtonElement>("[data-wizard-expand-all]")

  if (!step2 || !step3 || !timelineEl || !summaryEl || !raciHintEl || !resultContentEl) {
    return
  }

  collapseAllBtn?.addEventListener("click", () => {
    setAllTimelineGroupsExpanded(timelineEl, false)
  })
  expandAllBtn?.addEventListener("click", () => {
    setAllTimelineGroupsExpanded(timelineEl, true)
  })

  const wizardData = data

  // Prázdné stavy timeline
  const tlEmptyNoSelection = `<p class="home-wizard-result-empty">Vyberte roli pro zobrazení úkolů.</p>`

  function updateStepVisibility() {
    const hasRole = state.roleKeys.size > 0
    const hasEtapa = state.etapaKeys.size > 0
    step2!.hidden = !hasRole
    step3!.hidden = !hasEtapa
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
    syncEtapaCards()
    updateStepVisibility()
    // Při změně role pokud jsou zvolené etapy, přerenderuj výsledek
    if (state.etapaKeys.size > 0) renderResult()
    // Plynule scrollnout na step 2 (etapa), aby uživatel viděl co má dál vybrat
    if (state.roleKeys.size > 0) {
      requestAnimationFrame(() => {
        step2!.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    } else {
      state.etapaKeys.clear()
      updateStepVisibility()
      timelineEl!.innerHTML = tlEmptyNoSelection
      summaryEl!.innerHTML = ""
    }
  }

  function syncEtapaCards() {
    const hasRole = state.roleKeys.size > 0
    for (const card of etapaCards) {
      const key = normalizeMetaId(card.dataset.etapaKey ?? "")
      card.hidden = !hasRole
      if (!hasRole) {
        card.classList.remove("selected")
        card.setAttribute("aria-pressed", "false")
        continue
      }
      const isSelected = state.etapaKeys.has(key)
      card.classList.toggle("selected", isSelected)
      card.setAttribute("aria-pressed", isSelected ? "true" : "false")
    }
  }

  function syncRaciCards() {
    for (const card of raciCards) {
      const key = (card.dataset.raciKey || "").toUpperCase()
      const isSelected = state.raciKeys.has(key)
      card.classList.toggle("selected", isSelected)
      card.setAttribute("aria-pressed", isSelected ? "true" : "false")
    }
    const hasRaci = state.raciKeys.size > 0
    raciHintEl!.hidden = hasRaci
    resultContentEl!.hidden = !hasRaci
  }

  function toggleRaciKey(key: string) {
    const hadAnyRaci = state.raciKeys.size > 0
    if (state.raciKeys.has(key)) {
      state.raciKeys.delete(key)
    } else {
      state.raciKeys.add(key)
    }
    syncRaciCards()
    if (state.etapaKeys.size > 0) {
      renderResult()
      if (!hadAnyRaci && state.raciKeys.size > 0) {
        requestAnimationFrame(() => {
          resultContentEl!.scrollIntoView({ behavior: "smooth", block: "start" })
        })
      }
    }
  }

  function renderResult() {
    if (state.roleKeys.size === 0 || state.etapaKeys.size === 0) return
    if (state.raciKeys.size === 0) {
      summaryEl!.innerHTML = ""
      timelineEl!.innerHTML =
        `<p class="home-wizard-result-empty">Vyberte alespoň jednu roli v RACI (R, A, C nebo I) pro zobrazení úkolů.</p>`
      return
    }

    const selectedRoles = wizardData.roles.filter((r) => state.roleKeys.has(r.key))
    const filtered = filterActivities(wizardData, state.roleKeys, state.raciKeys, state.etapaKeys)
    const roleLabels = selectedRoles.map((r) => r.title).join(", ")

    // Summary
    const etapaLabels = wizardData.etapy
      .filter((e) => state.etapaKeys.has(normalizeMetaId(e.key)))
      .map((e) => e.label)
    const summaryTags = [
      roleLabels,
      formatRaciKeys(state.raciKeys) || "—",
      ...(etapaLabels.length > 0 ? [summarizeLabels(etapaLabels)] : []),
    ]
    summaryEl!.innerHTML = `
      ${summaryTags.map((tag) => `<span class="home-wizard-result-tag">${escapeHtml(tag)}</span>`).join(" · ")}
      — ${filtered.length} ${pluralCinnosti(filtered.length)}
    `

    // Timeline
    if (filtered.length === 0) {
      timelineEl!.innerHTML =
        state.raciKeys.size === 0
          ? `<p class="home-wizard-result-empty">Vyberte alespoň jednu roli v RACI (R, A, C nebo I) pro zobrazení úkolů.</p>`
          : `<p class="home-wizard-result-empty">Pro zvolenou kombinaci jsme nenašli žádné úkoly.</p>`
      return
    }

    renderTimeline(timelineEl!, filtered, selectedRoles, wizardData.etapy, state.completedActivityIds)
  }

  /* Připojení kliků */
  for (const card of roleCards) {
    card.addEventListener("click", () => {
      const key = card.dataset.roleKey
      if (key) toggleRole(key)
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
      if (state.roleKeys.size > 0) {
        renderResult()
        if (!hadAnyEtapa && state.etapaKeys.size > 0) {
          requestAnimationFrame(() => {
            step3!.scrollIntoView({ behavior: "smooth", block: "nearest" })
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

  syncRoleCards()
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

document.addEventListener("nav", () => {
  // Reset popover singleton při každé navigaci (SPA), aby se nepletl s novou stránkou
  hideWizPopover()
  if (_wizPopoverEl) {
    _wizPopoverEl.remove()
    _wizPopoverEl = null
  }
  _wizPopoverCache.clear()
  wireWizard()
})
