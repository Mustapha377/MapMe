// src/components/StatsPanel.jsx
import React, { useState } from 'react';
import { calculateTotalDistance, formatDistance, getTimelineData, getMostVisited } from '../utils/statsUtils';
import { getCountryStats } from '../utils/markerUtils';

function StatsPanel({ visits }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (visits.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <p className="text-gray-500">📍 Add locations to see your travel statistics!</p>
      </div>
    );
  }

  const totalDistance = calculateTotalDistance(visits);
  const mostVisited = getMostVisited(visits);
  const countryStats = getCountryStats(visits);
  const timeline = getTimelineData(visits);
  const uniqueCountries = new Set(visits.map(v => v.country)).size;
  const uniqueCities = new Set(visits.map(v => v.city)).size;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 px-4 font-semibold transition ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('countries')}
          className={`flex-1 py-3 px-4 font-semibold transition ${
            activeTab === 'countries'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🌍 Countries
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-3 px-4 font-semibold transition ${
            activeTab === 'timeline'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📅 Timeline
        </button>
      </div>

      {/* Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{visits.length}</div>
                <div className="text-sm text-gray-600">Total Places</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{uniqueCountries}</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{uniqueCities}</div>
                <div className="text-sm text-gray-600">Cities</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{formatDistance(totalDistance)}</div>
                <div className="text-sm text-gray-600">Distance Traveled</div>
              </div>
            </div>

            {mostVisited.city && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-2">🏆 Most Visited</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span className="text-sm">🏙️ City</span>
                    <span className="font-semibold">{mostVisited.city.name} ({mostVisited.city.count}x)</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span className="text-sm">🌍 Country</span>
                    <span className="font-semibold">{mostVisited.country.name} ({mostVisited.country.count}x)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Countries Tab */}
        {activeTab === 'countries' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 mb-3">Countries Visited</h3>
            {countryStats.map((country, index) => (
              <div key={country.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" 
                     style={{ backgroundColor: country.color }}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{country.name}</div>
                  <div className="text-xs text-gray-600">
                    {country.count} visit{country.count > 1 ? 's' : ''} • {country.cities} {country.cities > 1 ? 'cities' : 'city'}
                  </div>
                </div>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      backgroundColor: country.color,
                      width: `${(country.count / visits.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 mb-3">Travel Timeline</h3>
            {timeline.map((visit, index) => (
              <div key={visit.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 flex-1 bg-blue-200 my-1"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-semibold text-gray-800">
                      {visit.city}, {visit.country}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      📅 {visit.formattedDate} • 🕐 {visit.formattedTime}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {visit.method === 'GPS' ? '🛰️ GPS' : '🌐 IP'} • {visit.state}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsPanel;