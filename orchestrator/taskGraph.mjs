export class TaskGraph {
  constructor() { this.nodes = new Map() }
  add(node) {
    if (!this.nodes.has(node.id)) this.nodes.set(node.id, { retries: 0, status: "pending", dependsOn: [], ...node })
  }
  getReady() {
    return [...this.nodes.values()].filter(n =>
      n.status === "pending" && (n.dependsOn || []).every(d => this.nodes.get(d)?.status === "done")
    )
  }
  markDone(id, result) {
    const n = this.nodes.get(id)
    if (n) { n.status = "done"; n.result = result }
  }
  markFailed(id) {
    const n = this.nodes.get(id)
    if (n) n.status = "failed"
  }
  upstream() {
    const by = {}
    for (const n of this.nodes.values()) {
      if (n.status === "done" && n.result) {
        by[n.result.agent || n.type] = n.result
        if (n.type === "code") by.coder = n.result
        if (n.type === "critic") by.critic = n.result
      }
    }
    return by
  }
  board() {
    const nodes = [...this.nodes.values()].map(n => ({
      id: n.id, type: n.type, status: n.status, dependsOn: n.dependsOn || [], retries: n.retries || 0,
      resultSummary: n.result?.output || n.result?.fix || (n.result?.skipped ? `skipped: ${n.result.reason}` : n.result?.score != null ? `score=${n.result.score}` : null),
      accept: n.result?.accept, skipped: n.result?.skipped
    }))
    const counts = {
      total: nodes.length,
      pending: nodes.filter(n => n.status === "pending").length,
      running: nodes.filter(n => n.status === "running").length,
      done: nodes.filter(n => n.status === "done").length,
      failed: nodes.filter(n => n.status === "failed").length
    }
    return { label: "Lumiel Agent Board", counts, nodes, complete: counts.pending === 0 && counts.running === 0 && counts.failed === 0 }
  }
}
