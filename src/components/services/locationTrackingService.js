// src/services/locationTrackingService.js

class LocationTrackingService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.lastSavedLocation = null;
    this.minDistanceThreshold = 1000; // 1km in meters
    this.trackingInterval = 300000; // 5 minutes
    this.onLocationUpdate = null;
    this.notificationPermission = 'default';
    
    // Load tracking state from localStorage
    this.loadTrackingState();
    
    // Request notification permission if tracking
    if (this.isTracking) {
      this.requestNotificationPermission();
    }
  }

  // Save tracking state to localStorage
  saveTrackingState() {
    localStorage.setItem('mapme_tracking_enabled', JSON.stringify(this.isTracking));
    if (this.lastSavedLocation) {
      localStorage.setItem('mapme_last_location', JSON.stringify(this.lastSavedLocation));
    }
  }

  // Load tracking state from localStorage
  loadTrackingState() {
    try {
      const savedTracking = localStorage.getItem('mapme_tracking_enabled');
      if (savedTracking) {
        this.isTracking = JSON.parse(savedTracking);
      }
      
      const savedLocation = localStorage.getItem('mapme_last_location');
      if (savedLocation) {
        this.lastSavedLocation = JSON.parse(savedLocation);
      }
    } catch (error) {
      console.error('Error loading tracking state:', error);
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.notificationPermission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission === 'granted';
    }

    return false;
  }

  // Show browser notification
  showNotification(title, body, options = {}) {
    if (this.notificationPermission !== 'granted') return;

    const notification = new Notification(title, {
      body,
      icon: '/vite.svg', // Your app icon
      badge: '/vite.svg',
      tag: 'mapme-tracking',
      requireInteraction: false,
      ...options
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
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
  async startTracking(callback) {
    if (this.isTracking && this.watchId !== null) {
      console.log('Already tracking');
      return;
    }

    if (!('geolocation' in navigator)) {
      console.error('Geolocation not supported');
      return;
    }

    // Request notification permission
    await this.requestNotificationPermission();

    this.onLocationUpdate = callback;
    this.isTracking = true;
    this.saveTrackingState();

    // Show notification that tracking started
    this.showNotification(
      '🗺️ MapMe Auto-Tracking Enabled',
      'We\'ll save places as you travel. Close this app to continue tracking in background.'
    );

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
          this.saveTrackingState();
          
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
    this.saveTrackingState();
    
    // Show notification that tracking stopped
    this.showNotification(
      '⏹️ MapMe Auto-Tracking Disabled',
      'Location tracking has been stopped.'
    );
    
    console.log('Location tracking stopped');
  }

  // Resume tracking (called on app reload)
  resumeTracking(callback) {
    if (this.isTracking && this.watchId === null) {
      console.log('Resuming tracking after page reload');
      this.startTracking(callback);
    }
  }

  // Get tracking status
  getStatus() {
    return {
      isTracking: this.isTracking,
      lastLocation: this.lastSavedLocation,
      notificationPermission: this.notificationPermission
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

  // Clear all tracking data
  clearTrackingData() {
    localStorage.removeItem('mapme_tracking_enabled');
    localStorage.removeItem('mapme_last_location');
    this.lastSavedLocation = null;
  }
}

// Create singleton instance
const trackingService = new LocationTrackingService();

export default trackingService;