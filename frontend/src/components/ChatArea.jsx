import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FiMoreVertical, FiShare2, FiTrash2, FiArchive, FiMenu } from 'react-icons/fi'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import api from '../services/api'
import Toast from './Toast'
import logoImage from '../assets/logo.png'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ChatArea = ({ selectedConversation, setSelectedConversation, sidebarOpen, setSidebarOpen }) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [toast, setToast] = useState(null)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const abortControllerRef = useRef(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // Function to scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [shouldAutoScroll])

  // Check if user is scrolled up manually
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      setShouldAutoScroll(isAtBottom)
    }
  }, [])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages()
    } else {
      setMessages([])
    }
    setShouldAutoScroll(true)
  }, [selectedConversation])

  const loadMessages = async () => {
    try {
      const response = await api.get(`/chat/messages/${selectedConversation.id}`)
      setMessages(response.data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendMessage = async (message, fileContent = null) => {
    if (!message.trim() && !fileContent) return
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: fileContent ? `${message}\n\n[File uploaded and processed]` : message,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    
    setLoading(true)
    setIsStreaming(true)
    setStreamingContent('')
    setShouldAutoScroll(true)     
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          conversation_id: selectedConversation?.id || null,
          message: message,
          file_content: fileContent
        }),
        signal: abortControllerRef.current.signal
      })
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.done) {
                setIsStreaming(false)
                setStreamingContent('')
                
                const aiMessage = {
                  id: data.message_id,
                  role: 'assistant',
                  content: fullResponse,
                  created_at: new Date().toISOString()
                }
                setMessages(prev => [...prev, aiMessage])
                
                if (data.conversation_id && !selectedConversation) {
                  const convResponse = await api.get(`/chat/conversations`)
                  const newConv = convResponse.data.find(c => c.id === data.conversation_id)
                  if (newConv) {
                    setSelectedConversation(newConv)
                  }
                }
              } else {
                fullResponse += data.content
                setStreamingContent(fullResponse)
              }
            } catch (e) {
              console.error('Parse error:', e)
            }
          }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Stream error:', error)
        setToast({ type: 'error', message: 'Failed to send message. Please try again.' })
        setMessages(prev => prev.filter(m => m.id !== userMessage.id))
      }
    } finally {
      setLoading(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleRegenerate = async (messageId) => {
    setLoading(true)
    setIsStreaming(true)
    setStreamingContent('')
    setShouldAutoScroll(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat/regenerate/${messageId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.done) {
                setIsStreaming(false)
                setStreamingContent('')
                await loadMessages()
              } else {
                fullResponse += data.content
                setStreamingContent(fullResponse)
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error('Regenerate error:', error)
      setToast({ type: 'error', message: 'Failed to regenerate response' })
    } finally {
      setLoading(false)
      setIsStreaming(false)
    }
  }

  const handleDeleteChat = async () => {
    if (!selectedConversation) return
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        await api.delete(`/chat/${selectedConversation.id}`)
        setSelectedConversation(null)
        setMessages([])
        setToast({ type: 'success', message: 'Chat deleted successfully' })
      } catch (error) {
        setToast({ type: 'error', message: 'Failed to delete chat' })
      }
    }
    setShowMenu(false)
  }

  const handleArchiveChat = async () => {
    if (!selectedConversation) return
    try {
      await api.put(`/chat/${selectedConversation.id}/archive`)
      setSelectedConversation(null)
      setMessages([])
      setToast({ type: 'success', message: 'Chat archived successfully' })
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to archive chat' })
    }
    setShowMenu(false)
  }

  const handleShareChat = () => {
    if (!selectedConversation) return
    const shareUrl = `${window.location.origin}/share/${selectedConversation.id}`
    navigator.clipboard.writeText(shareUrl)
    setToast({ type: 'success', message: 'Share link copied!' })
    setShowMenu(false)
  }

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <img 
              src={logoImage} 
              alt="NEURA CHAT Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome to NEURA CHAT</h2>
          <p className="text-text-secondary">Start a new conversation by clicking the button below</p>
          <button
            onClick={() => {
              api.post('/chat/new').then(res => setSelectedConversation(res.data))
            }}
            className="mt-4 bg-gradient-to-r from-accent to-blue-600 text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            Start New Chat
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-dark-bg h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-border-color px-6 py-4 flex items-center justify-between bg-sidebar-bg flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1 hover:bg-hover-bg rounded"
          >
            <FiMenu className="text-text-primary" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">{selectedConversation.title}</h1>
            <p className="text-xs text-text-secondary">NEURA CHAT AI</p>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-hover-bg rounded-lg"
          >
            <FiMoreVertical className="text-text-primary" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-sidebar-bg border border-border-color rounded-lg shadow-lg z-50">
                <button
                  onClick={handleShareChat}
                  className="w-full text-left px-4 py-2 hover:bg-hover-bg flex items-center gap-3 rounded-t-lg"
                >
                  <FiShare2 /> Share Chat
                </button>
                <button
                  onClick={handleArchiveChat}
                  className="w-full text-left px-4 py-2 hover:bg-hover-bg flex items-center gap-3"
                >
                  <FiArchive /> Archive Chat
                </button>
                <button
                  onClick={handleDeleteChat}
                  className="w-full text-left px-4 py-2 hover:bg-hover-bg flex items-center gap-3 rounded-b-lg text-danger"
                >
                  <FiTrash2 /> Delete Chat
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6"
        style={{ 
          overflowY: 'auto',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              onRegenerate={() => handleRegenerate(message.id)}
              isLastAi={message.role === 'assistant' && index === messages.length - 1 && !isStreaming}
            />
          ))}
          
          {isStreaming && streamingContent && (
            <MessageBubble
              message={{ role: 'assistant', content: streamingContent }}
              isStreaming={true}
            />
          )}
          
          {loading && !streamingContent && (
            <div className="flex justify-start">
              <div className="bg-hover-bg rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <MessageInput onSend={sendMessage} disabled={loading || isStreaming} />
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export default ChatArea