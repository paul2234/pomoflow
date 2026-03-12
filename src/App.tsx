import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { MouseEvent } from 'react'

import './App.css'
import { playCompletionTone } from './domain/audio'
import { buildFlowHierarchy, getFlowPathKeys } from './domain/flowHierarchy'
import type { FlowHierarchyNode } from './domain/flowHierarchy'
import { loadFlows, saveFlows } from './domain/flowStorage'
import { sanitizeLink, sanitizeRichText } from './domain/richText'
import { createTimerState, timerReducer } from './domain/timer'
import type { Flow } from './domain/types'

const DEFAULT_FOCUS_MINUTES = 20
const DEFAULT_BREAK_MINUTES = 10
const MOBILE_BREAKPOINT_PX = 760
type TimerMode = 'focus' | 'break'

function App() {
  const [initialFlowState] = useState(getInitialFlowState)
  const [now, setNow] = useState(() => new Date())
  const [titleTime, setTitleTime] = useState(() => new Date())
  const [flows, setFlows] = useState<Flow[]>(initialFlowState.flows)
  const [activeFlowId, setActiveFlowId] = useState<string | null>(initialFlowState.activeFlowId)
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES)
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK_MINUTES)
  const [timerMode, setTimerMode] = useState<TimerMode>('focus')
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(initialFlowState.expandedKeys))
  const [isMobileNav, setIsMobileNav] = useState(() => window.innerWidth < MOBILE_BREAKPOINT_PX)
  const [isNavExpanded, setIsNavExpanded] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT_PX)

  const [timer, dispatchTimer] = useReducer(
    timerReducer,
    DEFAULT_FOCUS_MINUTES * 60,
    createTimerState,
  )

  const editorRef = useRef<HTMLDivElement | null>(null)
  const hasHandledCompletion = useRef(false)
  const lastHydratedFlowId = useRef<string | null>(null)

  const activeFlow = flows.find((flow) => flow.id === activeFlowId) ?? null
  const historyTree = useMemo(() => buildFlowHierarchy(flows), [flows])

  useEffect(() => {
    const onResize = (): void => {
      const nextIsMobile = window.innerWidth < MOBILE_BREAKPOINT_PX
      setIsMobileNav(nextIsMobile)
      if (nextIsMobile) {
        setIsNavExpanded(false)
      }
    }

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
      dispatchTimer({ type: 'tick' })
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    saveFlows(flows)
  }, [flows])

  useEffect(() => {
    if (!editorRef.current || !activeFlowId) {
      return
    }

    if (lastHydratedFlowId.current === activeFlowId) {
      return
    }

    editorRef.current.innerHTML = activeFlow?.contentHtml ?? ''
    lastHydratedFlowId.current = activeFlowId
  }, [activeFlow?.contentHtml, activeFlowId])

  useEffect(() => {
    const modeSeconds = timerMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60
    dispatchTimer({ type: 'setDuration', seconds: modeSeconds })
  }, [breakMinutes, focusMinutes, timerMode])

  useEffect(() => {
    if (timer.status !== 'completed') {
      hasHandledCompletion.current = false
      return
    }

    if (hasHandledCompletion.current) {
      return
    }
    hasHandledCompletion.current = true

    void playCompletionTone().catch(() => {
      // Browser may block audio autoplay until user interaction.
    })

    if (timerMode === 'focus') {
      setTimerMode('break')
      dispatchTimer({ type: 'reset', seconds: breakMinutes * 60 })
      dispatchTimer({ type: 'start' })

      if (!activeFlowId) {
        return
      }

      const completedAt = new Date().toISOString()
      setFlows((currentFlows) =>
        currentFlows.map((flow) =>
          flow.id === activeFlowId
            ? {
                ...flow,
                updatedAt: completedAt,
                session: {
                  focusDurationSec: focusMinutes * 60,
                  breakDurationSec: breakMinutes * 60,
                  completedAt,
                },
              }
            : flow,
        ),
      )
      return
    }

    setTimerMode('focus')
    dispatchTimer({ type: 'reset', seconds: focusMinutes * 60 })
  }, [activeFlowId, breakMinutes, focusMinutes, timer.status, timerMode])

  function applyFormatting(command: 'bold' | 'italic' | 'createLink'): void {
    if (!editorRef.current) {
      return
    }

    editorRef.current.focus()

    if (command === 'createLink') {
      const rawUrl = window.prompt('Paste a link')
      if (!rawUrl) {
        return
      }

      const safeUrl = sanitizeLink(rawUrl)
      if (!safeUrl) {
        return
      }

      document.execCommand('createLink', false, safeUrl)
      onEditorInput()
      return
    }

    document.execCommand(command)
    onEditorInput()
  }

  function onEditorInput(): void {
    if (!editorRef.current || !activeFlowId) {
      return
    }

    const currentHtml = editorRef.current.innerHTML

    setFlows((currentFlows) =>
      currentFlows.map((flow) =>
        flow.id === activeFlowId
          ? {
              ...flow,
              contentHtml: currentHtml,
              updatedAt: new Date().toISOString(),
            }
          : flow,
      ),
    )
  }

  function onEditorBlur(): void {
    if (!editorRef.current || !activeFlowId) {
      return
    }

    const safeHtml = sanitizeRichText(editorRef.current.innerHTML)
    if (safeHtml !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = safeHtml
    }

    setFlows((currentFlows) =>
      currentFlows.map((flow) =>
        flow.id === activeFlowId
          ? {
              ...flow,
              contentHtml: safeHtml,
              updatedAt: new Date().toISOString(),
            }
          : flow,
      ),
    )
  }

  function onEditorClick(event: MouseEvent<HTMLDivElement>): void {
    const target = event.target as HTMLElement
    const anchor = target.closest('a')

    if (!anchor) {
      return
    }

    const href = anchor.getAttribute('href')
    if (!href) {
      return
    }

    event.preventDefault()
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  function addFlowEntry(): Flow {
    const nextFlow = createFlow()
    setFlows((current) => [nextFlow, ...current])
    setActiveFlowId(nextFlow.id)
    lastHydratedFlowId.current = null
    setExpandedKeys((current) => {
      const next = new Set(current)
      for (const key of getFlowPathKeys(nextFlow)) {
        next.add(key)
      }
      return next
    })
    return nextFlow
  }

  function startFocusFlow(): void {
    if (timer.status === 'running') {
      return
    }

    const nextSeconds = timerMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60

    if (timerMode === 'focus') {
      setTitleTime(new Date())
      addFlowEntry()
    }

    dispatchTimer({ type: 'reset', seconds: nextSeconds })
    dispatchTimer({ type: 'start' })
  }

  function stopTimer(): void {
    dispatchTimer({ type: 'pause' })
  }

  function resetTimer(): void {
    const seconds = timerMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60
    dispatchTimer({ type: 'reset', seconds })
  }

  function setMode(mode: TimerMode): void {
    setTimerMode(mode)
    const seconds = mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60
    dispatchTimer({ type: 'reset', seconds })
  }

  function toggleExpanded(key: string): void {
    setExpandedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function handleSelectFlow(flowId: string): void {
    setActiveFlowId(flowId)
    if (isMobileNav) {
      setIsNavExpanded(false)
    }
  }

  return (
    <div className={isNavExpanded ? 'layout nav-expanded' : 'layout nav-collapsed'}>
      <aside className={isNavExpanded ? 'side-nav expanded' : 'side-nav'} aria-label="Timeline navigation">
        <div className="side-nav-head">
          <h2>Pomoflow</h2>
        </div>
        <div className="tree-wrap">
          {historyTree.map((node) => (
            <TreeNode
              key={node.key}
              node={node}
              expandedKeys={expandedKeys}
              activeFlowId={activeFlowId}
              onToggle={toggleExpanded}
              onSelectFlow={handleSelectFlow}
            />
          ))}
        </div>
      </aside>

      {isMobileNav && isNavExpanded ? (
        <button
          type="button"
          className="nav-backdrop"
          onClick={() => setIsNavExpanded(false)}
          aria-label="Close timeline menu"
        />
      ) : null}

      <div className="content-shell">
        <div className="main-sheet">
          <button
            type="button"
            className="nav-toggle"
            onClick={() => setIsNavExpanded((current) => !current)}
            aria-label={isNavExpanded ? 'Collapse timeline menu' : 'Expand timeline menu'}
            title={isNavExpanded ? 'Hide timeline' : 'Show timeline'}
          >
            {isNavExpanded ? '←' : '→'}
          </button>

          <header className="panel header-panel">
            <div>
              <h1>{formatTitleDateTime(titleTime)}</h1>
              <p className="clock" aria-live="polite">
                {formatNow(now)}
              </p>
            </div>
          </header>

          <section className="panel timer-panel">
            <div className="timer-card single">
              <div className="timer-head compact">
                <div className="mode-toggle" role="tablist" aria-label="Timer mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={timerMode === 'focus'}
                    className={timerMode === 'focus' ? 'active-mode' : ''}
                    onClick={() => setMode('focus')}
                  >
                    Focus
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={timerMode === 'break'}
                    className={timerMode === 'break' ? 'active-mode' : ''}
                    onClick={() => setMode('break')}
                  >
                    Break
                  </button>
                </div>
              </div>

              <div className="timer-row">
                <p className="timer-value" aria-live="polite">
                  {formatDuration(timer.remainingSeconds)}
                </p>

                <div className="timer-actions icon-actions">
                  <button type="button" aria-label="Start timer" title="Start" onClick={startFocusFlow}>
                    ▶
                  </button>
                  <button type="button" aria-label="Stop timer" title="Stop" onClick={stopTimer}>
                    ■
                  </button>
                  <button type="button" aria-label="Reset timer" title="Reset" onClick={resetTimer}>
                    ↻
                  </button>
                </div>

                <label className="timer-minutes">
                  Min
                  <input
                    type="number"
                    min={1}
                    max={timerMode === 'focus' ? 180 : 90}
                    value={timerMode === 'focus' ? focusMinutes : breakMinutes}
                    onChange={(event) => {
                      const nextValue = Math.max(1, Number(event.target.value) || 1)
                      if (timerMode === 'focus') {
                        setFocusMinutes(nextValue)
                        return
                      }

                      setBreakMinutes(nextValue)
                    }}
                    disabled={timer.status === 'running'}
                  />
                </label>
              </div>
            </div>
          </section>

          {timer.status === 'completed' ? (
            <p className="time-up-banner" role="status" aria-live="assertive">
              {timerMode === 'focus' ? 'Time is up. Take a break.' : 'Break complete. Ready to focus.'}
            </p>
          ) : null}

          <main className="workspace">
            <section className="panel editor-panel">
              <div className="toolbar" role="toolbar" aria-label="Editor formatting controls">
                <button type="button" aria-label="Bold" onClick={() => applyFormatting('bold')}>
                  B
                </button>
                <button type="button" aria-label="Italic" onClick={() => applyFormatting('italic')}>
                  I
                </button>
                <button type="button" aria-label="Insert link" onClick={() => applyFormatting('createLink')}>
                  🔗
                </button>
              </div>
              <div
                ref={editorRef}
                className="editor"
                contentEditable
                suppressContentEditableWarning
                onInput={onEditorInput}
                onBlur={onEditorBlur}
                onClick={onEditorClick}
                role="textbox"
                aria-multiline="true"
                aria-label="Flow editor"
                data-placeholder="Start writing your flow..."
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

interface TreeNodeProps {
  node: FlowHierarchyNode
  expandedKeys: Set<string>
  activeFlowId: string | null
  onToggle: (key: string) => void
  onSelectFlow: (flowId: string) => void
}

function TreeNode({ node, expandedKeys, activeFlowId, onToggle, onSelectFlow }: TreeNodeProps) {
  if (node.kind === 'flow') {
    const isActive = node.flowId === activeFlowId
    return (
      <div className="tree-node flow-node">
        <button
          type="button"
          className={isActive ? 'tree-item active-flow' : 'tree-item'}
          onClick={() => node.flowId && onSelectFlow(node.flowId)}
        >
          {node.label}
        </button>
      </div>
    )
  }

  const isOpen = expandedKeys.has(node.key)
  return (
    <div className="tree-node">
      <button type="button" className="tree-item tree-parent" onClick={() => onToggle(node.key)}>
        <span className={isOpen ? 'caret open' : 'caret'} aria-hidden="true">
          ▸
        </span>
        {node.label}
      </button>
      {isOpen ? (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.key}
              node={child}
              expandedKeys={expandedKeys}
              activeFlowId={activeFlowId}
              onToggle={onToggle}
              onSelectFlow={onSelectFlow}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function createFlow(): Flow {
  const timestamp = new Date().toISOString()
  return {
    id: generateFlowId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    contentHtml: '',
    tags: [],
    session: {
      focusDurationSec: DEFAULT_FOCUS_MINUTES * 60,
      breakDurationSec: DEFAULT_BREAK_MINUTES * 60,
      completedAt: null,
    },
  }
}

function getInitialFlowState(): { flows: Flow[]; activeFlowId: string; expandedKeys: string[] } {
  const existingFlows = loadFlows()
  if (existingFlows.length > 0) {
    return {
      flows: existingFlows,
      activeFlowId: existingFlows[0].id,
      expandedKeys: getFlowPathKeys(existingFlows[0]),
    }
  }

  const initialFlow = createFlow()
  return {
    flows: [initialFlow],
    activeFlowId: initialFlow.id,
    expandedKeys: getFlowPathKeys(initialFlow),
  }
}

function generateFlowId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `flow-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

function formatNow(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function formatTitleDateTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default App
