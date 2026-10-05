// Auditoria local de layout e interações. Executar: node tests/responsive.cjs
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.qa');
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(req.url.split('?')[0]);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  try {
    res.setHeader('Content-Type', file.endsWith('.webp') ? 'image/webp' : file.endsWith('.woff2') ? 'font/woff2' : file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.png') ? 'image/png' : file.endsWith('.jpg') ? 'image/jpeg' : 'text/html');
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404); res.end(); }
});
server.listen(8127, '127.0.0.1', async () => {
  const child = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless', '--disable-gpu', '--no-sandbox', '--no-first-run', '--remote-debugging-port=9227', `--user-data-dir=${path.join(output, 'profile')}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let socket;
  try {
    let list;
    for (let i = 0; i < 40; i++) {
      try { list = await (await fetch('http://127.0.0.1:9227/json/list')).json(); break; }
      catch { await new Promise(r => setTimeout(r, 250)); }
    }
    socket = new WebSocket(list.find(x => x.type === 'page').webSocketDebuggerUrl);
    await new Promise(r => socket.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map();
    socket.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
    });
    await send('Page.enable');
    await send('Runtime.enable');
    const errors=[];
    socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);});

    const results = [];
    for (const width of [375, 390, 430, 768, 820, 1366, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: 'http://127.0.0.1:8127/' });
      await new Promise(r => setTimeout(r, 900));
      await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
      // Aguarda as imagens visiveis; o carregamento lazy pode continuar apos as fontes.
      await send('Runtime.evaluate', {expression: "Promise.all([...document.images].filter(img => img.getBoundingClientRect().top < innerHeight).map(img => img.decode().catch(() => {})))",awaitPromise:true});
      const result = await send('Runtime.evaluate', { expression: `(() => {
        document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0);
        const h = document.querySelector('.header').getBoundingClientRect();
        const toggle = document.querySelector('.menu-toggle');
        const menu = document.querySelector('#menu');
        const cards = [...document.querySelectorAll('.category-card')];
        const r = { width: innerWidth, noOverflow: document.documentElement.scrollWidth <= innerWidth,
          headerClear: document.querySelector('.hero-visual').getBoundingClientRect().top >= h.bottom - 1,
          whatsappConsistent: [...document.querySelectorAll('[data-contact=whatsapp]')].every(a=>a.querySelector('.whatsapp-icon') && a.getAttribute('aria-label') && !a.classList.contains('is-active')),
          cardsClickable: cards.length === 6 && cards.every(x => x.tagName === 'A' && x.getAttribute('href')),
          imagesLoaded: [...document.images].filter(x => x.getBoundingClientRect().top < innerHeight).every(x => x.complete && x.naturalWidth > 0),
          categoryColumns: getComputedStyle(document.querySelector('.category-grid')).gridTemplateColumns.split(' ').length,
          fontsLoaded: document.fonts.check('500 16px Inter') && document.fonts.check('500 48px "Playfair Display"'),
          categoriesFollowHero: document.querySelector('#inicio').nextElementSibling.id === 'categorias',
          officialLinks: [...document.querySelectorAll('[data-contact]')].every(a => a.href === ({whatsapp:'https://wa.me/5548999806764?text=Ol%C3%A1!%20Vim%20pelo%20link%20do%20Site%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es.',instagram:'https://www.instagram.com/luardeveraobeachwear/',maps:'https://maps.app.goo.gl/zMQEsFzRRy5HFf9a8'}[a.dataset.contact]) && a.target === '_blank' && a.rel === 'noopener noreferrer'),
          storeInfo: document.querySelectorAll('.opening-hours > div').length === 7 && [...document.querySelectorAll('.opening-hours dd')].every(d => d.textContent === '09:00\u201302:00') && document.querySelector('main').lastElementChild.id === 'localizacao' && document.querySelector('.location-map iframe').src.includes('&output=embed') && document.querySelector('.location-map').getBoundingClientRect().height === (innerWidth <= 768 ? 320 : 460) && document.querySelector('.footer .container').lastElementChild.textContent === 'Site feito por Bryan Tiago.' };
        if (innerWidth <= 768) {
          toggle.click(); r.menuOpens = toggle.getAttribute('aria-expanded') === 'true' && getComputedStyle(menu).display !== 'none';
          menu.querySelector('a').click(); r.menuCloses = toggle.getAttribute('aria-expanded') === 'false';
          toggle.click(); document.querySelector('.hero').click(); r.outsideCloses = toggle.getAttribute('aria-expanded') === 'false';
          toggle.click(); document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'})); r.escapeCloses = toggle.getAttribute('aria-expanded') === 'false';
        }
        document.querySelector('.hero-action').click(); r.heroTarget = location.hash === '#categorias';
        r.categoryClear = document.querySelector('#categorias').getBoundingClientRect().top >= h.height - 1;
        r.anchorsClear = ['sobre','categorias','contato'].every(id=>{document.querySelector('#'+id).scrollIntoView();return document.querySelector('#'+id).getBoundingClientRect().top>=h.height-1;});
        const quick=document.querySelector('.mobile-contact').getBoundingClientRect(); r.touchTarget = innerWidth>768 || (quick.width>=44 && quick.height>=44);
        window.scrollTo(0, document.documentElement.scrollHeight);
        const bottom = document.querySelector('.bottom-nav').getBoundingClientRect();
        r.footerClear = innerWidth > 768 || document.querySelector('.footer').getBoundingClientRect().bottom <= bottom.top + 1;
        window.scrollTo(0, 0); return r;
      })()`, returnByValue: true });
      results.push(result.result.value); console.log(JSON.stringify(result.result.value));
      await new Promise(r => setTimeout(r, 600));
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(output, `screen-${width}.png`), Buffer.from(shot.data, 'base64'));
      // Captura do catálogo: revela os elementos somente no ambiente de auditoria.
      if (width === 390 || width === 1440) {
        await send('Runtime.evaluate', { expression: "document.querySelectorAll('.is-pending').forEach(x=>x.classList.remove('is-pending'));document.querySelector('#categorias').scrollIntoView();" });
        await new Promise(r => setTimeout(r, 600));
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(output, `categories-${width}.png`), Buffer.from(shot.data, 'base64'));
        for (const [name, selector] of [['about', '#sobre'], ['banner', '.summer-banner'], ['contact', '#contato'], ['location', '#localizacao'], ['footer', '.footer']]) {
          await send('Runtime.evaluate', { expression: `document.querySelector('${selector}').scrollIntoView();` });
          await new Promise(r => setTimeout(r, 600));
          if (name === 'location') await new Promise(r => setTimeout(r, 8000));
          const sectionShot = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(output, `${name}-${width}.png`), Buffer.from(sectionShot.data, 'base64'));
        }
      }
    }
    const mapFrames = await send('Page.getFrameTree');
    console.log(JSON.stringify({mapFrames: mapFrames.frameTree.childFrames?.map(f => ({url:f.frame.url, unreachableUrl:f.frame.unreachableUrl}))}));
    const external = await send('Runtime.evaluate', { expression: `(async () => {
      const source = await (await fetch('/js/script.js')).text();
      const frame = document.createElement('iframe'); document.body.append(frame);
      frame.contentDocument.body.innerHTML = document.body.innerHTML;
      const s = frame.contentDocument.createElement('script');
      s.textContent = source.replaceAll('link: ""', 'link: "https://example.com/catalogue"');
      frame.contentDocument.body.append(s);
      const cards = [...frame.contentDocument.querySelectorAll('.category-card')].slice(-6);
      return { externalLinks: cards.length === 6 && cards.every(x => x.target === '_blank' && x.rel === 'noopener noreferrer' && x.href === 'https://example.com/catalogue') };
    })()`, awaitPromise: true, returnByValue: true });
    console.log(JSON.stringify(external.result.value));
    if(errors.length){console.error(errors);process.exitCode=1;}
    for (const page of ['politica-de-privacidade.html', 'termos-de-uso.html']) {
      for (const width of [375, 390, 430, 768, 1366, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', {width,height:1000,deviceScaleFactor:1,mobile:false});
        await send('Page.navigate', {url:'http://127.0.0.1:8127/'+page});
        await new Promise(r=>setTimeout(r,700));
        const check = await send('Runtime.evaluate', {expression: "({noOverflow:document.documentElement.scrollWidth<=innerWidth, returnLink:document.querySelector('.legal-back').getAttribute('href')==='index.html', content:document.querySelector('article').textContent.includes('00.923.062/0001-75')})",returnByValue:true});
        console.log(JSON.stringify({page,width,...check.result.value}));
        if(Object.values(check.result.value).some(v=>v!==true))process.exitCode=1;
      }
    }

    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ layouts: results, ...external.result.value }, null, 2));
    if (results.some(r => Object.entries(r).some(([k,v]) => k !== 'width' && k !== 'categoryColumns' && v !== true)) || !external.result.value.externalLinks) process.exitCode = 1;
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { socket?.close(); child.kill(); server.close(); }
});
