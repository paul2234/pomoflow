import type { Flow, TimeBucket } from './types'

export interface FlowGroup {
  label: string
  key: string
  flows: Flow[]
}

export function groupFlowsByBucket(flows: Flow[], bucket: TimeBucket): FlowGroup[] {
  const sortedFlows = [...flows].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
  const grouped = new Map<string, FlowGroup>()

  for (const flow of sortedFlows) {
    const createdAt = new Date(flow.createdAt)
    const key = getBucketKey(createdAt, bucket)

    const current = grouped.get(key)
    if (current) {
      current.flows.push(flow)
      continue
    }

    grouped.set(key, {
      key,
      label: formatBucketLabel(createdAt, bucket),
      flows: [flow],
    })
  }

  return Array.from(grouped.values())
}

function getBucketKey(date: Date, bucket: TimeBucket): string {
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')

  if (bucket === 'year') {
    return year
  }

  if (bucket === 'month') {
    return `${year}-${month}`
  }

  if (bucket === 'day') {
    return `${year}-${month}-${day}`
  }

  return `${year}-${month}-${day}-${hour}`
}

function formatBucketLabel(date: Date, bucket: TimeBucket): string {
  if (bucket === 'year') {
    return new Intl.DateTimeFormat(undefined, { year: 'numeric' }).format(date)
  }

  if (bucket === 'month') {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
    }).format(date)
  }

  if (bucket === 'day') {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    }).format(date)
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
  }).format(date)
}
