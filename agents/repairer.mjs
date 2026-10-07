export const repairer = {
  async run(input, upstream = {}) {
    if (upstream.critic?.accept) {
      return { agent: "repairer", skipped: true, reason: "critic accepted candidate" }
    }
    return { agent: "repairer", skipped: false, fix: "minimal safe patch", changes: ["narrow failure surface"] }
  }
}
