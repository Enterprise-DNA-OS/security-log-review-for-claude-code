# Security Log Review for Claude Code

Own the source register, log review and investigation evidence. Imported security events in a database, worked through Claude Code, Codex, OpenCode or Cursor. MIT licensed. Built for the daily review desk around your existing log collectors.

## Three ways to use it

- **Do it yourself:** install the free version, import selected EventLog Analyzer CSV exports and work from your own database. Hosting and your coding-agent subscription remain your costs.
- **We customise it:** Enterprise DNA maps your records, writes your source policies and review steps, and builds a web front end or different stack if you need one.
- **We run it for you:** Omni by Enterprise DNA installs, connects and operates your version. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=manageengine-eventlog-analyzer&utm_medium=readme).

## Start with fictional records

```bash
npm install
npm test
npm run demo
```

The demo uses a temporary database and removes it afterwards. `npm run demo -- --keep` keeps the private HTML and three actual command captures in the printed temporary folder. `npm run migrate` followed by `npm run seed` creates a persistent demo. Seeding refuses an existing business workspace.

## Start a business workspace

```bash
npm run migrate
node scripts/logs.mjs init --name="Your business" --by="Your name"
node scripts/logs.mjs import eventlog imports/search.csv --by="Your name" --dry-run
node scripts/logs.mjs import eventlog imports/search.csv --by="Your name"
```

Use a fresh DATA_DIR for business records. Read [the switching guide](docs/replace-manageengine-eventlog-analyzer.md) first: exports have selectable columns, timestamps need a timezone, and counts need reconciliation. The supplied example is fictional, not a captured vendor export.

DATABASE_URL selects private Postgres. Otherwise DATA_DIR selects embedded PGlite, defaulting to .data/db. OUTPUT_DIR chooses the folder for reports, drafts and archives. This is one business per database and one trusted operator at a time. Actor labels are not authenticated identities. Do not expose the owner connection to a browser.

## The weekly rituals

Use /coverage to see where imported evidence stops, /failed-logins for repeated sign-ins, /privileged-changes for selected administrative events, /cases for the investigation diary and /weekly-review for the handover. /compliance checks recorded source policies and evidence fields against the cited guidance. Every finding needs an analyst's interpretation.

There are **21 CLI operations and 26 slash recipes**. [Command syntax](docs/cli.md). Imported events, import batches, case links and history are append-only through database triggers. Imports are atomic, repeated evidence is deduplicated, and conflicting source record identities fail. A case cannot close without linked evidence and a written disposition. Closing a case records an analyst's conclusion; it never disables an account or performs an external response.

## Paperwork and views

Set brand.json to your business name, logo and colours. `npm run docs` produces an investigation evidence pack per case and a logging-policy review per source. `npm run view` produces the weekly coverage view, privileged activity view and stored-record checks. /draft-case writes a private handover draft. All text is escaped and outputs stay in ignored folders. [Why there is no front end](docs/why-no-front-end.md).

## Ten questions answered from your records

/insights answers all ten today. These are included joins, not a claim that EventLog Analyzer cannot be configured to answer them.

1. Which registered sources have no imported events?
2. Which source owners have stale imported coverage?
3. Which sources have no agreed retention period?
4. Which imported events lack an actor, action or outcome?
5. Which accounts have at least three failed sign-ins on one source in the last day?
6. Which accounts have both failed and successful sign-ins on one source in the last day?
7. Which high-severity events have no investigation link?
8. Which open investigations are overdue?
9. Which events are linked to more than one investigation?
10. Which sources have events beyond their recorded retention period?

## Your first hour: ten things to ask for

1. Show which registered sources have no imported evidence.
2. List repeated failed sign-ins in the last day.
3. Find administrative group changes for review.
4. Explain which coverage dates are stale.
5. Open an investigation with an owner and due date.
6. Link the exact events behind that investigation.
7. Record the system owner's explanation as a note.
8. Put our name on the investigation pack.
9. Add a read-only view grouped by source owner.
10. Add our business-unit field through /customise.

## Operational limits

This base reviews batch imports. It does not collect live logs, send alerts, prevent intrusions, prove an attack occurred, or certify compliance. Keep existing collection, alerting and response systems until their replacements are separately built and validated. The default administrative filter covers four Windows event codes and matching action text, not all privileged activity. Failure grouping is a review hint, not a detection guarantee. No screens are needed to run these review jobs.

An export can be incomplete, and no events can mean a missing export. Register every expected source separately. The latest imported timestamp is not a live collector heartbeat. Reconcile each export's count and time range before relying on a review. When no native record number is present, identical normalised records collapse on import; obtain record numbers if identical events must be distinguished.

Retention findings request a review; they never delete evidence. Database owners can bypass application controls, so protect access and keep tested backups and original exports in approved storage. JSON export is a readable archive, not an automated restore facility. [Compliance basis](docs/compliance.md), [research](docs/research.md) and [verification](docs/verification.md).
