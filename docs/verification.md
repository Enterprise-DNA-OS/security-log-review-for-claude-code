# Verification evidence

Local Linux run on 16 November 2026: npm install completed with zero reported vulnerabilities; npm test passed 64 assertions across all 21 CLI operations. The test uses an isolated PGlite database and private temporary output. It covers business seed refusal, idempotent seed, complete import rollback, repeat imports, conflicting identity, custom mapping, timezones, invalid dates, ambiguous matching, immutable records, evidence-gated closure, closed-case rejection, archive contents, escaped HTML and real CLI exit codes.

npm run demo captures three real command runs and renders the three views plus investigation and source review documents. No screenshot or page output is invented. The GitHub workflow runs npm ci, npm test and npm run demo on Linux and Windows. GitHub Actions run 43969223905 passed on both ubuntu-latest and windows-latest, including npm test and npm run demo: https://github.com/Enterprise-DNA-OS/security-log-review-for-claude-code/actions/runs/43969223905.

The schema uses Postgres SQL and the shared pg/PGlite adapter. This run exercised PGlite, not an external Postgres server. No live business logs, collectors or customer export were used. Fixtures and demo policies are fictional. No high-volume, intrusion-detection or production access-control claim is made.

The generated coverage view and investigation pack were opened in headless Chromium at desktop and mobile sizes and inspected on 16 November 2026.
