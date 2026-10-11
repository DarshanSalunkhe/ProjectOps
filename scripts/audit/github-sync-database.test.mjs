import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import request from 'supertest';
import {auditEnvironment,auditClient} from './environment.mjs';
// Deliberately separate from credential-free unit tests. Writes are schema-scoped.
test('isolated PostgreSQL webhook-to-task workflow, CI reevaluation, manual guard, duplicate delivery and progress',async()=>{
 auditEnvironment();const verify=await auditClient();await verify.end();
 process.env.GITHUB_SYNC_ENABLED='true';process.env.GITHUB_WEBHOOK_SECRET='database-fixture-secret';process.env.OLLAMA_ENABLED='false';
 const [{default:app},{default:pool},{generateToken},{githubActivityRepository:repository},{processDelivery},{projectRepository},{dependencyRepository}]=await Promise.all([
  import('../../backend/src/app.js'),import('../../backend/src/config/database.js'),import('../../backend/src/utils/jwt.js'),import('../../backend/src/repositories/githubActivityRepository.js'),import('../../backend/src/services/githubEventService.js'),import('../../backend/src/repositories/projectRepository.js'),import('../../backend/src/repositories/dependencyRepository.js')]);
 const originalFetch=globalThis.fetch;let checksPass=false,prMerged=false;
 let projectId,taskId,secondId,stopWorker=()=>{};
 const sha='b'.repeat(40),repoId=Date.now(),fullName='team/repo-'+crypto.randomUUID().slice(0,8);
 const pr=()=>({number:7,title:`TASK-${taskId} invitations`,body:'Review invitations',head:{sha,ref:'feature/invitations'},base:{repo:{id:repoId},ref:'main'},merged:prMerged,state:prMerged?'closed':'open',html_url:'https://github.com/'+fullName+'/pull/7',user:{login:'developer'},updated_at:'2026-10-11T12:00:00Z'});
 globalThis.fetch=async url=>{
  const route=new URL(url).pathname;let data;
  if(route==='/repos/'+fullName)data={id:repoId,full_name:fullName,default_branch:'main',html_url:'https://github.com/'+fullName};
  else if(route==='/repos/'+fullName+'/pulls/7')data=pr();
  else if(route.endsWith('/files'))data=[{filename:'src/invitations.js'}];
  else if(route.endsWith('/check-runs'))data={total_count:1,check_runs:[{name:'test',id:10,status:'completed',conclusion:checksPass?'success':'failure'}]};
  else if(route.endsWith('/status'))data={total_count:0,statuses:[]};
  else throw new Error('Unexpected external API request: '+route);
  return {ok:true,status:200,json:async()=>data};
 };
 try {
  const {rows:[owner]}=await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES('Sync Owner',$1,'test-only','SYSTEM_ADMIN') RETURNING id",[`sync-${crypto.randomUUID()}@example.invalid`]);
  const auth={Authorization:'Bearer '+generateToken(owner.id,false)};
  const project=await projectRepository.create({name:'GitHub Sync DB Test',deadline:'2027-01-01'},owner.id);projectId=project.id;
  const {rows:[task]}=await pool.query("INSERT INTO tasks(project_id,title,created_by) VALUES($1,'Implement invitations',$2) RETURNING id",[projectId,owner.id]);taskId=task.id;
  const {rows:[dependent]}=await pool.query("INSERT INTO tasks(project_id,title,created_by) VALUES($1,'Test invitations',$2) RETURNING id",[projectId,owner.id]);secondId=dependent.id;
  await dependencyRepository.create(secondId,taskId,'BLOCKS');
  await pool.query('UPDATE tasks SET estimated_hours=8 WHERE id=$1',[taskId]);
  await pool.query('INSERT INTO task_assignments(task_id,user_id) VALUES($1,$2)',[taskId,owner.id]);
  const {workloadService}=await import('../../backend/src/services/workloadService.js');await workloadService.calculateUserWorkload(owner.id);
  assert.equal((await request(app).put(`/api/github/projects/${projectId}/sync`).set(auth).send({url:'https://github.com/'+fullName,enabled:true,requiredChecks:['test'],requireConfirmation:false})).status,200);
  const deliver=async(event,payload,id=crypto.randomUUID())=>{
   const raw=JSON.stringify({repository:{id:repoId,full_name:fullName},...payload});
   const response=await request(app).post('/api/github/webhook').set('Content-Type','application/json').set('x-github-event',event).set('x-github-delivery',id).set('x-hub-signature-256','sha256='+crypto.createHmac('sha256',process.env.GITHUB_WEBHOOK_SECRET).update(raw).digest('hex')).send(raw);
   assert.equal(response.status,202,JSON.stringify(response.body));return response;
  };
  const drain=async()=>{const d=await repository.claim();assert.ok(d);await processDelivery(d);await repository.finish(d);};
  const current=async()=> (await pool.query('SELECT * FROM tasks WHERE id=$1',[taskId])).rows[0];
  const deliveryId=crypto.randomUUID(),push={ref:'refs/heads/feature/invitations',commits:[{id:'a'.repeat(40),message:`TASK-${taskId} implement invitations`,modified:['src/invitations.js']}]};
  await deliver('push',push,deliveryId);await drain();assert.equal((await current()).status,'IN_PROGRESS');
  assert.equal((await deliver('push',push,deliveryId)).body.duplicate,true);assert.equal(await repository.claim(),undefined);
  await deliver('pull_request',{action:'opened',pull_request:pr()});await drain();assert.equal((await current()).status,'IN_PROGRESS');
  prMerged=true;await deliver('pull_request',{action:'closed',pull_request:pr()});await drain();assert.equal((await current()).status,'IN_PROGRESS');
  checksPass=true;await deliver('check_run',{check_run:{head_sha:sha}});await drain();assert.equal((await current()).status,'COMPLETED');
  const reread=await projectRepository.findById(projectId);assert.equal(Number(reread.completed_task_count),1);assert.equal(Number(reread.task_count),2);
  assert.notEqual(new Date(reread.updated_at).getTime(),new Date(project.updated_at).getTime());
  assert.equal(Number((await pool.query('SELECT workload_hours FROM users WHERE id=$1',[owner.id])).rows[0].workload_hours),0);
  const dependencies=await dependencyRepository.findByTask(secondId);assert.equal(dependencies[0].depends_on_task_status,'COMPLETED');
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM github_sync_history WHERE project_id=$1',[projectId])).rows[0].count,2);
  // Retry check deliveries do not duplicate the completion/history.
  await deliver('check_run',{check_run:{head_sha:sha}});await drain();assert.equal((await pool.query('SELECT count(*)::int AS count FROM github_sync_history WHERE project_id=$1',[projectId])).rows[0].count,2);
  assert.equal((await request(app).patch(`/api/tasks/${taskId}`).set(auth).send({status:'TODO'})).status,200);
  assert.equal((await current()).github_sync_paused,true);assert.equal((await current()).github_last_activity_id,null);
  await deliver('push',{...push,commits:[{...push.commits[0],id:'c'.repeat(40)}]});await drain();assert.equal((await current()).status,'TODO');
  const dashboard=(await request(app).get(`/api/github/projects/${projectId}/sync`).set(auth)).body.data;
  const pending=dashboard.activities.find(a=>a.metadata.sha==='c'.repeat(40));assert.equal(pending.outcome,'NEEDS_REVIEW');
  assert.equal((await request(app).patch(`/api/github/projects/${projectId}/sync/tasks/${taskId}`).set(auth).send({paused:false})).status,200);
  assert.equal((await request(app).post(`/api/github/projects/${projectId}/sync/activities/${pending.id}/review`).set(auth).send({decision:'CONFIRMED',taskId})).status,200);
  assert.equal((await current()).status,'IN_PROGRESS');
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM activity_log WHERE project_id=$1 AND action_type=\'STATUS_CHANGED\'',[projectId])).rows[0].count,4);
  // Existing repository URL edit also invalidates automation, rather than leaving a stale connection.
  assert.equal((await request(app).patch(`/api/projects/${projectId}`).set(auth).send({github_repo_url:'https://github.com/team/different-repo'})).status,200);
  assert.equal((await repository.connection(projectId)).enabled,false);
  const raw=JSON.stringify({repository:{id:repoId,full_name:fullName},...push});
  const blocked=await request(app).post('/api/github/webhook').set('Content-Type','application/json').set('x-github-event','push').set('x-github-delivery',crypto.randomUUID()).set('x-hub-signature-256','sha256='+crypto.createHmac('sha256',process.env.GITHUB_WEBHOOK_SECRET).update(raw).digest('hex')).send(raw);
  assert.equal(blocked.status,403);
  // A crashed worker's persisted lease is reclaimed, retries are bounded, and owners can retry.
  const {rows:[job]}=await pool.query(`INSERT INTO github_deliveries(delivery_id,project_id,repository_id,event,payload,state,attempts,lease_until)
   VALUES($1,$2,$3,'push',$4,'PROCESSING',1,now()-interval '1 minute') RETURNING id`,[crypto.randomUUID(),projectId,repoId,JSON.stringify({repository:{id:repoId,full_name:fullName},...push})]);
  let recovered=await repository.claim();assert.equal(String(recovered.id),String(job.id));assert.equal(recovered.attempts,2);
  await repository.finish(recovered,true);await pool.query('UPDATE github_deliveries SET available_at=now() WHERE id=$1',[job.id]);
  recovered=await repository.claim();assert.equal(recovered.attempts,3);await repository.finish(recovered,true);
  assert.equal((await pool.query('SELECT state FROM github_deliveries WHERE id=$1',[job.id])).rows[0].state,'FAILED');
  assert.equal((await request(app).post(`/api/github/projects/${projectId}/sync/deliveries/${job.id}/retry`).set(auth)).status,200);
  recovered=await repository.claim();assert.equal(recovered.attempts,1);await repository.finish(recovered);
  // Start the real asynchronous worker against an accepted persisted delivery.
  assert.equal((await request(app).put(`/api/github/projects/${projectId}/sync`).set(auth).send({url:'https://github.com/'+fullName,enabled:true,requiredChecks:['test'],requireConfirmation:false})).status,200);
  const {rows:[automatic]}=await pool.query("INSERT INTO tasks(project_id,title,created_by) VALUES($1,'Background worker task',$2) RETURNING id",[projectId,owner.id]);
  await deliver('push',{ref:'refs/heads/feature/worker',commits:[{id:'d'.repeat(40),message:`OPS-${automatic.id} worker progress`,modified:['src/worker.js']}]});
  const {startGithubWorker}=await import('../../backend/src/services/githubEventService.js');stopWorker=startGithubWorker();
  const deadline=Date.now()+30000;let status;
  do {await new Promise(r=>setTimeout(r,1000));status=(await pool.query('SELECT status FROM tasks WHERE id=$1',[automatic.id])).rows[0].status;}while(status!=='IN_PROGRESS'&&Date.now()<deadline);
  assert.equal(status,'IN_PROGRESS');stopWorker();
 } finally {stopWorker();globalThis.fetch=originalFetch;await pool.end();}
});

