import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Toast from '../components/Toast'
import { FiArrowLeft, FiKey, FiTrash2, FiDownload, FiArchive } from 'react-icons/fi'

const Settings = ({ setIsAuthenticated }) => {
  const navigate = useNavigate()
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      setToast({ type: 'error', message: 'New passwords do not match' })
      return
    }
    
    setLoading(true)
    try {
      await api.put('/user/change-password', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      })
      setToast({ type: 'success', message: 'Password changed successfully!' })
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.detail || 'Password change failed' })
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
      try {
        await api.delete('/user/account')
        localStorage.removeItem('token')
        setIsAuthenticated(false)
        navigate('/login')
      } catch (error) {
        setToast({ type: 'error', message: 'Failed to delete account' })
      }
    }
  }
  
  const handleExportChats = async () => {
    try {
      const response = await api.get('/chat/conversations')
      const conversations = response.data
      const exportData = []
      
      for (const conv of conversations) {
        const messagesRes = await api.get(`/chat/messages/${conv.id}`)
        exportData.push({
          conversation: conv,
          messages: messagesRes.data
        })
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neura-chat-export-${new Date().toISOString()}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      setToast({ type: 'success', message: 'Chats exported successfully!' })
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to export chats' })
    }
  }
  
  const handleBackToChat = () => {
    navigate('/')
  }

  const isMobile = window.innerWidth < 768

  return (
    <div className="flex-1 overflow-y-auto bg-dark-bg">
      <div className="max-w-2xl mx-auto p-6">
        {/* Mobile Back Button */}
        {isMobile && (
          <button
            onClick={handleBackToChat}
            className="md:hidden flex items-center gap-2 text-accent hover:text-accent/80 mb-4 transition-colors"
          >
            <FiArrowLeft /> Back to Chat
          </button>
        )}
        
        {/* Desktop Back Button */}
        <button
          onClick={() => navigate('/')}
          className="hidden md:flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <FiArrowLeft /> Back to Chat
        </button>
        
        <div className="space-y-6">
          {/* Password Change */}
          <div className="bg-sidebar-bg rounded-2xl p-8">
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <FiKey /> Change Password
            </h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-text-secondary mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  className="w-full bg-input-bg border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-text-secondary mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="w-full bg-input-bg border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-text-secondary mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="w-full bg-input-bg border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-accent text-white px-6 py-2 rounded-lg hover:opacity-90"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
          
          {/* Data Management */}
          <div className="bg-sidebar-bg rounded-2xl p-8">
            <h2 className="text-xl font-bold text-text-primary mb-4">Data Management</h2>
            
            <div className="space-y-3">
              <button
                onClick={handleExportChats}
                className="w-full flex items-center justify-between px-4 py-3 bg-input-bg rounded-lg hover:bg-hover-bg transition-colors"
              >
                <span className="flex items-center gap-2"><FiDownload /> Export All Chats</span>
                <span className="text-text-secondary">JSON</span>
              </button>
              
              <button
                onClick={() => {
                  navigate('/?archived=true')
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-input-bg rounded-lg hover:bg-hover-bg transition-colors"
              >
                <span className="flex items-center gap-2"><FiArchive /> View Archived Chats</span>
                <span className="text-text-secondary">→</span>
              </button>
            </div>
          </div>
          
          {/* Danger Zone */}
          <div className="bg-sidebar-bg rounded-2xl p-8 border border-danger">
            <h2 className="text-xl font-bold text-danger mb-4">Danger Zone</h2>
            <p className="text-text-secondary mb-4">Once you delete your account, there is no going back. All your data will be permanently removed.</p>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 bg-danger text-white px-6 py-2 rounded-lg hover:opacity-90"
            >
              <FiTrash2 /> Delete Account
            </button>
          </div>
        </div>
      </div>
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export default Settings