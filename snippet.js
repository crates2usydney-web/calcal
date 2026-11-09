(() => {
  const out = {ready: document.readyState, bodyChildren: document.body ? document.body.children.length : -1, found: []};
  const walk = (root, depth) => {
    if (!root || depth > 12) return;
    const els = root.querySelectorAll('*');
    for (const el of els) {
      if (el.childElementCount === 0) {
        const t = (el.textContent || '').trim();
        if (t === 'I understand' || t === 'Decline') out.found.push(el.tagName + '.' + el.className + '|' + t);
      }
      if (el.shadowRoot) walk(el.shadowRoot, depth + 1);
    }
  };
  walk(document, 0);
  out.htmlLen = document.documentElement.outerHTML.length;
  out.cookieIds = [...document.querySelectorAll('[id]')].map(e => e.id).filter(id => /ot|consent|cookie/i.test(id)).slice(0,10);
  return JSON.stringify(out);
})()