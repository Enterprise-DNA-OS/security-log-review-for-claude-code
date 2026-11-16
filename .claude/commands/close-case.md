---
description: "Record the analyst disposition"
---

# Record the analyst disposition

Read CLAUDE.md and docs/cli.md. Confirm workspace and requested scope.

```bash
node scripts/logs.mjs close-case "LOG-301" --disposition="Conclusion and evidence basis" --by="Operator"
```

Requires linked evidence and the operator decision. Closing performs no external response. Closed cases cannot be edited through the CLI.

Answer from the actual output. Include the evidence scope and the next review action. Never send, publish, disable accounts or change external systems.
