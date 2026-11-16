---
description: "Import an EventLog Analyzer export"
---

# Import an EventLog Analyzer export

Read CLAUDE.md and docs/cli.md. Confirm workspace and requested scope.

```bash
node scripts/logs.mjs import eventlog imports/search.csv --by="Operator" --dry-run
```

Read docs/replace-manageengine-eventlog-analyzer.md. Confirm columns, timezone, source identities and expected count. Run the dry run, then the same command without --dry-run when this import is requested. Reconcile counts and sampled records; do not claim the entire history moved.

Answer from the actual output. Include the evidence scope and the next review action. Never send, publish, disable accounts or change external systems.
