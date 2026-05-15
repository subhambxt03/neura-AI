import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi'
import api from '../services/api'
import Toast from '../components/Toast'

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', response.data.token)
      setIsAuthenticated(true)
      navigate('/')
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.detail || 'Login failed' })
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
          <h1 className="text-2xl font-bold text-text-primary">Welcome Back</h1>
          <p className="text-text-secondary mt-2">Sign in to continue to NEURA CHAT</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary mb-2">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>
          
          {/* Forgot Password Link */}
          <div className="text-right">
            <Link 
              to="/forgot-password" 
              className="text-sm text-accent hover:underline transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-blue-600 text-white py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? 'Logging in...' : (
              <>
                <FiLogIn /> Sign In
              </>
            )}
          </button>
        </form>
        
        <p className="text-center text-text-secondary mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export default Login