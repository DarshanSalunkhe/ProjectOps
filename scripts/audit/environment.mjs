import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';
export const root = path.resolve(import.meta.dirname,'../..');
export function auditEnvironment() {
 dotenv.config({path:path.join(root,'.env.local')});
 const state=JSON.parse(fs.readFileSync(path.join(root,'.audit/state.json'),'utf8'));
 if(!/^projectops_audit_\d+$/.test(state.schema)) throw new Error('Unsafe audit schema');
 const url=new URL(process.env.DATABASE_URL); url.hostname=url.hostname.replace('-pooler.', '.');
 url.searchParams.set('options',`-c search_path=${state.schema}`);
 process.env.DATABASE_URL=url.toString(); process.env.NODE_ENV='test';
 process.env.PORT='5000'; process.env.CORS_ORIGIN='http://127.0.0.1:5173'; process.env.FRONTEND_URL='http://127.0.0.1:5173';
 // Increase timeouts for long-running test operations (AI planner, bulk inserts)
 process.env.DB_STATEMENT_TIMEOUT='60000'; // 60 seconds for statements
 process.env.DB_CONNECTION_TIMEOUT='30000'; // 30 seconds for connections
 for(const key of ['SMTP_HOST','SMTP_USER','SMTP_PASS','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','OPENAI_API_KEY','GEMINI_API_KEY']) process.env[key]='';
 return state;
}
export async function auditClient() {
 const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000}); await client.connect();
 await client.query(`SET search_path TO "${JSON.parse(fs.readFileSync(path.join(root,'.audit/state.json'),'utf8')).schema}"`);
 const {rows}=await client.query('SELECT current_schema() AS schema');
 if(!/^projectops_audit_\d+$/.test(rows[0].schema)) {await client.end();throw new Error('Refusing non-audit database writes');}
 return client;
}

