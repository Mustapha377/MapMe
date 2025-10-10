// src/services/geocodingService.js

const OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;
const OPENCAGE_API_URL = 'https://api.opencagedata.com/geocode/v1/json';

/**
 * Convert latitude/longitude to readable location (country, state, city)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{country: string, state: string, city: string}>}
 */
export async function reverseGeocode(lat, lng) {
  try {
    const url = `${OPENCAGE_API_URL}?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}&pretty=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenCage API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No results found');
    }
    
    const components = data.results[0].components;
    
    return {
      country: components.country || 'Unknown',
      state: components.state || components.region || components.county || 'Unknown',
      city: components.city || components.town || components.village || components.suburb || 'Unknown',
      formatted: data.results[0].formatted || 'Unknown location'
    };
    
  } catch (error) {
    console.error('Geocoding error:', error);
    
    // Return fallback values
    return {
      country: 'Unknown',
      state: 'Unknown',
      city: 'Unknown',
      formatted: 'Unknown location'
    };
  }
}

/**
 * Get location details from IP address (fallback method)
 * @returns {Promise<{lat: number, lng: number, country: string, state: string, city: string}>}
 */
export async function getLocationFromIP() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    return {
      lat: data.latitude,
      lng: data.longitude,
      country: data.country_name || 'Unknown',
      state: data.region || 'Unknown',
      city: data.city || 'Unknown',
      formatted: `${data.city}, ${data.region}, ${data.country_name}`
    };
  } catch (error) {
    console.error('IP geolocation error:', error);
    throw error;
  }
}