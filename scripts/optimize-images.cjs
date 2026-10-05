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
    res.setHeader('Content-Type', file.endsWith('.woff2') ? 'font/woff2' : file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.png') ? 'image/png' : file.endsWith('.jpg') ? 'image/jpeg' : 'text/html');
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

    await send('Page.navigate',{url:'http://127.0.0.1:8127/'});
    await new Promise(r=>setTimeout(r,800));
    const jobs=[['hero-editorial.jpg',1536],['biquinis.jpg',800],['maios-editorial.jpg',800],['saidas-editorial.jpg',800],['vestidos.jpg',800],['masculina-editorial.jpg',800],['acessorios-editorial.jpg',800],['banner-praia.jpg',1600]];
    for(const [file,max] of jobs){
      const result=await send('Runtime.evaluate',{expression: '(async()=>{const img=new Image();img.src="/assets/images/'+file+'";await img.decode();const c=document.createElement("canvas");c.width=Math.min('+max+',img.naturalWidth);c.height=Math.round(img.naturalHeight*c.width/img.naturalWidth);c.getContext("2d").drawImage(img,0,0,c.width,c.height);return c.toDataURL("image/webp",0.88)})()',awaitPromise:true,returnByValue:true});
      const data=result.result.value; if(!data?.startsWith('data:image/webp'))throw Error('Conversion failed: '+file);
      fs.writeFileSync(path.join(root,'assets/images',file.replace('.jpg','.webp')),Buffer.from(data.split(',')[1],'base64'));
    }
    for(const size of [32,180]){
      const result=await send('Runtime.evaluate',{expression:'(async()=>{const img=new Image();img.src="/assets/images/logo-horizontal.png";await img.decode();const c=document.createElement("canvas");c.width=c.height='+size+';const ctx=c.getContext("2d");ctx.fillStyle="#fde706";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,img.naturalWidth*0.075,img.naturalHeight*0.125,img.naturalHeight*0.75,img.naturalHeight*0.75,0,0,c.width,c.height);return c.toDataURL("image/png")})()',awaitPromise:true,returnByValue:true});
      fs.writeFileSync(path.join(root,'assets/images',size===32?'favicon-32.png':'apple-touch-icon.png'),Buffer.from(result.result.value.split(',')[1],'base64'));
    }
    const logo = await send('Runtime.evaluate',{expression:'(async()=>{const img=new Image();img.src="/assets/images/logo-horizontal.png";await img.decode();const c=document.createElement("canvas");c.width=1000;c.height=Math.round(img.naturalHeight*1000/img.naturalWidth);c.getContext("2d").drawImage(img,0,0,c.width,c.height);return c.toDataURL("image/png")})()',awaitPromise:true,returnByValue:true});
    fs.writeFileSync(path.join(root,'assets/images/logo-web.png'),Buffer.from(logo.result.value.split(',')[1],'base64'));
    console.log('WebP photographs and official-logo icons created.');
  } catch(e){console.error(e);process.exitCode=1;}
  finally{socket?.close();child.kill();server.close();}
});
