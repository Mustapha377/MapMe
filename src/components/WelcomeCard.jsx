//WelcomeCard.jsx
import React from 'react';

function WelcomeCard({ onShowAuth }) {
  return (
    <div className="absolute bottom-6 left-6 w-96 bg-white rounded-xl shadow-2xl z-10 overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">🚀 Welcome to MapMe!</h3>
        <p className="text-blue-100 text-sm">Your personal travel tracking companion</p>
      </div>
      
      <div className="p-6">
        <div className="space-y-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
              🔐
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Create Your Account</h4>
              <p className="text-sm text-gray-600">Sign up in seconds, completely free</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
              📍
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Add Locations</h4>
              <p className="text-sm text-gray-600">Track every place you visit automatically</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">
              📊
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">View Insights</h4>
              <p className="text-sm text-gray-600">See stats, distance traveled, and more</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">
              📸
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Share Your Journey</h4>
              <p className="text-sm text-gray-600">Create beautiful map screenshots</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={onShowAuth}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
        >
          Get Started - It's Free! 🎉
        </button>
      </div>
    </div>
  );
}

export default WelcomeCard;