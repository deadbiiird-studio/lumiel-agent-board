import { TaskGraph } from "./taskGraph.mjs"
import { agents } from "../agents/index.mjs"

export async function runAgentBoard(entryInput, options = {}) {
  const graph = new TaskGraph()
  graph.add({ id: "root", type: "plan", input: entryInput, status: "pending", dependsOn: [], retries: 0 })
  let safety = 0
  while (safety++ < 32) {
    const ready = graph.getReady()
    if (!ready.length) break
    for (const task of ready) {
      try {
        task.status = "running"
        const agent = agents[task.type] || agents.chat
        const result = await agent.run(task.input, graph.upstream())
        if (result?.tasks) {
          for (const t of result.tasks) graph.add(t)
        }
        graph.markDone(task.id, result)
      } catch (e) {
        task.retries = (task.retries || 0) + 1
        if (task.retries > 2) graph.markFailed(task.id)
        else task.status = "pending"
      }
    }
  }
  return { board: graph.board() }
}
