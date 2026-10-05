// Após definir o domínio: node scripts/configure-domain.cjs https://SEU-DOMINIO
// Atualiza SEO sem inventar endereço de publicação.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const input = process.argv[2];
if (!input) throw new Error('Informe o domínio HTTPS real da loja.');
const url = new URL(input);
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Use uma URL HTTPS sem credenciais, query ou fragmento.');
const base = url.href.replace(/\/$/, '') + '/';
const pages = ['index.html', 'politica-de-privacidade.html', 'termos-de-uso.html'];
for (const page of pages) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, 'utf8').replace(/\s*<link rel="canonical"[^>]*>/g, '').replace(/\s*<meta property="og:url"[^>]*>/g, '');
  const canonical = new URL(page === 'index.html' ? '' : page, base).href;
  html = html.replace('</head>', `  <link rel="canonical" href="${canonical}">\n</head>`);
  if (page === 'index.html') {
    const image = new URL('assets/images/logo-horizontal.png', base).href;
    html = html.replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]+/, '$1' + image);
    html = html.replace('</head>', `  <meta property="og:url" content="${canonical}">\n</head>`);
    html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_, open, json, close) => {
      const data = JSON.parse(json); data.url = canonical;
      return open + '\n' + JSON.stringify(data, null, 2) + '\n  ' + close;
    });
  }
  fs.writeFileSync(file, html);
}
const entries = pages.map(page => `<url><loc>${new URL(page === 'index.html' ? '' : page, base).href}</loc></url>`).join('\n');
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', base).href}\n`);
