import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiUser, FiMail, FiPhone, FiLock, FiUserPlus } from 'react-icons/fi'
import api from '../services/api'
import Toast from '../components/Toast'

const Signup = ({ setIsAuthenticated }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setToast({ type: 'error', message: 'Passwords do not match' })
      return
    }
    
    setLoading(true)
    
    try {
      const response = await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      })
      localStorage.setItem('token', response.data.token)
      setIsAuthenticated(true)
      navigate('/')
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.detail || 'Signup failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="bg-sidebar-bg rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">NC</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Create Account</h1>
          <p className="text-text-secondary mt-2">Join NEURA CHAT today</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary mb-2">Full Name</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-text-secondary mb-2">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-text-secondary mb-2">Phone Number</label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-text-secondary mb-2">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                required
                minLength={6}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-text-secondary mb-2">Confirm Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Account...' : (
              <>
                <FiUserPlus /> Sign Up
              </>
            )}
          </button>
        </form>
        
        <p className="text-center text-text-secondary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export default Signup