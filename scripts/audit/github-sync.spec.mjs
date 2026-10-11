import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
for(const [name,width,height]of[['desktop',1365,900],['mobile',390,844]])test(`${name}: GitHub sync settings and review controls`,async({page})=>{
 await page.setViewportSize({width,height});await page.addInitScript(()=>localStorage.setItem('token','sync-fixture'));
 const runtime=[],actions=[];page.on('pageerror',e=>runtime.push(e.message));
 let connection={project_id:1,full_name:'team/repo',enabled:true,integration_branch:'main',required_checks:['test'],require_confirmation:true};
 let activities=[{id:10,task_id:103,task_title:'Member invitations',confidence:0.8,method:'GEMINI',reason:'Review task association before applying.',decision:'PENDING',outcome:'NEEDS_REVIEW',metadata:{kind:'pull_request',title:'Add invitations',merged:true,url:'https://github.com/team/repo/pull/7'}}];
 await page.route('**/api/**',async route=>{
  const r=route.request(),url=new URL(r.url());let data=[];
  if(url.pathname.endsWith('/auth/me'))data={id:1,name:'Owner',email:'owner@example.invalid',role:'PROJECT_OWNER'};
  else if(url.pathname.endsWith('/projects/1'))data={id:1,name:'Sync Demo',created_by:1,status:'ACTIVE',github_repo_url:'https://github.com/team/repo'};
  else if(url.pathname.endsWith('/projects'))data=[{id:1,name:'Sync Demo'}];
  else if(url.pathname.endsWith('/members'))data={members:[{user_id:1,role:'OWNER'}]};
  else if(url.pathname.endsWith('/tasks'))data=[{id:103,project_id:1,title:'Member invitations',status:'IN_PROGRESS',github_sync_paused:false}];
  else if(url.pathname.includes('/health/'))data={health:{score:90},risks:[]};
  else if(url.pathname.endsWith('/repository'))data={connected:true,repo:{full_name:'team/repo',html_url:'https://github.com/team/repo',default_branch:'main'},commits:[],pullRequests:[]};
  else if(url.pathname.endsWith('/sync')) {
   if(r.method()==='PUT'){actions.push(r.postDataJSON());connection={...connection,enabled:r.postDataJSON().enabled};data=connection;}
   else data={serviceEnabled:true,connection,activities,history:[],errors:[]};
  }else if(url.pathname.endsWith('/review')){actions.push(r.postDataJSON());activities=activities.map(a=>({...a,outcome:'RECORDED'}));}
  await route.fulfill({json:{success:true,data}});
 });
 await page.goto('/projects/1?tab=repository');
 await expect(page.getByRole('heading',{name:'GitHub Activity & AI Sync',exact:true})).toBeVisible();
 await page.getByLabel('Enable automatic task synchronization').uncheck();
 await page.getByRole('button',{name:'Save sync settings',exact:true}).click();await expect(page.getByText('Synchronization settings saved.',{exact:true})).toBeVisible();
 expect(actions[0]).toMatchObject({url:'https://github.com/team/repo',enabled:false,requiredChecks:['test'],requireConfirmation:true});
 await expect(page.getByRole('button',{name:'Confirm match and completion'})).toBeDisabled();
 await page.getByLabel('Enable automatic task synchronization').check();
 await page.getByRole('button',{name:'Save sync settings',exact:true}).click();await expect(page.getByText('Synchronization settings saved.',{exact:true})).toBeVisible();
 await fs.mkdir('docs/github-sync-evidence',{recursive:true});
 await page.getByRole('heading',{name:'Recent activity and match review'}).scrollIntoViewIfNeeded();
 await page.screenshot({path:`docs/github-sync-evidence/${name}-review.png`,fullPage:false});
 await page.getByRole('button',{name:'Confirm match and completion'}).click();await expect(page.getByText('Completion reviewed; backend conditions still apply.',{exact:true})).toBeVisible();
 expect(actions[2]).toEqual({decision:'CONFIRMED',taskId:103,approveCompletion:true});
 expect(await page.evaluate(()=>window.scrollY)).toBe(0);expect(runtime).toEqual([]);
});
