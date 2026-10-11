import pool from '../config/database.js';
import { githubService } from '../services/githubService.js';
import { githubActivityRepository as repository } from '../repositories/githubActivityRepository.js';
import { completionEvidence, normalizeGithubEvent } from '../services/githubEventService.js';
import { applyActivity } from '../services/githubTaskSyncService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';

const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0;
export const webhook=asyncHandler(async(req,res)=>{
 if(process.env.GITHUB_SYNC_ENABLED!=='true')throw new AppError('GitHub synchronization is disabled',503);
 const event=req.get('x-github-event'),delivery=req.get('x-github-delivery'),p=req.githubPayload;
 if(!/^[a-zA-Z0-9-]{1,100}$/.test(delivery||''))throw new AppError('GitHub delivery ID required',400);
 if(!p?.repository||!positive(p.repository.id)||!/^[-\w.]+\/[-\w.]+$/.test(p.repository.full_name||''))throw new AppError('Invalid repository identity',400);
 if(!['push','pull_request','check_run','check_suite','status','ping'].includes(event))return res.status(202).json({success:true,ignored:true});
 // Store only bounded metadata, not code, emails or the full raw webhook.
 const payload={repository:{id:p.repository.id,full_name:p.repository.full_name}};
 if(event==='push') {
  const normalized=normalizeGithubEvent(event,p);
  payload.ref=String(p.ref||'').slice(0,270);payload.deleted=!!p.deleted;
  payload.commits=normalized.map(a=>({id:a.sha,message:a.title,timestamp:a.timestamp,url:a.url,author:{name:a.author},modified:a.files}));
 }else if(event==='pull_request') {
  const a=normalizeGithubEvent(event,p)[0];payload.action=p.action;
  if(a)payload.pull_request={number:a.number,title:a.title,body:a.description,head:{sha:a.sha,ref:a.branch},base:{ref:a.base},merged:a.merged,state:a.state,html_url:a.url,user:{login:a.author},updated_at:a.timestamp};
 }else if(event==='check_run')payload.check_run={head_sha:p.check_run?.head_sha};
 else if(event==='check_suite')payload.check_suite={head_sha:p.check_suite?.head_sha};
 else if(event==='status')payload.sha=p.sha;
 const accepted=await repository.enqueue(delivery,event,payload);
 if(!accepted)throw new AppError('Repository is not linked to an enabled project integration',403);
 res.status(202).json({success:true,...accepted});
});
export const dashboard=asyncHandler(async(req,res)=>{
 const result=await repository.dashboard(req.params.projectId);
 successResponse(res,{...result,serviceEnabled:process.env.GITHUB_SYNC_ENABLED==='true'});
});
export const configure=asyncHandler(async(req,res)=>{
 const {url,enabled=false,integrationBranch,requiredChecks=[],requireConfirmation=true}=req.body;
 if(typeof enabled!=='boolean'||typeof requireConfirmation!=='boolean'||!Array.isArray(requiredChecks)||requiredChecks.length>20||requiredChecks.some(c=>typeof c!=='string'||!c.trim()||c.length>100))throw new AppError('Invalid synchronization settings',400);
 const parsed=githubService.parseUrl(url);
 if(!parsed||!/^https:\/\/github\.com\/[-\w.]+\/[-\w.]+(?:\.git)?\/?$/.test(url))throw new AppError('Enter a GitHub repository URL',400);
 const repo=await githubService.getRepo(url);
 if(!positive(repo.id)||!/^[-\w.]+\/[-\w.]+$/.test(repo.full_name||''))throw new AppError('Invalid GitHub repository response',502);
 const branch=integrationBranch||repo.default_branch;
 if(typeof branch!=='string'||!branch.trim()||branch.length>255)throw new AppError('Invalid integration branch',400);
 const client=await pool.connect();
 try {
  await client.query('BEGIN');
  const {rows:[project]}=await client.query('SELECT id FROM projects WHERE id=$1 FOR UPDATE',[req.params.projectId]);
  if(!project)throw new AppError('Project not found',404);
  await client.query(`INSERT INTO github_connections(project_id,repository_id,full_name,default_branch,integration_branch,enabled,required_checks,require_confirmation,configured_by)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(project_id) DO UPDATE SET repository_id=EXCLUDED.repository_id,full_name=EXCLUDED.full_name,default_branch=EXCLUDED.default_branch,integration_branch=EXCLUDED.integration_branch,enabled=EXCLUDED.enabled,required_checks=EXCLUDED.required_checks,require_confirmation=EXCLUDED.require_confirmation,configured_by=EXCLUDED.configured_by,last_error=NULL,last_synced_at=CASE WHEN github_connections.repository_id=EXCLUDED.repository_id THEN github_connections.last_synced_at ELSE NULL END`,
   [project.id,repo.id,repo.full_name,repo.default_branch,branch.trim(),enabled,JSON.stringify([...new Set(requiredChecks.map(c=>c.trim()))]),requireConfirmation,req.user.id]);
  await client.query('UPDATE projects SET github_repo_url=$2 WHERE id=$1',[project.id,repo.html_url]);
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 successResponse(res,await repository.connection(req.params.projectId));
});
export const disconnect=asyncHandler(async(req,res)=>{
 const client=await pool.connect();
 try{await client.query('BEGIN');await client.query('DELETE FROM github_connections WHERE project_id=$1',[req.params.projectId]);await client.query('UPDATE projects SET github_repo_url=NULL WHERE id=$1',[req.params.projectId]);await client.query('COMMIT');}
 catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 successResponse(res,null,'Repository disconnected; history retained');
});
export const review=asyncHandler(async(req,res)=>{
 if(process.env.GITHUB_SYNC_ENABLED!=='true')throw new AppError('GitHub synchronization is disabled',503);
 const {decision,taskId,approveCompletion=false}=req.body;
 if(!['CONFIRMED','REJECTED'].includes(decision)||typeof approveCompletion!=='boolean'||(decision==='CONFIRMED'&&!positive(taskId)))throw new AppError('Invalid review decision',400);
 const c=await repository.connection(req.params.projectId);
 if(!c?.enabled)throw new AppError('Enable repository synchronization before reviewing',409);
 const {rows:[activity]}=await pool.query('SELECT * FROM github_activities WHERE id=$1 AND project_id=$2 AND repository_id=$3',[req.params.activityId,req.params.projectId,c.repository_id]);
 if(!activity)throw new AppError('Activity not found',404);
 let evidence={};
 if(decision==='CONFIRMED')evidence=await completionEvidence(c,activity.metadata);
 const client=await pool.connect();
 try {
  await client.query('BEGIN');
  const {rows:[locked]}=await client.query('SELECT * FROM github_activities WHERE id=$1 FOR UPDATE',[activity.id]);
  if(locked.fingerprint!==activity.fingerprint)throw new AppError('Activity changed; refresh before reviewing',409);
  if(decision==='CONFIRMED') {
   const {rows:[task]}=await client.query('SELECT * FROM tasks WHERE id=$1 AND project_id=$2 FOR UPDATE',[taskId,req.params.projectId]);
   if(!task)throw new AppError('Task does not belong to this project',400);
   await client.query('UPDATE github_activities SET task_id=$2,task_version=$3,decision=$4,decided_by=$5,completion_approved=$6,outcome=$7 WHERE id=$1',[activity.id,task.id,task.github_status_version,decision,req.user.id,approveCompletion,'MATCHED']);
  }else await client.query("UPDATE github_activities SET decision='REJECTED',decided_by=$2,outcome='DISMISSED' WHERE id=$1",[activity.id,req.user.id]);
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 if(decision==='CONFIRMED')await applyActivity(activity.id,evidence,req.user.id);
 successResponse(res,await repository.dashboard(req.params.projectId));
});
export const pauseTask=asyncHandler(async(req,res)=>{
 if(typeof req.body.paused!=='boolean')throw new AppError('paused must be boolean',400);
 const {rows:[task]}=await pool.query('UPDATE tasks SET github_sync_paused=$3 WHERE id=$1 AND project_id=$2 RETURNING id,github_sync_paused',[req.params.taskId,req.params.projectId,req.body.paused]);
 if(!task)throw new AppError('Task not found',404);
 successResponse(res,task);
});
export const retryDelivery=asyncHandler(async(req,res)=>{
 const {rowCount}=await pool.query("UPDATE github_deliveries SET state='PENDING',attempts=0,available_at=now(),error=NULL WHERE id=$1 AND project_id=$2 AND state='FAILED'",[req.params.deliveryId,req.params.projectId]);
 if(!rowCount)throw new AppError('Failed delivery not found',404);
 successResponse(res,null,'Delivery queued');
});
