import fs from "node:fs"
import path from "node:path"

const DEFAULT_PATH = path.resolve(
  process.env.LUMIEL_AGENT_EVAL_PATH ||
    path.join(process.cwd(), "data", "agent-eval.jsonl")
)

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

export function appendEval(record, storePath = DEFAULT_PATH) {
  ensureDir(storePath)
  const line = JSON.stringify({ ...record, recordedAt: new Date().toISOString() })
  fs.appendFileSync(storePath, line + "\n", "utf8")
  return record
}

export function loadEvals(limit = 50, storePath = DEFAULT_PATH) {
  if (!fs.existsSync(storePath)) return []
  const lines = fs.readFileSync(storePath, "utf8").trim().split("\n").filter(Boolean)
  return lines.slice(-limit).map((l) => {
    try { return JSON.parse(l) } catch { return null }
  }).filter(Boolean)
}

/** Derive adaptive thresholds from recent board runs */
export function adaptiveThresholds(storePath = DEFAULT_PATH) {
  const recent = loadEvals(20, storePath)
  const sampleSize = recent.length

  if (sampleSize < 3) {
    return { accept: 0.75, repair: 0.6, minLeverage: 0.4, sampleSize, recentMean: null }
  }

  const avgs = recent.map((r) => r.boardScore?.overall ?? r.overall ?? 0.7)
  const mean = avgs.reduce((a, b) => a + b, 0) / avgs.length
  const accept = Math.min(0.9, Math.max(0.65, mean + 0.05))
  const repair = Math.min(accept - 0.1, Math.max(0.45, mean - 0.15))
  return { accept, repair, minLeverage: 0.4, sampleSize, recentMean: mean }
}
