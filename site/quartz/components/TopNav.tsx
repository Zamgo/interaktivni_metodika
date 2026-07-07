import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { sitePath } from "../util/path"

type NavLink = {
  label: string
  /** Relativní cesta od kořene webu (bez leadingslash) — nebo "" pro domovskou stránku. */
  path: string
}

type DropdownLink = {
  label: string
  path: string
}

const NAV_LINKS: NavLink[] = [
  { label: "Úvod", path: "" },
  { label: "Katalog všech činností", path: "cinnosti" },
]

const DEFINITIONS_ROOT_PATH = "05_Knihovna-průvodce"
const DEFINITIONS_DROPDOWN_LINKS: DropdownLink[] = [
  { label: "CDE workflow", path: "05_Knihovna-průvodce/CDE-workflow/" },
  { label: "Smluvní strany", path: "05_Knihovna-průvodce/Smluvní-strany/" },
  { label: "Role", path: "05_Knihovna-průvodce/Role/" },
  { label: "Fáze", path: "05_Knihovna-průvodce/Faze/" },
  { label: "Terminologie", path: "05_Knihovna-průvodce/Terminologie/" },
  { label: "Zákony", path: "05_Knihovna-průvodce/Zákony/" },
]

const TopNav: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const homeHref = sitePath(cfg.baseUrl)
  const logoSrc = sitePath(cfg.baseUrl, "static/rsd-logo.svg")

  return (
    <div class="top-nav">
      <a href={homeHref} class="top-nav-logo" aria-label="Zpět na úvod">
        <img
          src={logoSrc}
          alt="Ředitelství silnic a dálnic"
          width="120"
          height="49"
          class="top-nav-logo-img"
        />
      </a>
      <nav class="top-nav-links" aria-label="Hlavní navigace">
        {NAV_LINKS.map((link) => (
          <a
            href={link.path ? sitePath(cfg.baseUrl, link.path) : homeHref}
            class="top-nav-link"
            data-top-nav-path={link.path}
          >
            {link.label}
          </a>
        ))}
        <div class="top-nav-dropdown" data-top-nav-dropdown>
          <button
            type="button"
            class="top-nav-link top-nav-dropdown-toggle"
            data-top-nav-dropdown-toggle
            data-top-nav-path={DEFINITIONS_ROOT_PATH}
            aria-haspopup="true"
            aria-expanded="false"
          >
            Knihovna průvodce
          </button>
          <div class="top-nav-dropdown-menu" data-top-nav-dropdown-menu>
            {DEFINITIONS_DROPDOWN_LINKS.map((link) => (
              <a
                href={sitePath(cfg.baseUrl, link.path)}
                class="top-nav-dropdown-link"
                data-top-nav-path={link.path}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}

TopNav.css = `
.top-nav {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 1 1 auto;
  min-width: 0;
}

.top-nav-logo {
  flex: 0 0 auto;
  display: block;
  line-height: 0;
  background: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  text-decoration: none;
  transition: opacity 120ms ease;
}

.top-nav-logo:hover {
  opacity: 0.82;
}

.top-nav-logo-img {
  display: block;
  height: 34px;
  width: auto;
}

.top-nav-links {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  flex-wrap: nowrap;
  min-width: 0;
  overflow: visible;
}

.top-nav-link {
  display: inline-flex;
  align-items: center;
  border: 0;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--darkgray);
  text-decoration: none;
  white-space: nowrap;
  background: none;
  transition: background 120ms ease, color 120ms ease;
}

.top-nav-dropdown {
  position: relative;
}

.top-nav-dropdown-toggle {
  cursor: pointer;
  font-family: inherit;
}

.top-nav-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 14rem;
  background: var(--light);
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  display: none;
  flex-direction: column;
  padding: 0.35rem 0.25rem 0.25rem;
  z-index: 25;
}

.top-nav-dropdown.open .top-nav-dropdown-menu {
  display: flex;
}

.top-nav-dropdown-link {
  display: block;
  padding: 0.45rem 0.55rem;
  border-radius: 6px;
  color: var(--darkgray);
  text-decoration: none;
  white-space: nowrap;
  font-size: 0.87rem;
}

.top-nav-dropdown-link:hover {
  color: var(--secondary);
  background: color-mix(in srgb, var(--secondary) 10%, var(--light));
}

.top-nav-link:hover {
  background: color-mix(in srgb, var(--secondary) 10%, var(--light));
  color: var(--secondary);
}

.top-nav-link.active,
.top-nav-dropdown-link.active,
.top-nav-dropdown-toggle.active {
  color: var(--secondary);
  font-weight: 600;
  background: color-mix(in srgb, var(--secondary) 10%, var(--light));
}

@media all and (max-width: 800px) {
  .top-nav-links {
    display: none;
  }
  .top-nav-logo-img {
    height: 28px;
  }
}
`

TopNav.afterDOMLoaded = `
function markActiveTopNavLink() {
  const links = document.querySelectorAll(".top-nav-link, .top-nav-dropdown-link");
  if (!links.length) return;
  const normalizedPath = window.location.pathname.replace(/\\/+$/, "") || "/";
  const currentPath = decodeURIComponent(normalizedPath);
  const logo = document.querySelector(".top-nav-logo");
  const siteRoot = logo
    ? (new URL(logo.href, window.location.href).pathname.replace(/\\/+$/, "") || "/")
    : "";
  for (const link of links) {
    const pathFromData = link.dataset.topNavPath;
    const isHomeLink = pathFromData === "";
    const href = link.getAttribute("href");
    const resolved = href
      ? (new URL(href, window.location.href).pathname.replace(/\\/+$/, "") || "/")
      : pathFromData
        ? ((siteRoot === "/" ? "" : siteRoot) + "/" + pathFromData.replace(/^\\/+/, "")).replace(/\\/+$/, "")
        : "/";
    const isRoot = resolved === "/" || resolved === siteRoot;
    const isActive = isHomeLink
      ? currentPath === siteRoot
      : isRoot
      ? currentPath === resolved
      : currentPath === resolved || currentPath.startsWith(resolved + "/");
    link.classList.toggle("active", isActive);
  }
}

function setupTopNavDropdown() {
  const dropdown = document.querySelector("[data-top-nav-dropdown]");
  if (!dropdown) return;
  const toggle = dropdown.querySelector("[data-top-nav-dropdown-toggle]");
  const menu = dropdown.querySelector("[data-top-nav-dropdown-menu]");
  if (!toggle || !menu) return;

  const close = () => {
    dropdown.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  const open = () => {
    dropdown.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
  };

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    const isOpen = dropdown.classList.contains("open");
    if (isOpen) {
      close();
    } else {
      open();
    }
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      close();
    }
  });

  menu.querySelectorAll("a").forEach((item) => {
    item.addEventListener("click", close);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

setupTopNavDropdown();
document.addEventListener("nav", markActiveTopNavLink);
`

export default (() => TopNav) satisfies QuartzComponentConstructor
