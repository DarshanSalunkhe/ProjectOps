import pool from '../config/database.js';

export const githubActivityRepository = {
 async connection(projectId) {return (await pool.query('SELECT * FROM github_connections WHERE project_id=$1',[projectId])).rows[0];},
 async enqueue(deliveryId,event,payload) {
  const repo=payload.repository;
  const {rows:[connection]}=await pool.query(`SELECT c.* FROM github_connections c JOIN projects p ON p.id=c.project_id
   WHERE c.repository_id=$1 AND lower(c.full_name)=lower($2) AND c.enabled AND
   lower(rtrim(p.github_repo_url,'/')) IN (lower('https://github.com/'||c.full_name),lower('https://github.com/'||c.full_name||'.git'))`,[repo.id,repo.full_name]);
  if(!connection)return null;
  const {rows}=await pool.query(`INSERT INTO github_deliveries(delivery_id,project_id,repository_id,event,payload)
   VALUES($1,$2,$3,$4,$5) ON CONFLICT(delivery_id) DO NOTHING RETURNING id`,[deliveryId,connection.project_id,repo.id,event,JSON.stringify(payload)]);
  return {duplicate:rows.length===0};
 },
 async claim() {
  return (await pool.query(`WITH candidate AS (SELECT id FROM github_deliveries WHERE
   (state='PENDING' AND available_at<=now()) OR (state='PROCESSING' AND lease_until<now())
   ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1)
   UPDATE github_deliveries d SET state='PROCESSING',attempts=attempts+1,lease_until=now()+interval '5 minutes'
   FROM candidate c WHERE d.id=c.id RETURNING d.*`)).rows[0];
 },
 async finish(delivery,error) {
  await pool.query(`UPDATE github_deliveries SET state=$2,error=$3,lease_until=NULL,
   available_at=now()+interval '30 seconds' * power(2,LEAST(attempts,5)) WHERE id=$1`,
   [delivery.id,error?(delivery.attempts>=3?'FAILED':'PENDING'):'DONE',error?'GitHub processing failed; verify credentials, provider budgets and repository access.':null]);
 },
 async dashboard(projectId) {
  const [connection,activities,history,errors]=await Promise.all([
   this.connection(projectId),
   pool.query(`SELECT a.*,t.title AS task_title FROM github_activities a LEFT JOIN tasks t ON t.id=a.task_id LEFT JOIN github_connections c ON c.project_id=a.project_id WHERE a.project_id=$1 AND (c.repository_id IS NULL OR a.repository_id=c.repository_id) ORDER BY a.updated_at DESC LIMIT 50`,[projectId]),
   pool.query(`SELECT h.*,t.title AS task_title,a.metadata FROM github_sync_history h LEFT JOIN tasks t ON t.id=h.task_id LEFT JOIN github_activities a ON a.id=h.activity_id WHERE h.project_id=$1 ORDER BY h.id DESC LIMIT 30`,[projectId]),
   pool.query(`SELECT id,event,state,error,created_at FROM github_deliveries WHERE project_id=$1 AND error IS NOT NULL ORDER BY id DESC LIMIT 10`,[projectId])]);
  return {connection:connection||null,activities:activities.rows,history:history.rows,errors:errors.rows};
 }
};
