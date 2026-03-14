import { render, screen } from '@testing-library/react'

import App from './App'

describe('App', () => {
  it('renders timers and editor controls', () => {
    render(<App />)

    expect(screen.getByPlaceholderText(/my goal for this flow is/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /focus/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /break/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stop timer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset timer/i })).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /insert link/i })).toBeInTheDocument()

    expect(screen.getByRole('textbox', { name: /flow editor/i })).toBeInTheDocument()
  })
})
