import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { reverseGeocode, getLocationFromIP } from './components/services/geocodingService';
import { onAuthChange, logOut, saveVisit, getUserVisits, deleteVisit } from './components/services/firebaseService';
import { createCustomMarker, getCountryColor } from './utils/markerUtils';
import AuthModal from './components/AuthModal';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import StatsPanel from './components/StatsPanel';
import LoadingOverlay from './components/LoadingOverlay';
import WelcomeCard from './components/WelcomeCard';
import Notification from './components/Notification';
import ImportModal from './components/ImportModal';
import trackingService from './components/services/locationTrackingService';
import TrackingSettings from './components/TrackingSettings';
import TrackingPermissionModal from './components/TrackingPermissionModal';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map controller component
function MapController({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.setView(center, 10);
    }
  }, [center, map]);
  return null;
}

// Helper function for duplicate detection
const isDuplicateLocation = (newLat, newLng, existingVisits, threshold = 0.01) => {
  return existingVisits.some(visit => {
    const latDiff = Math.abs(visit.lat - newLat);
    const lngDiff = Math.abs(visit.lng - newLng);
    return latDiff < threshold && lngDiff < threshold;
  });
};

function App() {
  // State management
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [notification, setNotification] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStats, setTrackingStats] = useState({
  autoDetected: 0,
  lastDetected: null
});
  const [showTrackingPermission, setShowTrackingPermission] = useState(false);


  // Default map center
  const defaultCenter = [9.0820, 8.6753];
  const mapCenter = userLocation || defaultCenter;

  // Show notification helper
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserVisits(currentUser.uid);
      } else {
        setVisits([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load user visits
  const loadUserVisits = async (userId) => {
    setLoadingVisits(true);
    const { visits: userVisits, error } = await getUserVisits(userId);
    
    if (error) {
      console.error('Load visits error:', error);
      showNotification('Failed to load your visits', 'error');
    } else {
      setVisits(userVisits);
    }
    setLoadingVisits(false);
  };

  // Handle logout
  const handleLogout = async () => {
    const { error } = await logOut();
    if (error) {
      showNotification('Failed to logout', 'error');
    } else {
      showNotification('Logged out successfully', 'success');
    }
  };

  // Get user location
  const getUserLocation = async () => {
    if (!user) {
      setShowAuthModal(true);
      showNotification('Sign in to start tracking your adventures', 'warning');
      return;
    }

    if (loading || loadingVisits) return;

    setLoading(true);
    showNotification('Detecting your current location...', 'info');

    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            
            if (isDuplicateLocation(coords.lat, coords.lng, visits)) {
              showNotification('This location is already in your travel map', 'warning');
              setLoading(false);
              return;
            }
            
            showNotification('Retrieving city and country information...', 'info');
            const locationDetails = await reverseGeocode(coords.lat, coords.lng);
            setUserLocation(coords);
            
            const visitData = {
              ...coords,
              ...locationDetails,
              method: 'GPS',
              timestamp: new Date().toISOString()
            };
            
            showNotification('Adding to your travel map...', 'info');
            const { id, error: saveError } = await saveVisit(user.uid, visitData);
            
            if (saveError) {
              showNotification('Unable to save location. Please try again.', 'error');
              console.error('Save error:', saveError);
              setLoading(false);
            } else {
              const newVisit = { id, ...visitData, userId: user.uid, createdAt: visitData.timestamp };
              setVisits(prevVisits => [newVisit, ...prevVisits]);
              showNotification(`Successfully added ${locationDetails.city}, ${locationDetails.country}`, 'success');
              setLoading(false);
            }
          },
          (error) => {
            console.error('GPS Error:', error);
            showNotification('GPS unavailable, using network-based location...', 'warning');
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
      showNotification('Unable to detect location. Please check permissions.', 'error');
      setLoading(false);
    }
  };

  // IP fallback
  const fallbackToIP = async () => {
    try {
      showNotification('Detecting location from IP...', 'info');
      const locationData = await getLocationFromIP();
      
      if (isDuplicateLocation(locationData.lat, locationData.lng, visits)) {
        showNotification(`You've already added this location!`, 'warning');
        setLoading(false);
        return;
      }
      
      setUserLocation({ lat: locationData.lat, lng: locationData.lng });
      
      const visitData = {
        ...locationData,
        method: 'IP',
        timestamp: new Date().toISOString()
      };
      
      showNotification('Saving location...', 'info');
      const { id, error: saveError } = await saveVisit(user.uid, visitData);
      
      if (saveError) {
        showNotification('Failed to save location', 'error');
        console.error('Save error:', saveError);
        setLoading(false);
      } else {
        const newVisit = { id, ...visitData, userId: user.uid, createdAt: visitData.timestamp };
        setVisits(prevVisits => [newVisit, ...prevVisits]);
        showNotification(`Location saved: ${locationData.city}, ${locationData.country}`, 'success');
        setLoading(false);
      }
    } catch (err) {
      showNotification('Failed to detect location', 'error');
      setLoading(false);
    }
  };

  // Handle delete visit - show confirmation
  const handleDeleteVisit = (visit) => {
    setPendingDelete(visit);
    setNotification({
      message: `Are you sure you want to remove ${visit.city}, ${visit.country} from your travel map? This action cannot be undone.`,
      type: 'confirm'
    });
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    
    const { error } = await deleteVisit(pendingDelete.id);
    
    if (error) {
      showNotification('Failed to delete visit', 'error');
    } else {
      setVisits(prevVisits => prevVisits.filter(v => v.id !== pendingDelete.id));
      showNotification(`${pendingDelete.city}, ${pendingDelete.country} has been removed from your travel map`, 'success');
    }
    
    setPendingDelete(null);
    setNotification(null);
  };

  // Cancel delete
  const cancelDelete = () => {
    setPendingDelete(null);
    setNotification(null);
  };

  // Import location history
const handleImportPlaces = async (places) => {
  showNotification(`Importing ${places.length} locations...`, 'info');
  
  let successCount = 0;
  let errorCount = 0;

  for (const place of places) {
    const visitData = {
      ...place,
      timestamp: place.timestamp || new Date().toISOString()
    };

    const { id, error } = await saveVisit(user.uid, visitData);

    if (!error && id) {
      const newVisit = { id, ...visitData, userId: user.uid, createdAt: visitData.timestamp };
      setVisits(prevVisits => [newVisit, ...prevVisits]);
      successCount++;
    } else {
      errorCount++;
    }

    // Small delay to avoid overwhelming Firebase
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (successCount > 0) {
    showNotification(`Successfully imported ${successCount} location${successCount > 1 ? 's' : ''}!`, 'success');
  }
  
  if (errorCount > 0) {
    showNotification(`Failed to import ${errorCount} location${errorCount > 1 ? 's' : ''}`, 'warning');
  }
};


// Handle location update from tracking service
const handleTrackingUpdate = async (coords) => {
  if (coords.error) {
    console.error('Tracking error:', coords.error);
    return;
  }

  if (!user) return;

  try {
    // Check if already exists (duplicate prevention)
    if (isDuplicateLocation(coords.lat, coords.lng, visits)) {
      console.log('Location already tracked, skipping');
      return;
    }

    showNotification('New location detected, adding to map...', 'info');

    // Reverse geocode
    const locationDetails = await reverseGeocode(coords.lat, coords.lng);

    const visitData = {
      lat: coords.lat,
      lng: coords.lng,
      ...locationDetails,
      method: 'Auto-Tracked',
      timestamp: coords.timestamp
    };

    // Save to Firebase
    const { id, error: saveError } = await saveVisit(user.uid, visitData);

    if (!saveError && id) {
      const newVisit = { id, ...visitData, userId: user.uid, createdAt: visitData.timestamp };
      setVisits(prevVisits => [newVisit, ...prevVisits]);
      
      // Update stats
      setTrackingStats(prev => ({
        autoDetected: prev.autoDetected + 1,
        lastDetected: `${locationDetails.city}, ${locationDetails.country}`
      }));

      showNotification(`Auto-detected: ${locationDetails.city}, ${locationDetails.country}`, 'success');
    }
  } catch (error) {
    console.error('Tracking save error:', error);
  }
};

// Toggle tracking
const toggleTracking = () => {
  if (!user) {
    setShowAuthModal(true);
    showNotification('Please sign in to use auto-tracking', 'warning');
    return;
  }

  if (isTracking) {
    // Stop tracking
    trackingService.stopTracking();
    setIsTracking(false);
    showNotification('Auto-tracking disabled', 'info');
  } else {
    // Show permission modal first
    setShowTrackingPermission(true);
  }
};

// Handle tracking permission
const handleAllowTracking = () => {
  setShowTrackingPermission(false);
  trackingService.startTracking(handleTrackingUpdate);
  setIsTracking(true);
  showNotification('Auto-tracking enabled! We\'ll save places as you travel.', 'success');
};

const handleDenyTracking = () => {
  setShowTrackingPermission(false);
  showNotification('Auto-tracking not enabled', 'info');
};

// Cleanup tracking on unmount or logout
useEffect(() => {
  return () => {
    if (isTracking) {
      trackingService.stopTracking();
    }
  };
}, [isTracking]);

// Stop tracking when user logs out
useEffect(() => {
  if (!user && isTracking) {
    trackingService.stopTracking();
    setIsTracking(false);
    setTrackingStats({ autoDetected: 0, lastDetected: null });
  }
}, [user, isTracking]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        onShowAuth={() => setShowAuthModal(true)}
        onAddLocation={getUserLocation}
        onImport={() => setShowImportModal(true)}
        loading={loading}
        visits={visits}
        onNotification={showNotification}
      />

      {/* Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
            onConfirm={notification.type === 'confirm' ? confirmDelete : undefined}
            onCancel={notification.type === 'confirm' ? cancelDelete : undefined}
          />
        </div>
      )}

      {/* Stats Bar */}
      <StatsBar visits={visits} loading={loadingVisits} />

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
            <Marker 
              key={visit.id} 
              position={[visit.lat, visit.lng]}
              icon={createCustomMarker(getCountryColor(visit.country))}
            >
              <Popup>
                <div className="text-center p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg mb-1">{visit.city}</h3>
                  <p className="text-gray-600 text-sm">{visit.state}</p>
                  <p className="font-semibold text-blue-600">{visit.country}</p>
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500 space-y-2">
                    <p>📍 {visit.lat.toFixed(4)}, {visit.lng.toFixed(4)}</p>
                    {visit.method && (
                      <p>
                        <span className="bg-gray-200 px-2 py-1 rounded">
                          {visit.method === 'GPS' ? '🛰️ GPS' : '🌐 IP Location'}
                        </span>
                      </p>
                    )}
                    {user && (
                      <button
                        onClick={() => handleDeleteVisit(visit)}
                        className="mt-2 w-full bg-red-500 text-white px-3 py-2 rounded text-xs hover:bg-red-600 transition font-semibold"
                      >
                        🗑️ Delete Visit
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Tracking Settings - Add this */}
        {user && (
          <TrackingSettings
            isTracking={isTracking}
            onToggleTracking={toggleTracking}
            trackingStats={trackingStats}
          />
        )}

        {/* Stats Panel (for logged-in users with visits) */}
        {user && visits.length > 0 && (
          <div className="absolute bottom-6 left-6 w-96 z-10">
            <StatsPanel visits={visits} />
          </div>
        )}

        {/* Welcome Card (for non-logged-in users) */}
        {!user && (
          <WelcomeCard onShowAuth={() => setShowAuthModal(true)} />
        )}

        {/* Loading Overlay */}
        {loadingVisits && (
          <LoadingOverlay message="Loading your travels..." />
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(user) => {
            showNotification(`Welcome, ${user.email}!`, 'success');
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && user && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportPlaces}
          onNotification={showNotification}
          userId={user.uid}
        />
      )}

      {/* Tracking Permission Modal */}
      {showTrackingPermission && (
        <TrackingPermissionModal
          onAllow={handleAllowTracking}
          onDeny={handleDenyTracking}
        />
      )}
    </div>
  );
}

export default App;