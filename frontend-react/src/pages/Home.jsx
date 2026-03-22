import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Activity } from 'lucide-react';

export default function Home() {
  return (
    <div style={{ padding: '4rem 0' }}>
      <div className="text-center mb-4">
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: 800 }}>
          The Future of <span className="text-gradient">Salon Queueing</span>
        </h1>
        <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Real-time AI camera tracking meets elegant design. Know exactly how many people are waiting and your estimated wait time before you even leave home.
        </p>
      </div>

      <div className="text-center mb-4">
        <Link to="/map" className="btn" style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>
          Find Salons Nearby
        </Link>
      </div>

      <div className="grid-3 mt-4">
        <div className="glass-panel text-center">
          <MapPin size={40} className="mb-2 text-gradient" />
          <h3 className="mb-1">Location Based</h3>
          <p className="text-muted">Instantly find salons near you utilizing accurate Haversine geolocation.</p>
        </div>
        
        <div className="glass-panel text-center">
          <Activity size={40} className="mb-2 text-gradient" />
          <h3 className="mb-1">Real-time Tracking</h3>
          <p className="text-muted">Powerful AI cameras count the crowd live. No more guessing if it's busy.</p>
        </div>

        <div className="glass-panel text-center">
          <Sparkles size={40} className="mb-2 text-gradient" />
          <h3 className="mb-1">Smart Predictions</h3>
          <p className="text-muted">Our algorithm predicts your exact wait time based on the active crowd.</p>
        </div>
      </div>
    </div>
  );
}
