# Command reference

All operations use `node scripts/logs.mjs <command>`. Reads print human tables by default; add `--json` for structured output. Flags use `--key=value`. Mutations require `--by="Operator name"`. This is a recorded label, not authentication. Unknown flags and extra arguments fail.

| Operation | Arguments | Result |
|---|---|---|
| init | --name="Business" --by="Name" | Initialise an empty business workspace |
| sources | none | Registered sources and policies |
| add-source | --name=HOST --owner="Name" --by="Name" | Register an expected source even before its first export |
| set-policy | HOST --owner="Name" --gap-hours=24 --retention-days=180 --basis="Approved policy reference" --review-due=2027-01-31 --security-ref="Access and backup review reference" --by="Name" | Record agreed source policy and history |
| events | [--source=HOST] [--actor="Account"] [--since=2026-11-01T00:00:00Z] [--until=2026-11-30T23:59:59Z] | Imported events, inclusive time limits |
| attention | none | Coverage, ownership and investigation gaps |
| coverage | none | Latest imported evidence per registered source |
| failed-logins | none | At least three failed sign-ins per source/account in the last 24 hours |
| privileged-changes | none | Selected administrative event codes or action text |
| cases | none | Investigation diary |
| show-case | CODE-or-id | Case, selected events and history |
| open-case | --code=LOG-301 --title="Review" --owner="Name" --due=2027-01-31 --by="Name" | Open a review case |
| link-event | CODE EVENT-ID --reason="Why selected" --by="Name" | Add immutable evidence link |
| log-note | CODE --text="Observed facts and source" --by="Name" | Append an investigation note |
| close-case | CODE --disposition="Analyst conclusion with basis" --by="Name" | Close with linked evidence; no external response |
| history | none | Operator actions and import counts |
| compliance | none | Policy and stored-record findings |
| insights | [--question=1] | Ten questions, or one numbered question |
| draft-case | CODE | Private branded handover draft |
| import | eventlog FILE [--map=FILE] [--offset=+13:00] [--date-order=DMY] [--dry-run] --by="Name" | Atomic CSV import; see switching guide |
| export | none | Full JSON archive under exports/ |

Sources resolve by a case-insensitive exact name or UUID prefix. Cases resolve by case-insensitive exact code or UUID prefix. Events resolve by UUID prefix. Ambiguous matches list candidate ids and exit 1; nothing changes. Empty matches also exit 1. The CLI does not silently choose a record.

Use YYYY-MM-DD for policy and due dates. Event timestamps require seconds and a timezone. Time filters use explicit ISO timestamps. --offset and --date-order apply only to imports. All review windows use UTC. Daylight-saving changes require separate exports with the correct offset or explicit offsets on each row.

Read results are not paginated; narrow events with the filters for large imports. This base has no high-volume ingestion benchmark. Keep very large originals in approved archival storage and import a reviewed scope. Do not put private data into examples/ or git.
