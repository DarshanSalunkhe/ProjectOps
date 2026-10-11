import pool from '../config/database.js';
import { activityRepository } from '../repositories/activityRepository.js';
import { aiService } from './aiService.js';
import { workloadService } from './workloadService.js';

// AI suggestions never control transitions. Only independently verified evidence does.
export function transitionFor(activity,task,connection,evidence={},confirmed=false) {
 if(task.github_sync_paused)return {reason:'Manual decision protected. Resume GitHub updates explicitly.'};
 if(task.status==='BLOCKED'||task.status==='COMPLETED')return {reason:'Existing blocked/completed status preserved.'};
 if(activity.kind==='push')return task.status==='TODO'?{status:'IN_PROGRESS',reason:'Matched commit indicates work has started.'}:{reason:'Commit recorded; completion requires a merged pull request.'};
 if(activity.kind!=='pull_request')return {reason:'Activity recorded.'};
 if(!evidence.merged)return {reason:'Pull request review recorded; no review status exists in ProjectOps.'};
 if(evidence.base!==connection.integration_branch)return {reason:'Merge targets a different integration branch.'};
 if(!evidence.verified)return {reason:'Merge/check evidence could not be verified.'};
 if(connection.required_checks.length && !evidence.checksPassed)return {reason:'Required checks are pending, failed or unavailable.'};
 if(task.acceptance_criteria&&!confirmed)return {reason:'Task acceptance criteria require a project member to confirm completion.'};
 if((connection.require_confirmation||!connection.required_checks.length)&&!confirmed)return {reason:'Completion requires confirmation.'};
 return {status:'COMPLETED',reason:connection.required_checks.length?'Verified merged pull request and required checks passed.':'Verified merged pull request; completion confirmed by a project member.'};
}
export async function applyActivity(activityId,evidence={},actorId=null) {
 const client=await pool.connect();let projectId;
 try {
  await client.query('BEGIN');
  const {rows:[a]}=await client.query('SELECT * FROM github_activities WHERE id=$1 FOR UPDATE',[activityId]);
  if(!a) {await client.query('ROLLBACK');return;}
  projectId=a.project_id;
  const {rows:[c]}=await client.query(`SELECT c.*,p.github_repo_url FROM github_connections c JOIN projects p ON p.id=c.project_id WHERE c.project_id=$1 FOR UPDATE OF c,p`,[a.project_id]);
  if(!c||!c.enabled||String(c.repository_id)!==String(a.repository_id)||!c.github_repo_url?.toLowerCase().replace(/\/$/,'').replace(/\.git$/,'').endsWith('/'+c.full_name.toLowerCase())) {await client.query('ROLLBACK');return;}
  if(a.decision==='REJECTED'||!a.task_id){await client.query('COMMIT');return;}
  const {rows:[task]}=await client.query('SELECT * FROM tasks WHERE id=$1 AND project_id=$2 FOR UPDATE',[a.task_id,a.project_id]);
  if(!task) {await client.query('COMMIT');return;}
  const confirmed=a.decision==='CONFIRMED';
  if(a.metadata.kind==='pull_request' && (evidence.sha!==a.metadata.sha||String(evidence.repositoryId)!==String(c.repository_id)||JSON.stringify(evidence.requiredChecks)!==JSON.stringify(c.required_checks)))evidence={verified:false};
  let change;
  if(task.github_status_version!==a.task_version)change={reason:'Task status changed after this activity was matched. Review again.'};
  else if(!confirmed && a.match_requires_confirmation)change={reason:a.reason};
  else change=transitionFor(a.metadata,task,c,evidence,a.completion_approved);
  const outcome=change.status?'UPDATED':(task.status==='COMPLETED'?'RECORDED':'NEEDS_REVIEW');
  if(change.status && change.status!==task.status) {
   await client.query("SELECT set_config('projectops.github_sync','on',true)");
   await client.query('UPDATE tasks SET status=$2,github_last_activity_id=$3 WHERE id=$1',[task.id,change.status,a.id]);
   await client.query('UPDATE projects SET updated_at=now() WHERE id=$1',[a.project_id]);
   if(change.status==='COMPLETED') {
    const {rows:assignees}=await client.query('SELECT user_id FROM task_assignments WHERE task_id=$1',[task.id]);
    for(const assignee of assignees)await workloadService.calculateUserWorkload(assignee.user_id,client);
   }
   await client.query(`INSERT INTO github_sync_history(project_id,task_id,activity_id,previous_status,new_status,user_id,reason) VALUES($1,$2,$3,$4,$5,$6,$7)`,[a.project_id,task.id,a.id,task.status,change.status,actorId,change.reason]);
   await activityRepository.create({project_id:a.project_id,user_id:actorId,action_type:'STATUS_CHANGED',entity_type:'TASK',entity_id:task.id,description:`Task OPS-${task.id} changed from ${task.status} to ${change.status} from GitHub`,metadata:{githubActivityId:a.id,url:a.metadata.url,reason:change.reason}},client);
  }
  await client.query('UPDATE github_activities SET outcome=$2,reason=$3,updated_at=now() WHERE id=$1',[a.id,outcome,change.reason]);
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 if(projectId)aiService.invalidateProject(projectId);
 // Progress/dependency eligibility and risk scores are already computed from current tasks
 // by the existing repositories/intelligence endpoints; no parallel score is stored here.
}
