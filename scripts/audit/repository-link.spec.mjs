import {test,expect} from '@playwright/test';
test('repository link saves and remains visible after reload even if GitHub is unreachable',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('token','repo-fixture'));
 let project={id:1,name:'Repo Fixture',status:'PLANNING',created_by:1,github_repo_url:null};
 await page.route('**/api/**',async route=>{
  const url=new URL(route.request().url());let data=[];
  if(url.pathname.endsWith('/auth/me'))data={id:1,name:'Owner',email:'owner@example.invalid',role:'DEVELOPER'};
  else if(url.pathname.endsWith('/projects/1')) {if(route.request().method()==='PATCH')project={...project,...route.request().postDataJSON()};data=project;}
  else if(url.pathname.endsWith('/projects'))data=[project];
  else if(url.pathname.endsWith('/members'))data={members:[{user_id:1,role:'OWNER'}]};
  else if(url.pathname.includes('/health/'))data={health:{score:null},risks:[]};
  else if(url.pathname.includes('/github/'))data={connected:false,error:'Repository metadata is temporarily unavailable.'};
  await route.fulfill({json:{success:true,data}});
 });
 await page.goto('/projects/1?tab=repository');await page.getByRole('button',{name:'Link Repository',exact:true}).click();
 await page.getByLabel('GitHub Repository URL').fill('https://github.com/example/project');await page.getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.getByText('https://github.com/example/project',{exact:true})).toBeVisible();await expect(page.getByText('No repository linked yet.')).toHaveCount(0);
 await page.reload();await expect(page.getByText('https://github.com/example/project',{exact:true})).toBeVisible();await expect(page.getByText('No repository linked yet.')).toHaveCount(0);
});
