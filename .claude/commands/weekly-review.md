---
description: "Weekly security-log review"
---

# Weekly security-log review

Read CLAUDE.md and docs/compliance.md. Run these three live reads against the confirmed workspace:

```bash
node scripts/logs.mjs coverage --json
node scripts/logs.mjs attention --json
node scripts/logs.mjs cases --json
```

Write drafts/weekly-review-YYYY-MM-DD.md with the imported time range by source, coverage gaps, overdue cases, owners and the next review action. Include that this is imported evidence, not live collector health. Do not infer a clean security posture from no findings. Show the draft in chat. Never send it.
