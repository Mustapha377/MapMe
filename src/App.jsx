import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to recenter map when location changes
function MapController({ center }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, 10);
  }, [center, map]);
  return null;
}

function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [visits, setVisits] = useState([
    // Sample data - we'll replace this with real data later
    { id: 1, lat: 9.0579, lng: 7.4951, city: 'Abuja', country: 'Nigeria' },
    { id: 2, lat: 6.5244, lng: 3.3792, city: 'Lagos', country: 'Nigeria' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default map center (will be Nigeria for now)
  const defaultCenter = [9.0820, 8.6753];
  const mapCenter = userLocation || defaultCenter;

  // Get user's current location
  const getUserLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try GPS first
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(newLocation);
            
            // Add to visits (temporary - later we'll save to Firebase)
            const newVisit = {
              id: Date.now(),
              ...newLocation,
              city: 'Current Location',
              country: 'Detecting...',
            };
            setVisits([...visits, newVisit]);
            setLoading(false);
          },
          (error) => {
            console.error('GPS Error:', error);
            fallbackToIP();
          }
        );
      } else {
        fallbackToIP();
      }
    } catch (err) {
      setError('Failed to get location');
      setLoading(false);
    }
  };

  // Fallback to IP-based location
  const fallbackToIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const newLocation = {
        lat: data.latitude,
        lng: data.longitude,
      };
      setUserLocation(newLocation);
      
      const newVisit = {
        id: Date.now(),
        ...newLocation,
        city: data.city || 'Unknown',
        country: data.country_name || 'Unknown',
      };
      setVisits([...visits, newVisit]);
      setLoading(false);
    } catch (err) {
      setError('Failed to detect location via IP');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🗺️ My Travel Map</h1>
            <p className="text-sm opacity-90">Track your adventures around the world</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={getUserLocation}
              disabled={loading}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '📍 Detecting...' : '📍 Add Current Location'}
            </button>
            <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition">
              📸 Share Map
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-gray-100 p-3 border-b">
        <div className="max-w-7xl mx-auto flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">📍 Places Visited:</span>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full">{visits.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">🌍 Countries:</span>
            <span className="bg-green-600 text-white px-3 py-1 rounded-full">
              {new Set(visits.map(v => v.country)).size}
            </span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {userLocation && <MapController center={[userLocation.lat, userLocation.lng]} />}
          
          {visits.map((visit) => (
            <Marker key={visit.id} position={[visit.lat, visit.lng]}>
              <Popup>
                <div className="text-center">
                  <h3 className="font-bold text-lg">{visit.city}</h3>
                  <p className="text-gray-600">{visit.country}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {visit.lat.toFixed(4)}, {visit.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Instructions Overlay */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm z-10">
        <h3 className="font-bold text-lg mb-2">🚀 Getting Started</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Add Current Location" to mark where you are</li>
          <li>Allow location access when prompted</li>
          <li>Watch your travel map grow!</li>
          <li>Share your adventures with friends</li>
        </ol>
      </div>
    </div>
  );
}

export default App;