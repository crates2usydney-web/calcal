import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-first-run'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
await p.setCookie({ name: 'cal_sid', value: '30d8a22b-21bc-4394-9c6b-d2b7859ed74a', domain: 'localhost', path: '/' });
const shots = [
  ['http://localhost:3000/dashboard/polls/30aba415-6312-4dbd-a2fa-ccb8e1d6fb77', 'rec-poll-detail.png'],
  ['http://localhost:3000/dashboard/integrations/google-calendar', 'rec-integration-detail.png'],
  ['http://localhost:3000/dashboard/webhooks/7eae53ae-2229-4952-9d72-8911744e6e61', 'rec-webhook-detail.png'],
];
for (const [url, file] of shots) {
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.screenshot({ path: file, fullPage: false });
}
await b.close();
