//Header.jsx
import React from 'react';
import ShareButton from './ShareButton';
import { MapPinned, MapPin, Globe, LogIn, LogOut, } from 'lucide-react';


function Header({ user, onLogout, onShowAuth, onAddLocation, onImport, loading, visits, onNotification}) {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <span className="text-3xl">🗺️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">MapMe</h1>
              <p className="text-sm opacity-90">
                {user ? `Welcome, ${user.email.split('@')[0]}` : 'Track your adventures'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {user ? (
              <>
                <button
                  onClick={onAddLocation}
                  disabled={loading}
                  className="bg-white text-blue-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⌛</span>
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <MapPin/>
                      <span>Add Location</span>
                    </>
                  )}
                </button>

                 <button
                  onClick={onImport}
                  className="bg-white text-green-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-green-50 transition flex items-center gap-2 shadow-md"
                  title="Import location history"
                >
                  <span>📤</span>
                  <span>Import</span>
                </button>
                
                <ShareButton visits={visits} userName={user?.email || 'Anonymous'} />
                
                <button 
                  onClick={onLogout}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-5 py-2.5 rounded-lg font-semibold transition flex items-center gap-2 backdrop-blur-sm"
                >
                  <LogOut/>
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={onShowAuth}
                className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition shadow-md flex items-center gap-2"
              >
                <LogIn/>
                <span>Login / Sign Up</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;