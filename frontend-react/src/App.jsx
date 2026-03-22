import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import Home from './pages/Home';
import MapView from './pages/MapView';
import OwnerLogin from './pages/OwnerLogin';
import Dashboard from './pages/Dashboard';

function App() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <header className="header">
        <Link to="/" className="header-logo">
          <Scissors size={28} />
          <span>Smart Saloon</span>
        </Link>
        <nav className="nav-links">
          <Link to="/map">Find Salons</Link>
          <Link to="/owner/login" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
            Owner Login
          </Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
