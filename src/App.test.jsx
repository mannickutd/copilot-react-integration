import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders navigation and redirects to clients page', () => {
    render(<App />)
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Networks')).toBeInTheDocument()
    expect(screen.getByText('Clients Management')).toBeInTheDocument()
  })
})