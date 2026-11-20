import type { Page } from 'playwright'
import type { Config, Finding, Viewport } from './types.ts'

const spacingProperties = [
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'row-gap', 'column-gap',
] as const
const properties = [
  'width', 'height', ...spacingProperties, 'font-size', 'line-height', 'letter-spacing',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
] as const

const options = {
  dimension: ['property', 'expected', 'unit', 'comparison', 'force'],
  spacing: ['property', 'tokens'],
  'item-gap': ['items', 'axis', 'expected', 'unit', 'comparison', 'force'],
  'repeated-gaps': ['items', 'axis'],
  alignment: ['items', 'axis', 'edge'],
  'related-gap': ['items', 'axis', 'reference', 'factor'],
  'group-distance': ['items', 'axis', 'factor'],
  'unused-region': ['items', 'axis', 'fraction'],
  'inconsistent-padding': [],
  'equivalent-components': ['property'],
  clipping: ['axis'],
  'page-overflow': [],
} as const

type RuleType = keyof typeof options
type Property = typeof properties[number]
export interface LayoutRule {
  id: string
  type: RuleType
  selector?: string
  group?: string
  role?: string
  source?: string
  criterion?: string
  minWidth?: number
  maxWidth?: number
  items?: string
  axis?: 'x' | 'y'
  edge?: 'start' | 'center' | 'end'
  property?: Property
  expected?: number
  unit?: 'px' | 'dp'
  comparison?: 'exact' | 'min' | 'max'
  force?: 'requirement' | 'recommendation'
  tokens?: string[]
  reference?: number
  factor?: number
  fraction?: number
  exceptions?: { selector: string; viewport: string; reason: string }[]
}

export function parseRules(input: unknown): LayoutRule[] {
  if (!Array.isArray(input)) throw new Error('rules must be an array')
  const ids = new Set<string>()
  return input.map((value: unknown, index) => {
    const fail = (message: string): never => { throw new Error(`rules[${index}] ${message}`) }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('must be an object')
    const r = value as Record<string, unknown>
    if (typeof r.id !== 'string' || !/^[a-z\d][a-z\d_.-]*$/i.test(r.id)) return fail('needs an alphanumeric id (dots, dashes and underscores allowed)')
    if (ids.has(r.id)) return fail(`duplicates id "${r.id}"`)
    if (r.id.toUpperCase() === 'WCAG-2.5.8' || r.id.toUpperCase() === 'AUDIT-READINESS') return fail('uses a reserved auditor rule id')
    ids.add(r.id)
    if (typeof r.type !== 'string' || !Object.hasOwn(options, r.type)) return fail('has an unknown rule type')
    const type = r.type as RuleType
    const common = ['id', 'type', 'source', 'criterion', 'minWidth', 'maxWidth', 'exceptions']
    if (type !== 'page-overflow') common.push('selector', 'group', 'role')
    const allowed = new Set([...common, ...options[type]])
    for (const key of Object.keys(r)) if (!allowed.has(key)) return fail(`does not support "${key}" on ${type}`)
    for (const key of ['selector', 'group', 'role', 'source', 'criterion', 'items']) {
      if (key in r && (typeof r[key] !== 'string' || !(r[key] as string).trim())) return fail(`needs nonempty text in ${key}`)
    }
    if (type !== 'page-overflow' && !(r.selector || r.group || r.role)) return fail('needs a selector, group or role')
    if (r.selector && (r.group || r.role)) return fail('accepts either selector or annotations')
    for (const key of ['minWidth', 'maxWidth', 'expected', 'reference', 'factor', 'fraction']) {
      if (key in r && (typeof r[key] !== 'number' || !Number.isFinite(r[key]))) return fail(`needs a finite ${key}`)
    }
    for (const key of ['minWidth', 'maxWidth', 'reference']) {
      if ((r[key] as number) < 0) return fail(`${key} must be nonnegative`)
    }
    if ((r.minWidth as number) > (r.maxWidth as number)) return fail('minWidth exceeds maxWidth')
    if ((type === 'dimension' || type === 'item-gap') && !('expected' in r)) return fail('needs expected')
    if (type === 'item-gap' && (r.expected as number) < 0) return fail('expected item-gap must be nonnegative')
    if (type === 'related-gap' && !('reference' in r)) return fail('needs reference in CSS px')
    if (type === 'unused-region' && (!('fraction' in r) || (r.fraction as number) < 0 || (r.fraction as number) > 1)) return fail('fraction must be between 0 and 1')
    if ('factor' in r && (r.factor as number) < 1) return fail('factor must be at least 1')
    if (type === 'spacing' || type === 'dimension' || type === 'equivalent-components') {
      const supported: readonly string[] = type === 'spacing' ? spacingProperties : properties
      if (typeof r.property !== 'string' || !supported.includes(r.property)) return fail(`needs a supported ${type} property`)
    }
    for (const [key, choices] of Object.entries({
      axis: ['x', 'y'], edge: ['start', 'center', 'end'], comparison: ['exact', 'min', 'max'],
      unit: ['px', 'dp'], force: ['recommendation', 'requirement'],
    })) {
      if (key in r && !choices.includes(r[key] as string)) return fail(`has invalid ${key}`)
    }
    if ('tokens' in r && (!Array.isArray(r.tokens) || !r.tokens.length || r.tokens.some(v => typeof v !== 'string' || !v.trim()) || new Set(r.tokens).size !== r.tokens.length)) return fail('tokens must be distinct, nonempty token names')
    if ('exceptions' in r) {
      if (!Array.isArray(r.exceptions)) return fail('exceptions must be an array')
      const seen = new Set<string>()
      for (const entry of r.exceptions) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return fail('each exception must be an object')
        const fields = ['selector', 'viewport', 'reason']
        if (Object.keys(entry).some(key => !fields.includes(key))) return fail('unknown exception field')
        if (fields.some(k => typeof entry[k] !== 'string' || !entry[k].trim())) return fail('each exception needs nonempty selector, viewport and reason fields')
        if (type === 'page-overflow' && entry.selector !== ':root') return fail('page-overflow exceptions must select :root')
        const key = JSON.stringify([entry.viewport, entry.selector])
        if (seen.has(key)) return fail('duplicate exception selector for this viewport')
        seen.add(key)
      }
    }
    return { ...r } as unknown as LayoutRule
  })
}

type Box = { left: number; right: number; top: number; bottom: number }
type Clip = { axis: 'x' | 'y'; excess: number; location: string }
type Sample = {
  identity: number
  selector: string
  box: Box
  visible: boolean
  values: Record<string, string>
  spacing: string | null
  exception: string
  children: { identity: number; box: Box }[]
  content: Box
  clips: Clip[]
  uncertainty: string
}
type Snapshot = { selector: string; elements: Sample[]; issues?: { selector: string; message: string }[]; error?: string; page?: { content: number; viewport: number; exception: string } }
type Pair = { first: Snapshot; last: Snapshot }

// This function runs in Chromium. Keep all DOM helpers in its serialized scope.
async function rendered(rules: LayoutRule[]): Promise<Pair[]> {
  const ids = new WeakMap<Element, number>()
  let sequence = 0
  function identity(element: Element) {
    if (!ids.has(element)) ids.set(element, ++sequence)
    return ids.get(element)!
  }
  function path(element: Element): string {
    const parts: string[] = []
    for (let e: Element | null = element; e; e = e.parentElement) {
      if (e.id && document.querySelectorAll('#' + CSS.escape(e.id)).length === 1) {
        parts.unshift('#' + CSS.escape(e.id))
        break
      }
      const tag = CSS.escape(e.localName)
      const siblings = e.parentElement ? Array.from(e.parentElement.children).filter(s => s.localName === e!.localName) : [e]
      parts.unshift(siblings.length === 1 ? tag : tag + ':nth-of-type(' + (siblings.indexOf(e) + 1) + ')')
    }
    return parts.join(' > ')
  }
  function rectangle(e: Element): Box {
    const { left, right, top, bottom } = e.getBoundingClientRect()
    return { left, right, top, bottom }
  }
  function visible(e: Element): boolean {
    const rect = e.getBoundingClientRect()
    return (rect.width > 0 || rect.height > 0) && e.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true, opacityProperty: true })
  }
  function exception(e: Element, id: string) {
    for (let owner: Element | null = e; owner; owner = owner.parentElement) {
      const annotation = owner.getAttribute('data-ui-exception') ?? ''
      const colon = annotation.indexOf(':')
      if (colon >= 0 && annotation.slice(0, colon).trim() === id && annotation.slice(colon + 1).trim()) return annotation.slice(colon + 1).trim()
    }
    return ''
  }
  function configuredExceptions(rule: LayoutRule, matches: Element[], result: Snapshot) {
    const owners = new Map<Element, string>()
    const conflict = new Set<Element>()
    for (const entry of rule.exceptions ?? []) {
      const issue = (message: string) => (result.issues ??= []).push({ selector: entry.selector, message })
      try {
        const candidates = document.querySelectorAll(entry.selector)
        if (candidates.length !== 1) {
          issue(`Exception selector matched ${candidates.length} elements. Its scope must be unique.`)
          continue
        }
        const e = candidates[0]
        if (!matches.includes(e)) {
          issue('The exception selector is outside the measured rule scope.')
        } else if (owners.has(e) || conflict.has(e)) {
          issue('Multiple exception selectors identify the same owner. Resolve the overlap.')
          owners.delete(e)
          conflict.add(e)
        } else {
          owners.set(e, entry.reason)
        }
      } catch {
        issue('The exception selector is invalid CSS.')
      }
    }
    return owners
  }
  function clipEvidence(e: Element, rule: LayoutRule, sample: Sample) {
    const target = sample.box
    // A transform above the clipping ancestor changes viewport coordinates too.
    // clientWidth and clientHeight remain local CSS-pixel quantities.
    let complex = false
    for (let ancestor: Element | null = e; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor)
      complex ||= style.transform !== 'none' || style.scale !== 'none' || style.rotate !== 'none'
        || style.translate !== 'none' || style.zoom !== '1' && style.zoom !== 'normal'
    }
    let positioned = false
    const scroll = { x: false, y: false }
    for (let node: Element | null = e; node; node = node.parentElement) {
      const css = getComputedStyle(node)
      if (css.clipPath !== 'none' || css.clip !== 'auto' || css.maskImage !== 'none') sample.uncertainty = 'A shaped clip or mask requires visual inspection.'
      // Root and body overflow can propagate to the viewport. Avoid claiming
      // an ordinary element clip when viewport propagation changes the boundary.
      if (node === document.documentElement || node === document.body) {
        const rootBox = rectangle(node)
        const uncertainX = rule.axis !== 'y' && ['clip', 'hidden'].includes(css.overflowX) &&
          (target.left < Math.max(0, rootBox.left) || target.right > Math.min(innerWidth, rootBox.right) || node === e && node.scrollWidth > node.clientWidth)
        const uncertainY = rule.axis !== 'x' && ['clip', 'hidden'].includes(css.overflowY) &&
          (target.top < Math.max(0, rootBox.top) || target.bottom > Math.min(innerHeight, rootBox.bottom) || node === e && node.scrollHeight > node.clientHeight)
        if (uncertainX || uncertainY) sample.uncertainty = 'Root or body overflow may propagate to the viewport. Inspect this boundary in the rendered page.'
        continue
      }
      const parentBox = rectangle(node)
      for (const axis of ['x', 'y'] as const) {
        if (rule.axis && rule.axis !== axis) continue
        const x = axis === 'x'
        const overflow = x ? css.overflowX : css.overflowY
        const client = x ? node.clientWidth : node.clientHeight
        const scrollSize = x ? node.scrollWidth : node.scrollHeight
        if (overflow === 'auto' || overflow === 'scroll') {
          if (node !== e && scrollSize > client) scroll[axis] = true
          continue
        }
        if (!['hidden', 'clip'].includes(overflow) || css.display === 'inline') continue
        if (overflow === 'clip' && css.getPropertyValue('overflow-clip-margin') !== '0px') {
          sample.uncertainty = 'The overflow clip margin changes the clipping boundary.'
          continue
        }
        if (node !== e && complex) {
          sample.uncertainty = 'A transform or zoom prevents comparison of local clip sizes and viewport coordinates.'
          continue
        }
        const start = x ? parentBox.left + node.clientLeft : parentBox.top + node.clientTop
        const excess = node === e ? scrollSize - client : Math.max(
          start - (x ? target.left : target.top), (x ? target.right : target.bottom) - (start + client),
        )
        if (excess <= 0) continue
        if (node !== e && (positioned || scroll[axis])) {
          sample.uncertainty = 'A positioned descendant or intervening scrollport makes the ancestor clipping boundary ambiguous.'
        } else {
          sample.clips.push({ axis, excess, location: node === e ? 'own content' : path(node) })
        }
      }
      positioned ||= css.position === 'absolute' || css.position === 'fixed'
    }
  }
  function snapshot(rule: LayoutRule): Snapshot {
    if (rule.type === 'page-overflow') {
      const root = document.scrollingElement || document.documentElement
      const result: Snapshot = { selector: ':root', elements: [] }
      const owner = document.documentElement
      const reasons = [exception(owner, rule.id), configuredExceptions(rule, [owner], result).get(owner)]
      result.page = { content: root.scrollWidth, viewport: owner.clientWidth, exception: reasons.filter(Boolean).join('. ') }
      return result
    }
    const group = rule.group ? '[data-ui-group=' + CSS.escape(rule.group) + ']' : ''
    const role = rule.role ? '[data-ui-role=' + CSS.escape(rule.role) + ']' : ''
    const selector = rule.selector || [group, role].filter(Boolean).join(' ')
    const result: Snapshot = { selector, elements: [] }
    try {
      if (group && role && document.querySelectorAll(group).length !== 1) {
        result.error = 'The annotated group did not resolve to exactly one container.'
        return result
      }
      const containers = ['item-gap', 'repeated-gaps', 'alignment', 'related-gap', 'group-distance', 'unused-region']
      const isContainer = containers.includes(rule.type)
      const matches = Array.from(document.querySelectorAll(selector))
      const exceptions = configuredExceptions(rule, matches, result)
      if (isContainer && matches.length > 1) {
        result.error = `Expected one group container, found ${matches.length}.`
        return result
      }
      for (const e of matches) {
        const box = rectangle(e)
        const css = getComputedStyle(e)
        const values: Record<string, string> = {}
        const props = rule.type === 'inconsistent-padding' ? ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'] : rule.property ? [rule.property] : []
        for (const prop of props) {
          if (prop === 'width') values[prop] = (box.right - box.left) + 'px'
          else if (prop === 'height') values[prop] = (box.bottom - box.top) + 'px'
          else values[prop] = css.getPropertyValue(prop)
        }
        const element: Sample = {
          identity: identity(e), selector: path(e), box, visible: visible(e), values,
          spacing: e.getAttribute('data-ui-spacing'), exception: [exception(e, rule.id), exceptions.get(e)].filter(Boolean).join('. '),
          children: [], content: { ...box }, clips: [], uncertainty: '',
        }
        if (rule.type === 'spacing' && (rule.property === 'row-gap' || rule.property === 'column-gap')) {
          const grid = css.display.includes('grid')
          const flex = css.display.includes('flex')
          const row = rule.property === 'row-gap'
          const crossAxis = flex && row === css.flexDirection.startsWith('row')
          if ((!grid && !flex) || crossAxis && css.flexWrap === 'nowrap') {
            element.uncertainty = 'This gap property has no verified layout effect on the selected axis.'
          } else {
            const items = Array.from(e.children).filter(visible).map(rectangle)
            const vertical = row === css.writingMode.startsWith('horizontal')
            const start = vertical ? 'top' : 'left'
            const end = vertical ? 'bottom' : 'right'
            if (items.length < 2 || Math.max(...items.map(b => b[start])) < Math.min(...items.map(b => b[end]))) {
              element.uncertainty = 'Two distinct rendered item positions on the selected gap axis could not be established.'
            }
          }
        }
        if (isContainer) {
          element.children = Array.from(e.querySelectorAll(rule.items || ':scope > *')).filter(visible).map(child => ({
            identity: identity(child), box: rectangle(child),
          }))
          if (rule.type === 'unused-region') {
            const left = box.left + e.clientLeft + parseFloat(css.paddingLeft)
            const top = box.top + e.clientTop + parseFloat(css.paddingTop)
            element.content = { left, top, right: left + e.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight),
              bottom: top + e.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) }
            for (let ancestor: Element | null = e; ancestor; ancestor = ancestor.parentElement) {
              const a = getComputedStyle(ancestor)
              if (a.transform !== 'none' || a.scale !== 'none' || a.rotate !== 'none' || a.zoom !== '1' && a.zoom !== 'normal') element.uncertainty = 'A transform or zoom prevents a direct content-box comparison.'
            }
            if ([...e.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())) element.uncertainty = 'Direct text also occupies the selected region.'
          }
        }
        if (rule.type === 'clipping' && element.visible) clipEvidence(e, rule, element)
        result.elements.push(element)
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error)
    }
    return result
  }
  const first = rules.map(snapshot)
  // A suspended background tab may not schedule an animation frame.
  await new Promise<void>(resolve => {
    const timer = setTimeout(resolve, 150)
    requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(timer); resolve() }))
  })
  return rules.map((rule, i) => ({ first: first[i], last: snapshot(rule) }))
}

type Check = {
  observed: string
  expected: string
  failed?: boolean
  recommendation: string
}
const heuristic = new Set<RuleType>(['related-gap', 'group-distance', 'unused-region', 'inconsistent-padding', 'equivalent-components'])
const px = (n: number) => Number(n.toFixed(3)) + 'px'
const unknown = (observed: string, expected: string): Check => ({
  observed, expected, recommendation: 'Resolve the missing or ambiguous evidence and repeat this measurement.',
})

function pixelValue(e: Sample, property: string): number | undefined {
  const value = e.values[property] ?? ''
  return /^-?(?:\d+(?:\.\d+)?|\.\d+)px$/.test(value) ? Number.parseFloat(value) : undefined
}

function instance(rule: LayoutRule, e: Sample, config: Config): Check {
  if (rule.type === 'clipping') {
    const clips = e.clips.filter(c => c.excess > config.tolerance)
    const expected = `Content fits its selected overflow boundaries on ${rule.axis ?? 'both axes'}.`
    if (e.uncertainty && !clips.length) return unknown(e.uncertainty, expected)
    return { failed: clips.length > 0,
      observed: clips.length ? clips.map(c => `${c.axis} excess ${px(c.excess)} at ${c.location}`).join(', ') : 'No excess measured at hidden or clip overflow boundaries.',
      expected, recommendation: 'Allow the clipped content to wrap, expand its containing box or provide the intended scrolling behavior.' }
  }
  const property = rule.property!
  const value = pixelValue(e, property)
  if (value === undefined) return unknown(`${property} resolved to "${e.values[property]}".`, 'A single measurable CSS-pixel length.')
  if (rule.type === 'spacing') {
    if (e.uncertainty) return unknown(e.uncertainty, 'An applied spacing property on this layout axis.')
    const annotated = e.spacing?.trim()
    const names = rule.tokens ?? (annotated ? [annotated] : Object.keys(config.tokens))
    if (annotated && rule.tokens && !names.includes(annotated)) {
      return unknown(`Annotated spacing token "${annotated}" conflicts with allowed tokens ${names.join(', ')}.`, 'Consistent element and project token policies.')
    }
    const permitted = annotated ? [annotated] : names
    if (!permitted.length || permitted.some(k => !Object.hasOwn(config.tokens, k))) {
      return unknown(`${property} ${px(value)}. The token scale is empty or lacks ${permitted.filter(k => !Object.hasOwn(config.tokens, k)).join(', ') || 'a candidate'}.`, 'At least one named token with a configured CSS-pixel value.')
    }
    const expected = permitted.map(k => `${k} (${px(config.tokens[k])})`).join(', ')
    const nearest = permitted.reduce((a, b) => Math.abs(value - config.tokens[a]) <= Math.abs(value - config.tokens[b]) ? a : b)
    return { observed: `Resolved ${property} ${px(value)}`, expected,
      failed: Math.abs(config.tokens[nearest] - value) > config.tolerance,
      recommendation: `Apply the intended spacing token to ${property}. The closest allowed value is ${nearest} (${px(config.tokens[nearest])}).` }
  }
  return lengthCheck(rule, property, [value], config)
}

// Dimensions and rendered sibling gaps share units, tolerance and comparison
// semantics. Every adjacent pair must meet the configured criterion.
function lengthCheck(rule: LayoutRule, label: string, values: number[], config: Config): Check {
  const observed = label + ' ' + values.map(px).join(', ')
  const unit = rule.unit ?? 'px'
  const compare = rule.comparison ?? 'exact'
  if (unit === 'dp' && config.cssPxPerDp === undefined) return unknown(observed, `${compare} ${rule.expected}dp requires the project CSS-px-per-dp mapping.`)
  const expected = rule.expected! * (unit === 'dp' ? config.cssPxPerDp! : 1)
  const failed = values.some(value => {
    const delta = value - expected
    if (compare === 'min') return delta < -config.tolerance
    if (compare === 'max') return delta > config.tolerance
    return Math.abs(delta) > config.tolerance
  })
  const owner = rule.type === 'item-gap' ? 'the container gap or item margins' : label
  return { failed, observed, expected: `${compare} ${px(expected)}${unit === 'dp' ? ' (' + rule.expected + 'dp)' : ''}`,
    recommendation: `Adjust ${owner} to meet the ${compare} criterion of ${px(expected)}.` }
}

function groupCheck(rule: LayoutRule, e: Sample, config: Config): Check {
  const tolerance = config.tolerance
  const axis = rule.axis ?? 'y'
  const [start, end] = axis === 'y' ? ['top', 'bottom'] as const : ['left', 'right'] as const
  const [crossStart, crossEnd] = axis === 'y' ? ['left', 'right'] as const : ['top', 'bottom'] as const
  const boxes = e.children.map(c => c.box)
  const minimum = rule.type === 'unused-region' ? 1 : rule.type === 'group-distance' ? 4 : rule.type === 'repeated-gaps' ? 3 : 2
  if (boxes.length < minimum) return unknown(`${boxes.length} visible comparison items.`, `At least ${minimum} rendered items for ${rule.type}.`)
  if (rule.type === 'alignment') {
    const edge = rule.edge ?? 'start'
    const values = boxes.map(b => edge === 'start' ? b[start] : edge === 'end' ? b[end] : (b[start] + b[end]) / 2)
    return { failed: Math.max(...values) - Math.min(...values) > tolerance,
      observed: `${axis} ${edge} coordinates ${values.map(px).join(', ')}`, expected: 'A shared edge or center coordinate within tolerance.',
      recommendation: `Align the selected items to their common physical ${axis} ${edge} coordinate.` }
  }
  if (rule.type === 'unused-region') {
    const length = e.content[end] - e.content[start]
    if (e.uncertainty || length <= 0) return unknown(e.uncertainty || 'The region has no measurable content-box extent.', 'A measurable, constrained region.')
    const intervals = boxes.map(b => [Math.max(e.content[start], b[start]), Math.min(e.content[end], b[end])])
      .filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0])
    let occupied = 0
    let covered = e.content[start]
    for (const [a, b] of intervals) {
      occupied += Math.max(0, b - Math.max(a, covered))
      covered = Math.max(covered, b)
    }
    const unused = length - occupied
    return { failed: unused > length * rule.fraction! + tolerance,
      observed: `${px(unused)} of ${px(length)} (${(100 * unused / length).toFixed(1)}%) unoccupied along ${axis} by selected items.`,
      expected: `Review above ${Number((100 * rule.fraction!).toFixed(3))}% unoccupied extent in this constrained region.`,
      recommendation: 'Check whether the free space serves alignment, growth or a task before reducing the constrained region.' }
  }
  // Sorting geometrically also handles reversed flex and DOM order. Cross-axis
  // overlap and non-overlapping primary intervals disambiguate a single lane.
  boxes.sort((a, b) => a[start] - b[start])
  const overlap = Math.min(...boxes.map(b => b[crossEnd])) - Math.max(...boxes.map(b => b[crossStart]))
  const gaps = boxes.slice(1).map((b, i) => b[start] - boxes[i][end])
  if (overlap <= 0 || gaps.some(g => g < -tolerance)) {
    return unknown('Items wrap, overlap or occupy different visual lanes.', `One ordered lane along physical ${axis}.`)
  }
  if (rule.type === 'item-gap') return lengthCheck(rule, `${axis} edge-to-edge gaps`, gaps, config)
  const observed = `${axis} edge-to-edge gaps ${gaps.map(px).join(', ')}`
  if (rule.type === 'repeated-gaps') {
    return { failed: Math.max(...gaps) - Math.min(...gaps) > tolerance, observed,
      expected: 'Equal repeated gaps within tolerance.', recommendation: 'Align the repeated gaps using the container spacing rule and inspect item margins.' }
  }
  if (rule.type === 'related-gap') {
    const bound = rule.reference! * (rule.factor ?? 1)
    return { failed: gaps.some(g => g > bound + tolerance), observed,
      expected: `Review above ${px(bound)} for these related items (reference ${px(rule.reference!)} × ${rule.factor ?? 1}).`,
      recommendation: 'Verify the relationship and reduce the largest gap if it visually separates related items.' }
  }
  const sorted = [...gaps].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = (sorted[mid] + sorted[Math.floor((sorted.length - 1) / 2)]) / 2
  const factor = rule.factor ?? 2
  return { failed: gaps.some(g => g > median * factor + tolerance || g < median / factor - tolerance), observed,
    expected: `Review outside ${px(median / factor)}–${px(median * factor)} (peer median ${px(median)}, factor ${factor}).`,
    recommendation: 'Inspect the outlying distance and match its peers if the groups have the same relationship.' }
}

function peers(rule: LayoutRule, elements: Sample[], tolerance: number): Check {
  if (elements.length < 2) return unknown(`${elements.length} comparable peers.`, 'At least two visible equivalent peers in the same state.')
  const props = rule.type === 'inconsistent-padding' ? ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'] : [rule.property!]
  let failed = false
  const observed: string[] = []
  for (const prop of props) {
    const values: number[] = []
    for (const element of elements) {
      const value = pixelValue(element, prop)
      if (value === undefined) return unknown(`${element.selector} ${prop} resolved to "${element.values[prop]}".`, 'Comparable CSS-pixel values.')
      values.push(value)
    }
    failed ||= Math.max(...values) - Math.min(...values) > tolerance
    observed.push(`${prop} ${values.map((v, i) => elements[i].selector + ' ' + px(v)).join(', ')}`)
  }
  return { failed, observed: observed.join('. '), expected: `Comparable ${props.join(', ')} across the selected peers, within tolerance.`,
    recommendation: 'Check variants, content and component states before aligning the differing values.' }
}

export async function layout(page: Page, config: Config, viewport: Viewport): Promise<Finding[]> {
  const rules = config.rules.filter(r => viewport.width >= (r.minWidth ?? 0) && viewport.width <= (r.maxWidth ?? Infinity))
  if (!rules.length) return []
  const scoped = rules.map(rule => ({ ...rule, exceptions: rule.exceptions?.filter(e => e.viewport === viewport.name) }))
  const snapshots = await page.evaluate(rendered, scoped)
  const results: Finding[] = []
  for (const [i, rule] of rules.entries()) {
    const { first, last } = snapshots[i]
    function record(selector: string, check: Check, exception = '') {
      let kind: Finding['kind'] = 'pass'
      let verdict: Finding['verdict'] = 'matches'
      if (check.failed === undefined) {
        kind = 'unverified observation'
        verdict = 'unverified'
      } else if (check.failed) {
        if (exception) {
          kind = 'exception'
          verdict = 'documented project exception'
        } else if (heuristic.has(rule.type)) {
          kind = 'heuristic warning'
          verdict = 'unverified'
        } else {
          kind = ['clipping', 'page-overflow'].includes(rule.type) || rule.force === 'requirement' ? 'confirmed violation' : 'design deviation'
          verdict = 'deviation'
        }
      }
      results.push({
        ruleId: rule.id, category: rule.type, selector, viewport: viewport.name, kind, verdict,
        severity: kind === 'confirmed violation' ? 'high' : kind === 'design deviation' ? 'medium' : kind === 'heuristic warning' ? 'low' : 'info',
        confidence: kind === 'unverified observation' ? 'low' : kind === 'heuristic warning' ? 'medium' : 'high',
        observed: check.observed + (kind === 'exception' ? '. Documented exception: ' + exception : ''),
        expected: check.expected, criterion: rule.criterion ?? check.expected,
        source: rule.source ?? `Project audit configuration, rule ${rule.id}`,
        recommendation: kind === 'pass' ? 'Preserve the measured behavior.' : kind === 'exception' ? 'Retain the documented reason and verify its scope.' : check.recommendation,
        verification: `Repeat ${rule.type} on ${selector} at ${viewport.width}×${viewport.height} with the same content and state.`,
      })
    }
    const issues = new Map<string, { selector: string; message: string }>()
    for (const issue of [...first.issues ?? [], ...last.issues ?? []]) issues.set(JSON.stringify(issue), issue)
    for (const issue of issues.values()) {
      record(issue.selector, unknown(issue.message, 'A unique exception owner within this rule and viewport.'))
    }
    if (first.error || last.error) {
      record(last.selector, unknown(last.error || first.error!, 'A valid selector and an unambiguous measurement scope.'))
      continue
    }
    if (rule.type === 'page-overflow') {
      if (JSON.stringify(first.page) !== JSON.stringify(last.page)) {
        record(last.selector, unknown('The scrolling document changed size between measurements.', 'A stable document width.'))
      } else {
        const { content, viewport: width, exception } = last.page!
        record(last.selector, { failed: content - width > config.tolerance, observed: `Document ${px(content)}, viewport ${px(width)}.`,
          expected: 'Document scroll width fits the viewport.', recommendation: 'Locate the element extending the document and allow it to shrink, wrap or scroll within its own container.' }, exception)
      }
      continue
    }
    if (!last.elements.length || first.elements.map(e => e.identity).join() !== last.elements.map(e => e.identity).join()) {
      record(last.selector, unknown(last.elements.length ? 'Matched membership changed between samples.' : 'No elements matched the configured scope.', 'Stable rendered matches.'))
      continue
    }
    const peerRule = ['inconsistent-padding', 'equivalent-components'].includes(rule.type)
    const available: Sample[] = []
    for (const [index, element] of last.elements.entries()) {
      if (!element.visible || JSON.stringify(first.elements[index]) !== JSON.stringify(element)) {
        record(element.selector, unknown(element.visible ? 'Geometry, membership, or measurement changed between samples.' : 'The matched element has no visible rendered box.', 'A stable, visible element.'))
      } else if (peerRule) {
        available.push(element)
      } else {
        const check = ['dimension', 'spacing', 'clipping'].includes(rule.type)
          ? instance(rule, element, config) : groupCheck(rule, element, config)
        record(element.selector, check, element.exception)
      }
    }
    if (peerRule && available.length) {
      // Compare unexcepted peers independently so one exception cannot hide an unrelated mismatch.
      const normal = available.filter(e => !e.exception)
      const baseline = peers(rule, normal, config.tolerance)
      if (normal.length >= 2 || available.length === normal.length) record(last.selector, baseline)
      for (const e of available.filter(e => e.exception)) {
        if (normal.length >= 2 && baseline.failed !== false) {
          record(e.selector, unknown('Unexcepted peers differ or lack comparable measurements.', 'A consistent reference for the excepted peer.'))
        } else {
          const comparison = normal.length ? [...normal, e] : available
          record(e.selector, peers(rule, comparison, config.tolerance), e.exception)
        }
      }
    }
  }
  return results
}
