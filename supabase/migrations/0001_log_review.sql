create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'Append-only evidence cannot be changed'; end $$;
create table workspace (id boolean primary key default true check(id), name text not null, demo boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table sources (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0), owner text not null default '',
 gap_hours integer check(gap_hours between 1 and 8760), retention_days integer check(retention_days between 1 and 36500),
 policy_basis text not null default '', review_due date, security_review_ref text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index sources_name on sources(lower(name));
create table import_batches(id uuid primary key default gen_random_uuid(), file_sha256 text not null, file_name text not null, imported_by text not null, row_count integer not null check(row_count>0), added_count integer not null check(added_count>=0 and added_count<=row_count), mapping jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table events (
 id uuid primary key default gen_random_uuid(), fingerprint text unique not null, source_id uuid not null references sources(id), batch_id uuid references import_batches(id) deferrable initially deferred,
 occurred_at timestamptz not null, actor text not null default '', action text not null default '', outcome text not null default '',
 event_code text not null default '', severity text not null default '', message text not null default '', raw_record jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index events_source_time on events(source_id,occurred_at);
create index events_actor on events(actor);
create table cases (
 id uuid primary key default gen_random_uuid(), code text unique not null, title text not null, owner text not null, due_on date not null,
 status text not null default 'open' check(status in ('open','closed')), disposition text not null default '', closed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((status='open' and closed_at is null) or (status='closed' and closed_at is not null and length(trim(disposition))>0))
);
create table case_events(id uuid primary key default gen_random_uuid(), case_id uuid not null references cases(id), event_id uuid not null references events(id), rationale text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(case_id,event_id));
create table history(id uuid primary key default gen_random_uuid(), record_type text not null, record_id uuid not null, actor text not null, action text not null, detail text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger source_touch before update on sources for each row execute function touch_updated_at();
create trigger case_touch before update on cases for each row execute function touch_updated_at();
create trigger workspace_touch before update on workspace for each row execute function touch_updated_at();
create trigger events_immutable before update or delete on events for each row execute function immutable_record();
create trigger history_immutable before update or delete on history for each row execute function immutable_record();
create trigger batch_immutable before update or delete on import_batches for each row execute function immutable_record();
create trigger links_immutable before update or delete on case_events for each row execute function immutable_record();
create view coverage as
 select s.id,s.name,s.owner,s.gap_hours,s.retention_days,s.review_due,s.policy_basis,s.security_review_ref,
 count(e.id)::int as event_count,max(e.occurred_at) as latest_event,
 case when count(e.id)=0 then 'no imported events' when s.gap_hours is null then 'no gap policy'
 when max(e.occurred_at)>now() then 'future timestamp' when max(e.occurred_at)<now()-s.gap_hours*interval '1 hour' then 'imported coverage stale' else 'within policy window' end as coverage_status
 from sources s left join events e on e.source_id=s.id group by s.id;
create view event_register as select e.id,s.name as source,e.occurred_at,e.actor,e.action,e.outcome,e.event_code,e.severity,e.message,e.batch_id from events e join sources s on s.id=e.source_id;
create view case_register as select c.id,c.code,c.title,c.owner,c.due_on,c.status,c.disposition,c.updated_at,count(ce.id)::int as linked_events from cases c left join case_events ce on ce.case_id=c.id group by c.id;
create view attention as
 select 'source'::text as kind,id,name as item,owner,'COVERAGE'::text as issue,coverage_status as detail from coverage where coverage_status<>'within policy window'
 union all select 'source',id,name,owner,'OWNER','No responsible owner recorded' from sources where trim(owner)=''
 union all select 'case',id,code,owner,'OVERDUE',due_on::text from cases where status='open' and due_on<current_date
 union all select 'case',id,code,owner,'NO-EVIDENCE','No linked events' from cases where status='open' and not exists(select 1 from case_events l where l.case_id=cases.id);
create view compliance_findings as
 select 'source'::text as kind,id,name as item,'POLICY'::text as rule,'Record gap, retention and policy basis'::text as finding from sources where gap_hours is null or retention_days is null or trim(policy_basis)=''
 union all select 'source',id,name,'REVIEW','Policy review is due or no review date is recorded' from sources where review_due is null or review_due<current_date
 union all select 'source',id,name,'SECURITY','No access and backup review reference' from sources where trim(security_review_ref)=''
 union all select 'event',e.id,s.name,'FIELDS','Actor, action or outcome is missing' from events e join sources s on s.id=e.source_id where trim(actor)='' or trim(action)='' or trim(outcome)=''
 union all select 'event',e.id,s.name,'FUTURE','Event timestamp is ahead of the review clock' from events e join sources s on s.id=e.source_id where occurred_at>now()
 union all select 'event',e.id,s.name,'RETENTION-REVIEW','Beyond the recorded retention period; assess purpose and holds before deletion' from events e join sources s on s.id=e.source_id where s.retention_days is not null and occurred_at<now()-s.retention_days*interval '1 day';
-- Trusted database owner only. Do not expose the owner connection to a browser.
alter table workspace enable row level security;
alter table sources enable row level security;
alter table events enable row level security;
alter table import_batches enable row level security;
alter table cases enable row level security;
alter table case_events enable row level security;
alter table history enable row level security;
revoke all on all tables in schema public from public;
