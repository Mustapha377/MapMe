import React, { useEffect } from 'react';

function Notification({ message, type = 'info', onClose, onConfirm, onCancel }) {
  const isConfirmation = type === 'confirm';

  useEffect(() => {
    if (!isConfirmation) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [onClose, isConfirmation]);

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-800',
      icon: '✅'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: '❌'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-800',
      icon: '⚠️'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-800',
      icon: 'ℹ️'
    },
    confirm: {
      bg: 'bg-white',
      border: 'border-gray-300',
      text: 'text-gray-800',
      icon: '🗑️'
    }
  };

  const style = styles[type] || styles.info;

  if (isConfirmation) {
    return (
      <div className={`${style.bg} border ${style.border} ${style.text} p-5 rounded-lg shadow-2xl animate-slide-in max-w-md`}>
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl flex-shrink-0">{style.icon}</span>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Confirm Deletion</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200 text-sm shadow-md hover:shadow-lg"
          >
            Delete Visit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${style.bg} border-l-4 ${style.border} ${style.text} p-4 rounded-r-lg shadow-lg flex items-center justify-between animate-slide-in`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{style.icon}</span>
        <p className="font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 ml-4 transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default Notification;