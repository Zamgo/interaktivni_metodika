import { QuartzFilterPlugin } from "../types"

function isStavSkryto(frontmatter: Record<string, unknown> | undefined): boolean {
  const stav = frontmatter?.stav
  if (typeof stav !== "string") return false
  return stav.trim().toLowerCase() === "skryto"
}

/** Vyloučí stránky s `stav: skryto` z webové publikace (stejně jako draft u RemoveDrafts). */
export const RemoveSkryto: QuartzFilterPlugin<{}> = () => ({
  name: "RemoveSkryto",
  shouldPublish(_ctx, [_tree, vfile]) {
    return !isStavSkryto(vfile.data?.frontmatter as Record<string, unknown> | undefined)
  },
})
