import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import request from 'supertest';
import express from 'express';
import webhookRoutes from '../../backend/src/routes/githubWebhookRoutes.js';
import githubRoutes from '../../backend/src/routes/githubRoutes.js';
import {errorHandler} from '../../backend/src/middleware/errorHandler.js';
import pool from '../../backend/src/config/database.js';
import {validGithubSignature} from '../../backend/src/middleware/githubWebhookVerification.js';
import {matchActivity,validateMatch} from '../../backend/src/services/githubTaskMatchingService.js';
import {normalizeGithubEvent,requiredChecksPass,completionEvidence} from '../../backend/src/services/githubEventService.js';
import {transitionFor,applyActivity} from '../../backend/src/services/githubTaskSyncService.js';
import {githubActivityRepository as repository} from '../../backend/src/repositories/githubActivityRepository.js';
import {userRepository} from '../../backend/src/repositories/userRepository.js';
import {projectMemberRepository} from '../../backend/src/repositories/projectMemberRepository.js';
import {generateToken} from '../../backend/src/utils/jwt.js';
const tasks=[{id:103,title:'Implement member invitations',description:'Email invitation flow'}];
const connection={project_id:1,configured_by:1,repository_id:10,full_name:'team/repo',integration_branch:'main',required_checks:['test'],require_confirmation:false};
const activity={kind:'push',title:'feat(TASK-103): invite API',description:'',branch:'feature/invite',files:['src/invite.js']};
const task={status:'TODO',github_sync_paused:false};
const app=express();
app.use('/api/github/webhook',webhookRoutes);
app.use(express.json());
app.use('/api/github',githubRoutes);
app.use(errorHandler);
test('HMAC verifies the exact raw bytes and rejects missing/malformed/tampered signatures',()=>{
 const body=Buffer.from('{"title":"héllo"}'),secret='test-only-secret';
 const signature='sha256='+crypto.createHmac('sha256',secret).update(body).digest('hex');
 assert.equal(validGithubSignature(body,signature,secret),true);
 for(const sig of [undefined,'sha256=zz','sha1='+signature.slice(7)])assert.equal(validGithubSignature(body,sig,secret),false);
 assert.equal(validGithubSignature(Buffer.concat([body,Buffer.from(' ')]),signature,secret),false);
});
test('webhook HTTP raw parser accepts signed events, rejects invalid signatures and handles duplicate/unrelated deliveries',async()=>{
 const saved={secret:process.env.GITHUB_WEBHOOK_SECRET,enabled:process.env.GITHUB_SYNC_ENABLED,enqueue:repository.enqueue};
 process.env.GITHUB_WEBHOOK_SECRET='fixture-secret';process.env.GITHUB_SYNC_ENABLED='true';let seen=false;
 repository.enqueue=async(id,event,payload)=>{assert.equal(payload.commits[0].id,'a'.repeat(40));if(payload.repository.id!==10)return null;const duplicate=seen;seen=true;return {duplicate};};
 const body=JSON.stringify({repository:{id:10,full_name:'team/repo'},ref:'refs/heads/main',commits:[{id:'a'.repeat(40),message:'TASK-103 work',modified:['src/a.js']}]});
 const send=(body,valid=true)=>request(app).post('/api/github/webhook').set('Content-Type','application/json').set('x-github-event','push').set('x-github-delivery','delivery-fixture').set('x-hub-signature-256','sha256='+crypto.createHmac('sha256',valid?'fixture-secret':'wrong').update(body).digest('hex')).send(body);
 try {
  assert.equal((await send(body,false)).status,401);
  assert.equal((await send(body)).status,202);
  assert.equal((await send(body)).body.duplicate,true);
  assert.equal((await send(body.replace('"id":10','"id":11'))).status,403);
 }finally{repository.enqueue=saved.enqueue;for(const [k,v]of[['GITHUB_WEBHOOK_SECRET',saved.secret],['GITHUB_SYNC_ENABLED',saved.enabled]])v===undefined?delete process.env[k]:process.env[k]=v;}
});
test('explicit TASK and UI OPS IDs match only project-local tasks without an AI call',async()=>{
 const model={call(){throw new Error('Must not call AI');}};
 assert.equal((await matchActivity(activity,tasks,connection,model)).taskId,103);
 assert.equal((await matchActivity({...activity,title:'OPS-103'},tasks,connection,model)).taskId,103);
 assert.equal((await matchActivity({...activity,title:'TASK-999'},tasks,connection,model)).taskId,undefined);
 assert.equal((await matchActivity({...activity,title:'TASK-103 TASK-999'},tasks,connection,model)).taskId,undefined);
});
test('deterministic unique title match requests confirmation',async()=>{
 const result=await matchActivity({...activity,title:'Implement member invitations',branch:'',files:[]},tasks,connection);
 assert.equal(result.method,'DETERMINISTIC');assert.equal(result.requiresConfirmation,true);
});
test('Gemini matching uses bounded candidates, existing budgets and strict structured output',async()=>{
 let calls=0;
 const model={async call(feature,messages,options){calls++;assert.equal(feature,'GITHUB_TASK_MATCHING');assert.equal(options.provider,'gemini');assert.equal(options.userId,1);assert.equal(options.projectId,1);assert.equal(options.maxOutput,400);assert.ok(messages[0].content.includes('untrusted'));return {content:JSON.stringify({matchedTaskId:'TASK-103',confidence:0.7,reason:'Invitation flow',suggestedStatus:'COMPLETED',requiresConfirmation:false})};}};
 const result=await matchActivity({...activity,title:'invite workflow',branch:'',files:[]},tasks,connection,model);
 assert.equal(calls,1);assert.equal(result.method,'GEMINI');assert.equal(result.requiresConfirmation,true);
 for(const value of [{matchedTaskId:'TASK-999',confidence:1,reason:'x',suggestedStatus:'COMPLETED',requiresConfirmation:false},{matchedTaskId:'TASK-103',confidence:1,reason:'x',suggestedStatus:'IN_REVIEW',requiresConfirmation:false}])assert.throws(()=>validateMatch(value,tasks));
});
test('Gemini unavailable or invalid never crashes matching and requires review',async()=>{
 for(const model of [{call:async()=>{throw new Error('offline');}},{call:async()=>({content:'not json'})}]){
  const result=await matchActivity({...activity,title:'ambiguous work',branch:'',files:[]},tasks,connection,model);assert.equal(result.method,'NONE');assert.equal(result.requiresConfirmation,true);
 }
});
test('push starts TODO but never completes or changes blocked/completed/manual tasks',()=>{
 assert.equal(transitionFor(activity,task,connection).status,'IN_PROGRESS');
 for(const status of ['IN_PROGRESS','BLOCKED','COMPLETED'])assert.equal(transitionFor(activity,{...task,status},connection).status,undefined);
 assert.equal(transitionFor(activity,{...task,github_sync_paused:true},connection).status,undefined);
});
test('opened and closed-unmerged PRs preserve status because review is not an existing status',()=>{
 for(const state of ['open','closed'])assert.equal(transitionFor({kind:'pull_request',state},task,connection,{verified:true,merged:false}).status,undefined);
});
test('merged PR requires verified target branch and successful configured checks',()=>{
 const pr={kind:'pull_request'},good={verified:true,merged:true,base:'main',checksPassed:true};
 assert.equal(transitionFor(pr,task,connection,good).status,'COMPLETED');
 for(const evidence of [{...good,verified:false},{...good,base:'develop'},{...good,checksPassed:false}])assert.equal(transitionFor(pr,task,connection,evidence,true).status,undefined);
 assert.equal(transitionFor(pr,task,{...connection,required_checks:[]},good).status,undefined);
 assert.equal(transitionFor(pr,task,{...connection,required_checks:[]},good,true).status,'COMPLETED');
 assert.equal(transitionFor(pr,{...task,acceptance_criteria:'Owner checks invitations'},connection,good).status,undefined);
});
test('pending, failed, missing or stale check evidence fails closed',()=>{
 assert.equal(requiredChecksPass(['test'],{runs:[{name:'test',id:2,status:'completed',conclusion:'success'}],statuses:[]}),true);
 for(const runs of [[],[{name:'test',id:2,status:'in_progress',conclusion:null}],[{name:'test',id:2,status:'completed',conclusion:'failure'},{name:'test',id:1,status:'completed',conclusion:'success'}]])assert.equal(requiredChecksPass(['test'],{runs,statuses:[]}),false);
 assert.equal(requiredChecksPass(['test'],{runs:[{name:'test',id:2,status:'completed',conclusion:'success'}],statuses:[{context:'test',state:'failure'}]}),false);
});
test('completion independently re-fetches PR and checks; wrong repository/head cannot complete',async()=>{
 const pr={number:18,head:{sha:'b'.repeat(40)},base:{repo:{id:10},ref:'main'},merged:true};
 const github={getPullRequest:async()=>pr,getChecks:async()=>({runs:[{name:'test',id:1,status:'completed',conclusion:'success'}],statuses:[]})};
 const a={kind:'pull_request',number:18,sha:pr.head.sha};
 assert.equal((await completionEvidence(connection,a,github)).checksPassed,true);
 assert.equal((await completionEvidence(connection,{...a,sha:'c'.repeat(40)},github)).verified,false);
 pr.base.repo.id=99;assert.equal((await completionEvidence(connection,a,github)).verified,false);
});
test('normalization bounds commit batches, changed filenames and message size',()=>{
 const events=normalizeGithubEvent('push',{ref:'refs/heads/main',commits:Array(101).fill({id:'a'.repeat(40),message:'x'.repeat(5000),modified:Array(100).fill('file.js')})});
 assert.equal(events.length,100);assert.equal(events[0].title.length,1000);assert.equal(events[0].files.length,50);
 assert.deepEqual(normalizeGithubEvent('push',{deleted:true,commits:[]}),[]);
});
test('persistent queue uses unique delivery insertion and rejects unrelated repository identity',async()=>{
 const saved=pool.query;let inserts=0;
 pool.query=async(sql,params)=>{if(sql.startsWith('SELECT c.'))return {rows:params[0]===10?[{project_id:1}]:[]};assert.ok(sql.includes('ON CONFLICT(delivery_id) DO NOTHING'));return {rows:inserts++?[]:[{id:1}]};};
 try{assert.equal((await repository.enqueue('id','push',{repository:{id:10,full_name:'team/repo'}})).duplicate,false);assert.equal((await repository.enqueue('id','push',{repository:{id:10,full_name:'team/repo'}})).duplicate,true);assert.equal(await repository.enqueue('id','push',{repository:{id:99,full_name:'team/repo'}}),null);}
 finally{pool.query=saved;}
});
test('task transition, sync history and existing member activity are one transaction',async()=>{
 const saved=pool.connect,queries=[];
 const a={id:1,project_id:1,repository_id:10,task_id:103,task_version:0,decision:'PENDING',outcome:'MATCHED',metadata:activity};
 pool.connect=async()=>({query:async(sql,params)=>{queries.push({sql,params});if(sql.startsWith('SELECT * FROM github_activities'))return {rows:[a]};if(sql.startsWith('SELECT c.'))return {rows:[{...connection,enabled:true,github_repo_url:'https://github.com/team/repo'}]};if(sql.startsWith('SELECT * FROM tasks'))return {rows:[{...task,id:103,project_id:1,github_status_version:0}]};return {rows:[]};},release(){}});
 try{await applyActivity(1);assert.ok(queries.some(q=>q.sql.startsWith('UPDATE tasks')&&q.params[1]==='IN_PROGRESS'));assert.ok(queries.some(q=>q.sql.includes('INSERT INTO github_sync_history')));assert.ok(queries.some(q=>q.sql.includes('INSERT INTO activity_log')));assert.equal(queries.at(-1).sql,'COMMIT');}
 finally{pool.connect=saved;}
});
test('sync management routes require membership and owners; review excludes viewers',async()=>{
 const saved={user:userRepository.findById,member:projectMemberRepository.findByProjectAndUser};let role=null;
 userRepository.findById=async()=>({id:1,role:'TEAM_MEMBER'});projectMemberRepository.findByProjectAndUser=async()=>role?{role}:null;
 const token=generateToken(1,false),auth={Authorization:'Bearer '+token};
 try {
  assert.equal((await request(app).get('/api/github/projects/9/sync').set(auth)).status,403);
  role='DEVELOPER';assert.equal((await request(app).put('/api/github/projects/9/sync').set(auth).send({})).status,403);
  role='VIEWER';assert.equal((await request(app).post('/api/github/projects/9/sync/activities/1/review').set(auth).send({})).status,403);
  assert.equal((await request(app).get('/api/github/projects/9/sync')).status,401);
 }finally{userRepository.findById=saved.user;projectMemberRepository.findByProjectAndUser=saved.member;}
});
