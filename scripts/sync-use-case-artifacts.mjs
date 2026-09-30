/** Deploy curated use-case artifacts into apps/web/public/targets/. */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcesDir = join(root, 'apps/web/artifacts/sources');
const manifestPath = join(root, 'apps/web/artifacts/manifest.json');
const targetsRoot = join(root, 'apps/web/public/targets');
const catalogPath = join(root, 'apps/web/src/feature/use-cases/artifacts.json');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const TRANSPARENT_SCROLLBAR_STYLE = `<style id="visualspec-scrollbar">html,body{scrollbar-width:thin;scrollbar-color:rgba(32,38,31,.16) transparent}html::-webkit-scrollbar,body::-webkit-scrollbar{width:8px;height:8px}html::-webkit-scrollbar-track,body::-webkit-scrollbar-track{background:transparent}html::-webkit-scrollbar-thumb,body::-webkit-scrollbar-thumb{background:rgba(32,38,31,.12);border-radius:999px;border:2px solid transparent;background-clip:padding-box}</style>`;

/** @param {string} html */
function injectTransparentScrollbars(html) {
  if (html.includes('visualspec-scrollbar')) return html;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${TRANSPARENT_SCROLLBAR_STYLE}</head>`);
  }
  return `${TRANSPARENT_SCROLLBAR_STYLE}${html}`;
}

/** @param {string} slug @param {Record<string, unknown>} entry */
function writeIndex(slug, entry) {
  const kind = entry.kind;
  if (kind === 'html') return;

  const asset = entry.asset ?? entry.source;
  const title = entry.title ?? slug;

  if (kind === 'video') {
    const muted = entry.muted !== false ? ' muted' : '';
    const loop = entry.loop ? ' loop' : '';
    const autoplay = entry.loop || entry.muted !== false ? ' autoplay' : '';
    writeFileSync(
      join(targetsRoot, slug, 'index.html'),
      injectTransparentScrollbars(`<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><style>html,body{margin:0;height:100%;background:#111}video{width:100%;height:100%;object-fit:contain;display:block;background:#111}</style></head><body><video src="${asset}" controls playsinline${autoplay}${muted}${loop}></video></body></html>\n`)
    );
    return;
  }

  if (kind === 'model') {
    writeFileSync(
      join(targetsRoot, slug, 'index.html'),
      injectTransparentScrollbars(`<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script><style>html,body{margin:0;height:100%;background:#eef1e8}model-viewer{width:100%;height:100%;min-height:100vh}</style></head><body><model-viewer src="${asset}" alt="${title}" camera-controls touch-action="pan-y" shadow-intensity="1" exposure="1.05" environment-image="neutral" auto-rotate></model-viewer></body></html>\n`)
    );
    return;
  }

  if (kind === 'pdf') {
    writeFileSync(
      join(targetsRoot, slug, 'index.html'),
      injectTransparentScrollbars(`<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><style>html,body{margin:0;height:100%;background:#eef1e8}iframe{display:block;width:100%;height:100%;min-height:100vh;border:0;background:#eef1e8}</style></head><body><iframe src="${asset}#toolbar=1" title="${title}"></iframe></body></html>\n`)
    );
    return;
  }

  if (kind === 'svg') {
    writeFileSync(
      join(targetsRoot, slug, 'index.html'),
      `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><style>html,body{margin:0;min-height:100%;display:grid;place-items:center;background:#f7f8f3}img{width:min(100%,420px);height:auto}</style></head><body><img src="${asset}" alt="${title}"/></body></html>\n`
    );
    return;
  }

  if (kind === 'pptx') {
    writeFileSync(
      join(targetsRoot, slug, 'index.html'),
      `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><style>:root{--ink:#22261f;--bg:#f7f8f3;--brand:#4b621c}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:32px;background:var(--bg);color:var(--ink);font-family:system-ui,sans-serif}.card{max-width:420px;text-align:center;padding:40px 32px;border:1px solid #d8ddd0;border-radius:12px;background:#fff}h1{margin:0 0 12px;font-size:1.35rem}p{margin:0 0 24px;line-height:1.5;color:#5c6258}a{display:inline-block;padding:12px 18px;border-radius:999px;background:var(--brand);color:#f7f8f3;text-decoration:none;font-weight:600}</style></head><body><div class="card"><h1>${title}</h1><p>Animated deck exported from the Visual Spec document. Download and open in Keynote, PowerPoint or LibreOffice Impress.</p><a href="${asset}" download>Download .pptx</a></div></body></html>\n`
    );
  }
}

const catalog = [];

for (const [slug, entry] of Object.entries(manifest)) {
  const dir = join(targetsRoot, slug);
  mkdirSync(dir, { recursive: true });

  const sourcePath = join(sourcesDir, entry.source);
  if (entry.kind === 'html') {
    const raw = readFileSync(sourcePath, 'utf8');
    writeFileSync(join(dir, 'index.html'), injectTransparentScrollbars(raw));
    catalog.push({
      slug,
      kind: 'html',
      preview: `/targets/${slug}/index.html`,
      download: `/targets/${slug}/index.html`
    });
    continue;
  }

  const assetName = entry.asset ?? entry.source;
  copyFileSync(sourcePath, join(dir, assetName));
  writeIndex(slug, entry);
  catalog.push({
    slug,
    kind: entry.kind,
    preview: `/targets/${slug}/index.html`,
    download: `/targets/${slug}/${assetName}`
  });
}

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Synced ${catalog.length} use-case artifacts into apps/web/public/targets`);
