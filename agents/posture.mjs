/**
 * Agent posture — durable, evolving defaults derived from board learning.
 * Every prior change feeds here: risk taxes, adaptive thresholds, learning strings.
 */
import fs from "node:fs"
import path from "node:path"
import { loadEvals } from "./evalMemory.mjs"

const DEFAULT_PATH = path.resolve(
  process.env.LUMIEL_AGENT_POSTURE_PATH ||
    path.join(process.cwd(), "data", "agent-posture.json")
)

const DEFAULT_POSTURE = {
  version: 1,
  updatedAt: null,
  riskDefaults: {
    crash: { defensive: true, minConfidence: 0.7, requireGuards: true },
    "data-loss": { defensive: true, appendOnly: true, requireGuards: true },
    security: { redactSecrets: true, threatNotes: true },
    resource: { avoidHeavyInstalls: true },
    "scope-creep": { minimalSlice: true }
  },
  lessons: [],
  agentStats: {
    planner: { runs: 0, expansions: 0 },
    coder: { runs: 0, accepted: 0, repaired: 0 },
    critic: { runs: 0, accepts: 0, rejects: 0 },
    repairer: { runs: 0, applied: 0, skipped: 0 }
  },
  axisBias: {
    correctness: 0,
    safety: 0,
    completeness: 0,
    leverage: 0
  }
}

export function loadPosture(storePath = DEFAULT_PATH) {
  try {
    if (fs.existsSync(storePath)) {
      const raw = JSON.parse(fs.readFileSync(storePath, "utf8"))
      return {
        ...DEFAULT_POSTURE,
        ...raw,
        riskDefaults: { ...DEFAULT_POSTURE.riskDefaults, ...(raw.riskDefaults || {}) },
        agentStats: {
          planner: { ...DEFAULT_POSTURE.agentStats.planner, ...(raw.agentStats?.planner || {}) },
          coder: { ...DEFAULT_POSTURE.agentStats.coder, ...(raw.agentStats?.coder || {}) },
          critic: { ...DEFAULT_POSTURE.agentStats.critic, ...(raw.agentStats?.critic || {}) },
          repairer: { ...DEFAULT_POSTURE.agentStats.repairer, ...(raw.agentStats?.repairer || {}) }
        },
        axisBias: { ...DEFAULT_POSTURE.axisBias, ...(raw.axisBias || {}) },
        lessons: Array.isArray(raw.lessons) ? raw.lessons.slice(-40) : []
      }
    }
  } catch {
    /* fall through */
  }
  return structuredClone(DEFAULT_POSTURE)
}

export function savePosture(posture, storePath = DEFAULT_PATH) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true })
  const next = {
    ...posture,
    version: (posture.version || 1) + 0,
    updatedAt: new Date().toISOString()
  }
  fs.writeFileSync(storePath, JSON.stringify(next, null, 2), "utf8")
  return next
}

export function evolvePosture(evaluation, storePath = DEFAULT_PATH) {
  const posture = loadPosture(storePath)
  const lessons = new Set(posture.lessons)

  for (const l of evaluation.learning || []) {
    if (l && typeof l === "string") lessons.add(l)
  }
  for (const h of evaluation.evolutionHints || []) {
    if (h && typeof h === "string") lessons.add(h)
  }

  for (const lesson of lessons) {
    const t = lesson.toLowerCase()
    if (t.includes("defensive") && t.includes("crash")) {
      posture.riskDefaults.crash = {
        ...posture.riskDefaults.crash,
        defensive: true,
        requireGuards: true,
        minConfidence: Math.max(posture.riskDefaults.crash.minConfidence || 0.7, 0.72)
      }
    }
    if (t.includes("append-only") || (t.includes("data-loss") && t.includes("planner"))) {
      posture.riskDefaults["data-loss"] = {
        ...posture.riskDefaults["data-loss"],
        appendOnly: true,
        defensive: true
      }
    }
    if (t.includes("security") && t.includes("mandatory")) {
      posture.riskDefaults.security = {
        ...posture.riskDefaults.security,
        threatNotes: true,
        redactSecrets: true
      }
    }
    if (t.includes("minimal slice") || t.includes("scope")) {
      posture.riskDefaults["scope-creep"] = {
        ...posture.riskDefaults["scope-creep"],
        minimalSlice: true
      }
    }
  }

  const stats = posture.agentStats
  stats.planner.runs += 1
  stats.coder.runs += 1
  stats.critic.runs += 1
  if (evaluation.criticAccept) {
    stats.critic.accepts += 1
    stats.coder.accepted += 1
  } else {
    stats.critic.rejects += 1
    stats.coder.repaired += 1
  }
  stats.repairer.runs += 1
  if (evaluation.repairSkipped) stats.repairer.skipped += 1
  else stats.repairer.applied += 1

  const score = evaluation.boardScore
  if (score) {
    const bias = posture.axisBias
    for (const axis of ["correctness", "safety", "completeness", "leverage"]) {
      const v = Number(score[axis])
      if (!Number.isFinite(v)) continue
      if (v < 0.75) bias[axis] = Math.min(0.15, (bias[axis] || 0) + 0.02)
      else bias[axis] = Math.max(0, (bias[axis] || 0) - 0.01)
    }
  }

  posture.lessons = [...lessons].slice(-40)
  return savePosture(posture, storePath)
}

export function claimsFromPosture(risks, posture) {
  const claims = {
    scoped: true,
    defensive: false,
    localFirst: true,
    appendOnly: false,
    threatNotes: false
  }
  for (const r of risks || []) {
    const d = posture.riskDefaults[r]
    if (!d) continue
    if (d.defensive) claims.defensive = true
    if (d.appendOnly) claims.appendOnly = true
    if (d.threatNotes) claims.threatNotes = true
    if (d.minimalSlice) claims.scoped = true
  }
  return claims
}

export function rebuildPostureFromEvals(evalPath, posturePath = DEFAULT_PATH) {
  const evals = loadEvals(100, evalPath)
  savePosture(structuredClone(DEFAULT_POSTURE), posturePath)
  for (const ev of evals) {
    evolvePosture(ev, posturePath)
  }
  return loadPosture(posturePath)
}
