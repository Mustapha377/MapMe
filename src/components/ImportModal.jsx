//ImportModal.jsx
import React, { useState } from 'react';
import { reverseGeocode } from '../components/services/geocodingService';

function ImportModal({ onClose, onImport, onNotification, userId }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectedPlaces, setDetectedPlaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState(new Set());

  // Parse Google Location History JSON
  const parseGoogleLocationHistory = (data) => {
    try {
      // Google Takeout format has "locations" array
      if (data.locations && Array.isArray(data.locations)) {
        return data.locations.map(loc => ({
          lat: loc.latitudeE7 / 1e7,
          lng: loc.longitudeE7 / 1e7,
          timestamp: loc.timestamp || new Date(parseInt(loc.timestampMs)).toISOString()
        }));
      }
      
      // Semantic Location History format
      if (data.timelineObjects && Array.isArray(data.timelineObjects)) {
        const locations = [];
        data.timelineObjects.forEach(obj => {
          if (obj.placeVisit && obj.placeVisit.location) {
            const loc = obj.placeVisit.location;
            locations.push({
              lat: loc.latitudeE7 / 1e7,
              lng: loc.longitudeE7 / 1e7,
              timestamp: obj.placeVisit.duration?.startTimestamp || new Date().toISOString()
            });
          }
        });
        return locations;
      }

      return [];
    } catch (error) {
      console.error('Parse error:', error);
      return [];
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      onNotification('Please upload a valid JSON file', 'error');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      onNotification('Analyzing your location history...', 'info');
      
      const locations = parseGoogleLocationHistory(data);
      
      if (locations.length === 0) {
        onNotification('No location data found in file', 'warning');
        setIsProcessing(false);
        return;
      }

      onNotification(`Found ${locations.length} location points. Processing...`, 'info');

      // Sample locations to reduce API calls (take every 10th location)
      const sampledLocations = locations.filter((_, index) => index % 10 === 0);
      
      // Reverse geocode locations
      const places = [];
      const uniquePlaces = new Map();

      for (let i = 0; i < sampledLocations.length; i++) {
        const loc = sampledLocations[i];
        setProgress(Math.round((i / sampledLocations.length) * 100));

        try {
          const details = await reverseGeocode(loc.lat, loc.lng);
          
          // Create unique key for deduplication
          const key = `${details.city}-${details.country}`;
          
          if (!uniquePlaces.has(key)) {
            uniquePlaces.set(key, {
              ...loc,
              ...details,
              method: 'Imported'
            });
          }

          // Small delay to avoid rate limiting
          if (i % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }

      const detectedArray = Array.from(uniquePlaces.values());
      setDetectedPlaces(detectedArray);
      
      // Select all by default
      setSelectedPlaces(new Set(detectedArray.map((_, idx) => idx)));
      
      onNotification(`Detected ${detectedArray.length} unique places!`, 'success');
      setProgress(100);
      setIsProcessing(false);

    } catch (error) {
      console.error('File processing error:', error);
      onNotification('Failed to process file. Please check format.', 'error');
      setIsProcessing(false);
    }
  };

  // Toggle place selection
  const togglePlace = (index) => {
    const newSelected = new Set(selectedPlaces);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPlaces(newSelected);
  };

  // Select/Deselect all
  const toggleAll = () => {
    if (selectedPlaces.size === detectedPlaces.length) {
      setSelectedPlaces(new Set());
    } else {
      setSelectedPlaces(new Set(detectedPlaces.map((_, idx) => idx)));
    }
  };

  // Import selected places
  const handleImport = async () => {
    const placesToImport = detectedPlaces.filter((_, idx) => selectedPlaces.has(idx));
    
    if (placesToImport.length === 0) {
      onNotification('Please select at least one place to import', 'warning');
      return;
    }

    await onImport(placesToImport);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">📍 Import Location History</h2>
              <p className="text-sm text-blue-100 mt-1">
                Upload your Google Location History to automatically add visited places
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!isProcessing && detectedPlaces.length === 0 && (
            <div className="space-y-6">
              {/* Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Upload Location History
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Supports Google Takeout JSON format
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition cursor-pointer inline-block">
                    Choose File
                  </span>
                </label>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">📖 How to get your location history:</h4>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                  <li>Go to <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google Takeout</a></li>
                  <li>Select "Location History" only</li>
                  <li>Choose JSON format</li>
                  <li>Download and extract the ZIP file</li>
                  <li>Upload the JSON file here</li>
                </ol>
              </div>

              {/* Privacy Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">🔒 Privacy & Security</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ Your location data is processed locally in your browser</li>
                  <li>✅ We only save the cities you choose to import</li>
                  <li>✅ Original file data is never stored on our servers</li>
                  <li>✅ You can review and deselect places before importing</li>
                </ul>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="text-center py-12">
              <div className="animate-spin text-6xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Processing Your Location History
              </h3>
              <p className="text-gray-600 mb-6">
                Analyzing coordinates and detecting cities...
              </p>
              <div className="max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{progress}% Complete</p>
              </div>
            </div>
          )}

          {/* Results */}
          {!isProcessing && detectedPlaces.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Found {detectedPlaces.length} Unique Places
                </h3>
                <button
                  onClick={toggleAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  {selectedPlaces.size === detectedPlaces.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {detectedPlaces.map((place, index) => (
                  <div
                    key={index}
                    onClick={() => togglePlace(index)}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition ${
                      selectedPlaces.has(index)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPlaces.has(index)}
                        onChange={() => togglePlace(index)}
                        className="mt-1 w-5 h-5"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{place.city}</h4>
                        <p className="text-sm text-gray-600">{place.state}</p>
                        <p className="text-sm text-blue-600">{place.country}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {detectedPlaces.length > 0 && !isProcessing && (
          <div className="border-t p-6 bg-gray-50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedPlaces.size === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {selectedPlaces.size} Place{selectedPlaces.size !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportModal;