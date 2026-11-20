import type { Page } from 'playwright'
import type { Config, Finding, Viewport } from './types.ts'

const nativeAndCommonTargets = [
  'button', 'a[href]', 'input:not([type="hidden"])', 'select', 'textarea', 'summary',
  '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]', '[role="switch"]',
  '[role="slider"]', '[role="tab"]', '[role^="menuitem"]', '[role="option"]', '[role="combobox"]',
  '[onclick]', '[contenteditable="true"]', '[tabindex]:not([tabindex="-1"])',
].join(',')
const exceptionNames = ['none', 'equivalent', 'inline', 'user-agent', 'essential'] as const
type ContextException = typeof exceptionNames[number]
type Review = {
  selector: string
  viewport: string
  evidence: string
  rectangularHitAreas?: boolean
  allPeersIncluded?: boolean
  exception?: ContextException
}

export type TargetPolicy = { selector: string; additionalPeers?: string; reviews: Review[] }

function record(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected an object in targets configuration')
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error('Unknown targets configuration key: ' + key)
  }
  return value as Record<string, unknown>
}

function stringField(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Expected nonempty targets.' + field)
  return value.trim()
}

export function parseTargets(input: unknown): TargetPolicy {
  if (input === undefined) return { selector: nativeAndCommonTargets, reviews: [] }
  const obj = record(input, ['selector', 'additionalPeers', 'reviews'])
  const selector = obj.selector === undefined ? nativeAndCommonTargets : stringField(obj.selector, 'selector')
  const additionalPeers = obj.additionalPeers === undefined ? undefined : stringField(obj.additionalPeers, 'additionalPeers')
  if (obj.reviews !== undefined && !Array.isArray(obj.reviews)) throw new Error('Expected targets.reviews array')
  const reviews = (obj.reviews ?? []).map((value: unknown): Review => {
    const entry = record(value, ['selector', 'viewport', 'evidence', 'rectangularHitAreas', 'allPeersIncluded', 'exception'])
    for (const key of ['rectangularHitAreas', 'allPeersIncluded']) {
      if (entry[key] !== undefined && typeof entry[key] !== 'boolean') throw new Error('Expected boolean targets.reviews.' + key)
    }
    if (entry.exception !== undefined && !exceptionNames.includes(entry.exception as ContextException)) {
      throw new Error('Invalid WCAG contextual exception')
    }
    return {
      selector: stringField(entry.selector, 'reviews.selector'),
      viewport: stringField(entry.viewport, 'reviews.viewport'),
      evidence: stringField(entry.evidence, 'reviews.evidence'),
      rectangularHitAreas: entry.rectangularHitAreas as boolean | undefined,
      allPeersIncluded: entry.allPeersIncluded as boolean | undefined,
      exception: entry.exception as ContextException | undefined,
    }
  })
  return { selector, additionalPeers, reviews }
}

type Target = {
  nodeId: number
  selector: string
  subject: boolean
  x: number
  y: number
  width: number
  height: number
  limitation: string
  hits: number[]
  activeAnimation: boolean
  review?: Review
}

async function sampleTargets(page: Page, policy: TargetPolicy, viewport: string) {
  return page.evaluate(async ({ defaults, policy, viewport }) => {
    const nodeIds = new WeakMap<Element, number>()
    let nextId = 1
    function idFor(el: Element) {
      let id = nodeIds.get(el)
      if (id === undefined) {
        id = nextId++
        nodeIds.set(el, id)
      }
      return id
    }

    function selectorFor(el: Element) {
      const parts = []
      for (let node: Element | null = el; node; node = node.parentElement) {
        if (node.id && document.querySelectorAll('#' + CSS.escape(node.id)).length === 1) {
          parts.unshift('#' + CSS.escape(node.id))
          break
        }
        const siblings = node.parentElement?.children
        const index = siblings ? Array.from(siblings).indexOf(node) + 1 : 1
        parts.unshift(CSS.escape(node.localName) + ':nth-child(' + index + ')')
      }
      return parts.join(' > ')
    }

    // Browser probes can contradict a review. Finite point samples cannot establish
    // the full activation boundary or the function of delegated event listeners.
    function limitation(el: Element, r: DOMRect, peers: Set<Element>, hits: number[]) {
      if (el.getClientRects().length !== 1) return 'fragmented box'
      if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return 'extends outside sampled viewport'
      for (const pseudo of ['::before', '::after']) {
        const style = getComputedStyle(el, pseudo)
        if (!['none', 'normal'].includes(style.content) && style.pointerEvents !== 'none') return 'generated hit area needs inspection'
      }
      // Chromium rounds pointer coordinates at adjacent edges. Sample one CSS
      // pixel inside each edge when possible to avoid hitting the next control.
      const insetX = Math.min(1, r.width / 2)
      const insetY = Math.min(1, r.height / 2)
      let obstructed = false
      for (const x of [r.left + insetX, r.left + r.width / 2, r.right - insetX]) {
        for (const y of [r.top + insetY, r.top + r.height / 2, r.bottom - insetY]) {
          let hit = document.elementFromPoint(x, y)
          hits.push(hit ? idFor(hit) : 0)
          while (hit && !peers.has(hit)) hit = hit.parentElement
          if (hit !== el) obstructed = true
        }
      }
      return obstructed ? 'hit tests differ from the candidate rectangle' : ''
    }

    function sample() {
      const candidates = Array.from(document.querySelectorAll(
        [defaults, policy.selector, policy.additionalPeers].filter(Boolean).join(','),
      ))
      const peers = new Set(candidates)
      const animations = document.getAnimations().flatMap(animation => {
        if ((animation.pending || animation.playState === 'running') && animation.effect instanceof KeyframeEffect &&
            animation.effect.target instanceof Element) return [animation.effect.target]
        return []
      })
      const reviewed = new Map<Element, Review>()
      const invalid: string[] = []
      for (const review of policy.reviews.filter(item => item.viewport === viewport)) {
        const elements = document.querySelectorAll(review.selector)
        if (elements.length !== 1 || !elements[0].matches(policy.selector) || reviewed.has(elements[0])) {
          invalid.push(review.selector)
        } else {
          reviewed.set(elements[0], review)
        }
      }
      const items = candidates.flatMap(el => {
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height || el.matches(':disabled') || el.closest('[inert]') ||
            getComputedStyle(el).visibility !== 'visible') return []
        const hits: number[] = []
        return [{
          nodeId: idFor(el), selector: selectorFor(el), subject: el.matches(policy.selector),
          x: r.x, y: r.y, width: r.width, height: r.height,
          limitation: limitation(el, r, peers, hits), review: reviewed.get(el), hits,
          activeAnimation: animations.some(a => a.contains(el) || el.contains(a)),
        }]
      })
      return { items, invalid }
    }
    const first = sample()
    // Separate samples by a rendering opportunity, with a bounded wait for hidden tabs.
    const rendered = await new Promise<boolean>(resolve => {
      const timer = setTimeout(() => resolve(false), 1000)
      requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(timer); resolve(true) }))
    })
    return { first, second: sample(), rendered }
  }, { defaults: nativeAndCommonTargets, policy, viewport })
}

const minimum = 24
const radius = minimum / 2
function undersized(t: Target) { return t.width < minimum || t.height < minimum }

// Check against every peer's rectangle, including long thin undersized peers.
// Undersized peers also have their own 24 CSS px circle. Tangency is sufficient.
function conflicts(a: Target, b: Target) {
  const x = a.x + a.width / 2
  const y = a.y + a.height / 2
  const dx = Math.max(b.x - x, 0, x - (b.x + b.width))
  const dy = Math.max(b.y - y, 0, y - (b.y + b.height))
  if (Math.hypot(dx, dy) < radius) return true
  return undersized(b) && Math.hypot(x - (b.x + b.width / 2), y - (b.y + b.height / 2)) < minimum
}

function overlapsBox(a: Target, b: Target) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

const source = 'https://www.w3.org/TR/WCAG22/#target-size-minimum'
const expected = '24 × 24 CSS px axis-aligned square within the activation area, or an applicable WCAG exception.'
export async function targets(page: Page, config: Config, viewport: Viewport): Promise<Finding[]> {
  const { first, second, rendered } = await sampleTargets(page, config.targets, viewport.name)
  const list = second.items
  const previous = new Map(first.items.map(t => [t.nodeId, t]))
  const current = new Map(list.map(t => [t.nodeId, t]))
  const changed = new Map<number, Target>()
  for (const t of first.items) {
    if (t.activeAnimation || JSON.stringify(t) !== JSON.stringify(current.get(t.nodeId))) changed.set(t.nodeId, t)
  }
  for (const t of list) {
    if (!previous.has(t.nodeId)) changed.set(t.nodeId, t)
  }
  const base = {
    ruleId: 'WCAG-2.5.8', category: 'accessibility', viewport: viewport.name,
    criterion: 'WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA', expected, source,
  }
  const subjects = list.filter(t => t.subject)
  for (const t of first.items) {
    if (t.subject && !current.get(t.nodeId)?.subject && !subjects.some(s => s.selector === t.selector)) subjects.push(t)
  }
  if (!subjects.length) return [{
    ...base, selector: config.targets.selector, observed: 'No rendered target candidates in scope.',
    kind: 'unverified observation', verdict: 'unverified', confidence: 'low', severity: 'info',
    recommendation: 'Inspect the intended page state and target selectors.', verification: 'No target measured.',
  }]
  return subjects.map((t): Finding => {
    const { review } = t
    const overlaps = undersized(t) ? list.filter(p => p !== t && conflicts(t, p)) : []
    const observed = 'DOM box ' + t.width + ' × ' + t.height + ' CSS px at (' + t.x + ', ' + t.y + '). ' +
      (undersized(t) ? 'Spacing conflicts among detected boxes: ' + (overlaps.map(p => p.selector).join(', ') || 'none') + '.' : '')
    const finding = {
      ...base, selector: t.selector, observed, confidence: 'high', severity: 'info',
      verification: review?.evidence ?? 'DOM measurement and sample hit tests only.',
    }
    // Spacing depends on the entire peer inventory. A full-size subject only
    // depends on peers that can take away part of its measured activation area.
    const unstable = [...changed.values()].find(p => {
      const now = current.get(p.nodeId)
      return p.nodeId === t.nodeId || undersized(t) || overlapsBox(t, p) || (now && overlapsBox(t, now))
    })
    const invalid = [...new Set([...first.invalid, ...second.invalid])]
    if (unstable || invalid.length || !rendered) {
      const reason = unstable ? 'Active animation or changed candidate membership, geometry, review binding or hit evidence for ' + unstable.selector
        : invalid.length ? 'A review requires one unique subject: ' + invalid.join(', ')
        : 'No intervening rendering opportunity observed'
      return { ...finding, kind: 'unverified observation', verdict: 'unverified', confidence: 'low',
        verification: reason + '. ' + finding.verification,
        recommendation: 'Wait for the state to settle, verify the review binding and repeat both samples.' }
    }
    if (review?.exception && review.exception !== 'none') {
      return { ...finding, kind: 'exception', verdict: 'matches',
        observed: observed + ' Reviewer verified the WCAG ' + review.exception + ' exception.',
        recommendation: 'Recheck the documented exception when content or behavior changes.' }
    }
    if (review?.rectangularHitAreas && !t.limitation) {
      if (!undersized(t)) return { ...finding, kind: 'pass', verdict: 'matches',
        recommendation: 'Retain the verified activation area.' }
      const witness = overlaps.find(p => !p.limitation)
      if (witness && review.exception === 'none') {
        return { ...finding, kind: 'confirmed violation', verdict: 'deviation', severity: 'high',
          observed: observed + ' Reviewed distinct target ' + witness.selector + ' intersects the spacing circle or its clearance circle.',
          recommendation: 'Enlarge the activation area or increase spacing, then repeat the pointer review.' }
      }
      if (!overlaps.length && review.allPeersIncluded && list.every(p => !p.limitation)) {
        return { ...finding, kind: 'exception', verdict: 'matches',
          observed: observed + ' Reviewed peer coverage supports the WCAG spacing exception.',
          recommendation: 'Recheck adjacent targets when layout or content changes.' }
      }
    }
    const gaps = []
    if (!review?.rectangularHitAreas) gaps.push('Activation rectangles and distinct actions need review')
    if (t.limitation) gaps.push(t.limitation)
    if (undersized(t)) {
      if (overlaps.length && review?.exception !== 'none') gaps.push('Four contextual exceptions need review')
      if (!overlaps.length && !review?.allPeersIncluded) gaps.push('Coverage of adjacent targets is unknown')
      const unresolvedPeer = (overlaps.length ? overlaps : list).find(p => p !== t && p.limitation)
      if (unresolvedPeer) gaps.push(unresolvedPeer.selector + ': ' + unresolvedPeer.limitation)
    }
    return { ...finding, kind: 'unverified observation', verdict: 'unverified', confidence: 'low',
      verification: [...gaps, finding.verification].join('. '),
      recommendation: 'Verify the activation boundaries, adjacent targets and applicable WCAG exceptions in this state.' }
  })
}
