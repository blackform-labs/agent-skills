import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
import { parseConfig } from '../src/config.ts'
import { layout, parseRules } from '../src/layout.ts'
import { targets } from '../src/targets.ts'

const mobile = { name: 'mobile', width: 390, height: 844 }
const desktop = { name: 'desktop', width: 1080, height: 800 }
const reason = 'The approved compact action uses a 20px container.'
const exception = (selector: string) => ({ selector, reason, viewport: mobile.name })
const control = { id: 'action-height', type: 'dimension', selector: 'button', property: 'height', expected: 48 }
const controls = '<style>button{width:20px;height:20px;padding:0;border:0;border-radius:0}</style><button id="a">A</button><button id="b">B</button>'

let browser: Browser
before(async () => { browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }) })
after(async () => { await browser?.close() })

async function withPage(html: string, run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: mobile })
  try {
    await page.setContent(html)
    await run(page)
  } finally { await page.close() }
}

test('a project exception retains measurements and applies only to its rule, owner and viewport', async () => {
  const config = parseConfig({ viewports: [mobile, desktop], rules: [
    { ...control, exceptions: [exception('#a')] }, { ...control, id: 'second-contract' },
  ], targets: { selector: '#a', reviews: [{ selector: '#a', viewport: mobile.name, rectangularHitAreas: true,
    exception: 'none', evidence: 'Independent author-sized controls with rectangular activation areas and no applicable alternative.' }] } })
  await withPage(controls, async page => {
    const [a, b, other] = await layout(page, config, mobile)
    assert.equal(a.kind, 'exception')
    assert.equal(a.verdict, 'documented project exception')
    assert.match(a.observed, /height 20px/)
    assert.ok(a.observed.includes(reason))
    assert.match(a.expected, /48px/)
    assert.equal(b.kind, 'design deviation')
    assert.equal(other.kind, 'design deviation')
    assert.equal((await targets(page, config, mobile))[0].kind, 'confirmed violation')
    await page.setViewportSize(desktop)
    assert.ok((await layout(page, config, desktop)).every(f => f.kind === 'design deviation'))
  })
})

test('missing, ambiguous, unrelated, conflicting and invalid exception selectors leave findings actionable', async () => {
  await withPage(controls, async page => {
    for (const selectors of [['#missing'], ['button'], ['body'], ['#a', 'button:first-of-type'], ['[!']]) {
      const config = parseConfig({ viewports: [mobile], rules: [{ ...control, exceptions: selectors.map(exception) }] })
      const results = await layout(page, config, mobile)
      assert.ok(results.some(f => f.kind === 'unverified observation' && /exception/i.test(f.observed)))
      assert.equal(results.filter(f => f.kind === 'design deviation').length, 2)
      assert.ok(results.every(f => f.kind !== 'exception'))
    }
  })
})

test('group, peer and page exceptions have distinct measured owners', async () => {
  const rules = [
    { id: 'rhythm', type: 'repeated-gaps', selector: '#group', exceptions: [exception('#group')] },
    { id: 'peer', type: 'equivalent-components', property: 'height', selector: '#group > i', exceptions: [exception('#odd')] },
    { id: 'page', type: 'page-overflow', exceptions: [exception(':root')] },
  ]
  const config = parseConfig({ viewports: [mobile], rules })
  await withPage('<style>#group{width:1400px}i{display:block;height:24px}#odd{margin-top:8px;height:20px}</style><div id="group"><i></i><i></i><i id="odd"></i></div>', async page => {
    const results = await layout(page, config, mobile)
    assert.deepEqual(results.map(f => [f.ruleId, f.kind]), [
      ['rhythm', 'exception'], ['peer', 'pass'], ['peer', 'exception'], ['page', 'exception'],
    ])
    assert.ok(results.filter(f => f.kind === 'exception').every(f => f.observed.includes(reason)))
  })
})

test('the rules parser rejects unscoped and malformed exceptions and reserved built-in ids', () => {
  for (const exceptions of [
    {}, [null], [{ selector: '#a', reason }], [{ ...exception('#a'), reason: '  ' }],
    [{ ...exception('#a'), global: true }], [exception('#a'), exception('#a')],
  ]) assert.throws(() => parseRules([{ ...control, exceptions }]))
  assert.throws(() => parseRules([{ id: 'page', type: 'page-overflow', exceptions: [exception('body')] }]))
  assert.throws(() => parseRules([{ ...control, id: 'WCAG-2.5.8', exceptions: [exception('#a')] }]))
})

test('item-gap measures a single rendered pair including margins and respects force, dp and comparison', async () => {
  const rule = { id: 'card-gap', type: 'item-gap', group: 'cards', items: ':scope > article', expected: 8, unit: 'dp', comparison: 'max' }
  const html = '<style>section{display:grid;row-gap:8px}article{height:24px}article+article{margin-top:16px}</style><section data-ui-group="cards"><article></article><article></article></section>'
  await withPage(html, async page => {
    const config = parseConfig({ viewports: [mobile], cssPxPerDp: 2, rules: [
      rule, { ...rule, id: 'project-gap', force: 'requirement' }, { ...rule, id: 'minimum-gap', comparison: 'min' },
      { ...rule, id: 'exact-gap', comparison: 'exact', expected: 12 },
    ] })
    const [material, project, min, exact] = await layout(page, config, mobile)
    assert.equal(material.kind, 'design deviation')
    assert.match(material.observed, /y edge-to-edge gaps 24px/)
    assert.match(material.expected, /max 16px \(8dp\)/)
    assert.equal(project.kind, 'confirmed violation')
    assert.equal(min.kind, 'pass')
    assert.equal(exact.kind, 'pass')
    const unmapped = await layout(page, parseConfig({ rules: [rule] }), mobile)
    assert.equal(unmapped[0].kind, 'unverified observation')
    assert.match(unmapped[0].observed, /24px/)
  })
})

test('an item-gap rule leaves wrapping unverified and checks each pair in a single lane', async () => {
  const html = '<style>#cards{display:flex;flex-wrap:wrap;width:60px;gap:8px}i{width:24px;height:20px}</style><div id="cards"><i></i><i></i><i></i></div>'
  const rule = { id: 'row-gap', type: 'item-gap', selector: '#cards', axis: 'x', expected: 8 }
  const config = parseConfig({ rules: [rule] })
  await withPage(html, async page => {
    const [wrapped] = await layout(page, config, mobile)
    assert.equal(wrapped.kind, 'unverified observation')
    await page.addStyleTag({ content: '#cards{width:200px}i:last-child{margin-left:2px}' })
    const [row] = await layout(page, config, mobile)
    assert.equal(row.kind, 'design deviation')
    assert.match(row.observed, /8px, 10px/)
  })
})
