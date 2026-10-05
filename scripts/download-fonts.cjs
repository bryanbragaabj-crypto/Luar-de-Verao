// Fontes locais: executado uma vez, sem dependências no site publicado.
const fs = require('node:fs');
const path = require('node:path');
const output = path.resolve(__dirname, '../assets/fonts');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const url = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600&display=swap';
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' } });
  if (!response.ok) throw new Error(`Font stylesheet: ${response.status}`);
  const css = await response.text();
  const blocks = [...css.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/g)].map(x => x[1]);
  const faces = [];
  const files = new Map();
  for (const block of blocks) {
    const family = block.match(/font-family:\s*'([^']+)'/)[1];
    if (faces.some(face => face.includes(`font-family: '${family}'`))) continue;
    const source = block.match(/url\(([^)]+)\)/)[1];
    let file = files.get(source);
    if (!file) {
      file = `${family.toLowerCase().replaceAll(' ', '-')}-${files.size + 1}.woff2`;
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Font download: ${response.status}`);
      fs.writeFileSync(path.join(output, file), Buffer.from(await response.arrayBuffer()));
      files.set(source, file);
    }
    faces.push(block.replace(source, `../assets/fonts/${file}`).replace(/font-weight:\s*\d+;/, `font-weight: 400 ${family === 'Inter' ? 700 : 600};`));
  }
  if (!faces.some(x => x.includes("'Inter'")) || !faces.some(x => x.includes("'Playfair Display'"))) throw new Error('Missing font families');
  fs.writeFileSync(path.resolve(__dirname, '../css/fonts.css'), '/* Fontes locais: subconjunto latino, incluindo os acentos do português. */\n' + faces.join('\n\n') + '\n');
  for (const [name, directory] of [['Inter', 'inter'], ['Playfair-Display', 'playfairdisplay']]) {
    const response = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${directory}/OFL.txt`);
    if (!response.ok) throw new Error(`Font license: ${response.status}`);
    fs.writeFileSync(path.join(output, `LICENSE-${name}.txt`), await response.text());
  }
  console.log(JSON.stringify({ files: [...files.values()], faces: faces.length }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
