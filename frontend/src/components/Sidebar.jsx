import React, { useState, useEffect } from 'react'
import { FiPlus, FiSearch, FiMenu, FiX, FiMessageCircle, FiShare2, FiTrash2 } from 'react-icons/fi'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserPanel from './UserPanel'
import api from '../services/api'
import Toast from './Toast'
import logoImage from '../assets/logo.png' 

const Sidebar = ({ sidebarOpen, setSidebarOpen, selectedConversation, setSelectedConversation, setIsAuthenticated }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)

  // Check if on Profile or Settings page
  const isOnProfileOrSettings = location.pathname === '/profile' || location.pathname === '/settings'
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await api.get('/chat/conversations')
      setConversations(response.data)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const handleNewChat = async () => {
    try {
      const response = await api.post('/chat/new')
      setSelectedConversation(response.data)
      setConversations([response.data, ...conversations])
      // Close sidebar on mobile after new chat
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    } catch (error) {
      console.error('Failed to create new chat:', error)
    }
  }

  const handleDeleteChat = async (convId, e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      try {
        await api.delete(`/chat/${convId}`)
        setConversations(conversations.filter(c => c.id !== convId))
        if (selectedConversation?.id === convId) {
          setSelectedConversation(null)
        }
        setToast({ type: 'success', message: 'Chat deleted successfully' })
      } catch (error) {
        setToast({ type: 'error', message: 'Failed to delete chat' })
      }
    }
  }

  const handleShareChat = async (convId, e) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}/share/${convId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setToast({ type: 'success', message: 'Share link copied to clipboard!' })
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to copy link' })
    }
  }

  const handleSelectConversation = (chat) => {
    setSelectedConversation(chat)
    // Close sidebar on mobile after selecting a conversation
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  // Filter and group conversations
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupConversations = (convs) => {
    const today = []
    const yesterday = []
    const last7Days = []
    const older = []
    
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    
    convs.forEach(conv => {
      const convDate = new Date(conv.created_at)
      if (convDate >= todayStart) {
        today.push(conv)
      } else if (convDate >= yesterdayStart) {
        yesterday.push(conv)
      } else if (convDate >= weekStart) {
        last7Days.push(conv)
      } else {
        older.push(conv)
      }
    })
    
    return { today, yesterday, last7Days, older }
  }

  const groups = groupConversations(filteredConversations)

  const ChatSection = ({ title, chats }) => (
    chats.length > 0 && (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-text-secondary mb-2 px-3 uppercase tracking-wider">
          {title}
        </h3>
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => handleSelectConversation(chat)}
            className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 mx-1 my-0.5 ${
              selectedConversation?.id === chat.id 
                ? 'bg-accent/20 text-text-primary border-l-2 border-accent' 
                : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FiMessageCircle className="flex-shrink-0 w-4 h-4" />
              <span className="text-sm truncate">{chat.title}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={(e) => handleShareChat(chat.id, e)}
                className="p-1.5 hover:bg-input-bg rounded transition-colors"
                title="Share chat"
              >
                <FiShare2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => handleDeleteChat(chat.id, e)}
                className="p-1.5 hover:bg-input-bg rounded transition-colors"
                title="Delete chat"
              >
                <FiTrash2 className="w-3.5 h-3.5 text-danger" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  )

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-sm animate-fade-in" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed md:relative z-50 w-80 h-full bg-sidebar-bg flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Header - Sticky */}
        <div className="p-4 border-b border-border-color bg-sidebar-bg sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* Logo Image */}
              <img 
                src={logoImage} 
                alt="NEURA CHAT Logo" 
                className="w-9 h-9 object-contain rounded-full"
              />
              <span className="font-bold text-text-primary text-lg hidden sm:inline">NEURA CHAT</span>
              <span className="font-bold text-text-primary text-lg sm:hidden">NC</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-hover-bg rounded-lg transition-colors active:scale-95"
              aria-label="Close menu"
            >
              <FiX className="text-text-secondary" size={20} />
            </button>
          </div>
          
          <button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-accent to-blue-600 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            <FiPlus size={18} /> 
            <span className="hidden sm:inline">New Chat</span>
          </button>
          
          <div className="relative mt-4">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-input-bg border border-border-color rounded-xl pl-9 pr-4 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
            />
          </div>
        </div>
        
        {/* Chat History - Scrollable Area with Custom Scrollbar */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FiMessageCircle className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
              <p className="text-text-secondary text-sm">
                {searchTerm ? 'No conversations found' : 'No chats yet'}
              </p>
              {!searchTerm && (
                <p className="text-text-secondary text-xs mt-2">
                  Click "New Chat" to start a conversation
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              <ChatSection title="Today" chats={groups.today} />
              <ChatSection title="Yesterday" chats={groups.yesterday} />
              <ChatSection title="Previous 7 Days" chats={groups.last7Days} />
              <ChatSection title="Older" chats={groups.older} />
            </div>
          )}
        </div>
        
        {/* User Panel - Sticky Bottom */}
        <div className="border-t border-border-color p-3 bg-sidebar-bg sticky bottom-0">
          <UserPanel setIsAuthenticated={setIsAuthenticated} onNavigate={() => {
            // Close sidebar on mobile when navigating
            if (window.innerWidth < 768) {
              setSidebarOpen(false)
            }
          }} />
        </div>
      </div>
      
      {/* Mobile menu button - HIDE when on Profile or Settings pages */}
      {!sidebarOpen && !isOnProfileOrSettings && isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-30 p-3 bg-sidebar-bg rounded-xl shadow-xl hover:bg-hover-bg transition-all duration-200 active:scale-95"
          aria-label="Open menu"
        >
          <FiMenu className="text-text-primary" size={22} />
        </button>
      )}
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  )
}

export default Sidebar  