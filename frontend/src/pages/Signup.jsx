import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiUser, FiMail, FiPhone, FiLock, FiUserPlus, FiArrowLeft } from 'react-icons/fi'
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
    
    if (formData.password.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters' })
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
      {/* Mobile back button */}
      <button
        onClick={() => navigate('/login')}
        className="fixed top-4 left-4 md:hidden text-text-secondary hover:text-text-primary transition-colors"
      >
        <FiArrowLeft size={24} />
      </button>

      <div className="bg-sidebar-bg rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 sm:mx-0">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-accent to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl sm:text-3xl font-bold text-white">NC</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Create Account</h1>
          <p className="text-sm sm:text-base text-text-secondary mt-2">Join NEURA CHAT today</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm sm:text-base mb-2">
              Full Name
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm sm:text-base" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2.5 sm:py-2 text-text-primary focus:outline-none focus:border-accent transition-colors text-sm sm:text-base"
                placeholder="John Doe"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-text-secondary text-sm sm:text-base mb-2">
              Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm sm:text-base" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2.5 sm:py-2 text-text-primary focus:outline-none focus:border-accent transition-colors text-sm sm:text-base"
                placeholder="john@example.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-text-secondary text-sm sm:text-base mb-2">
              Phone Number
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm sm:text-base" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2.5 sm:py-2 text-text-primary focus:outline-none focus:border-accent transition-colors text-sm sm:text-base"
                placeholder="+1234567890"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-text-secondary text-sm sm:text-base mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm sm:text-base" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2.5 sm:py-2 text-text-primary focus:outline-none focus:border-accent transition-colors text-sm sm:text-base"
                placeholder="••••••"
                required
                minLength={6}
              />
            </div>
            <p className="text-text-secondary text-xs mt-1">Minimum 6 characters</p>
          </div>
          
          <div>
            <label className="block text-text-secondary text-sm sm:text-base mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm sm:text-base" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2.5 sm:py-2 text-text-primary focus:outline-none focus:border-accent transition-colors text-sm sm:text-base"
                placeholder="••••••"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-blue-600 text-white py-3 sm:py-2.5 rounded-lg hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              <>
                <FiUserPlus size={18} /> Sign Up
              </>
            )}
          </button>
        </form>
        
        <p className="text-center text-text-secondary text-sm sm:text-base mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export default Signup