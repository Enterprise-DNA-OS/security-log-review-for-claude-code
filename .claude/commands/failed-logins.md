# Review repeated failed sign-ins

Read CLAUDE.md and docs/cli.md. Confirm workspace and requested scope.

```bash
node scripts/logs.mjs failed-logins
```

This groups at least three failures per source and account in the last 24 hours. A group is a review hint, not proof of compromise.

Answer from the actual output. Include the evidence scope and the next review action. Never send, publish, disable accounts or change external systems.
