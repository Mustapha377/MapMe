import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { reverseGeocode, getLocationFromIP } from './components/services/geocodingService';
import { onAuthChange, logOut, saveVisit, getUserVisits, deleteVisit } from './components/services/firebaseService';
import AuthModal from './components/AuthModal';

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
    if (center) {
      map.setView(center, 10);
    }
  }, [center, map]);
  return null;
}

// Helper function to check if location is duplicate
const isDuplicateLocation = (newLat, newLng, existingVisits, threshold = 0.01) => {
  return existingVisits.some(visit => {
    const latDiff = Math.abs(visit.lat - newLat);
    const lngDiff = Math.abs(visit.lng - newLng);
    return latDiff < threshold && lngDiff < threshold;
  });
};

function App() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loadingVisits, setLoadingVisits] = useState(false);

  // Default map center (Nigeria)
  const defaultCenter = [9.0820, 8.6753];
  const mapCenter = userLocation || defaultCenter;

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load user's visits from Firebase
        await loadUserVisits(currentUser.uid);
      } else {
        // Clear visits when logged out
        setVisits([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load user visits from Firebase
  const loadUserVisits = async (userId) => {
    setLoadingVisits(true);
    const { visits: userVisits, error } = await getUserVisits(userId);
    
    if (error) {
      console.error('Load visits error:', error);
      setError('Failed to load your visits');
    } else {
      setVisits(userVisits);
    }
    setLoadingVisits(false);
  };

  // Handle logout
  const handleLogout = async () => {
    const { error } = await logOut();
    if (error) {
      setError('Failed to logout');
    } else {
      setStatusMessage('Logged out successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  // Get user's current location with reverse geocoding
  const getUserLocation = async () => {
    if (!user) {
      setShowAuthModal(true);
      setStatusMessage('Please login to save your travels');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }

    // Prevent multiple simultaneous requests
    if (loading || loadingVisits) {
      return;
    }

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
            
            // Check for duplicate BEFORE geocoding (saves API calls)
            if (isDuplicateLocation(coords.lat, coords.lng, visits)) {
              setStatusMessage(`You've already added this location!`);
              setLoading(false);
              setTimeout(() => setStatusMessage(''), 3000);
              return;
            }
            
            setStatusMessage('Finding location details...');
            
            // Get location details from coordinates
            const locationDetails = await reverseGeocode(coords.lat, coords.lng);
            
            setUserLocation(coords);
            
            // Prepare visit data
            const visitData = {
              ...coords,
              ...locationDetails,
              method: 'GPS',
              timestamp: new Date().toISOString()
            };
            
            // Save to Firebase
            setStatusMessage('Saving location...');
            const { id, error: saveError } = await saveVisit(user.uid, visitData);
            
            if (saveError) {
              setError('Failed to save location');
              console.error('Save error:', saveError);
              setLoading(false);
            } else {
              // Add the new visit to local state immediately
              const newVisit = { id, ...visitData, userId: user.uid, createdAt: visitData.timestamp };
              setVisits(prevVisits => [newVisit, ...prevVisits]);
              setStatusMessage(`Location saved: ${locationDetails.city}, ${locationDetails.country}`);
              setLoading(false);
              setTimeout(() => setStatusMessage(''), 3000);
            }
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
      
      // Check for duplicate
      if (isDuplicateLocation(locationData.lat, locationData.lng, visits)) {
        setStatusMessage(`You've already added this location!`);
        setLoading(false);
        setTimeout(() => setStatusMessage(''), 3000);
        return;
      }
      
      setUserLocation({ lat: locationData.lat, lng: locationData.lng });
      
      const visitData = {
        ...locationData,
        method: 'IP',
        timestamp: new Date().toISOString()
      };
      
      // Save to Firebase
      setStatusMessage('Saving location...');
      const { id, error: saveError } = await saveVisit(user.uid, visitData);
      
      if (saveError) {
        setError('Failed to save location');
        console.error('Save error:', saveError);
        setLoading(false);
      } else {
        // Add the new visit to local state immediately
        const newVisit = { id, ...visitData, userId: user.uid, createdAt: visitData.timestamp };
        setVisits(prevVisits => [newVisit, ...prevVisits]);
        setStatusMessage(`Location saved: ${locationData.city}, ${locationData.country}`);
        setLoading(false);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to detect location. Please check your internet connection.');
      setLoading(false);
      setStatusMessage('');
    }
  };

  // Delete a visit
  const handleDeleteVisit = async (visitId) => {
    if (!confirm('Are you sure you want to delete this visit?')) return;

    const { error } = await deleteVisit(visitId);
    
    if (error) {
      setError('Failed to delete visit');
    } else {
      setVisits(prevVisits => prevVisits.filter(v => v.id !== visitId));
      setStatusMessage('Visit deleted');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  // Get unique country count
  const uniqueCountries = new Set(visits.map(v => v.country)).size;
  const uniqueCities = new Set(visits.map(v => v.city)).size;

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🗺️ MapMe</h1>
            <p className="text-sm opacity-90">
              {user ? `Welcome, ${user.email}` : 'Track your adventures around the world'}
            </p>
          </div>
          <div className="flex gap-2">
            {user ? (
              <>
                <button
                  onClick={getUserLocation}
                  disabled={loading || loadingVisits}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⌛</span>
                      Detecting...
                    </>
                  ) : (
                    <>
                      📍 Add Location
                    </>
                  )}
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                🔐 Login / Sign Up
              </button>
            )}
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
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold">
              {loadingVisits ? '...' : visits.length}
            </span>
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
              {uniqueCities}
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
                    {user && (
                      <button
                        onClick={() => handleDeleteVisit(visit.id)}
                        className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Instructions Overlay */}
      {!user && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm z-10 border-2 border-blue-200">
          <h3 className="font-bold text-lg mb-2 text-blue-600">🚀 Getting Started</h3>
          <ol className="text-sm space-y-2 list-decimal list-inside text-gray-700">
            <li>Click <strong>"Login / Sign Up"</strong> to create an account</li>
            <li>Add your current location</li>
            <li>Watch your travel map grow!</li>
            <li>Your data is saved and synced across devices</li>
          </ol>
        </div>
      )}

      {/* Loading Overlay */}
      {loadingVisits && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">🌍</div>
            <p className="text-xl font-semibold text-gray-700">Loading your travels...</p>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(user) => {
            setStatusMessage(`Welcome, ${user.email}!`);
            setTimeout(() => setStatusMessage(''), 3000);
          }}
        />
      )}
    </div>
  );
}

export default App;