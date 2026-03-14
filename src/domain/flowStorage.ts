import type { Flow } from './types'

const STORAGE_KEY = 'pomoflow.flows.v1'

export function loadFlows(): Flow[] {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Flow>[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((flow): flow is Partial<Flow> & { id: string; createdAt: string; updatedAt: string } => {
        return Boolean(flow.id && flow.createdAt && flow.updatedAt)
      })
      .map((flow) => ({
        id: flow.id,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
        goal: typeof flow.goal === 'string' ? flow.goal : '',
        contentHtml: typeof flow.contentHtml === 'string' ? flow.contentHtml : '',
        tags: Array.isArray(flow.tags) ? flow.tags.filter((tag): tag is string => typeof tag === 'string') : [],
        session: {
          focusDurationSec:
            typeof flow.session?.focusDurationSec === 'number' ? flow.session.focusDurationSec : 20 * 60,
          breakDurationSec:
            typeof flow.session?.breakDurationSec === 'number' ? flow.session.breakDurationSec : 10 * 60,
          completedAt: typeof flow.session?.completedAt === 'string' ? flow.session.completedAt : null,
        },
      }))
  } catch {
    return []
  }
}

export function saveFlows(flows: Flow[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flows))
}
