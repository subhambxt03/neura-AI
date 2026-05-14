import React, { useEffect } from 'react'
import { FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi'

const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])
  
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-600' : 'bg-danger'
      }`}>
        {type === 'success' ? (
          <FiCheckCircle className="text-white" />
        ) : (
          <FiAlertCircle className="text-white" />
        )}
        <span className="text-white">{message}</span>
        <button onClick={onClose} className="text-white opacity-70 hover:opacity-100">
          <FiX />
        </button>
      </div>
    </div>
  )
}

export default Toast