/** Shared agent board contracts — keep agents interoperable and evaluable */

export const AXES = ["correctness", "safety", "completeness", "leverage"]

export function normalizeGoal(input) {
  if (typeof input === "string") return input.trim()
  if (input?.goal) return String(input.goal).trim()
  return String(input ?? "").trim()
}

export function baseResult(agent, goal, extra = {}) {
  return {
    agent,
    goal,
    timestamp: new Date().toISOString(),
    ...extra
  }
}

export function scoreAxes(partial = {}) {
  const out = {}
  for (const a of AXES) {
    const v = Number(partial[a])
    out[a] = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5
  }
  out.overall =
    out.correctness * 0.35 +
    out.safety * 0.3 +
    out.completeness * 0.2 +
    out.leverage * 0.15
  return out
}

/** Risk signals that should raise the bar for critic / force repair */
export function detectRiskSignals(text) {
  const t = String(text).toLowerCase()
  const signals = []
  if (/\b(crash|exception|segfault|panic)\b/.test(t)) signals.push("crash")
  if (/\b(data loss|corrupt|wipe|delete all)\b/.test(t)) signals.push("data-loss")
  if (/\b(security|auth|token|secret|inject)\b/.test(t)) signals.push("security")
  if (/\b(disk|space|oom|memory leak)\b/.test(t)) signals.push("resource")
  if (/\b(refactor|rewrite|overhaul)\b/.test(t)) signals.push("scope-creep")
  return signals
}
