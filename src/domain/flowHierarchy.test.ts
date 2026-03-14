import { buildFlowHierarchy } from './flowHierarchy'
import type { Flow } from './types'

function makeFlow(id: string, createdAt: string): Flow {
  return {
    id,
    createdAt,
    updatedAt: createdAt,
    goal: `goal-${id}`,
    contentHtml: `<p>${id}</p>`,
    tags: [],
    session: {
      focusDurationSec: 1200,
      breakDurationSec: 600,
      completedAt: null,
    },
  }
}

describe('buildFlowHierarchy', () => {
  it('builds year/month/day/flow tree', () => {
    const flows = [
      makeFlow('one', '2026-03-12T11:05:00.000Z'),
      makeFlow('two', '2026-03-12T10:05:00.000Z'),
      makeFlow('three', '2026-02-12T10:05:00.000Z'),
    ]

    const tree = buildFlowHierarchy(flows)

    expect(tree).toHaveLength(1)
    expect(tree[0].kind).toBe('year')
    expect(tree[0].children).toHaveLength(2)
    expect(tree[0].children[0].kind).toBe('month')
    expect(tree[0].children[0].children[0].kind).toBe('day')
    expect(tree[0].children[0].children[0].children[0].kind).toBe('flow')
    expect(tree[0].children[0].children[0].children[0].label).toContain('goal')
  })
})
