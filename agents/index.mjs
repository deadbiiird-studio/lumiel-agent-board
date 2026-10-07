import { planner } from "./planner.mjs"
import { coder } from "./coder.mjs"
import { critic } from "./critic.mjs"
import { repairer } from "./repairer.mjs"

export const agents = {
  plan: planner,
  planner,
  code: coder,
  coder,
  critic,
  repair: repairer,
  repairer,
  chat: coder
}
