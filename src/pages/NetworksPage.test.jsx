import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'
import NetworksPage from './NetworksPage'
import { networksApi } from '../services/api'

// Mock the API module
vi.mock('../services/api', () => ({
  networksApi: {
    getNetworks: vi.fn(),
    createNetwork: vi.fn(),
    updateNetwork: vi.fn(),
    deleteNetwork: vi.fn(),
  }
}))

// Mock window.confirm
const mockConfirm = vi.fn()
globalThis.confirm = mockConfirm

// Mock console.error
const mockConsoleError = vi.fn()
globalThis.console.error = mockConsoleError

describe('NetworksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockClear()
    mockConsoleError.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the networks page correctly', () => {
    networksApi.getNetworks.mockResolvedValue([])
    
    render(<NetworksPage />)
    
    expect(screen.getByText('Networks Management')).toBeInTheDocument()
    expect(screen.getByText('Add New Network')).toBeInTheDocument()
  })

  it('loads and displays networks on mount', async () => {
    const mockNetworks = [
      { id: 1, ipv4: '192.168.1.0/24' },
      { id: 2, ipv4: '10.0.0.0/8' }
    ]
    networksApi.getNetworks.mockResolvedValue(mockNetworks)

    render(<NetworksPage />)

    await waitFor(() => {
      expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument()
      expect(screen.getByText('10.0.0.0/8')).toBeInTheDocument()
    })

    expect(networksApi.getNetworks).toHaveBeenCalledWith(0, 10)
  })

  it('displays "Not set" for networks without IPv4', async () => {
    const mockNetworks = [
      { id: 1, ipv4: null },
      { id: 2, ipv4: '' }
    ]
    networksApi.getNetworks.mockResolvedValue(mockNetworks)

    render(<NetworksPage />)

    await waitFor(() => {
      const notSetElements = screen.getAllByText('Not set')
      expect(notSetElements).toHaveLength(2)
    })
  })

  it('shows error message and console error when loading networks fails', async () => {
    const errorMessage = 'Network error'
    networksApi.getNetworks.mockRejectedValue(new Error(errorMessage))

    render(<NetworksPage />)

    await waitFor(() => {
      expect(screen.getByText(`Failed to load networks: ${errorMessage}`)).toBeInTheDocument()
    })

    expect(mockConsoleError).toHaveBeenCalledWith(`Failed to load networks: ${errorMessage}`)
  })

  it('shows add network form when Add New Network button is clicked', async () => {
    networksApi.getNetworks.mockResolvedValue([])

    render(<NetworksPage />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Add New Network'))

    await waitFor(() => {
      expect(screen.getByText('Add New Network')).toBeInTheDocument()
      expect(screen.getByLabelText('IPv4 Address:')).toBeInTheDocument()
      expect(screen.getByText('Add')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  it('creates a new network with IPv4 address successfully', async () => {
    networksApi.getNetworks.mockResolvedValue([])
    networksApi.createNetwork.mockResolvedValue({ id: 1, ipv4: '192.168.1.0/24' })

    render(<NetworksPage />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Click Add New Network
    fireEvent.click(screen.getByText('Add New Network'))

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByText('Add New Network')).toBeInTheDocument()
    })

    // Fill in the form
    const ipv4Input = screen.getByLabelText('IPv4 Address:')
    fireEvent.change(ipv4Input, { target: { value: '192.168.1.0/24' } })

    // Submit the form
    fireEvent.click(screen.getByText('Add'))

    await waitFor(() => {
      expect(networksApi.createNetwork).toHaveBeenCalledWith({ ipv4: '192.168.1.0/24' })
    })

    // Should reload networks after creation
    expect(networksApi.getNetworks).toHaveBeenCalledTimes(2) // Once on mount, once after creation
  })

  it('creates a new network without IPv4 address successfully', async () => {
    networksApi.getNetworks.mockResolvedValue([])
    networksApi.createNetwork.mockResolvedValue({ id: 1, ipv4: null })

    render(<NetworksPage />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Add New Network'))

    // Wait for form to appear and then submit
    await waitFor(() => {
      expect(screen.getByText('Add New Network')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Add'))

    await waitFor(() => {
      expect(networksApi.createNetwork).toHaveBeenCalledWith({ ipv4: null })
    })
  })

  it('shows error and console error when creating network fails', async () => {
    const errorMessage = 'Validation error'
    networksApi.getNetworks.mockResolvedValue([])
    networksApi.createNetwork.mockRejectedValue(new Error(errorMessage))

    render(<NetworksPage />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Add New Network'))
    
    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByText('Add New Network')).toBeInTheDocument()
    })

    const ipv4Input = screen.getByLabelText('IPv4 Address:')
    fireEvent.change(ipv4Input, { target: { value: '192.168.1.0/24' } })
    
    fireEvent.click(screen.getByText('Add'))

    await waitFor(() => {
      expect(screen.getByText(`Failed to save network: ${errorMessage}`)).toBeInTheDocument()
    })

    expect(mockConsoleError).toHaveBeenCalledWith(`Failed to save network: ${errorMessage}`)
  })

  it('edits an existing network', async () => {
    const mockNetworks = [{ id: 1, ipv4: '192.168.1.0/24' }]
    networksApi.getNetworks.mockResolvedValue(mockNetworks)
    networksApi.updateNetwork.mockResolvedValue({ id: 1, ipv4: '10.0.0.0/8' })

    render(<NetworksPage />)

    await waitFor(() => {
      expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument()
    })

    // Click Edit button
    fireEvent.click(screen.getByText('Edit'))

    await waitFor(() => {
      expect(screen.getByText('Edit Network')).toBeInTheDocument()
      expect(screen.getByDisplayValue('192.168.1.0/24')).toBeInTheDocument()
    })

    // Change the IPv4 address
    const ipv4Input = screen.getByLabelText('IPv4 Address:')
    fireEvent.change(ipv4Input, { target: { value: '10.0.0.0/8' } })

    // Submit the form
    fireEvent.click(screen.getByText('Update'))

    await waitFor(() => {
      expect(networksApi.updateNetwork).toHaveBeenCalledWith(1, { ipv4: '10.0.0.0/8' })
    })
  })

  it('edits a network to remove IPv4 address', async () => {
    const mockNetworks = [{ id: 1, ipv4: '192.168.1.0/24' }]
    networksApi.getNetworks.mockResolvedValue(mockNetworks)
    networksApi.updateNetwork.mockResolvedValue({ id: 1, ipv4: null })

    render(<NetworksPage />)

    await waitFor(() => {
      expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Edit'))

    const ipv4Input = screen.getByLabelText('IPv4 Address:')
    fireEvent.change(ipv4Input, { target: { value: '' } })

    fireEvent.click(screen.getByText('Update'))

    await waitFor(() => {
      expect(networksApi.updateNetwork).toHaveBeenCalledWith(1, { ipv4: null })
    })
  })

  it('deletes a network after confirmation', async () => {
    const mockNetworks = [{ id: 1, ipv4: '192.168.1.0/24' }]
    networksApi.getNetworks.mockResolvedValue(mockNetworks)
    networksApi.deleteNetwork.mockResolvedValue(null)
    mockConfirm.mockReturnValue(true) // User confirms deletion

    render(<NetworksPage />)

    await waitFor(() => {
      expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument()
    })

    // Click Delete button
    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this network?')
      expect(networksApi.deleteNetwork).toHaveBeenCalledWith(1)
    })
  })

  it('cancels delete when user does not confirm', async () => {
    const mockNetworks = [{ id: 1, ipv4: '192.168.1.0/24' }]
    networksApi.getNetworks.mockResolvedValue(mockNetworks)
    mockConfirm.mockReturnValue(false) // User cancels deletion

    render(<NetworksPage />)

    await waitFor(() => {
      expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Delete'))

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this network?')
    expect(networksApi.deleteNetwork).not.toHaveBeenCalled()
  })

  it('shows error and console error when deleting network fails', async () => {
    const errorMessage = 'Delete failed'
    const mockNetworks = [{ id: 1, ipv4: '192.168.1.0/24' }]
    networksApi.getNetworks.mockResolvedValue(mockNetworks)
    networksApi.deleteNetwork.mockRejectedValue(new Error(errorMessage))
    mockConfirm.mockReturnValue(true)

    render(<NetworksPage />)

    await waitFor(() => {
      expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(screen.getByText(`Failed to delete network: ${errorMessage}`)).toBeInTheDocument()
    })

    expect(mockConsoleError).toHaveBeenCalledWith(`Failed to delete network: ${errorMessage}`)
  })

  it('handles pagination correctly', async () => {
    const mockNetworks = Array.from({ length: 10 }, (_, i) => ({ 
      id: i + 1, 
      ipv4: `192.168.${i + 1}.0/24` 
    }))
    networksApi.getNetworks.mockResolvedValue(mockNetworks)

    render(<NetworksPage />)

    await waitFor(() => {
      expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument()
    })

    // Click Next button
    fireEvent.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(networksApi.getNetworks).toHaveBeenCalledWith(10, 10)
    })

    // Click Previous button
    fireEvent.click(screen.getByText('Previous'))

    await waitFor(() => {
      expect(networksApi.getNetworks).toHaveBeenCalledWith(0, 10)
    })
  })

  it('cancels add/edit form correctly', async () => {
    networksApi.getNetworks.mockResolvedValue([])

    render(<NetworksPage />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Open add form
    fireEvent.click(screen.getByText('Add New Network'))
    
    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByText('Add New Network')).toBeInTheDocument()
    })

    // Fill in some data
    const ipv4Input = screen.getByLabelText('IPv4 Address:')
    fireEvent.change(ipv4Input, { target: { value: '192.168.1.0/24' } })

    // Cancel the form
    fireEvent.click(screen.getByText('Cancel'))

    // Form should be hidden
    await waitFor(() => {
      expect(screen.queryByLabelText('IPv4 Address:')).not.toBeInTheDocument()
    })

    // The "Add New Network" button should be back
    expect(screen.getByRole('button', { name: 'Add New Network' })).toBeInTheDocument()
  })

  it('shows loading state during operations', async () => {
    networksApi.getNetworks.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)))

    render(<NetworksPage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  it('displays "No networks found" when there are no networks', async () => {
    networksApi.getNetworks.mockResolvedValue([])

    render(<NetworksPage />)

    await waitFor(() => {
      expect(screen.getByText('No networks found')).toBeInTheDocument()
    })
  })

  it('handles whitespace-only IPv4 input correctly', async () => {
    networksApi.getNetworks.mockResolvedValue([])
    networksApi.createNetwork.mockResolvedValue({ id: 1, ipv4: null })

    render(<NetworksPage />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Add New Network'))
    
    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByText('Add New Network')).toBeInTheDocument()
    })
    
    const ipv4Input = screen.getByLabelText('IPv4 Address:')
    fireEvent.change(ipv4Input, { target: { value: '   ' } }) // Only whitespace
    
    fireEvent.click(screen.getByText('Add'))

    await waitFor(() => {
      expect(networksApi.createNetwork).toHaveBeenCalledWith({ ipv4: null })
    })
  })
})