import type { Flow } from './types'

export interface FlowHierarchyNode {
  key: string
  label: string
  kind: 'year' | 'month' | 'day' | 'flow'
  children: FlowHierarchyNode[]
  flowId?: string
}

interface MonthBucket {
  node: FlowHierarchyNode
  dayMap: Map<string, FlowHierarchyNode>
}

interface YearBucket {
  node: FlowHierarchyNode
  monthMap: Map<string, MonthBucket>
}

export function buildFlowHierarchy(flows: Flow[]): FlowHierarchyNode[] {
  const sortedFlows = [...flows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const yearMap = new Map<string, YearBucket>()

  for (const flow of sortedFlows) {
    const date = new Date(flow.createdAt)
    const yearKey = `year-${date.getFullYear()}`
    const monthKey = `${yearKey}-month-${date.getMonth()}`
    const dayKey = `${monthKey}-day-${date.getDate()}`

    if (!yearMap.has(yearKey)) {
      yearMap.set(yearKey, {
        node: {
          key: yearKey,
          label: new Intl.DateTimeFormat(undefined, { year: 'numeric' }).format(date),
          kind: 'year',
          children: [],
        },
        monthMap: new Map<string, MonthBucket>(),
      })
    }

    const yearBucket = yearMap.get(yearKey)
    if (!yearBucket) {
      continue
    }

    if (!yearBucket.monthMap.has(monthKey)) {
      const monthNode: FlowHierarchyNode = {
        key: monthKey,
        label: new Intl.DateTimeFormat(undefined, { month: 'long' }).format(date),
        kind: 'month',
        children: [],
      }

      yearBucket.monthMap.set(monthKey, {
        node: monthNode,
        dayMap: new Map<string, FlowHierarchyNode>(),
      })
      yearBucket.node.children.push(monthNode)
    }

    const monthBucket = yearBucket.monthMap.get(monthKey)
    if (!monthBucket) {
      continue
    }

    if (!monthBucket.dayMap.has(dayKey)) {
      const dayNode: FlowHierarchyNode = {
        key: dayKey,
        label: new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(date),
        kind: 'day',
        children: [],
      }

      monthBucket.dayMap.set(dayKey, dayNode)
      monthBucket.node.children.push(dayNode)
    }

    const dayNode = monthBucket.dayMap.get(dayKey)
    if (!dayNode) {
      continue
    }

    dayNode.children.push({
      key: `flow-${flow.id}`,
      label: new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }).format(date),
      kind: 'flow',
      flowId: flow.id,
      children: [],
    })
  }

  return Array.from(yearMap.values()).map((bucket) => bucket.node)
}

export function getFlowPathKeys(flow: Flow): string[] {
  const date = new Date(flow.createdAt)
  const yearKey = `year-${date.getFullYear()}`
  const monthKey = `${yearKey}-month-${date.getMonth()}`
  const dayKey = `${monthKey}-day-${date.getDate()}`
  return [yearKey, monthKey, dayKey]
}
