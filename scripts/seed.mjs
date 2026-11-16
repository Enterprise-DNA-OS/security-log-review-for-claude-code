import fs from 'node:fs';
import path from 'node:path';
import { getDb, REPO_ROOT } from './lib/db.mjs';
const db=await getDb();
try {
 await db.exec('BEGIN');
 const rows=await db.query('select * from workspace');
 if(rows.some(r=>!r.demo)) throw Error('Refusing to seed a business workspace');
 await db.exec(fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8'));
 await db.exec('COMMIT');console.log('Seed PASS: fictional records, idempotent');
} catch(e){await db.exec('ROLLBACK');console.error(e.message);process.exitCode=1;} finally{await db.close();}
