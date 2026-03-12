import type { Flow } from './types'

const STORAGE_KEY = 'pomoflow.flows.v1'

export function loadFlows(): Flow[] {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as Flow[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
  } catch {
    return []
  }
}

export function saveFlows(flows: Flow[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flows))
}
