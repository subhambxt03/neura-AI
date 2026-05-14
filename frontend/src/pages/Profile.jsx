import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Toast from '../components/Toast'
import { FiSave, FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/user/profile', null, {
        params: formData
      })
      setUser({ ...user, ...formData })
      setToast({ type: 'success', message: 'Profile updated successfully!' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.detail || 'Update failed' })
    } finally {
      setLoading(false)
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
        
        <div className="bg-sidebar-bg rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-6">Profile Settings</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-text-secondary mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            
            <div>
              <label className="block text-text-secondary mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            
            <div>
              <label className="block text-text-secondary mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-accent text-white px-6 py-2 rounded-lg hover:opacity-90"
            >
              <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export default Profile