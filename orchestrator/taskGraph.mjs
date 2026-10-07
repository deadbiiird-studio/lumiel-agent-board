export class TaskGraph {
  constructor() {
    this.nodes = new Map()
  }

  add(node) {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, {
        retries: 0,
        status: "pending",
        dependsOn: [],
        ...node
      })
    }
  }

  getReady() {
    return [...this.nodes.values()].filter(
      (n) =>
        n.status === "pending" &&
        (n.dependsOn || []).every((d) => this.nodes.get(d)?.status === "done")
    )
  }

  markDone(id, result) {
    const n = this.nodes.get(id)
    if (n) {
      n.status = "done"
      n.result = result
    }
  }

  markFailed(id, error) {
    const n = this.nodes.get(id)
    if (n) {
      n.status = "failed"
      n.error = String(error?.message || error || "failed")
    }
  }

  upstream() {
    const byType = {}
    for (const n of this.nodes.values()) {
      if (n.status === "done" && n.result) {
        const key = n.result.agent || n.type
        byType[key] = n.result
        if (n.type === "code" || n.type === "coder") byType.coder = n.result
        if (n.type === "critic") byType.critic = n.result
        if (n.type === "plan" || n.type === "planner") byType.planner = n.result
        if (n.type === "repair" || n.type === "repairer") byType.repairer = n.result
      }
    }
    return byType
  }

  board() {
    const nodes = [...this.nodes.values()].map((n) => ({
      id: n.id,
      type: n.type,
      status: n.status,
      dependsOn: n.dependsOn || [],
      retries: n.retries || 0,
      resultSummary: summarize(n.result),
      scores: n.result?.scores || null,
      accept: n.result?.accept,
      skipped: n.result?.skipped
    }))

    const criticNodes = nodes.filter((n) => n.type === "critic" && n.scores)
    const boardScore = aggregateScores(criticNodes.map((n) => n.scores))

    const counts = {
      total: nodes.length,
      pending: nodes.filter((n) => n.status === "pending").length,
      running: nodes.filter((n) => n.status === "running").length,
      done: nodes.filter((n) => n.status === "done").length,
      failed: nodes.filter((n) => n.status === "failed").length,
      skippedRepair: nodes.filter((n) => n.type === "repair" && n.skipped).length
    }

    return {
      label: "Lumiel Agent Board",
      counts,
      boardScore,
      nodes,
      complete: counts.pending === 0 && counts.running === 0 && counts.failed === 0
    }
  }
}

function summarize(result) {
  if (result == null) return null
  if (result.skipped) return `skipped: ${result.reason || "n/a"}`
  if (result.output) return String(result.output).slice(0, 140)
  if (result.fix) return String(result.fix).slice(0, 140)
  if (result.scores) {
    const o = result.scores.overall?.toFixed?.(3) ?? result.scores.overall
    return `overall=${o} accept=${result.accept}`
  }
  if (result.plan) return `plan steps=${result.plan.length}; risks=${(result.risks || []).join(",") || "none"}`
  return "ok"
}

function aggregateScores(list) {
  if (!list.length) return null
  const axes = ["correctness", "safety", "completeness", "leverage", "overall"]
  const acc = Object.fromEntries(axes.map((a) => [a, 0]))
  for (const s of list) {
    for (const a of axes) acc[a] += Number(s[a] || 0)
  }
  for (const a of axes) acc[a] = acc[a] / list.length
  return acc
}
