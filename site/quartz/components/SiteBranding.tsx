import { sitePath } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { getActiveTenant } from "../../tenants"

const tenant = getActiveTenant()

/** Logo firmy nad levým panelem (menu / explorer) */
const SiteBranding: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const homeHref = sitePath(cfg.baseUrl)
  const logoSrc = sitePath(cfg.baseUrl, `static/${tenant.logo}`)
  return (
    <div class="site-branding">
      <a href={homeHref} class="site-branding__link" aria-label="Zpět na úvod">
        <img
          src={logoSrc}
          alt={tenant.logoAlt}
          class="site-branding__logo"
          width="172"
          height="70"
        />
      </a>
    </div>
  )
}

SiteBranding.css = `
.site-branding {
  flex-shrink: 0;
  margin: 0 0 1rem 0;
}
.site-branding__link {
  display: block;
  background: none !important;
  padding: 0 !important;
  line-height: 0;
}
.site-branding__link:hover {
  opacity: 0.92;
}
.site-branding__logo {
  display: block;
  width: 100%;
  max-width: 200px;
  height: auto;
}
@media all and (max-width: 800px) {
  .site-branding {
    margin: 0 0.75rem 0 0;
  }
  .site-branding__logo {
    max-width: 140px;
  }
}
`

export default (() => SiteBranding) satisfies QuartzComponentConstructor
