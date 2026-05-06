import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import type { QuartzPluginData } from "./quartz/plugins/vfile"
import { FileTrieNode } from "./quartz/util/fileTrie"

function isSeznamCinnostiPage(fileData: QuartzPluginData): boolean {
  const slug = (fileData.slug ?? "").toLowerCase()
  const permalink = String(fileData.frontmatter?.permalink ?? "")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase()
  const title = String(fileData.frontmatter?.title ?? "").toLowerCase()
  return (
    permalink === "cinnosti" ||
    title === "seznam všech činností" ||
    slug === "seznam-cinnosti" ||
    slug.endsWith("/seznam-cinnosti") ||
    slug === "seznam-činností" ||
    slug.endsWith("/seznam-činností")
  )
}

function isCdeWorkflowPage(fileData: QuartzPluginData): boolean {
  const slug = (fileData.slug ?? "").toLowerCase()
  const permalink = String(fileData.frontmatter?.permalink ?? "")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase()
  const title = String(fileData.frontmatter?.title ?? "").toLowerCase()
  return (
    permalink === "cde-workflow" ||
    title === "cde workflow" ||
    slug === "03---cde-workflow" ||
    slug.endsWith("/03---cde-workflow")
  )
}

/** Domovská stránka a duplicitní úvodní poznámka v Exploreru — bez panelu Metadata. */
function isMetodikaUvodPage(fileData: QuartzPluginData): boolean {
  if (fileData.slug === "index") return true
  const fp = String(fileData.filePath ?? "").replace(/\\/g, "/")
  return fp.endsWith("01_Úvod do metodiky ŘSD.md")
}

/** Řazení: 1) podle číselného prefixu (01_, 02_, …), 2) složky před soubory, 3) podle názvu. Používá slugSegment (segment cesty), ne displayName (může být z frontmatter). */
function sortByNumericPrefix(a: FileTrieNode, b: FileTrieNode): number {
  const segA = a.slugSegment ?? a.displayName ?? ""
  const segB = b.slugSegment ?? b.displayName ?? ""
  const numA = parseInt(segA.match(/^(\d+)/)?.[1] ?? "999999", 10)
  const numB = parseInt(segB.match(/^(\d+)/)?.[1] ?? "999999", 10)
  if (numA !== numB) return numA - numB
  if (!a.isFolder && b.isFolder) return 1
  if (a.isFolder && !b.isFolder) return -1
  return (segA || a.displayName).localeCompare(segB || b.displayName, undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

/**
 * Levý panel: úvod (index + stránka Úvod do metodiky), seznam všech činností, CDE workflow, Knihovna průvodce, Diagramy.
 * Ikony (vyhledávání, tmavý režim) zůstávají v layoutu — nejsou součástí Exploreru.
 * (filterFn se do klienta posílá přes .toString() — nesmí volat jiné funkce z tohoto souboru.)
 */
function explorerFilter(node: FileTrieNode): boolean {
  if (node.slugSegment === "tags") return false
  const s = String(node.slug).replace(/\/index$/i, "")
  const parts = s.split("/").filter(Boolean)
  if (parts.length === 0) return false

  const rootSeg = parts[0]
  const allowedRoot = new Set([
    "index",
    "01_Úvod-do-metodiky-ŘSD",
    "02---Seznam-všech-činností",
    "03---CDE-workflow",
    "05_Knihovna-průvodce",
    "06_Diagramy",
  ])

  if (parts.length === 1) {
    return allowedRoot.has(rootSeg)
  }
  return rootSeg === "05_Knihovna-průvodce" || rootSeg === "06_Diagramy"
}

function hideOrderingPrefix(node: FileTrieNode): void {
  node.displayName = node.displayName.replace(/^\d+_+/, "")
}

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.TopNav(), Component.Search(), Component.Darkmode()],
  afterBody: [
    Component.ConditionalRender({
      component: Component.HomeLanding(),
      condition: (page) => page.fileData.slug === "index",
    }),
    Component.ConditionalRender({
      component: Component.ProcesniOblastRuntime(),
      condition: (page) =>
        page.fileData.frontmatter?.typ === "oblast",
    }),
    Component.ConditionalRender({
      component: Component.CinnostiTable(),
      condition: (page) => isSeznamCinnostiPage(page.fileData),
    }),
    Component.ConditionalRender({
      component: Component.CdeWorkflowTable(),
      condition: (page) => isCdeWorkflowPage(page.fileData),
    }),
    Component.ConditionalRender({
      component: Component.RaciBacklinks(),
      condition: (page) => {
        const typ = page.fileData.frontmatter?.typ
        return (
          typ === "term" ||
          typ === "role" ||
          typ === "smluvni_strana" ||
          typ === "cinnost" ||
          typ === "ukol" ||
          typ === "oblast"
        )
      },
    }),
  ],
  footer: Component.Footer(),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs({ showRoot: false }),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.ConditionalRender({
      component: Component.MetadataPanel(),
      condition: (page) =>
        !isSeznamCinnostiPage(page.fileData) &&
        !isCdeWorkflowPage(page.fileData) &&
        !isMetodikaUvodPage(page.fileData),
    }),
    Component.TagList(),
  ],
  left: [],
  right: [],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs({ showRoot: false }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
  ],
  left: [],
  right: [],
}
