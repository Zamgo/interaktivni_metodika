/**
 * Multi-brand (white-label) konfigurace.
 *
 * Web se sestavuje ZVLÁŠŤ pro každou firmu (tenant) — aktivní firmu určuje
 * proměnná prostředí QUARTZ_TENANT (např. `QUARTZ_TENANT=sz`). Výchozí je "rsd".
 *
 * Přidání další firmy = jeden záznam níže + logo/ikona v `quartz/static/`
 * (+ volitelně pravidla záměny textu).
 */

export interface TenantColors {
  /** Hlavní tmavá barva značky (mapuje se na --brand-dark). */
  brandDark: string
  /** Světlejší akcent značky pro odkazy/hover (--brand-light). */
  brandLight: string
  /** Doplňkový akcent 1 — oranžová (--brand-accent). */
  brandAccent: string
  /** Doplňkový akcent 2 — zelená (--brand-accent-2). */
  brandAccent2: string
}

export interface TenantReplaceRule {
  from: string
  to: string
}

export interface Tenant {
  /** Interní identifikátor a zároveň URL prefix (…/rsd/, …/sz/). */
  id: string
  /** Zkratka firmy (zobrazovaná, nikoli slug). */
  short: string
  /** Plný název firmy. */
  full: string
  /** Titulek webu (og:site_name, <title> suffix zdroje). */
  pageTitle: string
  /** Název souboru loga v `quartz/static/`. */
  logo: string
  /** Alt text loga. */
  logoAlt: string
  /** Název souboru ikony (favicon) v `quartz/static/` (png nebo svg). */
  icon: string
  colors: TenantColors
  /**
   * Pravidla textové záměny aplikovaná při buildu na obsah.
   * Prázdné = zdrojová varianta (nic se nemění).
   * Pořadí je závazné (delší/plné názvy dávejte PŘED zkratky).
   */
  replace: TenantReplaceRule[]
  /**
   * Cesty (case-insensitive substring), kde se záměna NEPROVÁDÍ.
   * Např. legislativní texty musí zůstat doslovně.
   */
  replaceDenyList: string[]
}

export const DEFAULT_TENANT_ID = "rsd"

export const tenants: Record<string, Tenant> = {
  rsd: {
    id: "rsd",
    short: "ŘSD",
    full: "Ředitelství silnic a dálnic",
    pageTitle: "Metodika ŘSD (POC)",
    logo: "rsd-logo.svg",
    logoAlt: "Ředitelství silnic a dálnic",
    icon: "rsd-icon.svg",
    colors: {
      brandDark: "#09417a",
      brandLight: "#0096dc",
      brandAccent: "#d97706",
      brandAccent2: "#2f855a",
    },
    // Zdrojová varianta — obsah se nepřepisuje.
    replace: [],
    replaceDenyList: [],
  },
  sz: {
    id: "sz",
    short: "SŽ",
    full: "Správa železnic",
    pageTitle: "Metodika SŽ (POC)",
    logo: "sz-logo.png",
    logoAlt: "Správa železnic",
    icon: "sz-icon.svg",
    // Oficiální barvy dle grafického manuálu Správy železnic (sRGB).
    colors: {
      brandDark: "#002b59", // modrá (PANTONE 294 C)
      brandLight: "#00a1e0", // azurová (PANTONE 299 C)
      brandAccent: "#ff5200", // oranžová (PANTONE Orange 021 C)
      brandAccent2: "#34a49a", // zelená (PANTONE 3258 C)
    },
    // Delší názvy PŘED zkratkou, ať se nerozbije mezistav.
    replace: [
      { from: "Ředitelství silnic a dálnic", to: "Správa železnic" },
      { from: "ŘSD", to: "SŽ" },
    ],
    // Zákony/legislativa zůstávají doslovně.
    replaceDenyList: ["Zákony", "Zakony"],
  },
}

/** Aktivní firma podle QUARTZ_TENANT (fallback na výchozí). */
export function getActiveTenant(): Tenant {
  const id = (process.env.QUARTZ_TENANT ?? DEFAULT_TENANT_ID).toLowerCase()
  const tenant = tenants[id]
  if (!tenant) {
    const known = Object.keys(tenants).join(", ")
    throw new Error(`Neznámá firma (QUARTZ_TENANT="${id}"). Dostupné: ${known}.`)
  }
  return tenant
}
