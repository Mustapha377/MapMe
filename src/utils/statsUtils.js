//statsUtils.js

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRad = (value) => {
  return (value * Math.PI) / 180;
};

// Calculate total distance traveled
export const calculateTotalDistance = (visits) => {
  if (visits.length < 2) return 0;
  
  // Sort by timestamp
  const sortedVisits = [...visits].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  let totalDistance = 0;
  for (let i = 1; i < sortedVisits.length; i++) {
    const prev = sortedVisits[i - 1];
    const curr = sortedVisits[i];
    totalDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
  }
  
  return totalDistance;
};

// Format distance nicely
export const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  if (km < 1000) return `${Math.round(km)}km`;
  return `${(km / 1000).toFixed(1)}k km`;
};

// Get timeline data
export const getTimelineData = (visits) => {
  const sortedVisits = [...visits].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  return sortedVisits.map(visit => ({
    ...visit,
    formattedDate: new Date(visit.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    formattedTime: new Date(visit.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }));
};

// Get most visited places
export const getMostVisited = (visits) => {
  const cityCount = {};
  const countryCount = {};
  
  visits.forEach(visit => {
    cityCount[visit.city] = (cityCount[visit.city] || 0) + 1;
    countryCount[visit.country] = (countryCount[visit.country] || 0) + 1;
  });
  
  const topCity = Object.entries(cityCount).sort((a, b) => b[1] - a[1])[0];
  const topCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0];
  
  return {
    city: topCity ? { name: topCity[0], count: topCity[1] } : null,
    country: topCountry ? { name: topCountry[0], count: topCountry[1] } : null
  };
};