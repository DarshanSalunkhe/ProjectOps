import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../backend/src/config/database.js';
import { aiService } from '../../backend/src/services/aiService.js';
import { builtinAnswer, validateDates } from '../../backend/src/services/aiBuiltinService.js';

test('builtin project answers and strict calendar dates', () => {
 const ctx = { project: {name:'Demo',status:'ACTIVE'},tasks:[{title:'API',status:'BLOCKED',deadline:'2026-01-01',assignees:[{id:1}]}],members:[{id:1,name:'Alex'}],milestones:[] };
 assert.match(builtinAnswer('What tasks are overdue?',ctx,new Date('2026-10-11')), /API/);
 assert.match(builtinAnswer('Who has the most work assigned?',ctx), /Alex: 1/);
 assert.equal(builtinAnswer('Plan delivery by 2026-12-12',ctx), null);
 assert.equal(validateDates('2026-02-30'),false); assert.equal(validateDates('2028-02-29'),true);
});

test('local personalization, dedup, scoped cache, Gemini fallback, budgets and errors', async () => {
 const originalConnect = pool.connect, originalFetch = globalThis.fetch;
 const saved = {...process.env}; let localFails=false, calls=0, quota=10, logs=[];
 pool.connect=async()=>({query:async(sql,params)=>{
   if(sql.includes('INSERT INTO ai_usage_log')) logs.push(params);
   if(sql.includes('ai_monthly_quota_usd')) return {rows:[{ai_monthly_quota_usd:quota}]};
   if(sql.includes('AS spent')) return {rows:[{spent:0}]};
   return {rows:[{id:1}]};
 },release(){}});
 globalThis.fetch=async(url,opts)=>{ calls++; const body=JSON.parse(opts.body);
   if(url.includes('/api/chat')) { if(localFails) throw new Error('offline'); assert.equal(body.model,'gemma-test'); return {ok:true,json:async()=>({message:{content:'Personalized for Alex'},prompt_eval_count:20,eval_count:10})}; }
   assert.equal(opts.headers['x-goog-api-key'],'test-key');
   return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Cloud fallback'}]}}],usageMetadata:{promptTokenCount:20,candidatesTokenCount:10}})};
 };
 process.env.OLLAMA_MODEL='gemma-test'; process.env.OLLAMA_ENABLED='true'; process.env.GEMINI_API_KEY='test-key';
 const messages=[{role:'system',content:'Project Demo; Alex has React skills'},{role:'user',content:'Recommend assignments'}];
 try {
   const results=await Promise.all([aiService.call('CHAT',messages,{userId:1,projectId:10}),aiService.call('CHAT',messages,{userId:1,projectId:10})]);
   assert.equal(results[0].provider,'ollama');assert.equal(calls,1);
   assert.equal((await aiService.call('CHAT',messages,{userId:1,projectId:10})).cached,true);
   await aiService.call('CHAT',messages,{userId:2,projectId:10});assert.equal(calls,2);
   aiService.invalidateProject(10); localFails=true;
   assert.equal((await aiService.call('CHAT',messages,{userId:1,projectId:10})).provider,'gemini');
   assert.equal(logs.length,3);assert.ok(logs[2][7]>0);
   quota=0; await assert.rejects(aiService.call('CHAT',messages,{userId:3,projectId:10}),e=>e.statusCode===429);
   delete process.env.GEMINI_API_KEY;await assert.rejects(aiService.call('CHAT',messages,{userId:4,projectId:10}),e=>e.statusCode===503);
   await assert.rejects(aiService.call('CHAT',messages,{}),e=>e.statusCode===401);
 } finally {pool.connect=originalConnect;globalThis.fetch=originalFetch;process.env=saved;}
});
