# Bring across EventLog Analyzer review records

Checked 16 November 2026. This imports selected search/report rows for review. It is not a transfer of collection agents, alerting rules, compliance report definitions or all historical archives.

## Export and reconcile

1. In EventLog Analyzer, choose the search or report and its time range. Select the source, timestamp, user, action, outcome, event code, severity, message and native record number where available.
2. Use Export as and choose CSV, then download from export history. The vendor documents selectable report columns, so no single fixed header layout covers every export. Record the report's count and range. Check the vendor's advice on partial exports before assuming the file is complete.
3. Keep the original in approved private storage. Put a working copy in ignored imports/. Check its timezone, date order, count and source list. Missing actors or outcomes remain missing and are flagged; they are never invented from a message.
4. Import with one command after reviewing the dry run. Compare counts, earliest/latest times and duplicate count against the exported scope. Inspect sampled events and raw_record in the JSON archive.

```bash
node scripts/logs.mjs import eventlog imports/search.csv --by="Your name" --dry-run
node scripts/logs.mjs import eventlog imports/search.csv --by="Your name"
```

## Columns and time

| Field | Default recognised headers |
|---|---|
| source, required | Log Source, Device Name, Device, Host Name, HOSTNAME, Source |
| time, required | Date/Time, Time Generated, TimeGenerated, Date, Time, Timestamp |
| actor | User Name, Username, User, Actor |
| action | Action, Task Category, Category |
| outcome | Outcome, Result, Event Type |
| event_code | Event ID, EventID, Event Code |
| severity | Severity, Level |
| message | Message, Log Message, Description |
| native_id | Record Number, Event Record ID, Record ID |

Headers match case-insensitively. These are supported aliases, not a promise that every vendor build exports these exact names. For other selected columns, provide a mapping object from the field in the first column to the exact CSV header. examples/column-map.json illustrates a custom layout. It is fictional, as is examples/eventlog-search.csv.

```bash
node scripts/logs.mjs import eventlog imports/search.csv --map=imports/columns.json --date-order=DMY --offset=+13:00 --by="Your name"
```

An ISO timestamp with Z or an offset needs no time flag. A timezone-less `2026-11-16 14:30:00` requires --offset. Slash dates require --date-order=DMY or MDY. Unsupported or invalid dates fail the entire file. Confirm daylight saving; do not use one offset for exports crossing a clock change. Other date layouts require a reviewed normalisation before import.

## Identity and evidence

Each source is matched by name, ignoring case. Native record numbers are scoped to that source and must be unique across the exported scope. If a vendor record number repeats across channels, include the channel in the source name through a reviewed export preparation. A reused identity with changed normalised evidence fails the whole import. Without a native number, the importer hashes the source and normalised event fields; identical rows collapse even if they represented separate occurrences. Choose exports with native numbers when that distinction matters.

New source names start without owner or policy and appear in the review checks. Raw CSV fields and the file SHA-256 are retained. Duplicate batches are logged with their counts; repeated evidence is not inserted again. A failed row rolls back the whole file. A dry run validates and reports counts without leaving sources, events or history behind.

## What carries and what needs separate work

Event field values, raw rows, source names and the imported time range carry over. Your investigator assigns owners, policies, cases and notes in this system. Dashboards and alerts are rebuilt around your workflow, rather than copied from proprietary definitions. Binary event files, compressed archives, attachments, credentials, collection agents, response automations and existing case histories are outside this CSV adapter.

Run the review desk alongside your current system and reconcile results. Keep collection, alerting and response protection until separately delivered and validated. Enterprise DNA scopes those connections and the migration as part of your custom version.

Sources: [exporting searches](https://www.manageengine.com/products/eventlog/help/StandaloneManagedServer-UserGuide/SearchLogs/how-to-search.html), [report columns and CSV export](https://www.manageengine.com/products/eventlog/help/StandaloneManagedServer-UserGuide/EventLogAnalyzerReports/report-export-and-customization.html), [partial export troubleshooting](https://pitstop.manageengine.com/portal/en/kb/articles/how-to-troubleshoot-incomplete-or-partial-data-exports-in-eventlog-analyzer). The report-columns page labels itself for builds below 13.0.0; confirm the current product's labels and limits when exporting. No customer export was available for this build.
