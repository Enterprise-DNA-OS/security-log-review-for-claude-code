import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT } from './lib/db.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'log-review-demo-'));
const env={...process.env,DATABASE_URL:'',DATA_DIR:path.join(dir,'db'),OUTPUT_DIR:dir};
function call(script,args=[]){const r=spawnSync(process.execPath,[path.join(REPO_ROOT,'scripts',script),...args],{cwd:REPO_ROOT,env,encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.stdout);return r.stdout.trimEnd();}
try{
 call('migrate.mjs');call('seed.mjs');
 const screens=[];
 for(const [command,title,ask] of [['coverage','Imported coverage','Which sources need a fresh log export?'],['failed-logins','Repeated failed sign-ins','Which accounts have repeated failed sign-ins?'],['cases','Investigation diary','Which investigations need attention?']]){
  const output=call('logs.mjs',[command]);screens.push({title,ask,command:`node scripts/logs.mjs ${command}`,output});console.log(`\n${title}\n${output}`);
 }
 console.log(call('view.mjs'));console.log(call('docs.mjs'));
 fs.writeFileSync(path.join(dir,'screens.json'),JSON.stringify(screens,null,2));
 console.log(`Demo PASS${process.argv.includes('--keep')?'; artifacts: '+dir:''}`);
}finally{if(!process.argv.includes('--keep'))fs.rmSync(dir,{recursive:true,force:true});}
