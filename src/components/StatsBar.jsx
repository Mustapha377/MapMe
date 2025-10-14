//StatsBar.jsx
import React from 'react';

function StatsBar({ visits, loading }) {
  const uniqueCountries = new Set(visits.map(v => v.country)).size;
  const uniqueCities = new Set(visits.map(v => v.city)).size;

  const stats = [
    {
      icon: '📍',
      label: 'Places Visited',
      value: visits.length,
      color: 'blue'
    },
    {
      icon: '🌍',
      label: 'Countries',
      value: uniqueCountries,
      color: 'green'
    },
    {
      icon: '🏙️',
      label: 'Cities',
      value: uniqueCities,
      color: 'purple'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600'
  };

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="text-2xl">{stat.icon}</div>
              <div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                <div className="flex items-center gap-2">
                  <span className={`${colorClasses[stat.color]} text-white px-3 py-1 rounded-full font-bold text-lg`}>
                    {loading ? '...' : stat.value}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatsBar;