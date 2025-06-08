import { useState, useEffect, useCallback } from 'react';
import { networksApi } from '../services/api';

export default function NetworksPage() {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState(null);
  const [formData, setFormData] = useState({ ipv4: '' });
  const [pagination, setPagination] = useState({ skip: 0, limit: 10, hasMore: true });

  const loadNetworks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await networksApi.getNetworks(pagination.skip, pagination.limit);
      setNetworks(data || []);
      setPagination(prev => ({
        ...prev,
        hasMore: data && data.length === prev.limit
      }));
    } catch (err) {
      const errorMsg = 'Failed to load networks: ' + err.message;
      setError(errorMsg);
      console.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [pagination.skip, pagination.limit]);

  // Load networks on component mount and when pagination changes
  useEffect(() => {
    loadNetworks();
  }, [loadNetworks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    try {
      const networkData = {
        ipv4: formData.ipv4.trim() || null
      };
      
      if (editingNetwork) {
        await networksApi.updateNetwork(editingNetwork.id, networkData);
      } else {
        await networksApi.createNetwork(networkData);
      }
      setFormData({ ipv4: '' });
      setShowAddForm(false);
      setEditingNetwork(null);
      // Reset to first page and reload
      setPagination(prev => ({ ...prev, skip: 0 }));
      await loadNetworks();
    } catch (err) {
      const errorMsg = 'Failed to save network: ' + err.message;
      setError(errorMsg);
      console.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (network) => {
    setEditingNetwork(network);
    setFormData({ ipv4: network.ipv4 || '' });
    setShowAddForm(true);
  };

  const handleDelete = async (networkId) => {
    if (!confirm('Are you sure you want to delete this network?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await networksApi.deleteNetwork(networkId);
      await loadNetworks();
    } catch (err) {
      const errorMsg = 'Failed to delete network: ' + err.message;
      setError(errorMsg);
      console.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingNetwork(null);
    setFormData({ ipv4: '' });
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
      <h1>Networks Management</h1>
      
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
          Add New Network
        </button>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <h3>{editingNetwork ? 'Edit Network' : 'Add New Network'}</h3>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="ipv4">IPv4 Address:</label>
            <input
              type="text"
              id="ipv4"
              value={formData.ipv4}
              onChange={(e) => setFormData({ ipv4: e.target.value })}
              placeholder="e.g., 192.168.1.0/24 (optional)"
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </div>
          <div>
            <button type="submit" disabled={loading} style={{ marginRight: '10px', padding: '5px 15px' }}>
              {loading ? 'Saving...' : (editingNetwork ? 'Update' : 'Add')}
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
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>IPv4</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {networks.map((network) => (
              <tr key={network.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{network.id}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  {network.ipv4 || <em style={{ color: '#888' }}>Not set</em>}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <button 
                    onClick={() => handleEdit(network)}
                    disabled={loading}
                    style={{ marginRight: '5px', padding: '3px 8px', fontSize: '12px' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(network.id)}
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
        
        {networks.length === 0 && !loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No networks found
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
          Showing {pagination.skip + 1} - {pagination.skip + networks.length} 
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