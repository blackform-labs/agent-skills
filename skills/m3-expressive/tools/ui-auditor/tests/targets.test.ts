import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
import { parseTargets, targets } from '../src/targets.ts'

const viewport = { name: 'desktop', width: 800, height: 600 }
const reviewed = { selector: '#a', viewport: viewport.name, rectangularHitAreas: true,
  evidence: 'Fixture has independent author-sized rectangular toolbar controls; no alternate function, sentence, essential or legal requirement.',
  exception: 'none' }

let browser: Browser
before(async () => { browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }) })
after(async () => { await browser?.close() })

async function run(page: Page, html: string, reviews: unknown[] = [], additionalPeers?: string) {
  await page.setContent('<style>button,span{position:absolute;top:50px;left:50px;width:20px;height:20px;' +
    'padding:0;margin:0;border:none;border-radius:0;box-sizing:border-box}</style>' + html)
  const config = { viewports: [viewport], rules: [], tokens: {}, tolerance: 5,
    targets: parseTargets({ selector: '#a', additionalPeers, reviews }) }
  const findings = await targets(page, config, viewport)
  assert.equal(findings.length, 1)
  return findings[0]
}

test('a narrow report selector still considers independent peers, and a small box alone stays unverified', async () => {
  const page = await browser.newPage({ viewport })
  try {
    const html = '<button id="a">A</button><button id="b" style="left:70px">B</button>'
    assert.equal((await run(page, html)).kind, 'unverified observation')
    assert.equal((await run(page, html, [{ ...reviewed, exception: undefined }])).kind, 'unverified observation')
    const failure = await run(page, html, [reviewed])
    assert.equal(failure.kind, 'confirmed violation')
    assert.match(failure.observed, /#b/)
    assert.equal(failure.source, 'https://www.w3.org/TR/WCAG22/#target-size-minimum')
  } finally { await page.close() }
})

test('tangent circles pass spacing only with reviewed complete coverage; custom peers can disprove it', async () => {
  const page = await browser.newPage({ viewport })
  try {
    const html = '<button id="a">A</button><button id="b" style="left:74px">B</button>'
    assert.equal((await run(page, html, [reviewed])).kind, 'unverified observation')
    const complete = [{ ...reviewed, allPeersIncluded: true }]
    assert.equal((await run(page, html, complete)).kind, 'exception')
    const thinPeer = '<button id="a">A</button><span data-peer style="left:71px;width:200px;height:8px;top:58px">B</span>'
    assert.equal((await run(page, thinPeer, complete, '[data-peer]')).kind, 'confirmed violation')
    const largePeer = '<button id="a">A</button><button id="b" style="left:71px;width:40px;height:40px">B</button>'
    assert.equal((await run(page, largePeer, complete)).kind, 'confirmed violation')
  } finally { await page.close() }
})

test('reviewed size honors 24 CSS pixels even with a 5 px design tolerance', async () => {
  const page = await browser.newPage({ viewport })
  try {
    const html = (width: number) => '<button id="a" style="width:' + width + 'px;height:24px">A</button>'
    assert.equal((await run(page, html(24), [reviewed])).kind, 'pass')
    assert.equal((await run(page, html(23.5), [reviewed])).kind, 'unverified observation')
  } finally { await page.close() }
})

test('an expanded pseudo-element, round target, or obstruction leaves rectangle measurements inconclusive', async () => {
  const page = await browser.newPage({ viewport })
  try {
    const review = [{ ...reviewed, allPeersIncluded: true }]
    const button = '<button id="a">A</button>'
    for (const html of [
      button + '<style>#a::after{content:"";position:absolute;inset:-12px}</style>',
      button + '<style>#a{width:24px;height:24px;border-radius:50%}</style>',
      button + '<div style="position:absolute;left:50px;top:50px;width:20px;height:20px"></div>',
    ]) assert.equal((await run(page, html, review)).kind, 'unverified observation')
    const unknownPeer = button + '<button id="b" style="left:90px">B</button>' +
      '<style>#b::before{content:"";position:absolute;right:100%;width:25px;height:20px}</style>'
    const inconclusive = await run(page, unknownPeer, review)
    assert.equal(inconclusive.kind, 'unverified observation')
    assert.match(inconclusive.verification, /#b: generated hit area/)
  } finally { await page.close() }
})

test('a documented WCAG exception is scoped to its reviewed viewport and is never a project waiver', async () => {
  const page = await browser.newPage({ viewport })
  try {
    const html = '<p>Read the <a id="a" href="#report">report</a> now.</p>'
    const inline = { selector: '#a', viewport: 'desktop', evidence: 'A link within the surrounding sentence.', exception: 'inline' }
    const finding = await run(page, html, [inline])
    assert.equal(finding.kind, 'exception')
    assert.equal(finding.verdict, 'matches')
    assert.match(finding.observed, /WCAG inline/)
    assert.equal((await run(page, html, [{ ...inline, viewport: 'mobile' }])).kind, 'unverified observation')
    assert.throws(() => parseTargets({ reviews: [{ ...inline, exception: 'project' }] }))
  } finally { await page.close() }
})

test('moving subjects and peers, changed inventory and changed hit ownership stay unverified', async () => {
  const page = await browser.newPage({ viewport })
  const controls = '<button id="a">A</button><button id="b" style="left:70px">B</button>'
  const complete = [{ ...reviewed, allPeersIncluded: true }]
  try {
    for (const id of ['a', 'b']) {
      const shift = '<script>{const el=document.getElementById("' + id + '");' +
        'const rect=el.getBoundingClientRect.bind(el);let reads=0;el.getBoundingClientRect=()=>{' +
        'if(++reads===2) el.style.left=(el.offsetLeft+1)+"px";return rect()}}</script>'
      const finding = await run(page, controls + shift, complete)
      assert.equal(finding.kind, 'unverified observation')
      assert.match(finding.verification, new RegExp('geometry.*#' + id))
    }
    const large = '<style>#a{width:30px;height:30px}#b{left:120px!important}</style>'
    const animate = '<script>a.animate([{opacity:1},{opacity:1}],{duration:50000})</script>'
    assert.equal((await run(page, controls + large + animate, complete)).kind, 'unverified observation')
    const remove = '<script>{const rect=b.getBoundingClientRect.bind(b);b.getBoundingClientRect=()=>{' +
      'requestAnimationFrame(()=>b.remove());return rect()}}</script>'
    assert.equal((await run(page, controls + remove, complete)).kind, 'unverified observation')
    const overlay = '<script>{const rect=a.getBoundingClientRect.bind(a);a.getBoundingClientRect=()=>{' +
      'requestAnimationFrame(()=>{if(!a.firstElementChild){const i=document.createElement("i");' +
      'i.style.cssText="position:absolute;inset:0";a.append(i)}});return rect()}}</script>'
    assert.equal((await run(page, controls + large + overlay, complete)).kind, 'unverified observation')
  } finally { await page.close() }
})

test('the other three contextual exceptions retain their WCAG names and reviewer evidence', async () => {
  const page = await browser.newPage({ viewport })
  try {
    for (const [exception, html, evidence] of [
      ['equivalent', '<a id="a" href="#map">Map</a><a href="#map" style="display:block;width:60px;height:60px">Open map</a>',
        'Both links reach the same destination and the Open map control meets the criterion.'],
      ['user-agent', '<input id="a" type="checkbox">', 'The browser sizes this checkbox and no author sizing is applied.'],
      ['essential', '<button id="a">A</button>', 'Fixture A represents a map pin whose geographic position conveys its location.'],
    ]) {
      const result = await run(page, html, [{ selector: '#a', viewport: 'desktop', exception, evidence }])
      assert.equal(result.kind, 'exception')
      assert.equal(result.verdict, 'matches')
      assert.match(result.observed, new RegExp('WCAG ' + exception))
      assert.equal(result.verification, evidence)
    }
  } finally { await page.close() }
})
