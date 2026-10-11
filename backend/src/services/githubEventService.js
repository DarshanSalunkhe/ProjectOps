import pool from '../config/database.js';
import { githubService } from './githubService.js';
import { githubActivityRepository as repository } from '../repositories/githubActivityRepository.js';
import { taskRepository } from '../repositories/taskRepository.js';
import { activityRepository } from '../repositories/activityRepository.js';
import { matchActivity, fingerprint } from './githubTaskMatchingService.js';
import { applyActivity } from './githubTaskSyncService.js';

const text=(v,n)=>String(v||'')
 .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g,'[redacted private key]')
 .replace(/\b(?:AIza[\w-]{35}|gh[pousr]_[\w]+|github_pat_[\w]+|sk-[\w-]{20,})\b/g,'[redacted credential]')
 .replace(/\b(password|secret|token|api[_-]?key)\s*[=:]\s*\S+/gi,'$1=[redacted]')
 .slice(0,n);
const files=v=>(Array.isArray(v)?v:[]).slice(0,50).map(f=>text(f,240)).filter(f=>!/(^|\/)\.env(?:\.|$)|credentials|private[_-]?key/i.test(f));
const validSha=v=>/^[a-f0-9]{40}$/i.test(v||'');
export function normalizeGithubEvent(event,payload) {
 if(event==='push')return (payload.deleted?[]:payload.commits||[]).slice(0,100).filter(c=>validSha(c.id)).map(c=>({kind:'push',key:'commit:'+c.id,sha:c.id,title:text(c.message,1000),description:'',branch:text(payload.ref?.replace(/^refs\/heads\//,''),255),author:text(c.author?.username||c.author?.name,150),timestamp:text(c.timestamp,40),url:text(c.url,500),files:files([...(c.added||[]),...(c.modified||[]),...(c.removed||[])])}));
 if(event==='pull_request'&&['opened','reopened','edited','synchronize','closed','ready_for_review'].includes(payload.action)) {
  const p=payload.pull_request;if(!p||!Number.isSafeInteger(p.number)||p.number<1)return [];
  return [{kind:'pull_request',key:'pr:'+p.number,number:p.number,sha:p.head?.sha,title:text(p.title,500),description:text(p.body,2000),branch:text(p.head?.ref,255),base:text(p.base?.ref,255),merged:!!p.merged,state:p.state,author:text(p.user?.login,150),timestamp:text(p.updated_at,40),url:text(p.html_url,500),files:[]}];
 }
 return [];
}
export function requiredChecksPass(required,evidence) {
 return required.length>0&&required.every(name=>{
  const runs=evidence.runs.filter(c=>c.name===name).sort((a,b)=>Number(b.id)-Number(a.id));
  const statuses=evidence.statuses.filter(c=>c.context===name).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  // Any current matching source failing/pending prevents completion.
  if(!runs.length&&!statuses.length)return false;
  return (!runs.length||(runs[0].status==='completed'&&runs[0].conclusion==='success'))&&(!statuses.length||statuses[0].state==='success');
 });
}
export async function completionEvidence(connection,activity,github=githubService) {
 if(activity.kind!=='pull_request')return {};
 const pr=await github.getPullRequest(connection.full_name,activity.number);
 if(Number(pr.base?.repo?.id)!==Number(connection.repository_id)||pr.number!==activity.number||!validSha(pr.head?.sha)||pr.head.sha!==activity.sha)return {verified:false};
 const evidence={verified:true,merged:pr.merged===true,base:pr.base.ref,sha:pr.head.sha,repositoryId:connection.repository_id,requiredChecks:connection.required_checks,checksPassed:false};
 if(pr.merged&&connection.required_checks.length)evidence.checksPassed=requiredChecksPass(connection.required_checks,await github.getChecks(connection.full_name,pr.head.sha));
 return evidence;
}
export async function processDelivery(delivery) {
 const c=await repository.connection(delivery.project_id);
 if(!c||!c.enabled||String(c.repository_id)!==String(delivery.repository_id))return;
 // The configuring account must still own the project or be a current system admin.
 const {rows:[authorized]}=await pool.query(`SELECT u.id FROM users u LEFT JOIN project_members m ON m.user_id=u.id AND m.project_id=$2 WHERE u.id=$1 AND (u.role='SYSTEM_ADMIN' OR m.role='OWNER')`,[c.configured_by,c.project_id]);
 if(!authorized)throw new Error('Integration owner no longer authorized');
 if(['check_run','check_suite','status'].includes(delivery.event)) {
  const sha=delivery.payload.check_run?.head_sha||delivery.payload.check_suite?.head_sha||delivery.payload.sha;
  if(!validSha(sha))return;
  const {rows}=await pool.query(`SELECT * FROM github_activities WHERE project_id=$1 AND repository_id=$2 AND metadata->>'kind'='pull_request' AND metadata->>'sha'=$3 AND decision<>'REJECTED'`,[c.project_id,c.repository_id,sha]);
  for(const a of rows)await applyActivity(a.id,await completionEvidence(c,a.metadata));
  return;
 }
 const tasks=await taskRepository.findByProject(c.project_id);
 for(let activity of normalizeGithubEvent(delivery.event,delivery.payload)) {
  if(activity.kind==='pull_request') {
   // Fetch canonical metadata, so stale deliveries cannot revert a merged/newer PR.
   const pr=await githubService.getPullRequest(c.full_name,activity.number);
   if(Number(pr.base?.repo?.id)!==Number(c.repository_id))throw new Error('Repository mismatch');
   activity=normalizeGithubEvent('pull_request',{action:'edited',pull_request:pr})[0];
   if(!activity)continue;
   activity.files=files((await githubService.getPullRequestFiles(c.full_name,activity.number)).map(f=>f.filename));
  }
  const hash=fingerprint(activity,tasks);
  const {rows:[old]}=await pool.query('SELECT * FROM github_activities WHERE project_id=$1 AND repository_id=$2 AND activity_key=$3',[c.project_id,c.repository_id,activity.key]);
  if(old?.decision==='REJECTED')continue;
  const same=old?.fingerprint===hash;
  if(same&&activity.kind==='push')continue;
  let match;
  if(old?.decision==='CONFIRMED'||same)match={taskId:old.task_id,method:old.method,confidence:old.confidence,reason:old.reason,requiresConfirmation:old.match_requires_confirmation};
  else match=await matchActivity(activity,tasks,c);
  const task=tasks.find(t=>Number(t.id)===Number(match.taskId));
  const {rows:[saved]}=await pool.query(`INSERT INTO github_activities(project_id,repository_id,activity_key,metadata,fingerprint,task_id,task_version,method,confidence,reason,outcome,match_requires_confirmation)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
   ON CONFLICT(project_id,repository_id,activity_key) DO UPDATE SET metadata=EXCLUDED.metadata,fingerprint=EXCLUDED.fingerprint,
    task_id=CASE WHEN github_activities.decision='CONFIRMED' THEN github_activities.task_id ELSE EXCLUDED.task_id END,
    task_version=CASE WHEN github_activities.fingerprint=EXCLUDED.fingerprint THEN github_activities.task_version ELSE EXCLUDED.task_version END,
    completion_approved=CASE WHEN github_activities.metadata->>'sha'=EXCLUDED.metadata->>'sha' THEN github_activities.completion_approved ELSE false END,
    method=EXCLUDED.method,confidence=EXCLUDED.confidence,reason=EXCLUDED.reason,outcome=EXCLUDED.outcome,match_requires_confirmation=EXCLUDED.match_requires_confirmation,updated_at=now()
   RETURNING *`,[c.project_id,c.repository_id,activity.key,JSON.stringify(activity),hash,task?.id||null,task?.github_status_version??null,match.method,match.confidence??null,match.reason,match.requiresConfirmation?'NEEDS_REVIEW':'MATCHED',match.requiresConfirmation]);
  if(!old)await activityRepository.create({project_id:c.project_id,action_type:'UPDATED',entity_type:'PROJECT',entity_id:c.project_id,description:`GitHub activity: ${activity.title.slice(0,150)}`,metadata:{githubActivityId:saved.id,url:activity.url,needsReview:match.requiresConfirmation}});
  await applyActivity(saved.id,await completionEvidence(c,activity));
 }
 await pool.query('UPDATE github_connections SET last_synced_at=now(),last_error=NULL WHERE project_id=$1',[c.project_id]);
}
export function startGithubWorker() {
 if(process.env.GITHUB_SYNC_ENABLED!=='true')return ()=>{};
 let stopped=false,timer,busy=false;
 const tick=async()=>{
  if(stopped||busy)return;busy=true;let worked=false;
  try {
   const client=await pool.connect();let locked=false;
   try {
    // One worker across Render instances; the queue remains durable on restart.
    locked=(await client.query('SELECT pg_try_advisory_lock($1) AS locked',[73190420])).rows[0].locked;
    if(locked) {
     const delivery=await repository.claim();
     if(delivery) {
      worked=true;
      try {await processDelivery(delivery);await repository.finish(delivery);}
      catch {await repository.finish(delivery,true);await pool.query("UPDATE github_connections SET last_error='Processing failed. Check repository access and retry the delivery.' WHERE project_id=$1",[delivery.project_id]);}
     }
    }
   }finally{if(locked)await client.query('SELECT pg_advisory_unlock($1)',[73190420]);client.release();}
  }catch {console.error('GitHub sync worker unavailable; check migration 020 and database connectivity.');}
  finally {busy=false;if(!stopped){timer=setTimeout(tick,worked?3000:15000);timer.unref();}}
 };
 void tick();return ()=>{stopped=true;clearTimeout(timer);};
}
