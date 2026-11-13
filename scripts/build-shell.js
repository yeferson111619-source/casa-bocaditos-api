import {readdir,readFile,writeFile} from 'node:fs/promises';
const assets=(await readdir('dist/assets')).filter(name=>/\.(js|css)$/.test(name)).map(name=>'/assets/'+name);
const shell=['/','/index.html','/manifest.webmanifest','/icon-192.png','/icon-512.png',...assets];
let sw=await readFile('dist/sw.js','utf8');
sw=sw.replace('__SHELL__',JSON.stringify(shell)).replace('bocaditos-shell-v1','bocaditos-shell-'+assets.join('').replace(/[^a-z0-9]/gi,'').slice(-60));
await writeFile('dist/sw.js',sw);
