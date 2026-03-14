import { groupFlowsByBucket } from './flowBuckets'
import type { Flow } from './types'

function makeFlow(id: string, createdAt: string): Flow {
  return {
    id,
    createdAt,
    updatedAt: createdAt,
    goal: '',
    contentHtml: `<p>${id}</p>`,
    tags: [],
    session: {
      focusDurationSec: 1200,
      breakDurationSec: 600,
      completedAt: null,
    },
  }
}

describe('groupFlowsByBucket', () => {
  it('groups by day', () => {
    const flows = [
      makeFlow('one', '2026-03-11T09:00:00.000Z'),
      makeFlow('two', '2026-03-11T13:00:00.000Z'),
      makeFlow('three', '2026-03-10T09:00:00.000Z'),
    ]

    const groups = groupFlowsByBucket(flows, 'day')

    expect(groups).toHaveLength(2)
    expect(groups[0].flows).toHaveLength(2)
    expect(groups[1].flows).toHaveLength(1)
  })

  it('groups by hour', () => {
    const flows = [
      makeFlow('one', '2026-03-11T09:10:00.000Z'),
      makeFlow('two', '2026-03-11T09:20:00.000Z'),
      makeFlow('three', '2026-03-11T10:00:00.000Z'),
    ]

    const groups = groupFlowsByBucket(flows, 'hour')

    expect(groups).toHaveLength(2)
    expect(groups[0].flows).toHaveLength(1)
    expect(groups[1].flows).toHaveLength(2)
  })
})
