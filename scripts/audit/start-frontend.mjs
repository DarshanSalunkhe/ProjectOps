import {createServer} from 'vite';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
process.env.VITE_API_URL='http://127.0.0.1:5000/api';
process.chdir(path.join(root,'frontend'));
const server=await createServer({root:path.join(root,'frontend'),server:{host:'127.0.0.1',port:5173,strictPort:true}});
await server.listen(); server.printUrls();
