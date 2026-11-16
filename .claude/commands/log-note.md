---
description: "Record an investigation note"
---

# Record an investigation note

Read CLAUDE.md and docs/cli.md. Confirm workspace and requested scope.

```bash
node scripts/logs.mjs log-note "LOG-301" --text="Observed facts and their source" --by="Operator"
```

Separate observations from hypotheses. Never record a response as completed unless evidence confirms it.

Answer from the actual output. Include the evidence scope and the next review action. Never send, publish, disable accounts or change external systems.
