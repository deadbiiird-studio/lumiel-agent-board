export const coder = {
  async run(input) {
    const goal = input?.goal || input
    return { agent: "coder", goal, output: `candidate for: ${goal}`, confidence: 0.72 }
  }
}
