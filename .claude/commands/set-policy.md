---
description: "Record the approved source policy"
---

# Record the approved source policy

Read CLAUDE.md and docs/cli.md. Confirm workspace and requested scope.

```bash
node scripts/logs.mjs set-policy "HOST" --owner="Owner" --gap-hours=24 --retention-days=180 --basis="Approved reference" --review-due=2027-01-31 --security-ref="Review reference" --by="Operator"
```

Replace every example value with the approved policy. Dates and durations here are examples, not legal defaults.

Answer from the actual output. Include the evidence scope and the next review action. Never send, publish, disable accounts or change external systems.
