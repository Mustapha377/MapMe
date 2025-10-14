//LoadingOverlay.jsx
import React from 'react';

function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-20 backdrop-blur-sm">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin text-7xl mb-4">🌍</div>
          <div className="absolute inset-0 animate-ping opacity-25">
            <div className="text-7xl">🌍</div>
          </div>
        </div>
        <p className="text-xl font-semibold text-gray-700 mt-4">{message}</p>
        <div className="mt-4 flex gap-1 justify-center">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;