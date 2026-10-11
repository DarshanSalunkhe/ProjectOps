import {auditEnvironment} from './environment.mjs';
auditEnvironment();
await import('../../backend/server.js');
