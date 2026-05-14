import React, { useState, useRef, useEffect } from 'react'
import { FiPlus, FiMic, FiSend } from 'react-icons/fi'
import api from '../services/api'

const MessageInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [message])
  
  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message)
      setMessage('')
    }
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    setUploading(true)
    try {
      const response = await api.post('/file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data.content) {
        onSend(message, response.data.content)
        setMessage('')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }
  
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Please use Chrome.')
      return
    }
    
    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    
    recognition.onstart = () => {
      setIsRecording(true)
    }
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setMessage(prev => prev + (prev ? ' ' : '') + transcript)
    }
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
    }
    
    recognition.onend = () => {
      setIsRecording(false)
    }
    
    recognition.start()
    recognitionRef.current = recognition
  }
  
  return (
    <div className="border-t border-border-color p-4 bg-sidebar-bg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-2 bg-input-bg rounded-xl border border-border-color p-2">
          <label className="cursor-pointer p-2 hover:bg-hover-bg rounded-lg transition-colors">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <FiPlus className={`w-5 h-5 ${uploading ? 'text-accent animate-spin' : 'text-text-secondary'}`} />
          </label>
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={uploading ? 'Uploading file...' : 'Type your message...'}
            disabled={disabled || uploading}
            className="flex-1 bg-transparent text-text-primary placeholder-text-secondary resize-none outline-none py-2 max-h-[150px]"
            rows={1}
          />
          
          <button
            onClick={startVoiceInput}
            className={`p-2 rounded-lg transition-colors ${isRecording ? 'bg-danger text-white' : 'hover:bg-hover-bg text-text-secondary'}`}
            disabled={disabled}
          >
            <FiMic className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={(!message.trim() && !uploading) || disabled}
            className="p-2 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessageInput