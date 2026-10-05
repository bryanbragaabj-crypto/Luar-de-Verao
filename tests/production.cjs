// Auditoria de arquivos publicados. Execute: node tests/production.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'politica-de-privacidade.html', 'termos-de-uso.html'];
let checked = 0;
function localFile(value, directory = root) {
  if (!value || value.startsWith('#') || /^https?:/.test(value)) return;
  assert(!/^(?:file:|[a-z]:\\)/i.test(value), 'Caminho local absoluto');
  const target = path.resolve(directory, value.split('#')[0]);
  assert(fs.existsSync(target), `Arquivo ausente: ${value}`);
  checked++;
}
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert(!/localhost|127\.0\.0\.1|\[INSERIR|href="#"/.test(html));
  assert(/<title>/.test(html) && /name="description"/.test(html));
  for (const [, value] of html.matchAll(/(?:src|href)="([^"]*)"/g)) localFile(value);
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) assert(/alt="[^"]+"/.test(tag) && /width=/.test(tag) && /height=/.test(tag));
  for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert(/rel="noopener noreferrer"/.test(tag));
}
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const data = JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(data['@type'], 'ClothingStore');
assert.equal(data.taxID, '00.923.062/0001-75');
assert.equal(data.openingHoursSpecification.closes, '02:00');
assert.equal(data.openingHoursSpecification.dayOfWeek.length, 7);
const icons = [...home.matchAll(/<svg class="whatsapp-icon"[\s\S]*?<\/svg>/g)].map(m => m[0]);
assert.equal(icons.length, 6);
assert(icons.every(icon => icon === icons[0]));
const js = fs.readFileSync(path.join(root, 'js/script.js'), 'utf8');
for (const [, value] of js.matchAll(/imagem: "([^"]+)"/g)) localFile(value);
assert(!/\beval\s*\(|console\.log/.test(js));
for (const sheet of ['style.css', 'fonts.css']) {
  const css = fs.readFileSync(path.join(root, 'css', sheet), 'utf8');
  for (const [, value] of css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) localFile(value, path.join(root, 'css'));
}
const files = ['hero-editorial', 'biquinis', 'maios-editorial', 'saidas-editorial', 'vestidos', 'masculina-editorial', 'acessorios-editorial', 'banner-praia'];
let original = 0, optimized = 0;
for (const file of files) {
  original += fs.statSync(path.join(root, 'assets/images', file + '.jpg')).size;
  optimized += fs.statSync(path.join(root, 'assets/images', file + '.webp')).size;
}
assert(optimized < original);
console.log(`${checked} referências locais verificadas; fotos ${(100 * (1 - optimized / original)).toFixed(0)}% menores. SEO, SVGs e links de páginas aprovados.`);
