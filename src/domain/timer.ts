export type TimerStatus = 'idle' | 'running' | 'completed'

export interface TimerState {
  totalSeconds: number
  remainingSeconds: number
  status: TimerStatus
}

export type TimerAction =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'tick' }
  | { type: 'reset'; seconds: number }
  | { type: 'setDuration'; seconds: number }

export const MIN_TIMER_SECONDS = 60

export function createTimerState(seconds: number): TimerState {
  const safeSeconds = clampSeconds(seconds)

  return {
    totalSeconds: safeSeconds,
    remainingSeconds: safeSeconds,
    status: 'idle',
  }
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'start': {
      if (state.remainingSeconds <= 0) {
        return {
          ...state,
          status: 'completed',
        }
      }

      return {
        ...state,
        status: 'running',
      }
    }
    case 'pause': {
      if (state.status !== 'running') {
        return state
      }

      return {
        ...state,
        status: 'idle',
      }
    }
    case 'tick': {
      if (state.status !== 'running') {
        return state
      }

      const nextSeconds = state.remainingSeconds - 1
      if (nextSeconds <= 0) {
        return {
          ...state,
          remainingSeconds: 0,
          status: 'completed',
        }
      }

      return {
        ...state,
        remainingSeconds: nextSeconds,
      }
    }
    case 'reset': {
      const safeSeconds = clampSeconds(action.seconds)
      return {
        totalSeconds: safeSeconds,
        remainingSeconds: safeSeconds,
        status: 'idle',
      }
    }
    case 'setDuration': {
      if (state.status === 'running') {
        return state
      }

      const safeSeconds = clampSeconds(action.seconds)
      return {
        totalSeconds: safeSeconds,
        remainingSeconds: safeSeconds,
        status: 'idle',
      }
    }
    default:
      return state
  }
}

function clampSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) {
    return MIN_TIMER_SECONDS
  }

  return Math.max(MIN_TIMER_SECONDS, Math.floor(seconds))
}
