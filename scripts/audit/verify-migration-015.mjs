import {auditEnvironment, auditClient} from './environment.mjs';

try {
  auditEnvironment();
  const client = await auditClient();
  
  const {rows: schemaCheck} = await client.query('SELECT current_schema() AS schema');
  console.log('Current schema:', schemaCheck[0].schema);
  
  const {rows: tableCheck} = await client.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables 
     WHERE table_schema = current_schema() AND table_name = 'recovery_proposals') AS exists`
  );
  
  if (!tableCheck[0].exists) {
    console.log('❌ recovery_proposals table does NOT exist');
    process.exit(1);
  }
  
  const {rows: columns} = await client.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = current_schema() AND table_name = 'recovery_proposals' 
     ORDER BY ordinal_position`
  );
  
  const columnNames = columns.map(r => r.column_name);
  console.log('✓ recovery_proposals table exists');
  console.log('Columns:', columnNames.join(', '));
  
  const migration015Columns = ['snapshot_hash', 'status', 'reviewed_by', 'reviewed_at', 'applied_by', 'applied_at'];
  const hasMigration015 = migration015Columns.every(col => columnNames.includes(col));
  
  if (hasMigration015) {
    console.log('✓ Migration 015 columns confirmed');
  } else {
    console.log('❌ Migration 015 columns missing:', 
      migration015Columns.filter(col => !columnNames.includes(col)));
  }
  
  await client.end();
  process.exit(hasMigration015 ? 0 : 1);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
