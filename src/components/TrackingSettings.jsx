// src/components/TrackingSettings.jsx
import React, { useState } from 'react';

function TrackingSettings({ isTracking, onToggleTracking, trackingStats }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-10">
      {/* Tracking Status Badge */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-800">
              Auto-Tracking
            </div>
            <div className="text-xs text-gray-600">
              {isTracking ? 'Active' : 'Disabled'}
            </div>
          </div>
          <button
            onClick={onToggleTracking}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
              isTracking
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
          >
            {isTracking ? 'Stop' : 'Start'}
          </button>
        </div>

        {/* Stats */}
        {isTracking && trackingStats && (
          <div className="mt-3 pt-3 border-t space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Auto-detected:</span>
              <span className="font-semibold text-gray-800">
                {trackingStats.autoDetected} places
              </span>
            </div>
            {trackingStats.lastDetected && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Last detected:</span>
                <span className="font-semibold text-gray-800">
                  {trackingStats.lastDetected}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Persistent Tracking Indicator */}
        {isTracking && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-2">
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <span>🔄</span>
              <span className="font-semibold">Tracking will continue in background</span>
            </div>
          </div>
        )}

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full mt-3 text-xs text-blue-600 hover:text-blue-700 font-semibold"
        >
          {showSettings ? '▲ Hide Settings' : '▼ Tracking Settings'}
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-3 pt-3 border-t space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h4 className="text-xs font-semibold text-blue-800 mb-2">
                How Auto-Tracking Works:
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Monitors your location in the background</li>
                <li>• Saves places when you move 1km+ away</li>
                <li>• Uses minimal battery power</li>
                <li>• Continues tracking even after refresh</li>
                <li>• Sends browser notifications for new places</li>
                <li>• You can stop anytime</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded p-3">
              <h4 className="text-xs font-semibold text-green-800 mb-2">
                🔔 Browser Notifications:
              </h4>
              <p className="text-xs text-green-700">
                You'll receive notifications when new locations are detected, even when the app is in the background.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h4 className="text-xs font-semibold text-yellow-800 mb-1">
                ⚠️ Privacy Note:
              </h4>
              <p className="text-xs text-yellow-700">
                Your location is only saved to your account. We don't share it with anyone. All data stays private.
              </p>
            </div>

            {/* Notification Permission Status */}
            {'Notification' in window && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <h4 className="text-xs font-semibold text-gray-800 mb-1">
                  Notification Status:
                </h4>
                <p className="text-xs text-gray-700">
                  {Notification.permission === 'granted' && '✅ Enabled'}
                  {Notification.permission === 'denied' && '❌ Blocked'}
                  {Notification.permission === 'default' && '⏳ Not yet requested'}
                </p>
                {Notification.permission === 'denied' && (
                  <p className="text-xs text-red-600 mt-1">
                    Enable notifications in your browser settings to receive alerts.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackingSettings;