//TrackingPermissionModal.jsx
import React from 'react';

function TrackingPermissionModal({ onAllow, onDeny }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-slide-in">
        {/* Icon Header */}
        <div className="p-6 flex flex-col items-center">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mb-4">
            <span className="text-5xl">📍</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
            Enable Auto-Tracking?
          </h3>
          <p className="text-gray-600 text-center">
            Let MapMe automatically save places you visit as you travel
          </p>
        </div>

        {/* Benefits */}
        <div className="px-6 pb-6">
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="text-2xl">✅</div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">Effortless Tracking</h4>
                <p className="text-xs text-gray-600">No need to manually add locations</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="text-2xl">🔒</div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">Private & Secure</h4>
                <p className="text-xs text-gray-600">Only you can see your travel data</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="text-2xl">🔋</div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">Battery Efficient</h4>
                <p className="text-xs text-gray-600">Smart tracking uses minimal power</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="text-2xl">⏹️</div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">Full Control</h4>
                <p className="text-xs text-gray-600">Stop tracking anytime you want</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t p-4 flex gap-3">
          <button
            onClick={onDeny}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Not Now
          </button>
          <button
            onClick={onAllow}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Enable Tracking
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrackingPermissionModal;