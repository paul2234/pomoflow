import { createTimerState, timerReducer } from './timer'
import type { TimerState } from './timer'

describe('timerReducer', () => {
  it('counts down and completes at zero', () => {
    let state: TimerState = {
      totalSeconds: 2,
      remainingSeconds: 2,
      status: 'idle',
    }
    state = timerReducer(state, { type: 'start' })

    expect(state.status).toBe('running')

    state = timerReducer(state, { type: 'tick' })
    expect(state.remainingSeconds).toBe(1)
    expect(state.status).toBe('running')

    state = timerReducer(state, { type: 'tick' })
    expect(state.remainingSeconds).toBe(0)
    expect(state.status).toBe('completed')
  })

  it('ignores duration changes while running', () => {
    let state = createTimerState(120)
    state = timerReducer(state, { type: 'start' })
    state = timerReducer(state, { type: 'setDuration', seconds: 240 })

    expect(state.totalSeconds).toBe(120)
    expect(state.remainingSeconds).toBe(120)
  })

  it('catches up when multiple seconds elapse', () => {
    let state = createTimerState(300)
    state = timerReducer(state, { type: 'start' })
    state = timerReducer(state, { type: 'elapse', seconds: 90 })

    expect(state.remainingSeconds).toBe(210)
    expect(state.status).toBe('running')

    state = timerReducer(state, { type: 'elapse', seconds: 250 })
    expect(state.remainingSeconds).toBe(0)
    expect(state.status).toBe('completed')
  })
})
