// src/utils/markerUtils.js
import L from 'leaflet';

// Generate consistent color for a country name
export const getCountryColor = (countryName) => {
  const colors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#6366f1', // indigo
  ];
  
  // Generate consistent index from country name
  let hash = 0;
  for (let i = 0; i < countryName.length; i++) {
    hash = countryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Create custom colored marker
export const createCustomMarker = (color) => {
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.125 12.5 28.125S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0z" 
            fill="${color}" 
            stroke="#fff" 
            stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="4" fill="#fff"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// Get country stats
export const getCountryStats = (visits) => {
  const countryMap = {};
  
  visits.forEach(visit => {
    if (!countryMap[visit.country]) {
      countryMap[visit.country] = {
        name: visit.country,
        count: 0,
        cities: new Set(),
        color: getCountryColor(visit.country)
      };
    }
    countryMap[visit.country].count++;
    countryMap[visit.country].cities.add(visit.city);
  });
  
  return Object.values(countryMap).map(country => ({
    ...country,
    cities: country.cities.size
  })).sort((a, b) => b.count - a.count);
};