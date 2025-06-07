import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'
import ClientsPage from './ClientsPage'
import { clientsApi } from '../services/api'

// Mock the API module
vi.mock('../services/api', () => ({
  clientsApi: {
    getClients: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
  }
}))

// Mock window.alert
const mockAlert = vi.fn()
globalThis.alert = mockAlert

// Mock window.confirm
const mockConfirm = vi.fn()
globalThis.confirm = mockConfirm

describe('ClientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAlert.mockClear()
    mockConfirm.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the clients page correctly', () => {
    clientsApi.getClients.mockResolvedValue([])
    
    render(<ClientsPage />)
    
    expect(screen.getByText('Clients Management')).toBeInTheDocument()
    expect(screen.getByText('Add New Client')).toBeInTheDocument()
  })

  it('loads and displays clients on mount', async () => {
    const mockClients = [
      { id: 1, name: 'Client 1' },
      { id: 2, name: 'Client 2' }
    ]
    clientsApi.getClients.mockResolvedValue(mockClients)

    render(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Client 1')).toBeInTheDocument()
      expect(screen.getByText('Client 2')).toBeInTheDocument()
    })

    expect(clientsApi.getClients).toHaveBeenCalledWith(0, 10)
  })

  it('shows error message and alert when loading clients fails', async () => {
    const errorMessage = 'Network error'
    clientsApi.getClients.mockRejectedValue(new Error(errorMessage))

    render(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText(`Failed to load clients: ${errorMessage}`)).toBeInTheDocument()
    })

    expect(mockAlert).toHaveBeenCalledWith(`Failed to load clients: ${errorMessage}`)
  })

  it('shows add client form when Add New Client button is clicked', async () => {
    clientsApi.getClients.mockResolvedValue([])

    render(<ClientsPage />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Add New Client'))

    await waitFor(() => {
      expect(screen.getByText('Add New Client')).toBeInTheDocument()
      expect(screen.getByLabelText('Name:')).toBeInTheDocument()
      expect(screen.getByText('Add')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  it('creates a new client successfully', async () => {
    clientsApi.getClients.mockResolvedValue([])
    clientsApi.createClient.mockResolvedValue({ id: 1, name: 'New Client' })

    render(<ClientsPage />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Click Add New Client
    fireEvent.click(screen.getByText('Add New Client'))

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByLabelText('Name:')).toBeInTheDocument()
    })

    // Fill in the form
    const nameInput = screen.getByLabelText('Name:')
    fireEvent.change(nameInput, { target: { value: 'New Client' } })

    // Submit the form
    fireEvent.click(screen.getByText('Add'))

    await waitFor(() => {
      expect(clientsApi.createClient).toHaveBeenCalledWith({ name: 'New Client' })
    })

    // Should reload clients after creation
    expect(clientsApi.getClients).toHaveBeenCalledTimes(2) // Once on mount, once after creation
  })

  it('shows error and alert when creating client fails', async () => {
    const errorMessage = 'Validation error'
    clientsApi.getClients.mockResolvedValue([])
    clientsApi.createClient.mockRejectedValue(new Error(errorMessage))

    render(<ClientsPage />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Add New Client'))
    
    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByLabelText('Name:')).toBeInTheDocument()
    })
    
    const nameInput = screen.getByLabelText('Name:')
    fireEvent.change(nameInput, { target: { value: 'New Client' } })
    
    fireEvent.click(screen.getByText('Add'))

    await waitFor(() => {
      expect(screen.getByText(`Failed to save client: ${errorMessage}`)).toBeInTheDocument()
    })

    expect(mockAlert).toHaveBeenCalledWith(`Failed to save client: ${errorMessage}`)
  })

  it('requires name field when creating client', async () => {
    clientsApi.getClients.mockResolvedValue([])

    render(<ClientsPage />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Add New Client'))
    
    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByLabelText('Name:')).toBeInTheDocument()
    })
    
    // Submit the form with empty name field
    const form = screen.getByLabelText('Name:').closest('form')
    fireEvent.submit(form)

    // Should show the error now
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })

    expect(clientsApi.createClient).not.toHaveBeenCalled()
  })

  it('edits an existing client', async () => {
    const mockClients = [{ id: 1, name: 'Client 1' }]
    clientsApi.getClients.mockResolvedValue(mockClients)
    clientsApi.updateClient.mockResolvedValue({ id: 1, name: 'Updated Client' })

    render(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Client 1')).toBeInTheDocument()
    })

    // Click Edit button
    fireEvent.click(screen.getByText('Edit'))

    await waitFor(() => {
      expect(screen.getByText('Edit Client')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Client 1')).toBeInTheDocument()
    })

    // Change the name
    const nameInput = screen.getByLabelText('Name:')
    fireEvent.change(nameInput, { target: { value: 'Updated Client' } })

    // Submit the form
    fireEvent.click(screen.getByText('Update'))

    await waitFor(() => {
      expect(clientsApi.updateClient).toHaveBeenCalledWith(1, { name: 'Updated Client' })
    })
  })

  it('deletes a client after confirmation', async () => {
    const mockClients = [{ id: 1, name: 'Client 1' }]
    clientsApi.getClients.mockResolvedValue(mockClients)
    clientsApi.deleteClient.mockResolvedValue(null)
    mockConfirm.mockReturnValue(true) // User confirms deletion

    render(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Client 1')).toBeInTheDocument()
    })

    // Click Delete button
    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this client?')
      expect(clientsApi.deleteClient).toHaveBeenCalledWith(1)
    })
  })

  it('cancels delete when user does not confirm', async () => {
    const mockClients = [{ id: 1, name: 'Client 1' }]
    clientsApi.getClients.mockResolvedValue(mockClients)
    mockConfirm.mockReturnValue(false) // User cancels deletion

    render(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Client 1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Delete'))

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this client?')
    expect(clientsApi.deleteClient).not.toHaveBeenCalled()
  })

  it('shows error and alert when deleting client fails', async () => {
    const errorMessage = 'Delete failed'
    const mockClients = [{ id: 1, name: 'Client 1' }]
    clientsApi.getClients.mockResolvedValue(mockClients)
    clientsApi.deleteClient.mockRejectedValue(new Error(errorMessage))
    mockConfirm.mockReturnValue(true)

    render(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Client 1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(screen.getByText(`Failed to delete client: ${errorMessage}`)).toBeInTheDocument()
    })

    expect(mockAlert).toHaveBeenCalledWith(`Failed to delete client: ${errorMessage}`)
  })

  it('handles pagination correctly', async () => {
    const mockClients = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Client ${i + 1}` }))
    clientsApi.getClients.mockResolvedValue(mockClients)

    render(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Client 1')).toBeInTheDocument()
    })

    // Click Next button
    fireEvent.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(clientsApi.getClients).toHaveBeenCalledWith(10, 10)
    })

    // Click Previous button
    fireEvent.click(screen.getByText('Previous'))

    await waitFor(() => {
      expect(clientsApi.getClients).toHaveBeenCalledWith(0, 10)
    })
  })

  it('cancels add/edit form correctly', async () => {
    clientsApi.getClients.mockResolvedValue([])

    render(<ClientsPage />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Open add form
    fireEvent.click(screen.getByText('Add New Client'))
    
    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByLabelText('Name:')).toBeInTheDocument()
    })
    
    // Fill in some data
    const nameInput = screen.getByLabelText('Name:')
    fireEvent.change(nameInput, { target: { value: 'Test Client' } })

    // Cancel the form
    fireEvent.click(screen.getByText('Cancel'))

    // Form should be hidden
    await waitFor(() => {
      expect(screen.queryByLabelText('Name:')).not.toBeInTheDocument()
    })

    // The "Add New Client" button should be back
    expect(screen.getByRole('button', { name: 'Add New Client' })).toBeInTheDocument()
  })

  it('shows loading state during operations', async () => {
    clientsApi.getClients.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)))

    render(<ClientsPage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  it('displays "No clients found" when there are no clients', async () => {
    clientsApi.getClients.mockResolvedValue([])

    render(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('No clients found')).toBeInTheDocument()
    })
  })
})