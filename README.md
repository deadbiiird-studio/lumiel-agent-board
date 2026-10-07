# Lumiel Agent Board

Local-first multi-agent TaskGraph for Lumiel.

## Agents
- **planner** — risk scan, adaptive thresholds, success criteria, task expansion
- **coder** — structured candidates with claims, assumptions, posture evidence
- **critic** — multi-axis scoring (correctness, safety, completeness, leverage)
- **repairer** — critic-gated patches + structured posture updates

## Evolution loop
1. Board run records evaluation → `data/agent-eval.jsonl`
2. Learning / hints evolve **posture** → `data/agent-posture.json`
3. Next run: planner/coder/critic consume posture + adaptive thresholds

## Quick start
```bash
node run-board.mjs "Fix crash on empty memory store"
node run-board.mjs --test
```

## Branch map (each change)
| Branch | Change |
|--------|--------|
| `feature/01-board-scaffold` | TaskGraph + agent registry + board snapshot |
| `feature/02-agent-leverage` | Contracts, risk-aware agents, eval memory |
| `feature/03-agent-posture` | Posture store; agents apply/evolve learning |
| `feature/04-tests-and-cli` | Evaluation suite + CLI |

## Tests
```bash
node --test tests/agent-board.test.mjs
```
