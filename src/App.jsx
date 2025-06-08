import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/Navigation'
import ClientsPage from './pages/ClientsPage'
import NetworksPage from './pages/NetworksPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/clients" replace />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/networks" element={<NetworksPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
