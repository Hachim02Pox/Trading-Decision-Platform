/** Repeatable local browser checks. Requires the fixture API and Next dev server. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = process.env.HT_FRONTEND_URL ?? 'http://localhost:3100';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const out = resolve('docs/verification/ht-market-story');
await mkdir(out, { recursive: true });
const sunday = JSON.parse(await readFile('tests/fixtures/learning/FIXTURE_learning_sunday.json', 'utf8'));
const intermediate = JSON.parse(await readFile('tests/fixtures/learning/FIXTURE_learning_intermediate.json', 'utf8'));
const browser = await chromium.launch({ channel: 'chromium', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const failures = [];
page.on('pageerror', error => failures.push(error.message));
const results = [];
const tabs = ['La lecture', 'Ce qui a changé', 'Arbre de scénarios', 'Les forces en jeu', 'Comprendre'];
const slug = ['lecture', 'changements', 'graphe', 'forces', 'comprendre'];
const tab = title => page.getByRole('button', { name: title, exact: true });
const text = async () => (await page.locator('main').last().innerText()).replace(/\s+/g, ' ');
const contains = async value => assert.ok((await text()).includes(value.replace(/\s+/g, ' ')), `Missing reader copy: ${value.slice(0, 100)}`);
const expandAll = async () => {
  const closed = page.locator('main').last().locator('details:not([open]) > summary');
  while (await closed.count()) {
    await closed.first().click();
  }
};
try {
  await page.goto(`${origin}/sunday-read`);
  await tab(tabs[0]).waitFor();
  await contains(intermediate.learning_experience.headline.summary_fr);
  await contains(intermediate.learning_experience.synthesis.counter_case_fr);
  await page.getByRole('button', { name: 'Au fond', exact: true }).click();
  for (const mechanism of intermediate.learning_experience.mechanisms) {
    await page.locator('ol button').filter({ has: page.getByText(mechanism.title_fr, { exact: true }) }).click();
    for (const field of ['summary_fr', 'first_principle_fr', 'actor_fr', 'incentive_fr', 'transmission_fr', 'current_application_fr', 'alternative_fr', 'confirmation_fr', 'invalidation_fr', 'horizon_fr', 'limits_fr']) await contains(mechanism[field]);
    for (const example of mechanism.examples) await contains(example.text_fr);
  }
  for (const piece of intermediate.learning_experience.synthesis.pieces) {
    await page.getByRole('button', { name: piece.title_fr, exact: true }).click();
    await contains(piece.summary_fr); await contains(piece.role_fr);
  }
  for (const key of ['joint_reading_fr', 'dominant_driver_fr', 'counter_case_fr', 'why_preferred_or_mixed_fr', 'priced_in_fr', 'conditional_outlook_fr', 'unresolved_fr', 'next_checks_fr']) await contains(intermediate.learning_experience.synthesis[key]);
  await expandAll();
  for (const fact of intermediate.learning_experience.facts) await contains(fact.observation_fr);
  await tab('Les forces en jeu').click(); await expandAll();
  assert.equal(intermediate.family_readouts.flatMap(f => f.questions).length, 32);
  for (const family of intermediate.family_readouts) for (const question of family.questions) await contains(question.answer_fr);
  for (const judgment of intermediate.six_judgments) await contains(judgment.body);
  await tab('Comprendre').click();
  for (const concept of intermediate.learning_experience.concepts) {
    await page.getByRole('button', { name: concept.term_fr, exact: true }).first().click();
    for (const field of ['definition_fr', 'why_it_matters_fr', 'current_application_fr', 'example_fr', 'misconception_fr', 'limits_fr']) await contains(concept[field]);
  }
  await expandAll();
  for (const lesson of intermediate.learning_experience.lessons) { await contains(lesson.answer_fr); await contains(lesson.reasoning_fr); }
  // Query-link navigation must retain depth and tab and replace every snapshot.
  await page.getByRole('link', { name: /Sunday récap/ }).click();
  await page.waitForURL(`**runId=${sunday.meta.run_id}`);
  await page.waitForFunction(() => document.querySelector('nav[aria-label="Explorer le récap"] button[aria-pressed="true"]')?.textContent === 'Comprendre');
  assert.equal(await page.getByRole('button', { name: 'Au fond', exact: true }).getAttribute('aria-pressed'), 'true');
  await tab('La lecture').click(); await contains(sunday.learning_experience.headline.summary_fr);
  await tab('Arbre de scénarios').click();
  for (const node of sunday.scenario_tree.nodes) {
    const button = page.locator('button').filter({ has: page.locator('strong', { hasText: node.title_fr }) });
    await button.focus(); await button.press('Enter');
    for (const field of ['condition_fr', 'causal_path_fr', 'observable_confirmation_fr', 'time_window_fr', 'opposing_evidence_fr', 'invalidation_fr', 'practical_interpretation_fr']) await contains(node[field]);
    const explanation = sunday.learning_experience.scenario_explanations.find(item => item.node_id === node.id);
    for (const field of ['summary_fr', 'first_principle_fr', 'actor_fr', 'why_now_fr', 'limits_fr']) await contains(explanation[field]);
  }
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (let index = 0; index < tabs.length; index++) {
      await tab(tabs[index]).click();
      await page.evaluate(() => window.scrollTo(0, 0));
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
      assert.ok(dimensions.scroll <= dimensions.viewport + 1, `${tabs[index]} overflows at ${width}: ${JSON.stringify(dimensions)}`);
      const readerWidth = await page.locator('nav[aria-label="Explorer le récap"]').evaluate(element => element.parentElement.getBoundingClientRect().width);
      assert.ok(readerWidth <= width, `${tabs[index]} reader is clipped at ${width}: reader width ${readerWidth}`);
      await page.screenshot({ path: resolve(out, `${slug[index]}-${width}.png`), fullPage: width === 1440 });
      results.push({ width, tab: tabs[index], overflow: false });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/sunday-read?runId=FIXTURE-archive-without-learning`);
  await page.getByText('Cette lecture ne contient pas encore les explications approfondies', { exact: false }).waitFor();
  await contains(sunday.opening_thesis[0].body_fr);
  await page.goto(`${origin}/sunday-read?runId=FIXTURE-unknown-learning-version`);
  await page.getByText(/Cette version des explications approfondies n’est pas prise en charge/).waitFor();
  await contains(sunday.opening_thesis[0].body_fr);
  assert.deepEqual(failures, [], 'Browser runtime errors');
  await writeFile(resolve(out, 'browser-results.json'), JSON.stringify({ mode: 'LOCAL_FIXTURE_ONLY', results, checks: ['all mechanisms', 'six puzzle pieces', 'synthesis', '32 questions', 'six judgments', 'concepts and lessons', 'all scenario nodes', 'timeline depth and tab retention', 'archives', 'unknown version'], errors: failures }, null, 2) + '\n');
  console.log(`PASS ${results.length} responsive tab captures + content, graph, timeline and archive checks`);
} finally { await browser.close(); }
