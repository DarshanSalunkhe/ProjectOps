import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config({path:'.env.local'});
const client = new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:12000});
const classifyError = (error) => {
 if (error.code) return error.code;
 const message=String(error.message||'').toLowerCase();
 if (message.includes('timeout') || message.includes('timed out')) return 'TIMEOUT';
 if (message.includes('enotfound') || message.includes('getaddrinfo')) return 'DNS_FAILURE';
 if (message.includes('authentication') || message.includes('password')) return 'AUTHENTICATION_FAILURE';
 if (message.includes('does not exist')) return 'DATABASE_OR_SCHEMA_NOT_FOUND';
 return 'CONNECTION_FAILED';
};
try { await client.connect(); const result=await client.query('SELECT current_database() IS NOT NULL AS connected, has_database_privilege(current_database(), \'CREATE\') AS can_create_schema'); console.log(JSON.stringify(result.rows[0])); } catch(e) { console.log(JSON.stringify({connected:false,code:classifyError(e)})); process.exitCode=1; } finally { await client.end(); }
