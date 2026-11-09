#!/usr/bin/env node
// Minimal CDP driver for Poala's built-in browser (Electron webview).
// Usage:
//   node cdp.mjs list
//   node cdp.mjs text
//   node cdp.mjs shot <path.png>
//   node cdp.mjs eval <js-expression>
//   node cdp.mjs click <css-selector>
//   node cdp.mjs clicktext <text>
//   node cdp.mjs type <css-selector> <value> [--enter]
//   node cdp.mjs nav <url>
import { readFileSync, writeFileSync } from 'node:fs';

const MARKER = process.env.HOME + '/Library/Application Support/Poala/DevToolsActivePort';
function port() {
  if (process.env.POALA_CDP_PORT) return Number(process.env.POALA_CDP_PORT);
  try { return Number(readFileSync(MARKER, 'utf8').split('\n')[0].trim()) || 9222; }
  catch { return 9222; }
}
const base = 'http://127.0.0.1:' + port();

async function pickTarget() {
  const list = await (await fetch(base + '/json/list')).json();
  const t = list.find(x => x.type === 'webview' && x.webSocketDebuggerUrl) ||
            list.find(x => x.type === 'page' && x.webSocketDebuggerUrl && !(x.url || '').startsWith('file://'));
  if (!t) throw new Error('no browser target on ' + base);
  return t;
}

async function withSocket(fn) {
  const t = await pickTarget();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    return await fn(send, t);
  } finally { ws.close(); }
}

const [, , cmd, ...args] = process.argv;

if (cmd === 'list') {
  const list = await (await fetch(base + '/json/list')).json();
  console.log(list.filter(t => t.type === 'webview' || t.type === 'page')
    .map(t => t.type + '\t' + t.id + '\t' + (t.url || '').slice(0, 100)).join('\n'));
} else if (cmd === 'nav') {
  await withSocket(async (send) => {
    await send('Page.navigate', { url: args[0] });
    await new Promise(r => setTimeout(r, 3000));
    const { result } = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
    console.log('navigated | title:', result.value);
  });
} else if (cmd === 'eval') {
  let expr = args.join(' ');
  if (expr.startsWith('@')) { const { readFileSync } = await import('node:fs'); expr = readFileSync(expr.slice(1), 'utf8'); }
  const src = expr;
  await withSocket(async (send) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate',
      { expression: src, returnByValue: true, awaitPromise: true });
    if (exceptionDetails) throw new Error(exceptionDetails.text + ' ' + (exceptionDetails.exception?.description || ''));
    console.log(typeof result.value === 'string' ? result.value : JSON.stringify(result.value, null, 2));
  });
} else if (cmd === 'text') {
  await withSocket(async (send) => {
    const { result } = await send('Runtime.evaluate',
      { expression: 'document.body.innerText', returnByValue: true });
    console.log(result.value);
  });
} else if (cmd === 'shot') {
  await withSocket(async (send) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(args[0], Buffer.from(data, 'base64'));
    console.log('saved', args[0]);
  });
} else if (cmd === 'click') {
  const sel = JSON.stringify(args[0]);
  await withSocket(async (send) => {
    const expr = '(() => { const el = document.querySelector(' + sel + '); if(!el) return "NOT_FOUND"; el.scrollIntoView({block:"center"}); el.click(); return "CLICKED"; })()';
    const { result } = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    await new Promise(r => setTimeout(r, 2000));
    console.log(result.value);
  });
} else if (cmd === 'clicktext') {
  const txt = JSON.stringify(args[0]);
  await withSocket(async (send) => {
    const expr = '(() => { const t = ' + txt + '; const els = [...document.querySelectorAll("a,button,[role=button],input[type=submit],label,span,div")]; const el = els.find(e => (e.innerText||"").trim() === t) || els.find(e => (e.innerText||"").trim().includes(t) && e.children.length === 0); if(!el) return "NOT_FOUND"; el.scrollIntoView({block:"center"}); el.click(); return "CLICKED: " + (el.innerText||el.tagName); })()';
    const { result } = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    await new Promise(r => setTimeout(r, 2000));
    console.log(result.value);
  });
} else if (cmd === 'type') {
  const sel = JSON.stringify(args[0]);
  const val = JSON.stringify(args[1]);
  const enter = args.includes('--enter');
  await withSocket(async (send) => {
    const expr = '(() => { const el = document.querySelector(' + sel + '); if(!el) return "NOT_FOUND"; el.focus(); const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; const setter = Object.getOwnPropertyDescriptor(proto, "value").set; setter.call(el, ' + val + '); el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); return "TYPED"; })()';
    const { result } = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    console.log(result.value);
    if (enter) {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
      await send('Input.dispatchKeyEvent', { type: 'char', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
      await new Promise(r => setTimeout(r, 1500));
    }
  });
} else {
  console.log('usage: node cdp.mjs list|text|shot <path>|eval <js>|click <sel>|clicktext <text>|type <sel> <val> [--enter]|nav <url>');
  process.exit(2);
}
