//locationTrackingService.js

class LocationTrackingService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.lastSavedLocation = null;
    this.minDistanceThreshold = 1000; // 1km in meters
    this.trackingInterval = 300000; // 5 minutes
    this.onLocationUpdate = null;
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Check if location is significantly different
  isSignificantMove(lat, lng) {
    if (!this.lastSavedLocation) return true;

    const distance = this.calculateDistance(
      this.lastSavedLocation.lat,
      this.lastSavedLocation.lng,
      lat,
      lng
    );

    return distance >= this.minDistanceThreshold;
  }

  // Start tracking
  startTracking(callback) {
    if (this.isTracking) {
      console.log('Already tracking');
      return;
    }

    if (!('geolocation' in navigator)) {
      console.error('Geolocation not supported');
      return;
    }

    this.onLocationUpdate = callback;
    this.isTracking = true;

    // Request permission and start watching
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        };

        // Only save if significant move
        if (this.isSignificantMove(coords.lat, coords.lng)) {
          console.log('Significant move detected:', coords);
          this.lastSavedLocation = coords;
          
          if (this.onLocationUpdate) {
            this.onLocationUpdate(coords);
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (this.onLocationUpdate) {
          this.onLocationUpdate({ error: error.message });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        distanceFilter: this.minDistanceThreshold // iOS specific
      }
    );

    console.log('Location tracking started');
  }

  // Stop tracking
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.lastSavedLocation = null;
    console.log('Location tracking stopped');
  }

  // Get tracking status
  getStatus() {
    return {
      isTracking: this.isTracking,
      lastLocation: this.lastSavedLocation
    };
  }

  // Update settings
  updateSettings(settings) {
    if (settings.minDistanceThreshold) {
      this.minDistanceThreshold = settings.minDistanceThreshold;
    }
    if (settings.trackingInterval) {
      this.trackingInterval = settings.trackingInterval;
    }
  }
}

// Create singleton instance
const trackingService = new LocationTrackingService();

export default trackingService;