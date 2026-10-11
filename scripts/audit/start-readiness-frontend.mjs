import {createServer} from 'vite';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../../frontend');process.chdir(root);process.env.VITE_API_URL='http://127.0.0.1:5100/api';
const server=await createServer({root,server:{host:'127.0.0.1',port:5178,strictPort:true}});await server.listen();
