//ShareButton.jsx
import React, { useState } from 'react';
import html2canvas from 'html2canvas';

function ShareButton({ visits, userName, onNotification }) {
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  const captureMap = async () => {
    setIsSharing(true);
    
    try {
      // Get the map container
      const mapElement = document.querySelector('.leaflet-container');
      
      if (!mapElement) {
        onNotification('Unable to capture map. Please try again.', 'error');
        setIsSharing(false);
        return;
      }

      // Capture the map
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2,
      });

      // Create a new canvas with overlay text
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height + 200;

      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw the map
      ctx.drawImage(canvas, 0, 100);

      // Add overlay text at top
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🗺️ My Travel Map', finalCanvas.width / 2, 70);

      // Add stats at bottom
      const uniqueCountries = new Set(visits.map(v => v.country)).size;
      const uniqueCities = new Set(visits.map(v => v.city)).size;
      
      ctx.fillStyle = '#374151';
      ctx.font = '40px Arial';
      const statsY = canvas.height + 150;
      ctx.fillText(
        `📍 ${visits.length} Places | 🌍 ${uniqueCountries} Countries | 🏙️ ${uniqueCities} Cities`,
        finalCanvas.width / 2,
        statsY
      );

      // Add username/watermark
      ctx.fillStyle = '#6b7280';
      ctx.font = '30px Arial';
      ctx.fillText(`Created with MapMe by ${userName}`, finalCanvas.width / 2, statsY + 50);

      // Convert to image
      const imageDataUrl = finalCanvas.toDataURL('image/png');
      setCapturedImage(imageDataUrl);
      setShowShareModal(true);
      setIsSharing(false);
      
    } catch (error) {
      console.error('Screenshot error:', error);
      onNotification('Failed to capture map. Please try again.', 'error');
      setIsSharing(false);
    }
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = `my-travel-map-${Date.now()}.png`;
    link.href = capturedImage;
    link.click();
    onNotification('Map image downloaded successfully!', 'success');
  };

  const shareToSocial = (platform) => {
    const text = `Check out my travel map! 🗺️ I've visited ${visits.length} places across ${new Set(visits.map(v => v.country)).size} countries!`;
    
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };

  const copyToClipboard = async () => {
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      onNotification('Image copied to clipboard successfully!', 'success');
    } catch (error) {
      console.error('Copy error:', error);
      onNotification('Copy failed. Please use the download option.', 'error');
    }
  };

  return (
    <>
      <button
        onClick={captureMap}
        disabled={isSharing || visits.length === 0}
        title={visits.length === 0 ? 'Add locations to your map first' : 'Capture and share your travel map'}
        className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isSharing ? (
          <>
            <span className="animate-spin">📸</span>
            Capturing...
          </>
        ) : (
          <>
            📸 Share Map
          </>
        )}
      </button>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">📸 Share Your Map</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Preview */}
            <div className="p-6">
              <img
                src={capturedImage}
                alt="Map Screenshot"
                className="w-full border-2 border-gray-200 rounded-lg shadow-lg"
              />
            </div>

            {/* Actions */}
            <div className="p-6 border-t bg-gray-50 space-y-4">
              {/* Download & Copy */}
              <div className="flex gap-3">
                <button
                  onClick={downloadImage}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  ⬇️ Download Image
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2"
                >
                  📋 Copy to Clipboard
                </button>
              </div>

              {/* Social Share */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Share to social media:</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => shareToSocial('twitter')}
                    className="flex-1 bg-blue-400 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-500 transition"
                  >
                    🐦 Twitter
                  </button>
                  <button
                    onClick={() => shareToSocial('facebook')}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    📘 Facebook
                  </button>
                  <button
                    onClick={() => shareToSocial('whatsapp')}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition"
                  >
                    💬 WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ShareButton;