import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();

  const navStyle = {
    padding: '10px 0',
    borderBottom: '1px solid #ccc',
    marginBottom: '20px',
  };

  const linkStyle = {
    marginRight: '20px',
    padding: '8px 16px',
    textDecoration: 'none',
    borderRadius: '4px',
    color: '#646cff',
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: '#646cff',
    color: 'white',
  };

  return (
    <nav style={navStyle}>
      <Link 
        to="/clients" 
        style={location.pathname === '/clients' ? activeLinkStyle : linkStyle}
      >
        Clients
      </Link>
      <Link 
        to="/networks" 
        style={location.pathname === '/networks' ? activeLinkStyle : linkStyle}
      >
        Networks
      </Link>
    </nav>
  );
}