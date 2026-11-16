#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv, pick } from './lib/csv.mjs';
import { table } from './lib/format.mjs';
import { page, table as htmlTable, record, writeOut } from './lib/render.mjs';

export const questions = [
 'Which registered sources have no imported events?',
 'Which source owners have stale imported coverage?',
 'Which sources have no agreed retention period?',
 'Which imported events lack an actor, action or outcome?',
 'Which accounts have at least three failed sign-ins on one source in the last day?',
 'Which accounts have both failed and successful sign-ins on one source in the last day?',
 'Which high-severity events have no investigation link?',
 'Which open investigations are overdue?',
 'Which events are linked to more than one investigation?',
 'Which sources have events beyond their recorded retention period?'
];
const queries = [
 "select name,owner from coverage where event_count=0 order by name",
 "select name,owner,latest_event from coverage where coverage_status='imported coverage stale' order by name",
 'select name,owner from sources where retention_days is null order by name',
 "select id,source,occurred_at,actor,action,outcome from event_register where trim(actor)='' or trim(action)='' or trim(outcome)='' order by occurred_at",
 "select source,actor,count(*)::int as failures from event_register where lower(outcome) in ('failure','failed','audit failure') and (lower(action) like '%logon%' or lower(action) like '%login%' or event_code='4625') and occurred_at between now()-interval '24 hours' and now() group by source,actor having count(*)>=3 order by failures desc,source,actor",
 "select source,actor,count(*) filter(where lower(outcome) in ('failure','failed','audit failure'))::int as failures,count(*) filter(where lower(outcome) in ('success','successful','audit success'))::int as successes from event_register where occurred_at between now()-interval '24 hours' and now() and (lower(action) like '%logon%' or lower(action) like '%login%' or event_code in ('4624','4625')) group by source,actor having count(*) filter(where lower(outcome) in ('failure','failed','audit failure'))>0 and count(*) filter(where lower(outcome) in ('success','successful','audit success'))>0 order by source,actor",
 "select e.id,e.source,e.occurred_at,e.severity,e.message from event_register e where lower(e.severity) in ('critical','high','error','emergency','alert') and not exists(select 1 from case_events l where l.event_id=e.id) order by occurred_at",
 "select code,title,owner,due_on from cases where status='open' and due_on<current_date order by due_on,code",
 'select e.id,e.source,count(l.id)::int as investigations from event_register e join case_events l on l.event_id=e.id group by e.id,e.source having count(l.id)>1 order by e.source,e.id',
 "select s.name,s.retention_days,count(e.id)::int as review_count from sources s join events e on e.source_id=s.id where e.occurred_at<now()-s.retention_days*interval '1 day' group by s.name,s.retention_days order by s.name"
];
export const commands=['init','sources','add-source','set-policy','events','attention','coverage','failed-logins','privileged-changes','cases','show-case','open-case','link-event','log-note','close-case','history','compliance','insights','draft-case','import','export'];
const readQueries={
 sources:'select id,name,owner,gap_hours,retention_days,review_due from sources order by name',
 events:'select * from event_register order by occurred_at,id',
 attention:'select * from attention order by kind,item,issue',
 coverage:'select name,owner,event_count,latest_event,coverage_status from coverage order by name',
 'failed-logins':queries[4],
 'privileged-changes':"select id,source,occurred_at,actor,event_code,message from event_register where event_code in ('4728','4732','4756','4672') or lower(action) like '%privileg%' or lower(action) like '%group membership%' order by occurred_at,id",
 cases:'select * from case_register order by due_on,code',
 history:'select * from history order by created_at,id',
 compliance:'select * from compliance_findings order by kind,item,rule,id'
};
export function parseArgs(argv){
 const flags={};const args=[];
 for(const a of argv){if(a.startsWith('--')){const i=a.indexOf('=');const k=i<0?a.slice(2):a.slice(2,i);if(k in flags)throw Error(`Repeated flag --${k}`);flags[k]=i<0?true:a.slice(i+1);}else args.push(a);}
 return {args,flags};
}
function required(f,k){if(typeof f[k]!=='string'||!f[k].trim())throw Error(`--${k}=value is required`);return f[k].trim();}
function intValue(v,label){if(!/^\d+$/.test(String(v)))throw Error(`${label} must be a positive integer`);const n=Number(v);if(!Number.isSafeInteger(n)||n<1)throw Error(`${label} must be a positive integer`);return n;}
function dateValue(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v))||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Invalid date: ${v}; use YYYY-MM-DD`);return v;}
export function timestamp(value, flags={}){
 let s=String(value).trim();
 if(/^\d{2}\/\d{2}\/\d{4}/.test(s)){
  if(!['DMY','MDY'].includes(flags['date-order']))throw Error('Slash dates require --date-order=DMY or MDY');
  s=s.replace(/^(\d{2})\/(\d{2})\/(\d{4})/,(_,a,b,y)=>`${y}-${flags['date-order']==='DMY'?b:a}-${flags['date-order']==='DMY'?a:b}`);
 }
 s=s.replace(' ','T');
 if(!/(Z|[+-]\d{2}:\d{2})$/i.test(s)){
  if(!/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(String(flags.offset||'')))throw Error('Timestamp needs an explicit timezone or --offset=+12:00 (confirm daylight saving for this export)');
  s+=flags.offset;
 }
 if(!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/i.test(s))throw Error(`Invalid timestamp: ${value}`);
 dateValue(s.slice(0,10));const d=new Date(s);if(!Number.isFinite(d.getTime()))throw Error(`Invalid timestamp: ${value}`);return d.toISOString();
}
const aliases={source:['Log Source','Device Name','Device','Host Name','HOSTNAME','Source'],time:['Date/Time','Time Generated','TimeGenerated','Date','Time','Timestamp'],actor:['User Name','Username','User','Actor'],action:['Action','Task Category','Category'],outcome:['Outcome','Result','Event Type'],event_code:['Event ID','EventID','Event Code'],severity:['Severity','Level'],message:['Message','Log Message','Description'],native_id:['Record Number','Event Record ID','Record ID']};
const sha=s=>createHash('sha256').update(s).digest('hex');
function canonical(obj){return JSON.stringify(Object.fromEntries(Object.entries(obj).sort(([a],[b])=>a.localeCompare(b))));}
async function resolve(db,tableName,q){
 if(!q)throw Error('A record name, code or id is required');
 const col=tableName==='sources'?'name':tableName==='cases'?'code':null;
 const rows=await db.query(`select * from ${tableName} where id::text like $1 ${col?`or lower(${col})=lower($2)`:''} order by id`,col?[q+'%',q]:[q+'%']);
 if(rows.length!==1)throw Error(`${rows.length?'Ambiguous':'No matching'} ${tableName}: ${q}\n${rows.map(r=>`${r.id} ${r.name||r.code||r.message}`).join('\n')}`);
 return rows[0];
}
async function audit(db,type,id,by,action,detail){await db.query('insert into history(record_type,record_id,actor,action,detail) values($1,$2,$3,$4,$5)',[type,id,by,action,detail]);}
async function caseData(db,ref){const c=await resolve(db,'cases',ref);return {case:c,events:await db.query('select e.*,l.rationale from event_register e join case_events l on l.event_id=e.id where l.case_id=$1 order by e.occurred_at,e.id',[c.id]),history:await db.query("select actor,action,detail,created_at from history where record_type='case' and record_id=$1 order by created_at,id",[c.id])};}
const allowed={init:['name'], 'add-source':['name','owner'], 'set-policy':['owner','gap-hours','retention-days','basis','review-due','security-ref'],events:['source','actor','since','until'], 'open-case':['code','title','owner','due'], 'link-event':['reason'], 'log-note':['text'], 'close-case':['disposition'], import:['map','offset','date-order','dry-run'],insights:['question']};
const expected={init:0,sources:0,'add-source':0,'set-policy':1,events:0,attention:0,coverage:0,'failed-logins':0,'privileged-changes':0,cases:0,'show-case':1,'open-case':0,'link-event':2,'log-note':1,'close-case':1,history:0,compliance:0,insights:0,'draft-case':1,import:2,export:0};
export async function run(db,argv){
 const {args,flags:f}=parseArgs(argv);const cmd=args.shift();
 if(!commands.includes(cmd))throw Error(`Command required: ${commands.join(', ')}`);
 for(const k of Object.keys(f))if(!['json','by',...(allowed[cmd]||[])].includes(k))throw Error(`Unknown --${k} for ${cmd}`);
 if(args.length!==expected[cmd])throw Error(`${cmd} expects ${expected[cmd]} positional arguments; see docs/cli.md`);
 if('json' in f&&f.json!==true)throw Error('--json does not take a value');
 if('dry-run' in f&&f['dry-run']!==true)throw Error('--dry-run does not take a value');
 const ws=(await db.query('select * from workspace'))[0];
 if(!ws&&cmd!=='init')throw Error('Initialise with init --name="Your business" --by="Your name"');
 if(readQueries[cmd]){
  if(cmd!=='events')return await db.query(readQueries[cmd]);
  const where=[];const params=[];const filter=(sql,val)=>{params.push(val);where.push(sql.replace('?',`$${params.length}`));};
  if(f.source)filter('source_id=?',(await resolve(db,'sources',required(f,'source'))).id);
  if(f.actor)filter('lower(actor)=lower(?)',required(f,'actor'));
  if(f.since)filter('occurred_at>=?',timestamp(required(f,'since')));
  if(f.until)filter('occurred_at<=?',timestamp(required(f,'until')));
  return await db.query(`select id,occurred_at,actor,action,outcome,event_code,severity,message from events ${where.length?'where '+where.join(' and '):''} order by occurred_at,id`,params);
 }
 if(cmd==='insights'){
  const n=f.question?intValue(f.question,'question'):null;
  if(n&&n>10)throw Error('question must be 1 to 10');
  const out=[];for(let i=0;i<questions.length;i++)if(!n||i===n-1)out.push({question:questions[i],rows:await db.query(queries[i])});return out;
 }
 if(cmd==='show-case')return caseData(db,args[0]);
 if(cmd==='export'){
  const data={format:'security-log-review/v1',exported_at:new Date().toISOString(),workspace:ws};
  for(const name of ['sources','events','import_batches','cases','case_events','history'])data[name]=await db.query(`select * from ${name} order by id`);
  const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'exports');fs.mkdirSync(dir,{recursive:true,mode:0o700});
  const file=path.join(dir,`archive-${Date.now()}-${randomUUID()}.json`);fs.writeFileSync(file,JSON.stringify(data,null,2),{mode:0o600,flag:'wx'});return {file,events:data.events.length};
 }
 if(cmd==='draft-case'){
  const d=await caseData(db,args[0]);
  const file=writeOut('drafts',`case-${d.case.id}-${Date.now()}`,page({title:'Investigation handover draft',subtitle:'Imported evidence only. Analyst review required. Nothing sent.',sections:[{title:'Case',html:record(d.case)},{title:'Selected evidence',html:htmlTable(d.events)},{title:'Review history',html:htmlTable(d.history)}]}));return {file};
 }
 const by=required(f,'by');
 await db.exec('BEGIN');
 try {
  let result;
  if(cmd==='init'){
   if(ws)throw Error('Workspace already initialised');
   await db.query('insert into workspace(id,name) values(true,$1)',[required(f,'name')]);result={name:f.name};
  }else if(cmd==='add-source'){
   const s=(await db.query('insert into sources(name,owner) values($1,$2) returning *',[required(f,'name'),required(f,'owner')]))[0];
   await audit(db,'source',s.id,by,cmd,'Registered source; policy still needs confirmation');result=s;
  }else if(cmd==='set-policy'){
   const s=await resolve(db,'sources',args[0]);
   result=(await db.query('update sources set owner=$2,gap_hours=$3,retention_days=$4,policy_basis=$5,review_due=$6,security_review_ref=$7 where id=$1 returning *',[s.id,required(f,'owner'),intValue(required(f,'gap-hours'),'gap-hours'),intValue(required(f,'retention-days'),'retention-days'),required(f,'basis'),dateValue(required(f,'review-due')),required(f,'security-ref')]))[0];
   await audit(db,'source',s.id,by,cmd,JSON.stringify({before:s,after:result}));
  }else if(cmd==='open-case'){
   result=(await db.query('insert into cases(code,title,owner,due_on) values($1,$2,$3,$4) returning *',[required(f,'code'),required(f,'title'),required(f,'owner'),dateValue(required(f,'due'))]))[0];
   await audit(db,'case',result.id,by,cmd,result.title);
  }else if(['link-event','log-note','close-case'].includes(cmd)){
   const c=await resolve(db,'cases',args[0]);await db.query('select id from cases where id=$1 for update',[c.id]);
   const fresh=(await db.query('select * from cases where id=$1',[c.id]))[0];
   if(fresh.status==='closed')throw Error('Closed case cannot be changed');
   if(cmd==='link-event'){
    const e=await resolve(db,'events',args[1]);const reason=required(f,'reason');
    await db.query('insert into case_events(case_id,event_id,rationale) values($1,$2,$3)',[c.id,e.id,reason]);
    await audit(db,'case',c.id,by,cmd,`${e.id}: ${reason}`);
   }else if(cmd==='log-note')await audit(db,'case',c.id,by,cmd,required(f,'text'));
   else {
    if(!(await db.query('select id from case_events where case_id=$1',[c.id])).length)throw Error('Link evidence before closing a case');
    const disposition=required(f,'disposition');
    await db.query("update cases set status='closed',disposition=$2,closed_at=now() where id=$1",[c.id,disposition]);
    await audit(db,'case',c.id,by,cmd,disposition);
   }
   await db.query('update cases set updated_at=now() where id=$1',[c.id]);result=await caseData(db,c.id);
  }else if(cmd==='import'){
   if(args[0]!=='eventlog')throw Error('Import source must be eventlog');
   const bytes=fs.readFileSync(path.resolve(args[1]));const rows=parseCsv(bytes.toString('utf8'));
   if(!rows.length)throw Error('CSV has no records');
   const map=f.map?JSON.parse(fs.readFileSync(required(f,'map'),'utf8')):{};
   if(!map||typeof map!=='object'||Array.isArray(map))throw Error('Mapping must be an object');
   for(const [k,v] of Object.entries(map))if(!(k in aliases)||typeof v!=='string'||!Object.keys(rows[0]).includes(v))throw Error(`Invalid mapping ${k}: ${v}`);
   const batchId=randomUUID();let added=0;
   // Validation and all writes are inside one transaction. Failed rows roll back the entire file.
   for(let i=0;i<rows.length;i++){
    const raw=rows[i];const val=k=>pick(raw,...(map[k]?[map[k]]:aliases[k])).trim();
    const source=val('source');if(!source)throw Error(`Row ${i+2}: no source; select or map its exported column`);
    let time;try{time=timestamp(val('time'),f);}catch(e){throw Error(`Row ${i+2}: ${e.message}`);}
    await db.query('insert into sources(name) values($1) on conflict(lower(name)) do nothing',[source]);
    const s=(await db.query('select * from sources where lower(name)=lower($1)',[source]))[0];
    const record={time,actor:val('actor'),action:val('action'),outcome:val('outcome'),event_code:val('event_code'),severity:val('severity'),message:val('message')};
    const fingerprint=sha(source.toLowerCase()+'|'+(val('native_id')?'id:'+val('native_id'):'data:'+canonical(record)));
    const previous=(await db.query('select * from events where fingerprint=$1',[fingerprint]))[0];
    if(previous){
     const old={time:new Date(previous.occurred_at).toISOString(),actor:previous.actor,action:previous.action,outcome:previous.outcome,event_code:previous.event_code,severity:previous.severity,message:previous.message};
     if(canonical(old)!==canonical(record))throw Error(`Row ${i+2}: source record identity conflicts with existing evidence`);
     continue;
    }
    await db.query('insert into events(fingerprint,source_id,batch_id,occurred_at,actor,action,outcome,event_code,severity,message,raw_record) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[fingerprint,s.id,batchId,time,record.actor,record.action,record.outcome,record.event_code,record.severity,record.message,JSON.stringify(raw)]);added++;
   }
   await db.query('insert into import_batches(id,file_sha256,file_name,imported_by,row_count,added_count,mapping) values($1,$2,$3,$4,$5,$6,$7)',[batchId,sha(bytes),path.basename(args[1]),by,rows.length,added,JSON.stringify({columns:map,offset:f.offset||null,date_order:f['date-order']||null})]);
   await audit(db,'import',batchId,by,cmd,JSON.stringify({rows:rows.length,added,duplicates:rows.length-added}));
   result={rows:rows.length,added,duplicates:rows.length-added,dry_run:!!f['dry-run'],batch_id:batchId};
  }
  await db.exec(f['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
export function present(v){
 if(Array.isArray(v)){
  if(!v.length)return '(none)';
  if(v[0]?.question)return v.map(x=>`${x.question}\n${present(x.rows)}`).join('\n\n');
  const rows=v.map(r=>Object.fromEntries(Object.entries(r).map(([k,val])=>[k,val instanceof Date?val.toISOString():typeof val==='object'&&val!==null?JSON.stringify(val):val])));
  return table(rows,Object.keys(rows[0]).map(key=>({key,label:key.replaceAll('_',' '),width:key==='message'||key==='detail'?65:40})));
 }
 if(v?.case)return `Case\n${present([v.case])}\n\nEvidence\n${present(v.events)}\n\nHistory\n${present(v.history)}`;
 return present([v]);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const out=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(out,null,2):present(out));}
 catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
