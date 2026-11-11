// Opens the demo quiz in Chromium with the HintHush extension loaded,
// waits for the extension to remove the blur, answers every question from
// answers.json, submits, and prints the score.
//
//   npm run answer            -> visible browser
//   HEADLESS=1 npm run answer -> no window
//   QUIZ_URL=http://localhost:3000 npm run answer -> use your own quiz page

import { chromium } from 'playwright';
import { readFile, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION = path.resolve(here, '../extension');
const answers = JSON.parse(await readFile(path.join(here, 'answers.json'), 'utf8'));

let server;
let url = process.env.QUIZ_URL;
if (!url) {
  server = await startServer(0); // any free port
  url = `http://localhost:${server.address().port}`;
}

const context = await chromium.launchPersistentContext(await mkdtemp(path.join(os.tmpdir(), 'px-')), {
  channel: 'chromium', // Playwright's Chromium allows loading unpacked extensions
  headless: !!process.env.HEADLESS,
  args: [`--disable-extensions-except=${EXTENSION}`, `--load-extension=${EXTENSION}`],
});

try {
  const page = context.pages()[0] ?? await context.newPage();
  await page.goto(url);

  // The extension marks every un-blurred element with this attribute.
  await page.waitForSelector('[data-px-revealed]', { timeout: 10_000 });
  const revealed = await page.locator('[data-px-revealed]').count();
  console.log(`Extension revealed ${revealed} blurred block(s).`);
  await page.screenshot({ path: path.join(here, 'revealed.png'), fullPage: true });

  const cards = page.locator('.card');
  const n = await cards.count();
  let answered = 0;
  for (let i = 0; i < n; i++) {
    const card = cards.nth(i);
    const raw = (await card.locator('.question-text').innerText()).trim();
    const question = raw.replace(/^\d+\.\s*/, '');
    const answer = answers[question];
    if (!answer) { console.log(`  ? No answer for: "${question}"`); continue; }
    await card.getByLabel(answer, { exact: true }).check();
    answered++;
    console.log(`  ✓ ${question} -> ${answer}`);
    if (!process.env.HEADLESS) await page.waitForTimeout(400); // so you can watch it
  }

  await page.getByRole('button', { name: 'Submit' }).click();
  console.log(`Answered ${answered}/${n}. Page says: ${await page.locator('#result').innerText()}`);
  if (!process.env.HEADLESS) await page.waitForTimeout(3000);
} finally {
  await context.close();
  server?.close();
}
