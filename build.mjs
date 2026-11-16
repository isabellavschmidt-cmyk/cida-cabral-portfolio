import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const sourceOrigin = 'https://cida-cabral-portfolio.tidystrawberry8.chatgpt.site';
const output = 'dist';
const files = [
  'index.html', 'style.css', 'app.js',
  'assets/cida-cabral.png', 'assets/curriculo-cida-cabral.pdf',
  'assets/retiro-historico.jpg', 'assets/favicon.svg',
  'assets/dm-sans.css', 'assets/cormorant.css',
  'assets/dm-sans-license.txt', 'assets/cormorant-license.txt',
  'assets/dm-sans-0.ttf', 'assets/dm-sans-1.ttf',
  'assets/dm-sans-2.ttf', 'assets/dm-sans-3.ttf',
  'assets/cormorant-0.ttf', 'assets/cormorant-1.ttf',
  'assets/cormorant-2.ttf', 'assets/cormorant-3.ttf',
  'assets/cormorant-4.ttf'
];
const content = new Map();
const localSnapshot = await access('site/index.html').then(() => true, () => false);
const siteUrl = (process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
if (!siteUrl || new URL(siteUrl).protocol !== 'https:') {
  throw new Error('Informe SITE_URL ou use a variavel RENDER_EXTERNAL_URL.');
}

async function download(file) {
  const url = sourceOrigin + (file === 'index.html' ? '/' : '/' + file);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
        headers: { 'User-Agent': 'CidaCabralPortfolioMigration/1.0' }
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      if (new URL(response.url).origin !== sourceOrigin) throw new Error('Redirecionamento externo inesperado');
      const data = Buffer.from(await response.arrayBuffer());
      if (data.length === 0 || data.length > 8 * 1024 * 1024) throw new Error('Tamanho inesperado');
      return data;
    } catch (error) {
      if (attempt === 2) throw new Error(file + ': ' + error.message);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

function validate(file, data) {
  const text = data.toString('utf8');
  if (file === 'index.html') {
    for (const marker of ['hero-title', 'Cida', 'Cabral', 'Retiro dos Artistas', 'https://www.instagram.com/cidacabral/', 'Entrar em contato']) {
      if (!text.includes(marker)) throw new Error('Pagina original incompleta: ' + marker);
    }
  } else if (file.endsWith('.png')) {
    if (data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('PNG invalido: ' + file);
  } else if (file.endsWith('.jpg')) {
    if (data.subarray(0, 3).toString('hex') !== 'ffd8ff') throw new Error('JPEG invalido: ' + file);
  } else if (file.endsWith('.pdf')) {
    if (!text.startsWith('%PDF-')) throw new Error('PDF invalido: ' + file);
  } else if (file.endsWith('.ttf')) {
    if (!['00010000', '4f54544f', '74727565'].includes(data.subarray(0, 4).toString('hex'))) throw new Error('Fonte invalida: ' + file);
  } else if (/^\s*<!doctype html|^\s*<html/i.test(text)) {
    throw new Error('Documento HTML recebido no lugar de ' + file);
  }
}

for (const file of files) {
  const data = localSnapshot ? await readFile(path.join('site', file)) : await download(file);
  validate(file, data);
  content.set(file, data);
}
let html = content.get('index.html').toString('utf8').split(sourceOrigin).join(siteUrl);
if (!/<link[^>]+rel=["']canonical["']/i.test(html)) {
  html = html.replace('</head>', '  <link rel="canonical" href="' + siteUrl + '/">\n</head>');
}
content.set('index.html', Buffer.from(html));

function verifyLocalReference(reference, parent) {
  if (!reference || /^(?:#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) return;
  const localPath = decodeURIComponent(new URL(reference, 'https://local.invalid/' + parent).pathname).replace(/^\//, '');
  if (localPath && !content.has(localPath)) throw new Error('Arquivo referenciado ausente: ' + localPath);
}
for (const match of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)) verifyLocalReference(match[1], 'index.html');
for (const [file, data] of content) {
  if (file.endsWith('.css')) {
    for (const match of data.toString('utf8').matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/gi)) verifyLocalReference(match[1], file);
  }
  await mkdir(path.dirname(path.join(output, file)), { recursive: true });
  await writeFile(path.join(output, file), data);
  console.log('OK ' + file + ' (' + data.length + ' bytes)');
}
const syntax = spawnSync(process.execPath, ['--check', path.join(output, 'app.js')], { encoding: 'utf8' });
if (syntax.status !== 0) throw new Error('JavaScript invalido: ' + syntax.stderr);
const manifest = {
  site: siteUrl,
  builtAt: new Date().toISOString(),
  commit: process.env.RENDER_GIT_COMMIT || null,
  contact: 'https://www.instagram.com/cidacabral/',
  files: Array.from(content, ([file, data]) => ({
    path: file,
    bytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex')
  }))
};
await writeFile(path.join(output, 'build-info.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Validacao concluida: ' + files.length + ' arquivos, referencias locais e contato conferidos.');

if (!localSnapshot) {
  const liveManifestResponse = await fetch(siteUrl + '/build-info.json', { signal: AbortSignal.timeout(30000) });
  if (!liveManifestResponse.ok) throw new Error('Verificacao publica: manifesto indisponivel');
  const liveManifest = await liveManifestResponse.json();
  if (liveManifest.site !== siteUrl || liveManifest.files.length !== files.length) throw new Error('Manifesto publico inesperado');
  for (const entry of liveManifest.files) {
    const response = await fetch(siteUrl + '/' + (entry.path === 'index.html' ? '' : entry.path), { signal: AbortSignal.timeout(30000) });
    if (!response.ok || new URL(response.url).origin !== siteUrl) throw new Error('Recurso publico indisponivel: ' + entry.path);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error('Conteudo publico diverge: ' + entry.path);
  }
  console.log('CIDA_PUBLIC_VERIFIED ' + files.length + ' arquivos HTTPS sem autenticacao');
  for (const [file, data] of content) {
    const encoded = data.toString('base64');
    const total = Math.ceil(encoded.length / 8000);
    for (let index = 0; index < total; index++) {
      console.log('CIDA_SNAPSHOT_V1 ' + JSON.stringify({ path: file, index, total, data: encoded.slice(index * 8000, (index + 1) * 8000) }));
    }
  }
  console.log('CIDA_SNAPSHOT_COMPLETE ' + content.size);
}
