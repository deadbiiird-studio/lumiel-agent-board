export const planner = {
  async run(input) {
    const goal = typeof input === "string" ? input : String(input?.goal || input)
    return {
      agent: "planner",
      goal,
      plan: ["decompose", "implement", "critique", "repair-if-needed"],
      tasks: [
        { id: "code-1", type: "code", input: { goal }, status: "pending", dependsOn: ["root"], retries: 0 },
        { id: "critic-1", type: "critic", input: { goal }, status: "pending", dependsOn: ["code-1"], retries: 0 },
        { id: "repair-1", type: "repair", input: { goal, conditional: true }, status: "pending", dependsOn: ["critic-1"], retries: 0 }
      ]
    }
  }
}
