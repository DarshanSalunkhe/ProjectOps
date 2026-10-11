import fs from 'node:fs';
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config({path:'.env.local'});
const state=JSON.parse(fs.readFileSync('.audit/state.json','utf8'));
const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
try {
 await client.connect();
 const {rows}=await client.query("SELECT COUNT(*)::int AS count, md5(COALESCE(string_agg(row_to_json(p)::text, '|' ORDER BY id),'')) AS fingerprint FROM public.projects p");
 const unchanged=JSON.stringify(rows[0])===JSON.stringify(state.publicProjects);
 console.log(JSON.stringify({publicProjectsUnchanged:unchanged,count:rows[0].count}));
 if(!unchanged)process.exitCode=1;
} finally {await client.end();}
