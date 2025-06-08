// API base URL - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Generic API request function
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = Array.isArray(errorData.detail) 
          ? errorData.detail.map(err => err.msg).join(', ')
          : errorData.detail;
      }
    } catch {
      // If we can't parse the error response, use the default message
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (like DELETE operations)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return null;
}

// Client API functions
export const clientsApi = {
  // Get all clients with pagination
  getClients: (skip = 0, limit = 100) => 
    apiRequest(`/clients/?skip=${skip}&limit=${limit}`),
  
  // Get single client
  getClient: (clientId) => 
    apiRequest(`/clients/${clientId}`),
  
  // Create new client
  createClient: (clientData) => 
    apiRequest('/clients/', {
      method: 'POST',
      body: clientData,
    }),
  
  // Update client
  updateClient: (clientId, clientData) => 
    apiRequest(`/clients/${clientId}`, {
      method: 'PUT',
      body: clientData,
    }),
  
  // Delete client
  deleteClient: (clientId) => 
    apiRequest(`/clients/${clientId}`, {
      method: 'DELETE',
    }),
};

// Network API functions
export const networksApi = {
  // Get all networks with pagination
  getNetworks: (skip = 0, limit = 100) => 
    apiRequest(`/networks/?skip=${skip}&limit=${limit}`),
  
  // Get single network
  getNetwork: (networkId) => 
    apiRequest(`/networks/${networkId}`),
  
  // Create new network
  createNetwork: (networkData) => 
    apiRequest('/networks/', {
      method: 'POST',
      body: networkData,
    }),
  
  // Update network
  updateNetwork: (networkId, networkData) => 
    apiRequest(`/networks/${networkId}`, {
      method: 'PUT',
      body: networkData,
    }),
  
  // Delete network
  deleteNetwork: (networkId) => 
    apiRequest(`/networks/${networkId}`, {
      method: 'DELETE',
    }),
};