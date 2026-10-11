import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import dotenv from 'dotenv';
import { root } from './environment.mjs';

dotenv.config({ path: path.join(root, '.env.local') });
const state = JSON.parse(fs.readFileSync(path.join(root, '.audit/state.json'), 'utf8'));
if (!/^projectops_audit_\d+$/.test(state.schema)) throw new Error('Unsafe audit schema name');
const url = new URL(process.env.DATABASE_URL);
url.hostname = url.hostname.replace('-pooler.', '.');
url.searchParams.set('options', `-c search_path=${state.schema}`);
const client = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 15000 });
const requiredTables = [
  'users', 'projects', 'tasks', 'task_assignments', 'task_dependencies', 'project_members',
  'project_invitations', 'auth_sessions', 'password_reset_tokens', 'user_skills',
  'task_required_skills', 'milestones', 'activity_log', 'recovery_proposals'
];
try {
  await client.connect();
  const schemaResult = await client.query('SELECT current_schema() AS schema');
  if (schemaResult.rows[0].schema !== state.schema) throw new Error('Connection search_path is not the recorded audit schema');
  const tablesResult = await client.query(
    'SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_type = $1',
    ['BASE TABLE']
  );
  const actualTables = new Set(tablesResult.rows.map((row) => row.table_name));
  const missingTables = requiredTables.filter((table) => !actualTables.has(table));
  if (missingTables.length) throw new Error(`Audit schema missing required migration tables: ${missingTables.join(', ')}`);
  const publicFingerprint = await client.query(
    "SELECT COUNT(*)::int AS count, md5(COALESCE(string_agg(row_to_json(p)::text, '|' ORDER BY id),'')) AS fingerprint FROM public.projects p"
  );
  const baseline = state.publicProjects;
  const productionUnchanged = Number(publicFingerprint.rows[0].count) === Number(baseline.count)
    && publicFingerprint.rows[0].fingerprint === baseline.fingerprint;
  console.log(JSON.stringify({
    connected: true,
    activeSchemaMatchesAuditState: schemaResult.rows[0].schema === state.schema,
    auditSchema: state.schema,
    requiredMigrationTablesPresent: missingTables.length === 0,
    productionProjectFingerprintUnchanged: productionUnchanged
  }));
  if (!productionUnchanged) throw new Error('Public projects differ from the audit setup baseline');
} catch (error) {
  console.error(`Isolation verification failed: ${error.code || error.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
