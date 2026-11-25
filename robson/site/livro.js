const pdfUrl = new URL('livros/a-procura-de-uma-familia.pdf', import.meta.url).href;
const stage = document.querySelector('#page-stage');
const pageBox = document.querySelector('#pdf-page');
const canvas = document.querySelector('#pdf-canvas');
const textContainer = document.querySelector('#text-layer');
const status = document.querySelector('#reader-status');
const errorBox = document.querySelector('#reader-error');
const pageInput = document.querySelector('#page-number');
const previous = document.querySelector('#previous-page');
const next = document.querySelector('#next-page');
const chapter = document.querySelector('#chapter-select');
const zoomOut = document.querySelector('#zoom-out');
const zoomIn = document.querySelector('#zoom-in');
const fitButton = document.querySelector('#fit-page');
const zoomLabel = document.querySelector('#zoom-level');
const pageText = document.querySelector('#page-text');
const progress = document.querySelector('#reading-progress');
let library, documentPdf, rendering = false, queued = false, pageNumber = 1, zoom = 1;
let lastWidth = 0, resizeTimer;
const chapters = [...chapter.options].map(option => Number(option.value));
function pageFromHash() {
  const value = /^#pagina=(\d+)$/.exec(location.hash)?.[1];
  return value ? Math.max(1, Math.min(documentPdf?.numPages || 51, Number(value))) : 1;
}
function updateControls() {
  const total = documentPdf?.numPages || 51;
  previous.disabled = !documentPdf || pageNumber === 1;
  next.disabled = !documentPdf || pageNumber === total;
  pageInput.disabled = chapter.disabled = fitButton.disabled = !documentPdf;
  zoomOut.disabled = !documentPdf || zoom <= 0.75;
  zoomIn.disabled = !documentPdf || zoom >= 2;
  pageInput.value = pageNumber;
  pageInput.max = total;
  document.querySelector('#page-total').textContent = `de ${total}`;
  chapter.value = String(chapters.filter(number => number <= pageNumber).at(-1) || 1);
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
}
function fail() {
  errorBox.hidden = false;
  stage.hidden = true;
  stage.setAttribute('aria-busy', 'false');
  status.textContent = 'O PDF pode ser aberto ou baixado diretamente.';
}
async function renderPage() {
  if (!documentPdf) return;
  if (rendering) { queued = true; return; }
  rendering = true;
  const requested = pageNumber;
  const requestedZoom = zoom;
  stage.setAttribute('aria-busy', 'true');
  status.textContent = `Carregando página ${requested}…`;
  try {
    const page = await documentPdf.getPage(requested);
    const base = page.getViewport({scale: 1});
    const style = getComputedStyle(stage);
    const available = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const fitWidth = Math.min(available, 780);
    const viewport = page.getViewport({scale: fitWidth / base.width * requestedZoom});
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(viewport.width * density);
    canvas.height = Math.ceil(viewport.height * density);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    pageBox.style.width = `${viewport.width}px`;
    pageBox.style.height = `${viewport.height}px`;
    pageBox.style.setProperty('--scale-factor', viewport.scale);
    pageBox.style.setProperty('--total-scale-factor', viewport.scale);
    textContainer.replaceChildren();
    await page.render({canvasContext: canvas.getContext('2d'), viewport, transform: density === 1 ? undefined : [density, 0, 0, density, 0, 0]}).promise;
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('').trim();
    pageText.textContent = text || (requested === 1 ? 'Capa do livro À procura de uma família, de Robson Motta. Rubi Editorial. Apoio: Retiro dos Artistas.' : 'Esta página contém fotografias ou elementos gráficos, sem texto extraível.');
    try {
      await new library.TextLayer({textContentSource: content, container: textContainer, viewport}).render();
    } catch {
      // The original page and its readable transcription remain available.
      textContainer.replaceChildren();
    }
    errorBox.hidden = true;
    stage.hidden = false;
    stage.setAttribute('aria-busy', 'false');
    stage.setAttribute('aria-label', `Página ${requested} de ${documentPdf.numPages}. Use as teclas de seta para navegar.`);
    status.textContent = `Página ${requested} de ${documentPdf.numPages}`;
    progress.textContent = `${Math.round(requested / documentPdf.numPages * 100)}% do livro · ${documentPdf.numPages} páginas`;
    lastWidth = stage.clientWidth;
  } catch (error) {
    console.error('Não foi possível exibir a página do livro.', error);
    fail();
  } finally {
    rendering = false;
    if (queued) { queued = false; renderPage(); }
  }
}
function goToPage(value, scroll = true) {
  if (!documentPdf) return;
  const number = Number(value);
  if (!Number.isFinite(number)) { updateControls(); return; }
  pageNumber = Math.max(1, Math.min(documentPdf.numPages, Math.trunc(number)));
  history.replaceState(null, '', `#pagina=${pageNumber}`);
  updateControls();
  renderPage();
  if (scroll) stage.scrollIntoView({block: 'start', behavior: 'instant'});
}
function changeZoom(value) {
  zoom = Math.max(0.75, Math.min(2, Math.round(value * 100) / 100));
  updateControls(); renderPage();
}
previous.addEventListener('click', () => goToPage(pageNumber - 1));
next.addEventListener('click', () => goToPage(pageNumber + 1));
document.querySelector('#page-form').addEventListener('submit', event => {event.preventDefault(); goToPage(pageInput.value);});
pageInput.addEventListener('change', () => goToPage(pageInput.value));
chapter.addEventListener('change', () => goToPage(chapter.value));
zoomIn.addEventListener('click', () => changeZoom(zoom + 0.25));
zoomOut.addEventListener('click', () => changeZoom(zoom - 0.25));
fitButton.addEventListener('click', () => changeZoom(1));
document.querySelector('#retry-reader').addEventListener('click', () => location.reload());
stage.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault(); goToPage(pageNumber + (event.key === 'ArrowRight' ? 1 : -1), false);
  }
});
window.addEventListener('hashchange', () => goToPage(pageFromHash()));
new ResizeObserver(() => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {if (documentPdf && stage.clientWidth !== lastWidth) renderPage();}, 180);
}).observe(stage);
try {
  library = await import('./assets/pdfjs/pdf.min.mjs');
  library.GlobalWorkerOptions.workerSrc = new URL('./assets/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
  const loading = library.getDocument({url: pdfUrl, isEvalSupported: false, wasmUrl: new URL('./assets/pdfjs/wasm/', import.meta.url).href, standardFontDataUrl: new URL('./assets/pdfjs/standard_fonts/', import.meta.url).href});
  loading.onProgress = ({loaded, total}) => {if (!documentPdf && total) status.textContent = `Carregando livro… ${Math.min(100, Math.round(loaded / total * 100))}%`;};
  documentPdf = await loading.promise;
  pageNumber = pageFromHash();
  updateControls();
  await renderPage();
} catch (error) {
  console.error('Não foi possível carregar o livro.', error);
  fail();
}
