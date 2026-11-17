import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const source='robson/site', output='robson/dist';
const siteUrl=(process.env.RENDER_EXTERNAL_URL||process.env.SITE_URL||'').replace(/\/$/,'');
if(!siteUrl||new URL(siteUrl).protocol!=='https:')throw new Error('Endereco HTTPS de publicacao ausente');
await mkdir(path.join(output,'assets'),{recursive:true});
const photographs=[
 ['assets/robson-retrato.jpg','https://retirodosartistas.org.br/wp-content/uploads/2025/12/IMG_1698-683x1024.jpg'],
 ['assets/retiro-01.jpg','https://retirodosartistas.org.br/wp-content/uploads/2023/11/3-1.jpg'],
 ['assets/retiro-02.jpg','https://retirodosartistas.org.br/wp-content/uploads/2023/11/8.jpg']
];
async function get(url){
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'Mozilla/5.0 RobsonMottaPortfolio/1.0'}});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const bytes=Buffer.from(await response.arrayBuffer());
   if(!bytes.length||bytes.length>12*1024*1024)throw new Error('Tamanho de arquivo inesperado');
   return bytes;
  }catch(error){if(attempt===2)throw new Error(new URL(url).hostname+': '+error.message);await new Promise(r=>setTimeout(r,1000));}
 }
}
for(const [file,url] of photographs){
 const bytes=await get(url);
 if(bytes.subarray(0,3).toString('hex')!=='ffd8ff')throw new Error('Fotografia invalida: '+file);
 await writeFile(path.join(output,file),bytes);
 console.log('Imagem verificada: '+file+' ('+bytes.length+' bytes)');
}
const fontUrl='https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap';
let fonts=(await get(fontUrl)).toString('utf8');
if(!fonts.includes('@font-face'))throw new Error('Folha de fontes invalida');
const fontUrls=[...new Set([...fonts.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(x=>x[1]))];
if(!fontUrls.length||fontUrls.length>60)throw new Error('Fontes indisponiveis');
for(let i=0;i<fontUrls.length;i++){
 const url=fontUrls[i],extension=new URL(url).pathname.match(/\.(woff2?|ttf|otf)$/i)?.[1]||'ttf';
 const name='font-'+i+'.'+extension;
 const data=await get(url);
 if(/^\s*</.test(data.toString('utf8',0,100)))throw new Error('Fonte invalida');
 await writeFile(path.join(output,'assets',name),data);
 fonts=fonts.split(url).join(name);
}
await writeFile(path.join(output,'assets/fonts.css'),fonts);
for(const file of ['index.html','style.css','app.js','assets/favicon.svg']){
 let text=await readFile(path.join(source,file),'utf8');
 if(file==='index.html')text=text.split('__SITE_URL__').join(siteUrl);
 await writeFile(path.join(output,file),text);
}
const html=await readFile(path.join(output,'index.html'),'utf8');
for(const marker of ['Robson Motta','robsonmotta@retirodosartistas.org','https://retirodosartistas.org.br/','https://globoplay.globo.com/v/934995/']){
 if(!html.includes(marker))throw new Error('Conteudo obrigatorio ausente: '+marker);
}
if(html.includes('__SITE_URL__')||html.includes('cidacabral')||html.includes('chatgpt.site'))throw new Error('Referencia incorreta na pagina');
const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(x=>x[1]);
if(new Set(ids).size!==ids.length)throw new Error('Identificador HTML duplicado');
async function validateReference(ref,parent){
 if(ref.startsWith('#')){if(!ids.includes(ref.slice(1)))throw new Error('Ancora inexistente: '+ref);return;}
 if(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref))return;
 const local=decodeURIComponent(new URL(ref,'https://local.invalid/'+parent).pathname).replace(/^\//,'');
 if(local)await readFile(path.join(output,local));
}
for(const x of html.matchAll(/(?:src|href|data-image)=["']([^"']+)["']/g))await validateReference(x[1],'index.html');
for(const file of ['style.css','assets/fonts.css']){
 const css=await readFile(path.join(output,file),'utf8');
 for(const x of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g))await validateReference(x[1],file);
}
const syntax=spawnSync(process.execPath,['--check',path.join(output,'app.js')],{encoding:'utf8'});
if(syntax.status!==0)throw new Error(syntax.stderr||'JavaScript invalido');
const rows=[];
async function inventory(dir=''){
 for(const entry of await readdir(path.join(output,dir),{withFileTypes:true})){
  const relative=path.posix.join(dir,entry.name);
  if(entry.isDirectory())await inventory(relative);
  else{const bytes=await readFile(path.join(output,relative));rows.push({path:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
 }
}
await inventory();
await writeFile(path.join(output,'build-info.json'),JSON.stringify({site:siteUrl,commit:process.env.RENDER_GIT_COMMIT,builtAt:new Date().toISOString(),files:rows,contact:'robsonmotta@retirodosartistas.org'},null,2));
await writeFile(path.join(output,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+siteUrl+'/sitemap.xml\n');
await writeFile(path.join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+siteUrl+'/</loc></url></urlset>');
console.log('ROBSON_BUILD_OK '+rows.length+' arquivos; fotografias, fontes, navegacao e contato verificados.');

// Check the previously published version without blocking a repair deploy.
async function verifyPublishedSite(){
 const manifest=JSON.parse((await get(siteUrl+'/build-info.json')).toString('utf8'));
 if(manifest.site!==siteUrl||!Array.isArray(manifest.files)||manifest.files.length>80)throw new Error('Manifesto publicado invalido');
 for(const file of manifest.files){
  if(!/^[a-zA-Z0-9_./-]+$/.test(file.path)||file.path.includes('..')||file.path.startsWith('/')||!/^[a-f0-9]{64}$/.test(file.sha256))throw new Error('Referencia de arquivo invalida');
  const bytes=await get(siteUrl+'/'+file.path);
  if(bytes.length!==file.bytes||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw new Error('Arquivo publicado divergente: '+file.path);
 }
 const home=await get(siteUrl+'/');
 const expected=manifest.files.find(file=>file.path==='index.html');
 if(!expected||createHash('sha256').update(home).digest('hex')!==expected.sha256)throw new Error('Pagina inicial publicada divergente');
 console.log('ROBSON_LIVE_OK '+manifest.files.length+' arquivos publicados conferidos por HTTPS; pagina inicial, imagens, fontes, CSS e JavaScript.');
}
try{await verifyPublishedSite();}catch(error){console.log('ROBSON_LIVE_CHECK_UNAVAILABLE '+error.message);}
