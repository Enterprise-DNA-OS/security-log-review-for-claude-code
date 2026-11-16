# Logging policy and evidence checks

Sources checked 16 November 2026. These are stored-record checks and review aids. They do not certify compliance, verify live collectors, detect every intrusion, or determine a legal retention period.

The Australian Cyber Security Centre's [event logging guidance](https://www.cyber.gov.au/publication/small-business-cyber-security-handbook/event-logging) recommends a logging policy, useful event details, regular review, centralisation and protection of logs. Its [detailed guidance](https://www.cyber.gov.au/publication/best-practices-for-event-logging-and-threat-detection) discusses logging quality and retention. These are guidance, not a universal statutory deadline.

New Zealand [Privacy Act principle 5](https://www.privacy.org.nz/privacy-principles/5/) requires reasonable safeguards for personal information. [Principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits retention to the lawful purpose. Operators confirm applicable rules, investigations, holds and organisational policy. No fixed retention duration in this software is presented as law.

| Finding | Stored-record test | Basis |
|---|---|---|
| POLICY | Gap hours, retention days or policy basis missing | Logging policy guidance; business sets actual values |
| REVIEW | Review date missing or past | Internal policy review control |
| SECURITY | No reference for access and backup review | Prompt to inspect safeguards under principle 5; a reference is not proof they work |
| FIELDS | Actor, action or outcome missing | Useful event details in logging guidance |
| FUTURE | Event timestamp ahead of review clock | Internal clock/data-quality check |
| RETENTION-REVIEW | Event older than recorded source retention period | Purpose review under principle 9 and recorded business policy; assess holds before deletion |

Coverage, owner, overdue-case and no-evidence findings are internal workflow checks. A stale imported timestamp can mean an export is missing. It does not prove a live source is offline. Failure grouping and selected administrative codes are analyst review hints, not attack determinations. Confirm their meaning against your source configuration.

The demo uses fictional policies: 12 or 24 hours for coverage checks and 90 or 180 days for retention. They are not recommendations or legal thresholds. The tool never deletes old records or initiates an incident response. A qualified operator owns investigation decisions and any notifications outside this tool.

A private owner-only database, append-only evidence triggers and ignored output folders support local handling. They do not provide authenticated user identities, immutable storage against a database owner, backup certification or a public access layer. Review storage, backups, encryption, agent data-sharing and access before putting business logs here.
