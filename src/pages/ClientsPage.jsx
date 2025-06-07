import { useState, useEffect, useCallback } from 'react';
import { clientsApi } from '../services/api';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [pagination, setPagination] = useState({ skip: 0, limit: 10, hasMore: true });

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await clientsApi.getClients(pagination.skip, pagination.limit);
      setClients(data || []);
      setPagination(prev => ({
        ...prev,
        hasMore: data && data.length === prev.limit
      }));
    } catch (err) {
      const errorMsg = 'Failed to load clients: ' + err.message;
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [pagination.skip, pagination.limit]);

  // Load clients on component mount and when pagination changes
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (editingClient) {
        await clientsApi.updateClient(editingClient.id, formData);
      } else {
        await clientsApi.createClient(formData);
      }
      setFormData({ name: '' });
      setShowAddForm(false);
      setEditingClient(null);
      // Reset to first page and reload
      setPagination(prev => ({ ...prev, skip: 0 }));
      await loadClients();
    } catch (err) {
      const errorMsg = 'Failed to save client: ' + err.message;
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({ name: client.name });
    setShowAddForm(true);
  };

  const handleDelete = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await clientsApi.deleteClient(clientId);
      await loadClients();
    } catch (err) {
      const errorMsg = 'Failed to delete client: ' + err.message;
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingClient(null);
    setFormData({ name: '' });
    setError('');
  };

  const nextPage = () => {
    setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }));
  };

  const prevPage = () => {
    setPagination(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Clients Management</h1>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {!showAddForm && (
        <button 
          onClick={() => setShowAddForm(true)}
          disabled={loading}
          style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Add New Client
        </button>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <h3>{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              required
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </div>
          <div>
            <button type="submit" disabled={loading} style={{ marginRight: '10px', padding: '5px 15px' }}>
              {loading ? 'Saving...' : (editingClient ? 'Update' : 'Add')}
            </button>
            <button type="button" onClick={handleCancel} style={{ padding: '5px 15px' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && !showAddForm && <div>Loading...</div>}

      <div style={{ border: '1px solid #ccc', borderRadius: '4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Name</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{client.id}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{client.name}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <button 
                    onClick={() => handleEdit(client)}
                    disabled={loading}
                    style={{ marginRight: '5px', padding: '3px 8px', fontSize: '12px' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(client.id)}
                    disabled={loading}
                    style={{ padding: '3px 8px', fontSize: '12px', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '3px' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {clients.length === 0 && !loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No clients found
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={prevPage} 
          disabled={pagination.skip === 0 || loading}
          style={{ padding: '5px 15px' }}
        >
          Previous
        </button>
        <span>
          Showing {pagination.skip + 1} - {pagination.skip + clients.length} 
        </span>
        <button 
          onClick={nextPage} 
          disabled={!pagination.hasMore || loading}
          style={{ padding: '5px 15px' }}
        >
          Next
        </button>
      </div>
    </div>
  );
}