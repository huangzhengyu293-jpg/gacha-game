/* eslint-disable */
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://packdraw.com';
const PAGE = 'https://packdraw.com/zh';

function toAbs(url) {
  try {
    return new URL(url, ORIGIN).toString();
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  return await res.text();
}

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get('content-type') || '';
  return { buf, ct };
}

function extractCssLinks(html) {
  const links = new Set();
  const re = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const abs = toAbs(m[1]);
    if (abs) links.add(abs);
  }
  return [...links];
}

function extractImageUrlsFromCss(cssText) {
  const urls = new Set();
  const re = /url\(([^)]+)\)/gi;
  let m;
  while ((m = re.exec(cssText))) {
    let raw = m[1].trim().replace(/^['"]|['"]$/g, '');
    const abs = toAbs(raw);
    if (!abs) continue;
    if (/\.(png|jpe?g|webp|svg)(\?.*)?$/i.test(abs)) urls.add(abs);
  }
  return [...urls];
}

async function main() {
  const outDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const html = await fetchText(PAGE);
  const cssLinks = extractCssLinks(html);

  const candidateSet = new Set();
  for (const cssUrl of cssLinks) {
    try {
      const css = await fetchText(cssUrl);
      extractImageUrlsFromCss(css).forEach((u) => candidateSet.add(u));
    } catch {}
  }

  // Fallback: also try to find inline background urls in HTML
  extractImageUrlsFromCss(html).forEach((u) => candidateSet.add(u));

  const candidates = [...candidateSet];
  if (candidates.length === 0) {
    console.log('No image candidates found.');
    return;
  }

  // Fetch all candidates and pick the largest by size
  const sizes = [];
  for (const url of candidates) {
    try {
      const { buf, ct } = await fetchBuffer(url);
      sizes.push({ url, size: buf.length, ct, buf });
    } catch {}
  }
  sizes.sort((a, b) => b.size - a.size);
  if (sizes.length === 0) {
    console.log('No downloadable image found.');
    return;
  }
  const best = sizes[0];
  const extFromCt = (() => {
    if (/image\/webp/.test(best.ct)) return '.webp';
    if (/image\/png/.test(best.ct)) return '.png';
    if (/image\/jpeg/.test(best.ct)) return '.jpg';
    if (/image\/svg\+xml/.test(best.ct)) return '.svg';
    const m = best.url.match(/\.(png|jpe?g|webp|svg)(\?.*)?$/i);
    return m ? '.' + m[1].toLowerCase().replace('jpeg', 'jpg') : '.img';
  })();
  const outName = 'packdraw-bg' + extFromCt;
  const outPath = path.join(outDir, outName);
  fs.writeFileSync(outPath, best.buf);

  const meta = {
    source: best.url,
    size: best.size,
    contentType: best.ct,
    saved: '/'+outName,
    totalCandidates: candidates.length
  };
  const metaPath = path.join(process.cwd(), 'tmp-scrape-meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  console.log(JSON.stringify(meta));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


