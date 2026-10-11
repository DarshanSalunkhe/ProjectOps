import {auditEnvironment} from './environment.mjs';
auditEnvironment();
process.env.PORT='5100';process.env.FRONTEND_URL='http://127.0.0.1:5178';process.env.CORS_ORIGIN='http://127.0.0.1:5178';process.env.OLLAMA_ENABLED='false';
await import('../../backend/server.js');
