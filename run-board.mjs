#!/usr/bin/env node
import { runAgentBoard } from "./orchestrator/runBoard.mjs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const evalPath = path.join(__dirname, "data", "agent-eval.jsonl")
const posturePath = path.join(__dirname, "data", "agent-posture.json")

const args = process.argv.slice(2)

if (args[0] === "--test") {
  const { spawn } = await import("node:child_process")
  const child = spawn(
    process.execPath,
    ["--test", path.join(__dirname, "tests", "agent-board.test.mjs")],
    { stdio: "inherit", cwd: __dirname }
  )
  child.on("exit", (code) => process.exit(code ?? 1))
} else {
  const goal =
    args.join(" ").trim() ||
    "Add safe memory write path for project decisions"
  const { board, evaluation, thresholds, posture } = await runAgentBoard(goal, {
    evalPath,
    posturePath,
    baseDir: __dirname
  })
  console.log(
    JSON.stringify(
      {
        board,
        evaluation,
        thresholds,
        posture: {
          updatedAt: posture.updatedAt,
          lessons: posture.lessons?.slice(-8),
          riskDefaults: posture.riskDefaults,
          agentStats: posture.agentStats,
          axisBias: posture.axisBias
        }
      },
      null,
      2
    )
  )
}
