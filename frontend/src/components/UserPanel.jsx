import React, { useState, useRef, useEffect } from 'react'
import { FiUser, FiSettings, FiLogOut, FiMoreVertical, FiAward, FiArrowLeft } from 'react-icons/fi'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const UserPanel = ({ setIsAuthenticated, onNavigate }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavigation = (path) => {
    setShowMenu(false)
    // Call onNavigate to close sidebar on mobile
    if (onNavigate) {
      onNavigate()
    }
    navigate(path)
  }

  const handleBackToChat = () => {
    if (onNavigate) {
      onNavigate()
    }
    navigate('/')
  }

  const handleLogout = async () => {
    setShowMenu(false)
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      if (setIsAuthenticated) {
        setIsAuthenticated(false)
      }
      if (onNavigate) {
        onNavigate()
      }
      navigate('/login')
    }
  }

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U'
  }

  const getRandomColor = () => {
    const colors = ['#4F7CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Check if on Profile or Settings page (mobile only)
  const isOnProfileOrSettings = location.pathname === '/profile' || location.pathname === '/settings'
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <>
      {/* Mobile Back to Chat Button - RIGHT SIDE */}
      {isMobile && isOnProfileOrSettings && (
        <div className="fixed top-4 right-4 z-50 md:hidden">
          <button
            onClick={handleBackToChat}
            className="p-3 bg-accent rounded-xl shadow-xl hover:bg-accent/90 transition-all duration-200 active:scale-95 flex items-center gap-2 group"
            aria-label="Back to chat"
          >
            <span className="text-white text-sm font-medium">Back to Chat</span>
            <FiArrowLeft className="text-white" size={18} />
          </button>
        </div>
      )}

      {/* User Panel Menu (for sidebar) */}
      <div className="relative" ref={menuRef}>
        <div
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-3 cursor-pointer hover:bg-hover-bg p-3 rounded-xl transition-all duration-200 group"
        >
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0"
            style={{ backgroundColor: getRandomColor() }}
          >
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{user?.name || 'User'}</p>
            <div className="flex items-center gap-1">
              <FiAward className="w-3 h-3 text-accent" />
              <p className="text-xs text-text-secondary">Free Plan</p>
            </div>
          </div>
          <FiMoreVertical className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" size={16} />
        </div>
        
        {showMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-sidebar-bg border border-border-color rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up">
            <div className="px-4 py-3 border-b border-border-color">
              <p className="text-xs text-text-secondary">Signed in as</p>
              <p className="text-sm font-medium text-text-primary truncate">{user?.email}</p>
            </div>
            
            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full text-left px-4 py-2.5 hover:bg-hover-bg flex items-center gap-3 transition-colors"
            >
              <FiUser className="text-text-secondary w-4 h-4" />
              <span className="text-sm text-text-primary">Profile</span>
            </button>
            
            <button
              onClick={() => handleNavigation('/settings')}
              className="w-full text-left px-4 py-2.5 hover:bg-hover-bg flex items-center gap-3 transition-colors"
            >
              <FiSettings className="text-text-secondary w-4 h-4" />
              <span className="text-sm text-text-primary">Settings</span>
            </button>
            
            <div className="border-t border-border-color my-1"></div>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 hover:bg-hover-bg flex items-center gap-3 transition-colors rounded-b-xl"
            >
              <FiLogOut className="text-danger w-4 h-4" />
              <span className="text-sm text-danger">Logout</span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default UserPanel