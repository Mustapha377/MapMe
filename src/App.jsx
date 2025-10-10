import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { reverseGeocode, getLocationFromIP } from './components/services/geocodingService';

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
    // Sample data
    { id: 1, lat: 9.0579, lng: 7.4951, city: 'Abuja', state: 'FCT', country: 'Nigeria' },
    { id: 2, lat: 6.5244, lng: 3.3792, city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Default map center (Nigeria)
  const defaultCenter = [9.0820, 8.6753];
  const mapCenter = userLocation || defaultCenter;

  // Get user's current location with reverse geocoding
  const getUserLocation = async () => {
    setLoading(true);
    setError(null);
    setStatusMessage('Getting your location...');

    try {
      // Try GPS first
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            
            setStatusMessage('Finding location details...');
            
            // Get location details from coordinates
            const locationDetails = await reverseGeocode(coords.lat, coords.lng);
            
            setUserLocation(coords);
            
            // Add to visits
            const newVisit = {
              id: Date.now(),
              ...coords,
              ...locationDetails,
              method: 'GPS',
              timestamp: new Date().toISOString()
            };
            
            setVisits([...visits, newVisit]);
            setStatusMessage(`Location added: ${locationDetails.city}, ${locationDetails.country}`);
            setLoading(false);
            
            // Clear status message after 3 seconds
            setTimeout(() => setStatusMessage(''), 3000);
          },
          (error) => {
            console.error('GPS Error:', error);
            setStatusMessage('GPS failed, trying IP location...');
            fallbackToIP();
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        fallbackToIP();
      }
    } catch (err) {
      setError('Failed to get location');
      setLoading(false);
      setStatusMessage('');
    }
  };

  // Fallback to IP-based location with details
  const fallbackToIP = async () => {
    try {
      setStatusMessage('Detecting location from IP...');
      
      const locationData = await getLocationFromIP();
      
      setUserLocation({ lat: locationData.lat, lng: locationData.lng });
      
      const newVisit = {
        id: Date.now(),
        ...locationData,
        method: 'IP',
        timestamp: new Date().toISOString()
      };
      
      setVisits([...visits, newVisit]);
      setStatusMessage(`Location added: ${locationData.city}, ${locationData.country}`);
      setLoading(false);
      
      // Clear status message after 3 seconds
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setError('Failed to detect location. Please check your internet connection.');
      setLoading(false);
      setStatusMessage('');
    }
  };

  // Get unique country count
  const uniqueCountries = new Set(visits.map(v => v.country)).size;

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🗺️ MapMe</h1>
            <p className="text-sm opacity-90">Track your adventures around the world</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={getUserLocation}
              disabled={loading}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⌛</span>
                  Detecting...
                </>
              ) : (
                <>
                  📍 Add Current Location
                </>
              )}
            </button>
            <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition">
              📸 Share Map
            </button>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 text-sm">
          <p>{statusMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3">
          <p className="font-bold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-gray-100 p-3 border-b">
        <div className="max-w-7xl mx-auto flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">📍 Places Visited:</span>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold">{visits.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">🌍 Countries:</span>
            <span className="bg-green-600 text-white px-3 py-1 rounded-full font-bold">
              {uniqueCountries}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">🏙️ Cities:</span>
            <span className="bg-purple-600 text-white px-3 py-1 rounded-full font-bold">
              {new Set(visits.map(v => v.city)).size}
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
                <div className="text-center p-2">
                  <h3 className="font-bold text-lg mb-1">{visit.city}</h3>
                  <p className="text-gray-600 text-sm">{visit.state}</p>
                  <p className="font-semibold text-blue-600">{visit.country}</p>
                  <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                    <p>📍 {visit.lat.toFixed(4)}, {visit.lng.toFixed(4)}</p>
                    {visit.method && (
                      <p className="mt-1">
                        <span className="bg-gray-200 px-2 py-1 rounded">
                          {visit.method === 'GPS' ? '🛰️ GPS' : '🌐 IP Location'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Instructions Overlay */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm z-10 border-2 border-blue-200">
        <h3 className="font-bold text-lg mb-2 text-blue-600">🚀 Getting Started</h3>
        <ol className="text-sm space-y-2 list-decimal list-inside text-gray-700">
          <li>Click <strong>"Add Current Location"</strong></li>
          <li>Allow location access when prompted</li>
          <li>Watch your travel map grow!</li>
          <li>Click markers to see details</li>
        </ol>
        <p className="text-xs text-gray-500 mt-3 italic">
          💡 Tip: GPS provides more accurate location than IP detection
        </p>
      </div>
    </div>
  );
}

export default App;