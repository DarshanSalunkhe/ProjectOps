import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';
import {root} from './environment.mjs';
dotenv.config({path:path.join(root,'.env.local')});
const stateFile=path.join(root,'.audit/state.json');
const previous=fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile,'utf8')) : null;
const schema='projectops_audit_'+Date.now();
const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
try {
 await client.connect();
 const before=await client.query("SELECT COUNT(*)::int AS count, md5(COALESCE(string_agg(row_to_json(p)::text, '|' ORDER BY id),'')) AS fingerprint FROM public.projects p");
 await client.query(`CREATE SCHEMA "${schema}"`);
 await client.query(`SET search_path TO "${schema}"`);
 fs.mkdirSync(path.join(root,'.audit'),{recursive:true});
 fs.writeFileSync(stateFile,JSON.stringify({schema,createdAt:new Date().toISOString(),publicProjects:before.rows[0],previousSchemas:[...(previous?.previousSchemas||[]),...(previous?.schema?[previous.schema]:[])]},null,2));
 const dir=path.join(root,'database/migrations');
 for(const name of fs.readdirSync(dir).filter(x=>x.endsWith('.sql')).sort()) {
   await client.query(fs.readFileSync(path.join(dir,name),'utf8'));
   console.log('Migrated '+name);
 }
 console.log('Isolated schema ready: '+schema);
} catch(e){ console.error('Audit setup failed: '+(e.code||e.message));process.exitCode=1; } finally {await client.end();}
