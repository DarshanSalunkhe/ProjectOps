import test from 'node:test';
import assert from 'node:assert/strict';
import { projectRepository } from '../../backend/src/repositories/projectRepository.js';
import { updateProjectValidation } from '../../backend/src/validators/projectValidators.js';

test('project repository persists and clears the GitHub URL without updating unrelated fields',async()=>{
 let saved=null;const calls=[];
 const client={query:async(sql,params)=>{calls.push({sql,params});saved=params[0];return {rows:[{id:7,github_repo_url:saved}]};}};
 const url='https://github.com/example/project';
 assert.equal((await projectRepository.update(7,{github_repo_url:url,created_by:99},client)).github_repo_url,url);
 assert.match(calls[0].sql,/SET github_repo_url = \$1/);assert.deepEqual(calls[0].params,[url,7]);assert.doesNotMatch(calls[0].sql,/created_by/);
 assert.equal((await projectRepository.update(7,{github_repo_url:null},client)).github_repo_url,null);
});
test('repository URL validation accepts GitHub repositories and rejects other hosts and invalid paths',async()=>{
 const {validationResult}=await import('express-validator');
 for(const [url,valid] of [['https://github.com/example/project',true],['',true],[null,true],['https://example.com/project',false],['https://github.com/example',false],['javascript:alert(1)',false]]) {
  const req={body:{github_repo_url:url}};for(const chain of updateProjectValidation) if(chain.run) await chain.run(req);
  assert.equal(validationResult(req).isEmpty(),valid,String(url));
 }
});
test('database repository URL survives a reread (transaction rolled back)', {skip:process.env.VERIFY_REPO_DATABASE!=='1'},async()=>{
 const {default:pool}=await import('../../backend/src/config/database.js');const client=await pool.connect();
 try {await client.query('BEGIN');const {rows:[project]}=await client.query('SELECT id FROM projects ORDER BY id LIMIT 1');assert.ok(project);
  const url='https://github.com/example/persistence-check';await projectRepository.update(project.id,{github_repo_url:url},client);
  const {rows:[saved]}=await client.query('SELECT github_repo_url FROM projects WHERE id=$1',[project.id]);assert.equal(saved.github_repo_url,url);
 }finally{await client.query('ROLLBACK');client.release();await pool.end();}
});
