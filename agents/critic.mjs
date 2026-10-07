export const critic = {
  async run(input) {
    const goal = input?.goal || input
    return { agent: "critic", goal, score: 0.8, accept: true, needsRepair: false, issues: [] }
  }
}
