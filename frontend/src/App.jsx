import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { isAuthenticated, clearAuthData } from './services/auth'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'


const AppContent = ({ sidebarOpen, setSidebarOpen, selectedConversation, setSelectedConversation, setIsAuthenticated }) => {
  const location = useLocation()
  const isOnProfileOrSettings = location.pathname === '/profile' || location.pathname === '/settings'
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const showChatArea = !(isMobile && isOnProfileOrSettings)

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
        setIsAuthenticated={setIsAuthenticated}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={
            showChatArea ? (
              <ChatArea 
                selectedConversation={selectedConversation}
                setSelectedConversation={setSelectedConversation}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-dark-bg">
                <div className="text-center">
                  <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold">NC</span>
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary mb-2">NEURA CHAT</h2>
                  <p className="text-text-secondary">Tap the back button to return to chat</p>
                </div>
              </div>
            )
          } />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  const [authStatus, setAuthStatus] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' && window.innerWidth >= 768)
  const [selectedConversation, setSelectedConversation] = useState(null)

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      setAuthStatus(authenticated)
      setLoading(false)
    }
    checkAuth()
    
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSetAuthenticated = (status) => {
    setAuthStatus(status)
    if (!status) {
      clearAuthData()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!authStatus) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login setIsAuthenticated={handleSetAuthenticated} />} />
          <Route path="/signup" element={<Signup setIsAuthenticated={handleSetAuthenticated} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    )
  }

  return (
    <AuthProvider>
      <Router>
        <AppContent 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
          setIsAuthenticated={handleSetAuthenticated}
        />
      </Router>
    </AuthProvider>
  )
}

export default App