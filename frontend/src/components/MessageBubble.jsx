import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FiCopy, FiThumbsUp, FiThumbsDown, FiRefreshCw } from 'react-icons/fi'
import api from '../services/api'
import Toast from './Toast'

const MessageBubble = ({ message, onRegenerate, isLastAi, isStreaming }) => {
  const [feedback, setFeedback] = useState(null)
  const [toast, setToast] = useState(null)
  
  const isUser = message.role === 'user'
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setToast({ type: 'success', message: 'Copied to clipboard!' })
  }
  
  const handleFeedback = async (type) => {
    if (feedback) return
    setFeedback(type)
    try {
      await api.post('/feedback', {
        message_id: message.id,
        feedback_type: type
      })
      setToast({ type: 'success', message: 'Thanks for your feedback!' })
    } catch (error) {
      console.error('Feedback error:', error)
    }
  }
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`${isUser ? 'message-bubble-user' : 'message-bubble-ai'} ${isStreaming ? 'typing-pulse' : ''}`}>
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
        
        {!isUser && !isStreaming && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-color">
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-input-bg rounded transition-colors"
              title="Copy"
            >
              <FiCopy className="w-4 h-4 text-text-secondary" />
            </button>
            <button
              onClick={() => handleFeedback('like')}
              className={`p-1 hover:bg-input-bg rounded transition-colors ${feedback === 'like' ? 'text-accent' : ''}`}
              title="Like"
            >
              <FiThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFeedback('dislike')}
              className={`p-1 hover:bg-input-bg rounded transition-colors ${feedback === 'dislike' ? 'text-danger' : ''}`}
              title="Dislike"
            >
              <FiThumbsDown className="w-4 h-4" />
            </button>
            {isLastAi && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1 hover:bg-input-bg rounded transition-colors"
                title="Regenerate"
              >
                <FiRefreshCw className="w-4 h-4 text-text-secondary" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export default MessageBubble