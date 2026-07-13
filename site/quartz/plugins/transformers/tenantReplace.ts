import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root, Text } from "mdast"
import { getActiveTenant, TenantReplaceRule } from "../../../tenants"

/**
 * Řízená textová záměna pro white-label build (např. ŘSD → SŽ).
 *
 * - Aplikuje pravidla z aktivní firmy (tenants.ts) na VIDITELNÝ text
 *   (mdast `text` uzly) + na frontmatter title/description.
 * - NEMĚNÍ URL/slugy ani obsah kódových bloků — odkazy tak zůstávají funkční.
 * - Přeskakuje soubory z deny-listu (např. legislativní texty).
 *
 * Zdrojová firma (bez pravidel) = no-op.
 */

function applyRules(value: string, rules: TenantReplaceRule[]): string {
  let out = value
  for (const rule of rules) {
    out = out.split(rule.from).join(rule.to)
  }
  return out
}

function isDenied(filePath: string, denyList: string[]): boolean {
  const haystack = filePath.toLowerCase()
  return denyList.some((needle) => haystack.includes(needle.toLowerCase()))
}

export const TenantReplace: QuartzTransformerPlugin = () => {
  const tenant = getActiveTenant()
  const rules = tenant.replace
  const denyList = tenant.replaceDenyList

  return {
    name: "TenantReplace",
    markdownPlugins() {
      if (rules.length === 0) {
        return []
      }

      return [
        () => {
          return (tree: Root, file) => {
            const filePath = String(file.data.filePath ?? file.data.slug ?? "")
            if (isDenied(filePath, denyList)) {
              return
            }

            visit(tree, "text", (node: Text) => {
              node.value = applyRules(node.value, rules)
            })

            const fm = file.data.frontmatter as Record<string, unknown> | undefined
            if (fm) {
              for (const key of ["title", "description", "socialDescription"]) {
                const val = fm[key]
                if (typeof val === "string") {
                  fm[key] = applyRules(val, rules)
                }
              }
            }
          }
        },
      ]
    },
  }
}
