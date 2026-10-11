import path from 'node:path';
import {defineConfig} from '@playwright/test';
const root=path.resolve(import.meta.dirname,'../..');
export default defineConfig({testDir:'.',testMatch:['login-regression.spec.mjs','github-sync.spec.mjs','readiness-actions.spec.mjs','readiness.spec.mjs','layout-navigation.spec.mjs','repository-link.spec.mjs','ai-auth-buttons.spec.mjs'],workers:1,timeout:90000,reporter:[['list'],['json',{outputFile:'.audit/readiness-browser-results.json'}]],outputDir:'../../.audit/readiness-browser',use:{baseURL:'http://127.0.0.1:5178',headless:true,viewport:{width:1365,height:900},screenshot:'only-on-failure',trace:'retain-on-failure'},webServer:[{cwd:root,command:'node scripts/audit/start-readiness-backend.mjs',url:'http://127.0.0.1:5100/api/health',reuseExistingServer:false,timeout:60000},{cwd:root,command:'node scripts/audit/start-readiness-frontend.mjs',url:'http://127.0.0.1:5178/login',reuseExistingServer:false,timeout:30000}]});

